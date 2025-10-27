import { ProductRepository } from '@/repositories/product.repository';
import { BadRequestError, ConflictError, NotFoundError } from '@/utils/errors';
import type {
    CreateProductInput,
    GetProductsQuery,
    UpdateProductInput,
} from '@/validators/product.validator';
import { Prisma } from '@prisma/client';
import { ImageService } from './image.service';

export class ProductService {
    private productRepository: ProductRepository;
    private imageService: ImageService;

    constructor() {
        this.productRepository = new ProductRepository();
        this.imageService = new ImageService();
    }

    private generateSlug(name: string): string {
        const baseSlug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        const timestamp = Date.now();

        return `${baseSlug}-${timestamp}`;
    }

    private calculateDiscountPrice(
        sellingPrice: number,
        discountPercent: number
    ): number {
        return sellingPrice - (sellingPrice * discountPercent) / 100;
    }

    async createProduct(data: CreateProductInput) {
        // Generate slug
        const slug = this.generateSlug(data.name);

        // Check if barcode already exists (if provided)
        if (data.barcode) {
            const existingBarcode = await this.productRepository.findByBarcode(
                data.barcode
            );
            if (existingBarcode) {
                throw new ConflictError(
                    'Product with this barcode already exists',
                    'BARCODE_EXISTS'
                );
            }
        }

        // Check if slug already exists
        const existingSlug = await this.productRepository.findBySlug(slug);
        if (existingSlug) {
            throw new ConflictError(
                'Product with this name already exists',
                'PRODUCT_EXISTS'
            );
        }

        // Validate category exists
        const categoryExists = await this.productRepository.checkCategoryExists(
            data.categoryId
        );
        if (!categoryExists) {
            throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
        }

        // Validate brand exists (if provided)
        if (data.brandId) {
            const brandExists = await this.productRepository.checkBrandExists(
                data.brandId
            );
            if (!brandExists) {
                throw new NotFoundError('Brand not found', 'BRAND_NOT_FOUND');
            }
        }

        // Create product
        const product = await this.productRepository.create({
            sku: data.sku ?? null,
            barcode: data.barcode,
            name: data.name,
            slug,
            description: data.description,
            category: { connect: { id: data.categoryId } },
            brand: data.brandId ? { connect: { id: data.brandId } } : undefined,
            unit: data.unit || 'PCS',
            compatibleModels: data.compatibleModels,
            purchasePrice: data.purchasePrice,
            sellingPrice: data.sellingPrice,
            wholesalePrice: data.wholesalePrice,
            minOrderWholesale: data.minOrderWholesale,
            minStock: data.minStock || 0,
            weight: data.weight,
            dimensions: data.dimensions as any,
            specifications: data.specifications as any,
            storageLocation: data.storageLocation,
            tags: data.tags,
            images: data.images as any,
            mainImage: data.mainImage,
            isActive: data.isActive ?? true,
            isFeatured: data.isFeatured ?? false,
        });

        return product;
    }

    async getProducts(query: GetProductsQuery) {
        const {
            page = 1,
            limit = 10,
            search,
            categoryId,
            brandId,
            isActive,
            isFeatured,
            hasDiscount,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            branchId,
        } = query;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.ProductWhereInput = {
            deletedAt: null, // IMPORTANT: Always filter soft deleted
        };

        // Search by name, SKU, or compatible models
        if (search && search.trim() !== '') {
            where.OR = [
                { name: { contains: search.trim(), mode: 'insensitive' } },
                { sku: { contains: search.trim(), mode: 'insensitive' } },
                {
                    compatibleModels: {
                        contains: search.trim(),
                        mode: 'insensitive',
                    },
                },
            ];
        }

        // Filter by category
        if (categoryId && categoryId.trim() !== '') {
            where.categoryId = categoryId;
        }

        // Filter by brand
        if (brandId && brandId.trim() !== '') {
            where.brandId = brandId;
        }

        // Filter by status - CRITICAL: Check for explicit boolean values
        if (typeof isActive === 'boolean') {
            where.isActive = isActive;
        }

        // Filter by featured
        if (typeof isFeatured === 'boolean') {
            where.isFeatured = isFeatured;
        }

        // Filter by discount
        if (typeof hasDiscount === 'boolean') {
            where.hasDiscount = hasDiscount;
        }

        // Filter by price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.sellingPrice = {};
            if (minPrice !== undefined && minPrice > 0) {
                where.sellingPrice.gte = minPrice;
            }
            if (maxPrice !== undefined && maxPrice > 0) {
                where.sellingPrice.lte = maxPrice;
            }
        }

