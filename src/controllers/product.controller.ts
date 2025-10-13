import { ProductService } from '@/services/product.service';
import { BadRequestError } from '@/utils/errors';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class ProductController {
    private productService: ProductService;

    constructor() {
        this.productService = new ProductService();
    }

    createProduct = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;
            const product = await this.productService.createProduct(data);

            ResponseHandler.created(
                res,
                product,
                'Product created successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    addDiscount = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { discountPercent } = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const product = await this.productService.addDiscount(
                id,
                discountPercent
            );

            ResponseHandler.success(
                res,
                product,
                'Discount added successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    removeDiscount = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const product = await this.productService.removeDiscount(id);

            ResponseHandler.success(
                res,
                product,
                'Discount removed successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    deleteProduct = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            await this.productService.deleteProduct(id);

            ResponseHandler.success(res, null, 'Product deleted successfully');
        } catch (error) {
            next(error);
        }
    };

    getProducts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;

            const result = await this.productService.getProducts({
                page: parseInt(query.page as string) || 1,
                limit: parseInt(query.limit as string) || 10,
                search: query.search as string,
                categoryId: query.categoryId as string,
                brandId: query.brandId as string,
                isActive: query.isActive as 'true' | 'false',
                isFeatured: query.isFeatured as 'true' | 'false',
                hasDiscount: query.hasDiscount as 'true' | 'false',
                minPrice: query.minPrice
                    ? parseFloat(query.minPrice as string)
                    : undefined,
                maxPrice: query.maxPrice
                    ? parseFloat(query.maxPrice as string)
                    : undefined,
                sortBy: (query.sortBy as any) || 'createdAt',
                sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
            });

            ResponseHandler.success(
                res,
                {
                    products: result.products,
                    pagination: result.pagination,
                },
                'Products retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getProductById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const product = await this.productService.getProductById(id);

            ResponseHandler.success(
                res,
                product,
                'Product details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    updateProduct = async (
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

            const product = await this.productService.updateProduct(id, data);

            ResponseHandler.success(
                res,
                product,
                'Product updated successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    toggleProductStatus = async (
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

            const product = await this.productService.toggleProductStatus(
                id,
                isActive
            );

            ResponseHandler.success(
                res,
                product,
                `Product ${isActive ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error) {
            next(error);
        }
    };

    uploadImages = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const files = req.files as Express.Multer.File[];
            const setAsMain = req.body.setAsMain === 'true';

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            if (!files || files.length === 0) {
                throw new BadRequestError('No images provided', 'NO_FILES');
            }

            const result = await this.productService.uploadImages(
                id,
                files,
                setAsMain
            );

            ResponseHandler.success(
                res,
                result,
                'Images uploaded successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    deleteImage = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { imageUrl } = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            if (!imageUrl) {
                throw new BadRequestError(
                    'Image URL is required',
                    'IMAGE_URL_REQUIRED'
                );
            }

            const result = await this.productService.deleteImage(id, imageUrl);

            ResponseHandler.success(res, result, 'Image deleted successfully');
        } catch (error) {
            next(error);
        }
    };

    setMainImage = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { imageUrl } = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            if (!imageUrl) {
                throw new BadRequestError(
                    'Image URL is required',
                    'IMAGE_URL_REQUIRED'
                );
            }

            const result = await this.productService.setMainImage(id, imageUrl);

            ResponseHandler.success(
                res,
                result,
                'Main image updated successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
