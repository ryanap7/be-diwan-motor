import { z } from 'zod';

// Get stock overview query schema
export const getStockOverviewSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(1000).default(10),
        search: z.string().optional(),
        branchId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        isLowStock: z.enum(['true', 'false']).optional(),
        sortBy: z.enum(['name', 'sku', 'totalStock']).default('name'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
    }),
});

export type GetStockOverviewQuery = z.infer<
    typeof getStockOverviewSchema
>['query'];

// Get stock by product ID schema
export const getStockByProductSchema = z.object({
    params: z.object({
        productId: z.string().uuid('Invalid product ID'),
    }),
});

// Adjust stock schema
export const adjustStockSchema = z.object({
    params: z.object({
        productId: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        branchId: z.string().uuid('Invalid branch ID'),
        quantity: z.number().int('Quantity must be an integer'),
        type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
        reason: z.string().optional(),
        notes: z.string().optional(),
    }),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>['body'];

// Transfer stock schema
export const transferStockSchema = z.object({
    params: z.object({
        productId: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        fromBranchId: z.string().uuid('Invalid from branch ID'),
        toBranchId: z.string().uuid('Invalid to branch ID'),
        quantity: z.number().int().positive('Quantity must be positive'),
        notes: z.string().optional(),
    }),
});

export type TransferStockInput = z.infer<typeof transferStockSchema>['body'];

// Get stock movements schema
export const getStockMovementsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(1000).default(20),
        productId: z.string().uuid().optional(),
        branchId: z.string().uuid().optional(),
        type: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
    }),
});

export type GetStockMovementsQuery = z.infer<
    typeof getStockMovementsSchema
>['query'];
