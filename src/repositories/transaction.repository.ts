import prisma from '@/config/database';
import { Prisma, TransactionStatus } from '@prisma/client';

export class TransactionRepository {
    private readonly selectFields = {
        id: true,
        invoiceNumber: true,
        branchId: true,
        cashierId: true,
        customerId: true,
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
        totalAmount: true,
        paymentMethod: true,
        amountPaid: true,
        changeAmount: true,
        notes: true,
        status: true,
        transactionDate: true,
        createdAt: true,
        updatedAt: true,
        branch: {
            select: {
                id: true,
                name: true,
                code: true,
            },
        },
        cashier: {
            select: {
                id: true,
                fullName: true,
                username: true,
            },
        },
        customer: {
            select: {
                id: true,
                name: true,
                phone: true,
            },
        },
        items: {
            select: {
                id: true,
                productId: true,
                productName: true,
                productSku: true,
                quantity: true,
                unitPrice: true,
                subtotal: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                    },
                },
            },
        },
    };

    async create(data: Prisma.TransactionCreateInput) {
        return prisma.transaction.create({
            data,
            select: this.selectFields,
        });
    }

    async findById(id: string) {
        return prisma.transaction.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            select: this.selectFields,
        });
    }

    async findByInvoiceNumber(invoiceNumber: string) {
        return prisma.transaction.findFirst({
            where: {
                invoiceNumber,
                deletedAt: null,
            },
            select: this.selectFields,
        });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.TransactionWhereInput;
        orderBy?: Prisma.TransactionOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const whereClause: Prisma.TransactionWhereInput = {
            ...where,
            deletedAt: null,
        };

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                skip,
                take,
                where: whereClause,
                orderBy,
                select: this.selectFields,
            }),
            prisma.transaction.count({ where: whereClause }),
        ]);

        return { transactions, total };
    }

    async generateInvoiceNumber(branchId: string): Promise<string> {
        const today = new Date();
        const dateStr =
            today.toISOString().split('T')[0]?.replace(/-/g, '') ?? ''; // YYYYMMDD

        // Get branch code
        const branch = await prisma.branch.findUnique({
            where: { id: branchId },
            select: { code: true },
        });

        if (!branch) {
            throw new Error('Branch not found');
        }

        // Count today's transactions for this branch
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        const count = await prisma.transaction.count({
            where: {
                branchId,
                transactionDate: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });

        // Generate invoice number: INV-BRANCHCODE-YYYYMMDD-XXX
        const sequence = String(count + 1).padStart(3, '0');
        return `INV-${branch.code}-${dateStr}-${sequence}`;
    }

    async updateStatus(id: string, status: TransactionStatus, notes?: string) {
        return prisma.transaction.update({
            where: { id },
            data: {
                status,
                notes: notes || undefined,
            },
            select: this.selectFields,
        });
    }

    async softDelete(id: string) {
        return prisma.transaction.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    async getTransactionStats(params: {
        branchId?: string;
        cashierId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { branchId, cashierId, startDate, endDate } = params;

        // Base where clause
        const baseWhere: Prisma.TransactionWhereInput = {
            deletedAt: null,
            status: 'COMPLETED',
        };

        if (branchId) baseWhere.branchId = branchId;
        if (cashierId) baseWhere.cashierId = cashierId;

        // Period where clause with date filter
        const periodWhere: Prisma.TransactionWhereInput = {
            ...baseWhere,
        };

        if (startDate || endDate) {
            periodWhere.transactionDate = {};
            if (startDate) periodWhere.transactionDate.gte = startDate;
            if (endDate) periodWhere.transactionDate.lte = endDate;
        }

        // Today where clause
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayWhere: Prisma.TransactionWhereInput = {
            ...baseWhere,
            transactionDate: {
                gte: today,
                lt: tomorrow,
            },
        };

        // Execute all queries in parallel
        const [
            totalTransactions,
            revenueData,
            _averageData,
            minMaxData,
            todayCount,
            todayRevenueData,
            _todayAverageData,
        ] = await Promise.all([
            // Total transactions for period
            prisma.transaction.count({ where: periodWhere }),

            // Total revenue for period
            prisma.transaction.aggregate({
                where: periodWhere,
                _sum: {
                    totalAmount: true,
                },
            }),

            // Average per transaction for period
            prisma.transaction.aggregate({
                where: periodWhere,
                _avg: {
                    totalAmount: true,
                },
            }),

            // Min and Max transaction for period
            prisma.transaction.aggregate({
                where: periodWhere,
                _min: {
                    totalAmount: true,
                },
                _max: {
                    totalAmount: true,
                },
            }),

            // Today's transaction count
            prisma.transaction.count({ where: todayWhere }),

            // Today's revenue
            prisma.transaction.aggregate({
                where: todayWhere,
                _sum: {
                    totalAmount: true,
                },
            }),

            // Today's average
            prisma.transaction.aggregate({
                where: todayWhere,
                _avg: {
                    totalAmount: true,
                },
            }),
        ]);

        const totalRevenue = revenueData._sum.totalAmount
            ? Number(revenueData._sum.totalAmount)
            : 0;
        const todayRevenue = todayRevenueData._sum.totalAmount
            ? Number(todayRevenueData._sum.totalAmount)
            : 0;

        const averageTransaction =
            totalTransactions > 0
                ? Math.round((totalRevenue / totalTransactions) * 100) / 100
                : 0;

        const todayAverage =
            todayCount > 0
                ? Math.round((todayRevenue / todayCount) * 100) / 100
                : 0;

        return {
            period: {
                startDate: startDate || null,
                endDate: endDate || null,
            },
            stats: {
                totalTransactions,
                totalRevenue,
                averagePerTransaction: averageTransaction,
                minTransaction: minMaxData._min.totalAmount
                    ? Number(minMaxData._min.totalAmount)
                    : 0,
                maxTransaction: minMaxData._max.totalAmount
                    ? Number(minMaxData._max.totalAmount)
                    : 0,
            },
            today: {
                totalTransactions: todayCount,
                totalRevenue: todayRevenue,
                averagePerTransaction: todayAverage,
            },
        };
    }
}
