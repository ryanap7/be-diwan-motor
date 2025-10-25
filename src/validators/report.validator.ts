import { z } from 'zod';

// Report query filters (shared)
const reportDateRangeSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

// Sales Report Schemas
export const getSalesReportSchema = z.object({
    query: z.object({
        ...reportDateRangeSchema.shape,
        branchId: z.string().uuid().optional(),
        cashierId: z.string().uuid().optional(),
    }),
});

export const getTopSellingProductsSchema = z.object({
    query: z.object({
        ...reportDateRangeSchema.shape,
        branchId: z.string().uuid().optional(),
        limit: z.coerce.number().int().max(1000).positive().default(10),
    }),
});

export const getSlowMovingProductsSchema = z.object({
    query: z.object({
        ...reportDateRangeSchema.shape,
        branchId: z.string().uuid().optional(),
        limit: z.coerce.number().int().max(1000).positive().default(10),
        daysThreshold: z.coerce.number().int().positive().default(30),
    }),
});

export const getSalesByCategorySchema = z.object({
    query: z.object({
        ...reportDateRangeSchema.shape,
        branchId: z.string().uuid().optional(),
    }),
});

export const getCashierPerformanceSchema = z.object({
    query: z.object({
        ...reportDateRangeSchema.shape,
        branchId: z.string().uuid().optional(),
    }),
});

// Inventory Report Schemas
export const getInventoryReportSchema = z.object({
    query: z.object({
        branchId: z.string().uuid().optional(),
    }),
});

export const getLowStockProductsSchema = z.object({
    query: z.object({
        branchId: z.string().uuid().optional(),
        limit: z.coerce.number().int().positive().default(20),
    }),
});

export const getDeadStockProductsSchema = z.object({
    query: z.object({
        branchId: z.string().uuid().optional(),
        daysThreshold: z.coerce.number().int().positive().default(90),
        limit: z.coerce.number().int().positive().default(20),
    }),
});

export const getStockValuationSchema = z.object({
    query: z.object({
        branchId: z.string().uuid().optional(),
    }),
});

// Export types
export type GetSalesReportQuery = z.infer<typeof getSalesReportSchema>['query'];
export type GetTopSellingProductsQuery = z.infer<
    typeof getTopSellingProductsSchema
>['query'];
export type GetSlowMovingProductsQuery = z.infer<
    typeof getSlowMovingProductsSchema
>['query'];
export type GetSalesByCategoryQuery = z.infer<
    typeof getSalesByCategorySchema
>['query'];
export type GetCashierPerformanceQuery = z.infer<
    typeof getCashierPerformanceSchema
>['query'];
export type GetInventoryReportQuery = z.infer<
    typeof getInventoryReportSchema
>['query'];
export type GetLowStockProductsQuery = z.infer<
    typeof getLowStockProductsSchema
>['query'];
export type GetDeadStockProductsQuery = z.infer<
    typeof getDeadStockProductsSchema
>['query'];
export type GetStockValuationQuery = z.infer<
    typeof getStockValuationSchema
>['query'];
