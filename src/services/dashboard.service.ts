import { DashboardRepository } from '@/repositories/dashboard.repository';
import {
    GetDashboardAnalyticsQuery,
    GetInventoryAlertsQuery,
    GetSalesChartQuery,
} from '@/validators/dashboard.validator';

export class DashboardService {
    private dashboardRepository: DashboardRepository;

    constructor() {
        this.dashboardRepository = new DashboardRepository();
    }

    /**
     * Get comprehensive dashboard analytics
     * Includes: Sales performance, inventory stats, customer stats,
     * top products, recent transactions, low stock alerts
     */
    async getDashboardAnalytics(
        query: GetDashboardAnalyticsQuery,
        userRole: string,
        userBranchId?: string
    ) {
        // Apply branch filter based on user role
        let branchId = query.branchId;
        if (userRole === 'BRANCH_MANAGER' || userRole === 'CASHIER') {
            branchId = userBranchId; // Force their own branch
        }

        // Date ranges for different periods
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - 7);
        thisWeekStart.setHours(0, 0, 0, 0);

        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );

        // Execute all queries in parallel
        const [
            todaySales,
            weeklySales,
            monthlySales,
            totalTransactions,
            inventoryStats,
            customerStats,
            topProducts,
            recentTransactions,
            lowStockProducts,
        ] = await Promise.all([
            // Today's revenue
            this.dashboardRepository.getSalesRevenue({
                branchId,
                startDate: todayStart,
                endDate: todayEnd,
            }),

            // This week's revenue
            this.dashboardRepository.getSalesRevenue({
                branchId,
                startDate: thisWeekStart,
                endDate: now,
            }),

            // This month's revenue
            this.dashboardRepository.getSalesRevenue({
                branchId,
                startDate: thisMonthStart,
                endDate: thisMonthEnd,
            }),

            // Total transactions (all time)
            this.dashboardRepository.getTotalTransactions({ branchId }),

            // Inventory statistics
            this.dashboardRepository.getInventoryStats({ branchId }),

            // Customer statistics
            this.dashboardRepository.getCustomerStats({
                branchId,
                startDate: thisMonthStart,
                endDate: thisMonthEnd,
            }),

            // Top 5 selling products (this month)
            this.dashboardRepository.getTopSellingProducts({
                branchId,
                limit: 5,
                startDate: thisMonthStart,
                endDate: thisMonthEnd,
            }),

            // Recent 5 transactions
            this.dashboardRepository.getRecentTransactions({
                branchId,
                limit: 5,
            }),

            // Low stock products
            this.dashboardRepository.getLowStockProducts({
                branchId,
                limit: 10,
            }),
        ]);

        return {
            salesPerformance: {
                today: {
                    revenue: todaySales.revenue,
                    transactionCount: todaySales.transactionCount,
                },
                thisWeek: {
                    revenue: weeklySales.revenue,
                    transactionCount: weeklySales.transactionCount,
                },
                thisMonth: {
                    revenue: monthlySales.revenue,
                    transactionCount: monthlySales.transactionCount,
                },
                totalTransactions,
            },
            inventoryStats: {
                totalProducts: inventoryStats.totalProducts,
                lowStockCount: inventoryStats.lowStockCount,
                totalStockValue: inventoryStats.totalStockValue,
            },
            customerStats: {
                totalCustomers: customerStats.totalCustomers,
                newThisMonth: customerStats.newCustomers,
            },
            topSellingProducts: topProducts,
            recentTransactions: recentTransactions.map((tx) => ({
                id: tx.id,
                invoiceNumber: tx.invoiceNumber,
                totalAmount: Number(tx.totalAmount),
                paymentMethod: tx.paymentMethod,
                status: tx.status,
                transactionDate: tx.transactionDate,
                customerName: tx.customer?.name || 'Walk-in Customer',
                customerPhone: tx.customer?.phone,
                cashierName: tx.cashier.fullName,
                itemCount: tx.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                ),
            })),
            lowStockAlerts: lowStockProducts.map((stock) => ({
                id: stock.id,
                productId: stock.product.id,
                productName: stock.product.name,
                sku: stock.product.sku,
                categoryName: stock.product.category?.name,
                currentStock: stock.quantity,
                minStock: stock.product.minStock,
                unit: stock.product.unit,
                branchName: stock.branch.name,
                branchCode: stock.branch.code,
                status: stock.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            })),
        };
    }

    /**
     * Get sales chart data for visualization
     */
    async getSalesChartData(
        query: GetSalesChartQuery,
        userRole: string,
        userBranchId?: string
    ) {
        // Apply branch filter based on user role
        let branchId = query.branchId;
        if (userRole === 'BRANCH_MANAGER' || userRole === 'CASHIER') {
            branchId = userBranchId;
        }

        const data = await this.dashboardRepository.getSalesChartData({
            branchId,
            period: query.period,
            limit: query.limit,
        });

        // Group transactions by period
        const chartData = this.groupTransactionsByPeriod(
            data.transactions,
            query.period,
            query.limit
        );

        return {
            period: query.period,
            startDate: data.startDate,
            endDate: data.endDate,
            data: chartData,
        };
    }

    /**
     * Get inventory alerts (low stock & out of stock)
     */
    async getInventoryAlerts(
        query: GetInventoryAlertsQuery,
        userRole: string,
        userBranchId?: string
    ) {
        // Apply branch filter based on user role
        let branchId = query.branchId;
        if (userRole === 'BRANCH_MANAGER' || userRole === 'CASHIER') {
            branchId = userBranchId;
        }

        let lowStockProducts: any[] = [];
        let outOfStockProducts: any[] = [];

        if (query.alertType === 'all' || query.alertType === 'low_stock') {
            lowStockProducts =
                await this.dashboardRepository.getLowStockProducts({
                    branchId,
                    limit: query.limit,
                });
        }

        if (query.alertType === 'all' || query.alertType === 'out_of_stock') {
            outOfStockProducts =
                await this.dashboardRepository.getOutOfStockProducts({
                    branchId,
                    limit: query.limit,
                });
        }

        const formatProduct = (stock: any) => ({
            id: stock.id,
            productId: stock.product.id,
            productName: stock.product.name,
            sku: stock.product.sku,
            categoryName: stock.product.category?.name,
            currentStock: stock.quantity,
            minStock: stock.product.minStock,
            unit: stock.product.unit,
            branchName: stock.branch.name,
            branchCode: stock.branch.code,
            status: stock.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        });

        return {
            lowStock: lowStockProducts.map(formatProduct),
            outOfStock: outOfStockProducts.map(formatProduct),
            summary: {
                lowStockCount: lowStockProducts.length,
                outOfStockCount: outOfStockProducts.length,
                totalAlerts:
                    lowStockProducts.length + outOfStockProducts.length,
            },
        };
    }

    /**
     * Helper: Group transactions by period for chart
     */
    private groupTransactionsByPeriod(
        transactions: Array<{ transactionDate: Date; totalAmount: any }>,
        period: 'daily' | 'weekly' | 'monthly' | 'yearly',
        limit: number
    ) {
        const groups = new Map<string, { revenue: number; count: number }>();

        // Initialize all periods with zero values
        const now = new Date();
        for (let i = limit - 1; i >= 0; i--) {
            const date = new Date(now);
            let key: string;

            switch (period) {
                case 'daily':
                    date.setDate(date.getDate() - i);
                    key = date.toISOString().split('T')[0]!;
                    break;
                case 'weekly':
                    date.setDate(date.getDate() - i * 7);
                    key = `Week ${date.toISOString().split('T')[0]}`;
                    break;
                case 'monthly':
                    date.setMonth(date.getMonth() - i);
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'yearly':
                    date.setFullYear(date.getFullYear() - i);
                    key = String(date.getFullYear());
                    break;
            }

            groups.set(key, { revenue: 0, count: 0 });
        }

        // Aggregate transactions into periods
        transactions.forEach((tx) => {
            const date = new Date(tx.transactionDate);
            let key: string;

            switch (period) {
                case 'daily':
                    key = date.toISOString().split('T')[0]!;
                    break;
                case 'weekly':
                    key = `Week ${date.toISOString().split('T')[0]}`;
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'yearly':
                    key = String(date.getFullYear());
                    break;
            }

            const existing = groups.get(key);
            if (existing) {
                existing.revenue += Number(tx.totalAmount);
                existing.count += 1;
            }
        });

        // Convert to array format
        return Array.from(groups.entries()).map(([period, data]) => ({
            period,
            revenue: Math.round(data.revenue),
            transactionCount: data.count,
        }));
    }
}
