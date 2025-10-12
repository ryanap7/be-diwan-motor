import { Request, Response, NextFunction } from 'express';
import { BranchService } from '@/services/branch.service';
import { ResponseHandler } from '@/utils/response';
import { BranchStatus } from '@prisma/client';

export class BranchController {
    private branchService: BranchService;

    constructor() {
        this.branchService = new BranchService();
    }

    createBranch = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;

            const branch = await this.branchService.createBranch(data);

            ResponseHandler.success(
                res,
                branch,
                'Branch created successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    };

    assignManager = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { branchId } = req.params;
            const { userId } = req.body;

            if (typeof branchId !== 'string') {
                throw new Error('Invalid or missing branch ID');
            }

            const branch = await this.branchService.assignManager(branchId, {
                userId,
            });

            ResponseHandler.success(
                res,
                branch,
                'Manager assigned successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    assignCashier = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { branchId } = req.params;
            const { userId } = req.body;

            if (typeof branchId !== 'string') {
                throw new Error('Invalid or missing branch ID');
            }

            const branch = await this.branchService.assignCashier(branchId, {
                userId,
            });

            ResponseHandler.success(
                res,
                branch,
                'Cashier assigned successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    activateBranch = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { branchId } = req.params;

            if (typeof branchId !== 'string') {
                throw new Error('Invalid or missing branch ID');
            }

            const branch = await this.branchService.activateBranch(branchId);

            ResponseHandler.success(
                res,
                branch,
                'Branch activated successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    deactivateBranch = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { branchId } = req.params;

            if (typeof branchId !== 'string') {
                throw new Error('Invalid or missing branch ID');
            }

            const branch = await this.branchService.deactivateBranch(branchId);

            ResponseHandler.success(
                res,
                branch,
                'Branch deactivated successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    updateBranch = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { branchId } = req.params;
            const data = req.body;

            if (typeof branchId !== 'string') {
                throw new Error('Invalid or missing branch ID');
            }

            const branch = await this.branchService.updateBranch(
                branchId,
                data
            );

            ResponseHandler.success(res, branch, 'Branch updated successfully');
        } catch (error) {
            next(error);
        }
    };

    getBranches = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                search,
                city,
                province,
                isActive,
            } = req.query;

            const result = await this.branchService.getBranches({
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                status: status as BranchStatus,
                search: search as string,
                city: city as string,
                province: province as string,
                isActive:
                    isActive === 'true'
                        ? true
                        : isActive === 'false'
                          ? false
                          : undefined,
            });

            ResponseHandler.success(
                res,
                result,
                'Branches retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getBranchById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { branchId } = req.params;

            if (typeof branchId !== 'string') {
                throw new Error('Invalid or missing branch ID');
            }

            const branch = await this.branchService.getBranchById(branchId);

            ResponseHandler.success(
                res,
                branch,
                'Branch retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
