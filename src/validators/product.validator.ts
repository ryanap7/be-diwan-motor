import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        // Required fields
        name: z.string().min(1, 'Product name is required').trim(),
        categoryId: z.string().uuid('Invalid category ID'),
        unit: z.string().default('PCS'),
        purchasePrice: z.coerce
            .number()
            .positive('Purchase price must be positive'),
        sellingPrice: z.coerce
            .number()
            .positive('Selling price must be positive'),
        wholesalePrice: z.coerce
            .number()
            .positive('Wholesale price must be positive'),
        minOrderWholesale: z.coerce
            .number()
            .int()
            .positive('Minimum order must be positive'),
        isActive: z.boolean().default(true),

        // Optional fields
        sku: z.string().min(1, 'SKU is required').trim().optional(),
        barcode: z.string().trim().optional(),
        description: z.string().trim().optional(),
        brandId: z.string().uuid('Invalid brand ID').optional(),
        compatibleModels: z.string().trim().optional(),
        minStock: z.coerce.number().int().nonnegative().optional(),
        weight: z.coerce.number().positive().optional(),
        dimensions: z.object({}).optional(),
        specifications: z.object({}).optional(),
        storageLocation: z.string().trim().optional(),
        tags: z.string().trim().optional(),
        images: z.array(z.string()).optional(),
        mainImage: z.string().trim().optional(),
        isFeatured: z.boolean().optional(),
    }),
});

export const updateProductSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        name: z.string().min(1).trim().optional(),
        categoryId: z.string().uuid().optional(),
        unit: z.string().optional(),
        purchasePrice: z.coerce.number().positive().optional(),
        sellingPrice: z.coerce.number().positive().optional(),
        wholesalePrice: z.coerce.number().positive().optional(),
        minOrderWholesale: z.coerce.number().int().positive().optional(),
        sku: z.string().min(1).trim().optional(),
        barcode: z.string().trim().optional(),
        description: z.string().trim().optional(),
        brandId: z.string().uuid().optional().or(z.null()),
        compatibleModels: z.string().trim().optional(),
        minStock: z.coerce.number().int().nonnegative().optional(),
        weight: z.coerce.number().positive().optional(),
        dimensions: z.object({}).optional(),
        specifications: z.object({}).optional(),
        storageLocation: z.string().trim().optional(),
        tags: z.string().trim().optional(),
        images: z.array(z.string()).optional(),
        mainImage: z.string().trim().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
    }),
});

export const getProductsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(1000).optional(),
        search: z.string().trim().optional(),
        categoryId: z.string().uuid().optional(),
        branchId: z.string().uuid().optional(),
        brandId: z.string().uuid().optional(),
        isActive: z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional(),
        isFeatured: z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional(),
        hasDiscount: z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional(),
        minPrice: z.coerce.number().nonnegative().optional(),
        maxPrice: z.coerce.number().nonnegative().optional(),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

export const getProductByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
});

export const productDiscountSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        discountPercent: z.coerce
            .number()
            .min(0, 'Discount must be at least 0%')
            .max(100, 'Discount cannot exceed 100%'),
    }),
});

export const removeProductDiscountSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
});

export const toggleProductStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        isActive: z.boolean(),
    }),
});

export const deleteProductSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
});

export const uploadImagesSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        setAsMain: z.enum(['true', 'false']).optional(),
    }),
});

export const deleteImageSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        imageUrl: z.string().url('Invalid image URL'),
    }),
});

export const setMainImageSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        imageUrl: z.string().url('Invalid image URL'),
    }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>['query'];