        // Build orderBy with fallback
        const orderByClause: Prisma.ProductOrderByWithRelationInput = {
            [sortBy]: sortOrder,
        };

        console.log('Product Query Where:', JSON.stringify(where, null, 2)); // Debug log

        // Use different repository method based on whether we need stock info
        let products, total;

        if (branchId && branchId.trim() !== '') {
            // Get products with stock information
            const result = await this.productRepository.findManyWithStocks({
                skip,
                take: Number(limit),
                where,
                orderBy: orderByClause,
                branchId,
            });

            products = result.products;
            total = result.total;

            // Format products with stock information
            products = products.map((product: any) => {
                let stockQuantity = 0;
                let isLowStock = true;

                if (product.stocks && product.stocks.length > 0) {
                    if (branchId) {
                        // For specific branch
                        const branchStock = product.stocks[0];
                        stockQuantity = branchStock.quantity || 0;
                        isLowStock = branchStock.isLowStock ?? true;
                    } else {
                        // Total across all branches
                        stockQuantity = product.stocks.reduce(
                            (sum: number, stock: any) =>
                                sum + (stock.quantity || 0),
                            0
                        );
                        isLowStock = stockQuantity <= (product.minStock || 0);
                    }
                }

                const { stocks, ...productWithoutStocks } = product;

                return {
                    ...productWithoutStocks,
                    stock: {
                        quantity: stockQuantity,
                        isLowStock,
                    },
                    totalStock: stockQuantity,
                };
            });
        } else {
            // Get products without stock information (original behavior)
            const result = await this.productRepository.findMany({
                skip,
                take: Number(limit),
                where,
                orderBy: orderByClause,
            });

            products = result.products;
            total = result.total;
        }

        console.log(`Found ${total} products`); // Debug log

