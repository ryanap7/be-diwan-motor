import { ReportService } from '@/services/report.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class ReportController {
    private reportService: ReportService;

    constructor() {
        this.reportService = new ReportService();
    }

    // SALES REPORTS
    getSalesReport = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const report = await this.reportService.getSalesReport(
                req.query as any
            );
            ResponseHandler.success(
                res,
                report,
                'Sales report retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getTopSellingProducts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const products = await this.reportService.getTopSellingProducts(
                req.query as any
            );
            ResponseHandler.success(
                res,
                { products },
                'Top selling products retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getSlowMovingProducts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const products = await this.reportService.getSlowMovingProducts(
                req.query as any
            );
            ResponseHandler.success(
                res,
                { products },
                'Slow moving products retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getSalesByCategory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const categories = await this.reportService.getSalesByCategory(
                req.query as any
            );
            ResponseHandler.success(
                res,
                { categories },
                'Sales by category retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getCashierPerformance = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const performance = await this.reportService.getCashierPerformance(
                req.query as any
            );
            ResponseHandler.success(
                res,
                { performance },
                'Cashier performance retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    // INVENTORY REPORTS
    getInventoryReport = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const report = await this.reportService.getInventoryReport(
                req.query as any
            );
            ResponseHandler.success(
                res,
                report,
                'Inventory report retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getLowStockProducts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const products = await this.reportService.getLowStockProducts(
                req.query as any
            );
            ResponseHandler.success(
                res,
                { products },
                'Low stock products retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getDeadStockProducts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const products = await this.reportService.getDeadStockProducts(
                req.query as any
            );
            ResponseHandler.success(
                res,
                { products },
                'Dead stock products retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getStockValuation = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = await this.reportService.getStockValuation(
                req.query as any
            );
            ResponseHandler.success(
                res,
                data,
                'Stock valuation retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
