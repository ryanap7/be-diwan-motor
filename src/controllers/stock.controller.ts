import { StockService } from '@/services/stock.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class StockController {
    private stockService: StockService;

    constructor() {
        this.stockService = new StockService();
    }

    getStockOverview = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const result = await this.stockService.getStockOverview(
                query as any
            );

            ResponseHandler.success(
                res,
                result,
                'Stock overview retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getStockByProduct = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { productId } = req.params;

            if (typeof productId !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const result = await this.stockService.getStockByProduct(productId);

            ResponseHandler.success(
                res,
                result,
                'Product stock details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    adjustStock = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { productId } = req.params;
            const data = req.body;
            const userId = req.user!.userId; // From auth middleware

            if (typeof productId !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const result = await this.stockService.adjustStock(
                productId,
                data,
                userId
            );

            ResponseHandler.success(res, result, 'Stock adjusted successfully');
        } catch (error) {
            next(error);
        }
    };

    transferStock = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { productId } = req.params;
            const data = req.body;
            const userId = req.user!.userId;

            if (typeof productId !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const result = await this.stockService.transferStock(
                productId,
                data,
                userId
            );

            ResponseHandler.success(
                res,
                result,
                'Stock transferred successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getStockMovements = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const result = await this.stockService.getStockMovements(
                query as any
            );

            ResponseHandler.success(
                res,
                result,
                'Stock movements retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
