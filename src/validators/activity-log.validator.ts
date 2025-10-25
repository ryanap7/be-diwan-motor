import { z } from 'zod';
import { ActivityAction, EntityType } from '@prisma/client';

// Get Activity Logs query schema
export const getActivityLogsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(1000).default(10),
        search: z.string().optional(),
        userId: z.string().uuid().optional(),
        action: z.nativeEnum(ActivityAction).optional(),
        entityType: z.nativeEnum(EntityType).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        sortBy: z
            .enum(['createdAt', 'action', 'entityType', 'username'])
            .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
});

export type GetActivityLogsQuery = z.infer<
    typeof getActivityLogsQuerySchema
>['query'];

// Get Activity Log by ID schema
export const getActivityLogByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid activity log ID'),
    }),
});

// Get User Activity Summary schema
export const getUserActivitySummarySchema = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID'),
    }),
    query: z.object({
        days: z.coerce.number().int().positive().max(365).default(30),
    }),
});

// Get Entity History schema
export const getEntityHistorySchema = z.object({
    params: z.object({
        entityType: z.nativeEnum(EntityType),
        entityId: z.string().uuid('Invalid entity ID'),
    }),
});

// Get Statistics schema
export const getStatisticsQuerySchema = z.object({
    query: z.object({
        userId: z.string().uuid().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
    }),
});
