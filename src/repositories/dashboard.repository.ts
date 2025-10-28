import prisma from '@/config/database';
import { Prisma } from '@prisma/client';

export class DashboardRepository {
    // ============================================
    // SALES PERFORMANCE
    // ============================================

    async getSalesRevenue(params: {
        branchId?: string;
        startDate: Date;
        endDate: Date;
    }) {
        const { branchId, startDate, endDate } = params;

        const where: Prisma.TransactionWhereInput = {
            deletedAt: null,
            status: 'COMPLETED',
            transactionDate: {
                gte: startDate,
                lte: endDate,
            },
        };

        if (branchId) where.branchId = branchId;

        const result = await prisma.transaction.aggregate({
            where,
            _sum: {
                totalAmount: true,
            },
            _count: {
                id: true,
            },
        });

        return {
            revenue: result._sum.totalAmount
                ? Number(result._sum.totalAmount)
                : 0,
            transactionCount: result._count.id,
        };
    }

    async getTotalTransactions(params: { branchId?: string }) {
        const where: Prisma.TransactionWhereInput = {
            deletedAt: null,
        };

        if (params.branchId) where.branchId = params.branchId;

        return prisma.transaction.count({ where });
    }

    // ============================================
    // INVENTORY STATISTICS
    // ============================================

    async getInventoryStats(params: { branchId?: string }) {
        const { branchId } = params;

        const stockWhere: Prisma.StockWhereInput = {
            product: {
                deletedAt: null,
                isActive: true,
            },
        };
        if (branchId) stockWhere.branchId = branchId;

        const [totalProducts, lowStockCount, stockData] = await Promise.all([
            prisma.stock
                .findMany({
                    where: stockWhere,
                    distinct: ['productId'],
                })
                .then((stocks) => stocks.length),

            prisma.stock.count({
                where: {
                    ...stockWhere,
                    isLowStock: true,
                },
            }),

            prisma.stock.findMany({
                where: stockWhere,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            purchasePrice: true,
                        },
                    },
                    branch: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
        ]);

        const totalStockValue = stockData.reduce((total, stock) => {
            const price = Number(stock.product.purchasePrice);
            const qty = stock.quantity;
            const value = price * qty;

            return total + value;
        }, 0);

        return {
            totalProducts,
            lowStockCount,
            totalStockValue: Math.round(totalStockValue),
        };
    }

    async getLowStockProducts(params: { branchId?: string; limit: number }) {
        const { branchId, limit } = params;

        const where: Prisma.StockWhereInput = {
            isLowStock: true,
        };

        if (branchId) where.branchId = branchId;

        return prisma.stock.findMany({
            where,
            take: limit,
            orderBy: {
                quantity: 'asc',
            },
            select: {
                id: true,
                quantity: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        minStock: true,
                        unit: true,
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                branch: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async getOutOfStockProducts(params: { branchId?: string; limit: number }) {
        const { branchId, limit } = params;

        const where: Prisma.StockWhereInput = {
            quantity: 0,
        };

        if (branchId) where.branchId = branchId;

        return prisma.stock.findMany({
            where,
            take: limit,
            orderBy: {
                updatedAt: 'desc',
            },
            select: {
                id: true,
                quantity: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        minStock: true,
                        unit: true,
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                branch: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    // ============================================
    // CUSTOMER STATISTICS
    // ============================================

    async getCustomerStats(params: {
        branchId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { startDate, endDate } = params;

        // Total customers
        const totalCustomers = await prisma.customer.count({
            where: {
                deletedAt: null,
                isActive: true,
            },
        });

        // New customers in period (if dates provided)
        let newCustomers = 0;
        if (startDate && endDate) {
            newCustomers = await prisma.customer.count({
                where: {
                    deletedAt: null,
                    isActive: true,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            });
        }

        return {
            totalCustomers,
            newCustomers,
        };
    }

    // ============================================
    // TOP SELLING PRODUCTS
    // ============================================

    async getTopSellingProducts(params: {
        branchId?: string;
        limit: number;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { branchId, limit, startDate, endDate } = params;

        // Build transaction where clause
        const transactionWhere: Prisma.TransactionWhereInput = {
            deletedAt: null,
            status: 'COMPLETED',
        };

        if (branchId) transactionWhere.branchId = branchId;
        if (startDate && endDate) {
            transactionWhere.transactionDate = {
                gte: startDate,
                lte: endDate,
            };
        }

        // Get transaction items grouped by product
        const topProducts = await prisma.transactionItem.groupBy({
            by: ['productId'],
            where: {
                transaction: transactionWhere,
            },
            _sum: {
                quantity: true,
                subtotal: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: limit,
        });

        // Get product details for each top selling product
        const productsWithDetails = await Promise.all(
            topProducts.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        sellingPrice: true,
                        category: {
                            select: {
                                name: true,
                            },
                        },
                        brand: {
                            select: {
                                name: true,
                            },
                        },
                    },
                });

                return {
                    product,
                    totalQuantitySold: item._sum.quantity || 0,
                    totalRevenue: item._sum.subtotal
                        ? Number(item._sum.subtotal)
                        : 0,
                    transactionCount: item._count.id,
                };
            })
        );

        return productsWithDetails;
    }

    // ============================================
    // RECENT TRANSACTIONS
    // ============================================

    async getRecentTransactions(params: { branchId?: string; limit: number }) {
        const { branchId, limit } = params;

        const where: Prisma.TransactionWhereInput = {
            deletedAt: null,
        };

        if (branchId) where.branchId = branchId;

        return prisma.transaction.findMany({
            where,
            take: limit,
            orderBy: {
                transactionDate: 'desc',
            },
            select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                paymentMethod: true,
                status: true,
                transactionDate: true,
                customer: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
                cashier: {
                    select: {
                        fullName: true,
                    },
                },
                items: {
                    select: {
                        quantity: true,
                    },
                },
            },
        });
    }

    // ============================================
    // SALES CHART DATA
    // ============================================

    async getSalesChartData(params: {
        branchId?: string;
        period: 'daily' | 'weekly' | 'monthly' | 'yearly';
        limit: number;
    }) {
        const { branchId, period, limit } = params;

        const where: Prisma.TransactionWhereInput = {
            deletedAt: null,
            status: 'COMPLETED',
        };

        if (branchId) where.branchId = branchId;

        // Calculate date range based on period
        const endDate = new Date();
        const startDate = new Date();

        switch (period) {
            case 'daily':
                startDate.setDate(startDate.getDate() - limit);
                break;
            case 'weekly':
                startDate.setDate(startDate.getDate() - limit * 7);
                break;
            case 'monthly':
                startDate.setMonth(startDate.getMonth() - limit);
                break;
            case 'yearly':
                startDate.setFullYear(startDate.getFullYear() - limit);
                break;
        }

        where.transactionDate = {
            gte: startDate,
            lte: endDate,
        };

        // Get all transactions in the period
        const transactions = await prisma.transaction.findMany({
            where,
            select: {
                transactionDate: true,
                totalAmount: true,
            },
            orderBy: {
                transactionDate: 'asc',
            },
        });

        return {
            startDate,
            endDate,
            transactions,
        };
    }
}