        return {
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        };
    }

    async getProductById(id: string) {
        const product = await this.productRepository.findById(id);

        if (!product) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        return product;
    }

    async updateProduct(id: string, data: UpdateProductInput) {
        // Check if product exists
        const existingProduct = await this.productRepository.findById(id);
        if (!existingProduct) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        // Check if SKU is being updated and already exists
        if (data.sku && data.sku !== existingProduct.sku) {
            const skuExists = await this.productRepository.findBySku(data.sku);
            if (skuExists) {
                throw new ConflictError(
                    'Product with this SKU already exists',
                    'SKU_EXISTS'
                );
            }
        }

        // Check if barcode is being updated and already exists
        if (data.barcode && data.barcode !== existingProduct.barcode) {
            const barcodeExists = await this.productRepository.findByBarcode(
                data.barcode
            );
            if (barcodeExists) {
                throw new ConflictError(
                    'Product with this barcode already exists',
                    'BARCODE_EXISTS'
                );
            }
        }

        // Generate new slug if name is changed
        let slug = existingProduct.slug;
        if (data.name && data.name !== existingProduct.name) {
            slug = this.generateSlug(data.name);

            const slugExists = await this.productRepository.findBySlug(slug);
            if (slugExists && slugExists.id !== id) {
                throw new ConflictError(
                    'Product with this name already exists',
                    'PRODUCT_EXISTS'
                );
            }
        }

        // Validate category if being updated
        if (data.categoryId) {
            const categoryExists =
                await this.productRepository.checkCategoryExists(
                    data.categoryId
                );
            if (!categoryExists) {
                throw new NotFoundError(
                    'Category not found',
                    'CATEGORY_NOT_FOUND'
                );
            }
        }

        // Validate brand if being updated
        if (data.brandId) {
            const brandExists = await this.productRepository.checkBrandExists(
                data.brandId
            );
            if (!brandExists) {
                throw new NotFoundError('Brand not found', 'BRAND_NOT_FOUND');
            }
        }

        // Build update data
        const updateData: Prisma.ProductUpdateInput = {
            sku: data.sku,
            barcode: data.barcode,
            name: data.name,
            slug: data.name ? slug : undefined,
            description: data.description,
            unit: data.unit,
            compatibleModels: data.compatibleModels,
            purchasePrice: data.purchasePrice,
            sellingPrice: data.sellingPrice,
            wholesalePrice: data.wholesalePrice,
            minOrderWholesale: data.minOrderWholesale,
            minStock: data.minStock,
            weight: data.weight,
            dimensions: data.dimensions as any,
            specifications: data.specifications as any,
            storageLocation: data.storageLocation,
            tags: data.tags,
            images: data.images as any,
            mainImage: data.mainImage,
            isActive: data.isActive,
            isFeatured: data.isFeatured,
        };

        // Handle category relationship
        if (data.categoryId) {
            updateData.category = { connect: { id: data.categoryId } };
        }

        // Handle brand relationship
        if (data.brandId !== undefined) {
            if (data.brandId === null) {
                updateData.brand = { disconnect: true };
            } else {
                updateData.brand = { connect: { id: data.brandId } };
            }
        }

        const updatedProduct = await this.productRepository.update(
            id,
            updateData
        );

        return updatedProduct;
    }

    async toggleProductStatus(id: string, isActive: boolean) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        return this.productRepository.toggleStatus(id, isActive);
    }

    async addDiscount(id: string, discountPercent: number) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        // Calculate discount price
        const discountPrice = this.calculateDiscountPrice(
            Number(product.sellingPrice),
            discountPercent
        );

        return this.productRepository.updateDiscount(
            id,
            discountPercent,
            discountPrice
        );
    }

    async removeDiscount(id: string) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        if (!product.hasDiscount) {
            throw new BadRequestError(
                'Product does not have a discount',
                'NO_DISCOUNT'
            );
        }

        return this.productRepository.removeDiscount(id);
    }

    async deleteProduct(id: string) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        return this.productRepository.softDelete(id);
    }

    async uploadImages(
        id: string,
        files: Express.Multer.File[],
        setAsMain: boolean = false
    ): Promise<any> {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        // Check if product already has maximum images
        const currentImages = (product.images as string[]) || [];
        if (currentImages.length >= 3) {
            throw new BadRequestError(
                'Product already has maximum number of images (3). Please delete existing images first',
                'MAX_IMAGES_REACHED'
            );
        }

        // Check if adding new images would exceed limit
        if (currentImages.length + files.length > 3) {
            throw new BadRequestError(
                `Can only upload ${3 - currentImages.length} more image(s)`,
                'EXCEEDS_MAX_IMAGES'
            );
        }

        // Process and save images
        const uploadedUrls = await Promise.all(
            files.map((file) =>
                this.imageService.processAndSaveProductImage(
                    file.buffer,
                    file.originalname
                )
            )
        );

        // Update product images
        const updatedImages = [...currentImages, ...uploadedUrls];
        const mainImage =
            setAsMain && uploadedUrls.length > 0
                ? uploadedUrls[0]
                : product.mainImage || uploadedUrls[0];

        const updatedProduct = await this.productRepository.update(id, {
            images: updatedImages as any,
            mainImage,
        });

        return {
            ...updatedProduct,
            uploadedCount: uploadedUrls.length,
        };
    }

    async deleteImage(id: string, imageUrl: string): Promise<any> {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        const currentImages = (product.images as string[]) || [];

        // Check if image exists in product
        if (!currentImages.includes(imageUrl)) {
            throw new BadRequestError(
                'Image not found in product',
                'IMAGE_NOT_FOUND'
            );
        }

        // Check if trying to delete main image
        if (product.mainImage === imageUrl && currentImages.length > 1) {
            throw new BadRequestError(
                'Cannot delete main image. Set another image as main first',
                'CANNOT_DELETE_MAIN_IMAGE'
            );
        }

        // Remove image from array
        const updatedImages = currentImages.filter((img) => img !== imageUrl);

        // Update main image if it was deleted
        const mainImage =
            product.mainImage === imageUrl
                ? updatedImages[0] || null
                : product.mainImage;

        // Delete physical file
        await this.imageService.deleteImage(imageUrl);

        // Update product
        const updatedProduct = await this.productRepository.update(id, {
            images: updatedImages as any,
            mainImage,
        });

        return {
            ...updatedProduct,
            remainingImages: updatedImages.length,
        };
    }

    async setMainImage(id: string, imageUrl: string): Promise<any> {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        const currentImages = (product.images as string[]) || [];

        // Check if image exists in product
        if (!currentImages.includes(imageUrl)) {
            throw new BadRequestError(
                'Image not found in product images',
                'IMAGE_NOT_FOUND'
            );
        }

        // Update main image
        return this.productRepository.update(id, {
            mainImage: imageUrl,
        });
    }
}
