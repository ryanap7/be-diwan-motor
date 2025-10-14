import { PurchaseOrderService } from '@/services/purchase-order.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class PurchaseOrderController {
    private purchaseOrderService: PurchaseOrderService;

    constructor() {
        this.purchaseOrderService = new PurchaseOrderService();
    }

    createPurchaseOrder = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;
            const userId = req.user!.userId;

            const purchaseOrder =
                await this.purchaseOrderService.createPurchaseOrder(
                    data,
                    userId
                );

            ResponseHandler.success(
                res,
                purchaseOrder,
                'Purchase order created successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    };

    getPurchaseOrders = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const result = await this.purchaseOrderService.getPurchaseOrders(
                query as any
            );

            ResponseHandler.success(
                res,
                result,
                'Purchase orders retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getPurchaseOrderById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const purchaseOrder =
                await this.purchaseOrderService.getPurchaseOrderById(id);

            ResponseHandler.success(
                res,
                purchaseOrder,
                'Purchase order details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    updatePurchaseOrder = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const data = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const purchaseOrder =
                await this.purchaseOrderService.updatePurchaseOrder(id, data);

            ResponseHandler.success(
                res,
                purchaseOrder,
                'Purchase order updated successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    submitPurchaseOrder = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const purchaseOrder =
                await this.purchaseOrderService.submitPurchaseOrder(id);

            ResponseHandler.success(
                res,
                purchaseOrder,
                'Purchase order submitted successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    approvePurchaseOrder = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const purchaseOrder =
                await this.purchaseOrderService.approvePurchaseOrder(
                    id,
                    userId
                );

            ResponseHandler.success(
                res,
                purchaseOrder,
                'Purchase order approved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    receivePurchaseOrder = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const data = req.body;
            const userId = req.user!.userId;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const purchaseOrder =
                await this.purchaseOrderService.receivePurchaseOrder(
                    id,
                    data,
                    userId
                );

            ResponseHandler.success(
                res,
                purchaseOrder,
                'Purchase order received successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    cancelPurchaseOrder = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const purchaseOrder =
                await this.purchaseOrderService.cancelPurchaseOrder(id, reason);

            ResponseHandler.success(
                res,
                purchaseOrder,
                'Purchase order cancelled successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    deletePurchaseOrder = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            await this.purchaseOrderService.deletePurchaseOrder(id);

            ResponseHandler.success(
                res,
                null,
                'Purchase order deleted successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getStatistics = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { branchId } = req.query;
            const statistics = await this.purchaseOrderService.getStatistics(
                branchId as string | undefined
            );

            ResponseHandler.success(
                res,
                statistics,
                'Purchase order statistics retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
