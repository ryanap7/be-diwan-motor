import { CategoryService } from '@/services/category.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }

    createCategory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;
            const category = await this.categoryService.createCategory(data);

            ResponseHandler.success(
                res,
                category,
                'Category created successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    };

    getCategories = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const {
                page = 1,
                limit = 10,
                isActive,
                sortBy,
                sortOrder,
            } = req.query;

            // Validasi sortBy
            const validSortBy = ['name', 'createdAt', 'sortOrder'] as const;
            const parsedSortBy = validSortBy.includes(sortBy as any)
                ? (sortBy as 'name' | 'createdAt' | 'sortOrder')
                : 'createdAt';

            // Validasi sortOrder
            const parsedSortOrder =
                sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'asc';

            // Validasi sortBy dengan error handling
            if (sortBy && !validSortBy.includes(sortBy as any)) {
                throw new Error('Invalid sortBy parameter');
            }

            // Validasi sortOrder dengan error handling
            if (sortOrder && sortOrder !== 'asc' && sortOrder !== 'desc') {
                throw new Error('Invalid sortOrder parameter');
            }

            const result = await this.categoryService.getCategories({
                page: parseInt(page as string),
                limit: parseInt(limit as string),
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
                    categories: result.categories,
                    pagination: result.pagination,
                },
                'Categories retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getRootCategories = async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const categories = await this.categoryService.getRootCategories();

            ResponseHandler.success(
                res,
                categories,
                'Root categories retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getCategoryById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }
            const category = await this.categoryService.getCategoryById(id);

            ResponseHandler.success(
                res,
                category,
                'Category details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    updateCategory = async (
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

            const category = await this.categoryService.updateCategory(
                id,
                data
            );

            ResponseHandler.success(
                res,
                category,
                'Category updated successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    toggleCategoryStatus = async (
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

            const category = await this.categoryService.toggleCategoryStatus(
                id,
                isActive
            );

            ResponseHandler.success(
                res,
                category,
                `Category ${req.body.isActive ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error) {
            next(error);
        }
    };

    deleteCategory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const cascade = req.query.cascade === 'true';

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            await this.categoryService.deleteCategory(id, cascade);

            ResponseHandler.success(res, null, 'Category deleted successfully');
        } catch (error) {
            next(error);
        }
    };
}
