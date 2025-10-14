import prisma from '@/config/database';
import { Prisma } from '@prisma/client';
import type {
    GetSalesReportQuery,
    GetTopSellingProductsQuery,
    GetSlowMovingProductsQuery,
    GetSalesByCategoryQuery,
    GetCashierPerformanceQuery,
    GetInventoryReportQuery,
    GetLowStockProductsQuery,
    GetDeadStockProductsQuery,
    GetStockValuationQuery,
} from '@/validators/report.validator';

export class ReportRepository {
    // ===== SALES REPORTS =====

    async getSalesReportSummary(query: GetSalesReportQuery) {
        const where: Prisma.TransactionWhereInput = {
            status: 'COMPLETED',
            deletedAt: null,
        };

        if (query.branchId) where.branchId = query.branchId;
        if (query.cashierId) where.cashierId = query.cashierId;

        if (query.startDate || query.endDate) {
            where.transactionDate = {};
            if (query.startDate) where.transactionDate.gte = query.startDate;
            if (query.endDate) where.transactionDate.lte = query.endDate;
        }

        const [totalRevenue, totalTransactions, itemsSold] = await Promise.all([
            prisma.transaction.aggregate({
                where,
                _sum: { totalAmount: true },
            }),
            prisma.transaction.count({ where }),
            prisma.transactionItem.aggregate({
                where: { transaction: { ...where } },
                _sum: { quantity: true },
            }),
        ]);

        const revenue = totalRevenue._sum.totalAmount
            ? Number(totalRevenue._sum.totalAmount)
            : 0;
        const avgTransaction =
            totalTransactions > 0 ? revenue / totalTransactions : 0;

        return {
            totalRevenue: revenue,
            totalTransactions,
            totalItemsSold: itemsSold._sum.quantity || 0,
            averageTransactionValue: Math.round(avgTransaction * 100) / 100,
        };
    }

    async getTopSellingProducts(query: GetTopSellingProductsQuery) {
        const where: Prisma.TransactionItemWhereInput = {
            transaction: {
                status: 'COMPLETED',
                deletedAt: null,
                ...(query.branchId && { branchId: query.branchId }),
                ...(query.startDate || query.endDate
                    ? {
                          transactionDate: {
                              ...(query.startDate && { gte: query.startDate }),
                              ...(query.endDate && { lte: query.endDate }),
                          },
                      }
                    : {}),
            },
        };

        return prisma.transactionItem.groupBy({
            by: ['productId', 'productName', 'productSku'],
            where,
            _sum: {
                quantity: true,
                subtotal: true,
            },
            orderBy: {
                _sum: { quantity: 'desc' },
            },
            take: 10,
        });
    }

