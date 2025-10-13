import { z } from 'zod';

// Base schema for product
const productBaseSchema = z.object({
    sku: z.string().min(1, 'SKU is required').max(50),
    barcode: z.string().optional(),
    name: z.string().min(1, 'Product name is required').max(255),
    description: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID'),
    brandId: z.string().uuid('Invalid brand ID').optional(),
    unit: z
        .enum([
            'PCS',
            'Unit',
            'Box',
            'Lusin',
            'Karton',
            'Kg',
            'Liter',
            'Meter',
            'Set',
        ])
        .default('PCS'),
    compatibleModels: z.string().optional(),
    purchasePrice: z.number().positive('Purchase price must be positive'),
    sellingPrice: z.number().positive('Selling price must be positive'),
    wholesalePrice: z.number().positive().optional(),
    minStock: z.number().int().min(0).default(0),
    weight: z.number().positive().optional(),
    dimensions: z
        .object({
            length: z.number().positive(),
            width: z.number().positive(),
            height: z.number().positive(),
        })
        .optional(),
    specifications: z.record(z.string(), z.any()).optional(),
    storageLocation: z.string().optional(),
    tags: z.string().optional(),
    images: z
        .array(z.string().url())
        .max(3, 'Maximum 3 images allowed')
        .optional(),
    mainImage: z.string().url().optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
});

// Create product schema
export const createProductSchema = z.object({
    body: productBaseSchema.refine(
        (data) => data.sellingPrice >= data.purchasePrice,
        {
            message:
                'Selling price must be greater than or equal to purchase price',
            path: ['sellingPrice'],
        }
    ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];

// Update product schema
export const updateProductSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: productBaseSchema.partial().refine(
        (data) => {
            if (data.sellingPrice && data.purchasePrice) {
                return data.sellingPrice >= data.purchasePrice;
            }
            return true;
        },
        {
            message:
                'Selling price must be greater than or equal to purchase price',
            path: ['sellingPrice'],
        }
    ),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];

// Get product by ID schema
export const getProductByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
});

// Toggle product status schema
export const toggleProductStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        isActive: z.boolean(),
    }),
});

// Add/Update discount schema
export const productDiscountSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        discountPercent: z
            .number()
            .min(0, 'Discount must be at least 0%')
            .max(100, 'Discount cannot exceed 100%'),
    }),
});

// Remove discount schema
export const removeProductDiscountSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
});

// Delete product schema
export const deleteProductSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
});

// Get products query schema
export const getProductsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
        search: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        brandId: z.string().uuid().optional(),
        isActive: z.enum(['true', 'false']).optional(),
        isFeatured: z.enum(['true', 'false']).optional(),
        hasDiscount: z.enum(['true', 'false']).optional(),
        minPrice: z.coerce.number().positive().optional(),
        maxPrice: z.coerce.number().positive().optional(),
        sortBy: z
            .enum(['name', 'sku', 'sellingPrice', 'createdAt'])
            .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
});

export const uploadImagesSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        setAsMain: z
            .string()
            .optional()
            .transform((val) => val === 'true'),
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

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>['query'];
