import { z } from 'zod';

// Base schema for customer
const customerBaseSchema = z.object({
    name: z.string().min(1, 'Customer name is required').max(255),
    phone: z.string().min(1, 'Phone number is required'),
    email: z
        .string()
        .email('Invalid email format')
        .optional()
        .or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().default(true),
});

// Create customer schema
export const createCustomerSchema = z.object({
    body: customerBaseSchema,
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>['body'];

// Update customer schema
export const updateCustomerSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid customer ID'),
    }),
    body: customerBaseSchema.partial(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>['body'];

// Get customer by ID schema
export const getCustomerByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid customer ID'),
    }),
});

// Toggle customer status schema
export const toggleCustomerStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid customer ID'),
    }),
    body: z.object({
        isActive: z.boolean(),
    }),
});

// Delete customer schema
export const deleteCustomerSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid customer ID'),
    }),
});

// Get customers query schema
export const getCustomersQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
        search: z.string().optional(),
        isActive: z.enum(['true', 'false']).optional(),
        sortBy: z.enum(['name', 'createdAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
});

export type GetCustomersQuery = z.infer<
    typeof getCustomersQuerySchema
>['query'];
