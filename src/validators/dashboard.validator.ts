import { z } from 'zod';

// Get dashboard analytics schema
export const getDashboardAnalyticsSchema = z.object({
    query: z.object({
        branchId: z.string().uuid('Invalid branch ID').optional(),
        // Optional date range for custom period analysis
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
    }),
});

export type GetDashboardAnalyticsQuery = z.infer<
    typeof getDashboardAnalyticsSchema
>['query'];

// Get sales chart data schema
export const getSalesChartSchema = z.object({
    query: z.object({
        branchId: z.string().uuid('Invalid branch ID').optional(),
        period: z
            .enum(['daily', 'weekly', 'monthly', 'yearly'])
            .default('daily'),
        // Number of periods to show (e.g., last 7 days, last 12 months)
        limit: z.coerce.number().int().positive().max(365).default(7),
    }),
});

export type GetSalesChartQuery = z.infer<typeof getSalesChartSchema>['query'];

// Get inventory alerts schema
export const getInventoryAlertsSchema = z.object({
    query: z.object({
        branchId: z.string().uuid('Invalid branch ID').optional(),
        limit: z.coerce.number().int().positive().max(100).default(10),
        alertType: z.enum(['low_stock', 'out_of_stock', 'all']).default('all'),
    }),
});

export type GetInventoryAlertsQuery = z.infer<
    typeof getInventoryAlertsSchema
>['query'];
