import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .regex(
            /^[a-zA-Z0-9_]+$/,
            'Username can only contain letters, numbers, and underscores'
        ),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must not exceed 100 characters'),
    email: z.string().email('Invalid email format').toLowerCase(),
    fullName: z
        .string()
        .min(3, 'Full name must be at least 3 characters')
        .max(100, 'Full name must not exceed 100 characters'),
    phone: z
        .string()
        .regex(
            /^(\+62|62|0)[0-9]{9,12}$/,
            'Invalid Indonesian phone number format'
        )
        .optional()
        .nullable(),
    role: z
        .nativeEnum(UserRole)
        .refine(
            (val) =>
                val === UserRole.ADMIN ||
                val === UserRole.CASHIER ||
                val === UserRole.BRANCH_MANAGER,
            {
                message:
                    'Invalid role. Must be ADMIN, CASHIER, or BRANCH_MANAGER',
            }
        ),
    branchId: z.string().nullable().optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .regex(
            /^[a-zA-Z0-9_]+$/,
            'Username can only contain letters, numbers, and underscores'
        )
        .optional(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must not exceed 100 characters')
        .optional(),
    email: z.string().email('Invalid email format').toLowerCase().optional(),
    fullName: z
        .string()
        .min(3, 'Full name must be at least 3 characters')
        .max(100, 'Full name must not exceed 100 characters')
        .optional(),
    phone: z
        .string()
        .regex(
            /^(\+62|62|0)[0-9]{9,12}$/,
            'Invalid Indonesian phone number format'
        )
        .optional()
        .nullable(),
    role: z
        .nativeEnum(UserRole)
        .refine(
            (val) =>
                val === UserRole.ADMIN ||
                val === UserRole.CASHIER ||
                val === UserRole.BRANCH_MANAGER,
            {
                message:
                    'Invalid role. Must be ADMIN, CASHIER, or BRANCH_MANAGER',
            }
        )
        .optional(),
    branchId: z.string().uuid('Invalid branch ID format').optional(),
    isActive: z.boolean().optional(),
});

export const getUsersQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number),
    search: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    branchId: z.string().uuid().optional(),
    isActive: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