    async getSlowMovingProducts(query: GetSlowMovingProductsQuery) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - query.daysThreshold);

        return prisma.product.findMany({
            where: {
                isActive: true,
                stocks: {
                    some: {
                        ...(query.branchId && { branchId: query.branchId }),
                        OR: [
                            { lastSaleDate: { lt: cutoffDate } },
                            { lastSaleDate: null },
                        ],
                    },
                },
            },
            select: {
                id: true,
                name: true,
                sku: true,
                stocks: {
                    where: query.branchId
                        ? { branchId: query.branchId }
                        : undefined,
                    select: {
                        quantity: true,
                        lastSaleDate: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
            take: 10,
        });
    }

    async getSalesByCategory(query: GetSalesByCategoryQuery) {
        // Build base where filter
        const where: Prisma.TransactionItemWhereInput = {
            transaction: {
                status: 'COMPLETED',
                deletedAt: null,
                ...(query.branchId && { branchId: query.branchId }),
                ...(query.startDate || query.endDate
                    ? {
                          transactionDate: {
                              ...(query.startDate && { gte: query.startDate }),
                              ...(query.endDate && { lte: query.endDate }),
                          },
                      }
                    : {}),
            },
        };

        // Aggregate sales data by productId
        const results = await prisma.transactionItem.groupBy({
            by: ['productId'],
            where,
            _sum: {
                quantity: true,
                subtotal: true,
            },
        });

        if (results.length === 0) return [];

        // Get product & category data
        const productIds = results.map((r) => r.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                categoryId: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Merge results with category info & group
        const categoryStats = results.reduce(
            (acc, result) => {
                const product = products.find((p) => p.id === result.productId);
                const categoryId = product?.categoryId || 'uncategorized';
                const categoryName = product?.category?.name || 'Uncategorized';

                if (!acc[categoryId]) {
                    acc[categoryId] = {
                        categoryId,
                        categoryName,
                        totalQuantity: 0,
                        totalRevenue: 0,
                    };
                }

                acc[categoryId].totalQuantity += result._sum.quantity ?? 0;
                acc[categoryId].totalRevenue += Number(
                    result._sum.subtotal ?? 0
                );

                return acc;
            },
            {} as Record<
                string,
                {
                    categoryId: string;
                    categoryName: string;
                    totalQuantity: number;
                    totalRevenue: number;
                }
            >
        );

        // Sort by totalRevenue descending
        return Object.values(categoryStats).sort(
            (a, b) => b.totalRevenue - a.totalRevenue
        );
    }

    async getCashierPerformance(query: GetCashierPerformanceQuery) {
        const where: Prisma.TransactionWhereInput = {
            status: 'COMPLETED',
            deletedAt: null,
        };

        if (query.branchId) where.branchId = query.branchId;

        if (query.startDate || query.endDate) {
            where.transactionDate = {};
            if (query.startDate) where.transactionDate.gte = query.startDate;
            if (query.endDate) where.transactionDate.lte = query.endDate;
        }

        const results = await prisma.transaction.groupBy({
            by: ['cashierId'],
            where,
            _count: {
                id: true,
            },
            _sum: {
                totalAmount: true,
            },
            orderBy: {
                _sum: {
                    totalAmount: 'desc',
                },
            },
        });

        // Get cashier details
        const cashierIds = results.map((r) => r.cashierId).filter(Boolean);
        const cashiers = await prisma.user.findMany({
            where: { id: { in: cashierIds } },
            select: { id: true, fullName: true },
        });

        return results.map((r) => ({
            cashierId: r.cashierId,
            cashierName:
                cashiers.find((c) => c.id === r.cashierId)?.fullName ||
                'Unknown',
            totalTransactions: r._count.id,
            totalRevenue: r._sum.totalAmount ? Number(r._sum.totalAmount) : 0,
            averageTransaction:
                r._count.id > 0
                    ? r._sum.totalAmount
                        ? Number(r._sum.totalAmount) / r._count.id
                        : 0
                    : 0,
        }));
    }

    // ===== INVENTORY REPORTS =====

    async getInventoryReportSummary(query: GetInventoryReportQuery) {
        const where: Prisma.StockWhereInput = {};
        if (query.branchId) where.branchId = query.branchId;

        const [totalItems, lowStockCount, allStocks] = await Promise.all([
            prisma.stock.aggregate({
                where,
                _sum: {
                    quantity: true,
                },
            }),
            prisma.stock.count({
                where: {
                    ...where,
                    isLowStock: true,
                },
            }),
            prisma.stock.findMany({
                where,
                select: {
                    quantity: true,
                    product: {
                        select: {
                            sellingPrice: true,
                        },
                    },
                },
            }),
        ]);

        // Calculate total stock value
        const totalStockValue = allStocks.reduce((sum, stock) => {
            const value = stock.quantity * Number(stock.product.sellingPrice);
            return sum + value;
        }, 0);

        return {
            totalStockValue,
            totalItems: totalItems._sum.quantity || 0,
            lowStockCount,
            uniqueProducts: await prisma.stock.count({ where }),
        };
    }

    async getLowStockProducts(query: GetLowStockProductsQuery) {
        const where: Prisma.StockWhereInput = {
            isLowStock: true,
        };

        if (query.branchId) where.branchId = query.branchId;

        return prisma.stock.findMany({
            where,
            select: {
                id: true,
                quantity: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        sellingPrice: true,
                        minStock: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                quantity: 'asc',
            },
            take: query.limit,
        });
    }

    async getDeadStockProducts(query: GetDeadStockProductsQuery) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - query.daysThreshold);

        // Build base where
        const where: Prisma.StockWhereInput = {
            ...(query.branchId && { branchId: query.branchId }),
            OR: [{ lastSaleDate: { lt: cutoffDate } }, { lastSaleDate: null }],
        };

        return prisma.stock.findMany({
            where,
            select: {
                id: true,
                quantity: true,
                lastSaleDate: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        sellingPrice: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                lastSaleDate: 'asc',
            },
            take: query.limit,
        });
    }

    async getStockValuation(query: GetStockValuationQuery) {
        const where: Prisma.StockWhereInput = {};
        if (query.branchId) where.branchId = query.branchId;

        return prisma.stock.findMany({
            where,
            select: {
                id: true,
                quantity: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        sellingPrice: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { product: { category: { name: 'asc' } } },
                { product: { name: 'asc' } },
            ],
        });
    }
}
