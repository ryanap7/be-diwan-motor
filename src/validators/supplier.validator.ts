import { z } from 'zod';

// Base schema for supplier
const supplierBaseSchema = z.object({
    name: z.string().min(1, 'Supplier name is required').max(255),
    contactPerson: z.string().optional(),
    phone: z.string().min(1, 'Phone number is required'),
    email: z
        .string()
        .email('Invalid email format')
        .optional()
        .or(z.literal('')),
    address: z.string().min(1, 'Address is required'),
    paymentTerms: z.string().optional(),
    deliveryTerms: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().default(true),
});

// Create supplier schema
export const createSupplierSchema = z.object({
    body: supplierBaseSchema,
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>['body'];

// Update supplier schema
export const updateSupplierSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid supplier ID'),
    }),
    body: supplierBaseSchema.partial(),
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>['body'];

// Get supplier by ID schema
export const getSupplierByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid supplier ID'),
    }),
});

// Toggle supplier status schema
export const toggleSupplierStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid supplier ID'),
    }),
    body: z.object({
        isActive: z.boolean(),
    }),
});

// Delete supplier schema
export const deleteSupplierSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid supplier ID'),
    }),
});

// Get suppliers query schema
export const getSuppliersQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(1000).default(10),
        search: z.string().optional(),
        isActive: z.enum(['true', 'false']).optional(),
        sortBy: z.enum(['name', 'createdAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
});

export type GetSuppliersQuery = z.infer<
    typeof getSuppliersQuerySchema
>['query'];
