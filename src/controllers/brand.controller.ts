import { BrandService } from '@/services/brand.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class BrandController {
    private brandService: BrandService;

    constructor() {
        this.brandService = new BrandService();
    }

    createBrand = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;
            const brand = await this.brandService.createBrand(data);

            ResponseHandler.success(
                res,
                brand,
                'Brand created successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    };

    getBrands = async (
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

            const validSortBy = ['name', 'createdAt'] as const;
            const parsedSortBy = validSortBy.includes(sortBy as any)
                ? (sortBy as 'name' | 'createdAt')
                : 'createdAt';

            const parsedSortOrder =
                sortOrder === 'asc' || sortOrder === 'desc'
                    ? sortOrder
                    : 'desc';

            if (sortBy && !validSortBy.includes(sortBy as any)) {
                throw new Error('Invalid sortBy parameter');
            }

            if (sortOrder && sortOrder !== 'asc' && sortOrder !== 'desc') {
                throw new Error('Invalid sortOrder parameter');
            }

            const result = await this.brandService.getBrands({
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                search: search as string,
                isActive:
                    isActive === 'true'
                        ? true
                        : isActive === 'false'
                          ? false
                          : undefined,
                sortBy: parsedSortBy,
                sortOrder: parsedSortOrder,
            });

            ResponseHandler.success(
                res,
                {
                    brands: result.brands,
                    pagination: result.pagination,
                },
                'Brands retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getBrandById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const brand = await this.brandService.getBrandById(id);

            ResponseHandler.success(
                res,
                brand,
                'Brand details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    updateBrand = async (
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

            const brand = await this.brandService.updateBrand(id, data);

            ResponseHandler.success(res, brand, 'Brand updated successfully');
        } catch (error) {
            next(error);
        }
    };

    toggleBrandStatus = async (
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

            const brand = await this.brandService.toggleBrandStatus(
                id,
                isActive
            );

            ResponseHandler.success(
                res,
                brand,
                `Brand ${isActive ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error) {
            next(error);
        }
    };

    deleteBrand = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            await this.brandService.deleteBrand(id);

            ResponseHandler.success(res, null, 'Brand deleted successfully');
        } catch (error) {
            next(error);
        }
    };
}
