import { ReportRepository } from '@/repositories/report.repository';
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

export class ReportService {
    private reportRepository: ReportRepository;

    constructor() {
        this.reportRepository = new ReportRepository();
    }

    // SALES REPORTS
    async getSalesReport(query: GetSalesReportQuery) {
        return this.reportRepository.getSalesReportSummary(query);
    }

    async getTopSellingProducts(query: GetTopSellingProductsQuery) {
        const products =
            await this.reportRepository.getTopSellingProducts(query);
        return products.map((p) => ({
            productId: p.productId,
            productName: p.productName,
            productSku: p.productSku,
            totalQuantity: p._sum.quantity || 0,
            totalRevenue: p._sum.subtotal ? Number(p._sum.subtotal) : 0,
        }));
    }

    async getSlowMovingProducts(query: GetSlowMovingProductsQuery) {
        const products =
            await this.reportRepository.getSlowMovingProducts(query);

        return products.map((p) => {
            const totalStock = p.stocks?.reduce(
                (sum, s) => sum + Number(s.quantity ?? 0),
                0
            );

            const lastSaleDate =
                p.stocks?.length > 0
                    ? (p.stocks
                          .map((s) => s.lastSaleDate)
                          .filter((d): d is Date => d !== null)
                          .sort((a, b) => b.getTime() - a.getTime())[0] ?? null)
                    : null;

            return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                lastSaleDate,
                totalStock,
            };
        });
    }

    async getSalesByCategory(query: GetSalesByCategoryQuery) {
        const categories =
            await this.reportRepository.getSalesByCategory(query);
        const totalRevenue = categories.reduce(
            (sum, c) => sum + c.totalRevenue,
            0
        );

        return categories.map((c) => ({
            categoryId: c.categoryId,
            categoryName: c.categoryName,
            totalQuantity: c.totalQuantity,
            totalRevenue: c.totalRevenue,
            revenuePercentage:
                totalRevenue > 0 ? (c.totalRevenue / totalRevenue) * 100 : 0,
        }));
    }

    async getCashierPerformance(query: GetCashierPerformanceQuery) {
        return this.reportRepository.getCashierPerformance(query);
    }

    // INVENTORY REPORTS
    async getInventoryReport(query: GetInventoryReportQuery) {
        return this.reportRepository.getInventoryReportSummary(query);
    }

    async getLowStockProducts(query: GetLowStockProductsQuery) {
        const stocks = await this.reportRepository.getLowStockProducts(query);
        return stocks.map((s) => ({
            id: s.id,
            currentStock: s.quantity,
            minStock: s.product.minStock,
            product: {
                id: s.product.id,
                name: s.product.name,
                sku: s.product.sku,
                price: Number(s.product.sellingPrice),
            },
            branch: s.branch,
            stockValue: s.quantity * Number(s.product.sellingPrice),
        }));
    }

    async getDeadStockProducts(query: GetDeadStockProductsQuery) {
        const stocks = await this.reportRepository.getDeadStockProducts(query);

        return stocks.map((s) => {
            const price = Number(s.product.sellingPrice ?? 0);
            const quantity = Number(s.quantity ?? 0);
            const totalValue = quantity * price;

            return {
                id: s.id,
                quantity,
                lastSaleDate: s.lastSaleDate,
                product: {
                    id: s.product.id,
                    name: s.product.name,
                    sku: s.product.sku,
                    price,
                },
                branch: {
                    id: s.branch.id,
                    name: s.branch.name,
                },
                totalValue,
            };
        });
    }

    async getStockValuation(query: GetStockValuationQuery) {
        const stocks = await this.reportRepository.getStockValuation(query);

        const stocksWithValue = stocks.map((s) => ({
            id: s.id,
            quantity: s.quantity,
            product: {
                id: s.product.id,
                name: s.product.name,
                sku: s.product.sku,
                price: Number(s.product.sellingPrice),
                category: s.product.category,
            },
            branch: s.branch,
            totalValue: s.quantity * Number(s.product.sellingPrice),
        }));

        const totalValue = stocksWithValue.reduce(
            (sum, s) => sum + s.totalValue,
            0
        );

        return {
            stocks: stocksWithValue.map((s) => ({
                ...s,
                valuePercentage:
                    totalValue > 0 ? (s.totalValue / totalValue) * 100 : 0,
            })),
            totalValue,
            totalItems: stocks.reduce((sum, s) => sum + s.quantity, 0),
        };
    }
}
