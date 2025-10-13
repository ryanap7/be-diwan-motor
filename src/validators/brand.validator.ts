import { z } from 'zod';

// Create Brand Schema
export const createBrandSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(1, 'Brand name is required')
            .min(2, 'Brand name must be at least 2 characters')
            .max(100, 'Brand name must not exceed 100 characters')
            .trim(),

        description: z
            .string()
            .max(500, 'Description must not exceed 500 characters')
            .trim()
            .optional(),

        isActive: z.boolean().optional().default(true),
    }),
});

// Update Brand Schema
export const updateBrandSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid brand ID format'),
    }),
    body: z.object({
        name: z
            .string()
            .min(2, 'Brand name must be at least 2 characters')
            .max(100, 'Brand name must not exceed 100 characters')
            .trim()
            .optional(),

        description: z
            .string()
            .max(500, 'Description must not exceed 500 characters')
            .trim()
            .optional()
            .nullable(),

        isActive: z.boolean().optional(),
    }),
});

// Get Brand By ID Schema
export const getBrandByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid brand ID format'),
    }),
});

// Toggle Brand Status Schema
export const toggleBrandStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid brand ID format'),
    }),
    body: z.object({
        isActive: z.boolean(),
    }),
});

// Delete Brand Schema
export const deleteBrandSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid brand ID format'),
    }),
});

// Export types
export type CreateBrandInput = z.infer<typeof createBrandSchema>['body'];
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>['body'];
export type GetBrandByIdParams = z.infer<typeof getBrandByIdSchema>['params'];
export type ToggleBrandStatusInput = z.infer<
    typeof toggleBrandStatusSchema
>['body'];
export type DeleteBrandParams = z.infer<typeof deleteBrandSchema>['params'];
