import { SupplierService } from '@/services/supplier.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class SupplierController {
    private supplierService: SupplierService;

    constructor() {
        this.supplierService = new SupplierService();
    }

    createSupplier = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;
            const supplier = await this.supplierService.createSupplier(data);

            ResponseHandler.success(
                res,
                supplier,
                'Supplier created successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    };

    getSuppliers = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                isActive,
                sortBy,
                sortOrder,
            } = req.query;

            const result = await this.supplierService.getSuppliers({
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                search: search as string,
                isActive: isActive as 'true' | 'false' | undefined,
                sortBy: (sortBy as 'name' | 'createdAt') || 'createdAt',
                sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
            });

            ResponseHandler.success(
                res,
                {
                    suppliers: result.suppliers,
                    pagination: result.pagination,
                },
                'Suppliers retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getSupplierById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const supplier = await this.supplierService.getSupplierById(id);

            ResponseHandler.success(
                res,
                supplier,
                'Supplier details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    updateSupplier = async (
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

            const supplier = await this.supplierService.updateSupplier(
                id,
                data
            );

            ResponseHandler.success(
                res,
                supplier,
                'Supplier updated successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    toggleSupplierStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const supplier = await this.supplierService.toggleSupplierStatus(
                id,
                isActive
            );

            ResponseHandler.success(
                res,
                supplier,
                `Supplier ${isActive ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error) {
            next(error);
        }
    };

    deleteSupplier = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            await this.supplierService.deleteSupplier(id);

            ResponseHandler.success(res, null, 'Supplier deleted successfully');
        } catch (error) {
            next(error);
        }
    };
}
