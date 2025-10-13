import { z } from 'zod';

export const createCategorySchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, 'Category name must be at least 2 characters')
            .max(100, 'Category name must not exceed 100 characters')
            .trim(),

        parentId: z
            .string()
            .uuid('Parent ID must be a valid UUID format')
            .optional()
            .nullable(),

        description: z
            .string()
            .max(500, 'Description must not exceed 500 characters')
            .optional()
            .nullable(),

        sortOrder: z
            .number()
            .int('Sort order must be an integer')
            .min(0, 'Sort order must be at least 0')
            .optional(),

        icon: z
            .string()
            .max(255, 'Icon must not exceed 255 characters')
            .optional()
            .nullable(),

        isActive: z.boolean().optional().default(true),
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid('ID must be a valid UUID format'),
    }),
    body: z.object({
        name: z
            .string()
            .min(2, 'Category name must be at least 2 characters')
            .max(100, 'Category name must not exceed 100 characters')
            .trim()
            .optional(),

        parentId: z
            .string()
            .uuid('Parent ID must be a valid UUID format')
            .optional()
            .nullable(),

        description: z
            .string()
            .max(500, 'Description must not exceed 500 characters')
            .optional()
            .nullable(),

        sortOrder: z
            .number()
            .int('Sort order must be an integer')
            .min(0, 'Sort order must be at least 0')
            .optional(),

        icon: z
            .string()
            .max(255, 'Icon must not exceed 255 characters')
            .optional()
            .nullable(),

        isActive: z.boolean().optional(),
    }),
});

export const getCategoryByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('ID must be a valid UUID format'),
    }),
});

export const deleteCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid('ID must be a valid UUID format'),
    }),
});

export const toggleCategoryStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('ID must be a valid UUID format'),
    }),
    body: z.object({
        isActive: z.boolean(),
    }),
});

export const getCategoriesQuerySchema = z.object({
    query: z.object({
        page: z
            .string()
            .optional()
            .default('1')
            .transform((val) => parseInt(val, 10))
            .refine((val) => val > 0, 'Page must be greater than 0'),

        limit: z
            .string()
            .optional()
            .default('10')
            .transform((val) => parseInt(val, 10))
            .refine(
                (val) => val > 0 && val <= 100,
                'Limit must be between 1 and 100'
            ),

        search: z.string().optional(),

        parentId: z
            .string()
            .uuid('Parent ID must be a valid UUID format')
            .optional(),

        isActive: z
            .string()
            .optional()
            .transform((val) => {
                if (val === 'true') return true;
                if (val === 'false') return false;
                return undefined;
            }),

        sortBy: z
            .enum(['name', 'createdAt', 'sortOrder'])
            .optional()
            .default('sortOrder'),

        sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    }),
});

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type GetCategoriesQuery = z.infer<
    typeof getCategoriesQuerySchema
>['query'];
