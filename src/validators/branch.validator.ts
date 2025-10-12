import { z } from 'zod';
import { BranchStatus } from '@prisma/client';

// Operating Hours Schema
const operatingHoursSchema = z.object({
    monday: z
        .object({
            open: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            close: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            closed: z.boolean().optional(),
        })
        .optional(),
    tuesday: z
        .object({
            open: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            close: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            closed: z.boolean().optional(),
        })
        .optional(),
    wednesday: z
        .object({
            open: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            close: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            closed: z.boolean().optional(),
        })
        .optional(),
    thursday: z
        .object({
            open: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            close: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            closed: z.boolean().optional(),
        })
        .optional(),
    friday: z
        .object({
            open: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            close: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            closed: z.boolean().optional(),
        })
        .optional(),
    saturday: z
        .object({
            open: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            close: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            closed: z.boolean().optional(),
        })
        .optional(),
    sunday: z
        .object({
            open: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            close: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    'Invalid time format'
                ),
            closed: z.boolean().optional(),
        })
        .optional(),
});

// CREATE BRANCH SCHEMA
export const createBranchSchema = z.object({
    body: z.object({
        code: z
            .string()
            .min(2, 'Branch code must be at least 2 characters')
            .max(10, 'Branch code must not exceed 10 characters')
            .regex(
                /^[A-Z0-9_-]+$/,
                'Branch code must contain only uppercase letters, numbers, dashes, and underscores'
            )
            .transform((val) => val.toUpperCase()),
        name: z
            .string()
            .min(3, 'Branch name must be at least 3 characters')
            .max(100, 'Branch name must not exceed 100 characters')
            .trim(),
        address: z
            .string()
            .min(10, 'Address must be at least 10 characters')
            .max(500, 'Address must not exceed 500 characters')
            .trim(),
        city: z
            .string()
            .min(2, 'City must be at least 2 characters')
            .max(100, 'City must not exceed 100 characters')
            .trim(),
        province: z
            .string()
            .min(2, 'Province must be at least 2 characters')
            .max(100, 'Province must not exceed 100 characters')
            .trim(),
        postalCode: z
            .string()
            .regex(/^[0-9]{5}$/, 'Postal code must be exactly 5 digits')
            .trim(),
        phone: z
            .string()
            .regex(
                /^(\+62|62|0)[0-9]{9,12}$/,
                'Invalid Indonesian phone number format'
            )
            .trim(),
        email: z.string().email('Invalid email format').toLowerCase().trim(),
        operatingHours: operatingHoursSchema.optional(),
        notes: z
            .string()
            .max(1000, 'Notes must not exceed 1000 characters')
            .optional(),
    }),
});

// UPDATE BRANCH SCHEMA
export const updateBranchSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .min(3, 'Branch name must be at least 3 characters')
                .max(100, 'Branch name must not exceed 100 characters')
                .trim()
                .optional(),
            address: z
                .string()
                .min(10, 'Address must be at least 10 characters')
                .max(500, 'Address must not exceed 500 characters')
                .trim()
                .optional(),
            city: z
                .string()
                .min(2, 'City must be at least 2 characters')
                .max(100, 'City must not exceed 100 characters')
                .trim()
                .optional(),
            province: z
                .string()
                .min(2, 'Province must be at least 2 characters')
                .max(100, 'Province must not exceed 100 characters')
                .trim()
                .optional(),
            postalCode: z
                .string()
                .regex(/^[0-9]{5}$/, 'Postal code must be exactly 5 digits')
                .trim()
                .optional(),
            phone: z
                .string()
                .regex(
                    /^(\+62|62|0)[0-9]{9,12}$/,
                    'Invalid Indonesian phone number format'
                )
                .trim()
                .optional(),
            email: z
                .string()
                .email('Invalid email format')
                .toLowerCase()
                .trim()
                .optional(),
            operatingHours: operatingHoursSchema.optional(),
            notes: z
                .string()
                .max(1000, 'Notes must not exceed 1000 characters')
                .optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field must be provided for update',
        }),
    params: z.object({
        branchId: z.string().uuid('Invalid branch ID format'),
    }),
});

// ASSIGN USER SCHEMA (Manager or Cashier)
export const assignUserSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID format'),
    }),
    params: z.object({
        branchId: z.string().uuid('Invalid branch ID format'),
    }),
});

// DEACTIVATE BRANCH SCHEMA
export const deactivateBranchSchema = z.object({
    body: z.object({
        reason: z
            .string()
            .min(10, 'Reason must be at least 10 characters')
            .max(500, 'Reason must not exceed 500 characters')
            .trim(),
    }),
    params: z.object({
        branchId: z.string().uuid('Invalid branch ID format'),
    }),
});

// GET BRANCHES QUERY SCHEMA
export const getBranchesQuerySchema = z.object({
    query: z.object({
        page: z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 1))
            .refine((val) => val > 0, 'Page must be greater than 0'),
        limit: z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 10))
            .refine(
                (val) => val > 0 && val <= 100,
                'Limit must be between 1 and 100'
            ),
        status: z.nativeEnum(BranchStatus).optional(),
        search: z.string().trim().optional(),
        city: z.string().trim().optional(),
        province: z.string().trim().optional(),
        isActive: z
            .enum(['true', 'false'])
            .optional()
            .transform((val) =>
                val === 'true' ? true : val === 'false' ? false : undefined
            ),
    }),
});

// BRANCH ID PARAM SCHEMA
export const branchIdParamSchema = z.object({
    params: z.object({
        branchId: z.string().uuid('Invalid branch ID format'),
    }),
});

// Type exports for TypeScript
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type AssignUserInput = z.infer<typeof assignUserSchema>;
export type DeactivateBranchInput = z.infer<typeof deactivateBranchSchema>;
export type GetBranchesQueryInput = z.infer<typeof getBranchesQuerySchema>;
