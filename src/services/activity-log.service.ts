import { ActivityLogRepository } from '@/repositories/activity-log.repository';
import { ActivityLoggerHelper } from '@/utils/activity-logger.helper';
import { AppError } from '@/utils/errors';
import type { GetActivityLogsQuery } from '@/validators/activity-log.validator';
import { ActivityAction, EntityType, Prisma } from '@prisma/client';
import { Request } from 'express';

export class ActivityLogService {
    private activityLogRepository: ActivityLogRepository;

    constructor() {
        this.activityLogRepository = new ActivityLogRepository();
    }

    /**
     * Log activity (called by middleware or manually)
     */
    async logActivity(
        req: Request,
        action: ActivityAction,
        entityType: EntityType,
        options: {
            entityId?: string;
            entityName?: string;
            beforeData?: any;
            afterData?: any;
            statusCode?: number;
            errorMessage?: string;
            metadata?: any;
        } = {}
    ) {
        try {
            const logData = ActivityLoggerHelper.prepareLogData(
                req,
                action,
                entityType,
                options
            );

            return await this.activityLogRepository.create(logData);
        } catch (error) {
            // Don't throw error if logging fails, just log to console
            console.error('Failed to create activity log:', error);
            return null;
        }
    }

    /**
     * Get activity logs with filters
     */
    async getActivityLogs(query: GetActivityLogsQuery) {
        const {
            page = 1,
            limit = 10,
            search,
            userId,
            action,
            entityType,
            startDate,
            endDate,
            sortBy,
            sortOrder,
        } = query;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.ActivityLogWhereInput = {};

        if (search) {
            where.OR = [
                { description: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { entityName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (userId) {
            where.userId = userId;
        }

        if (action) {
            where.action = action;
        }

        if (entityType) {
            where.entityType = entityType;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        // Build orderBy
        const orderByClause: Prisma.ActivityLogOrderByWithRelationInput = {
            [sortBy]: sortOrder,
        };

        const { logs, total } = await this.activityLogRepository.findMany({
            skip,
            take: limit,
            where,
            orderBy: orderByClause,
        });

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get activity log by ID
     */
    async getActivityLogById(id: string) {
        const log = await this.activityLogRepository.findById(id);

        if (!log) {
            throw new AppError(404, 'Activity log not found', 'LOG_NOT_FOUND');
        }

        return log;
    }

    /**
     * Get statistics
     */
    async getStatistics(params?: {
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        return this.activityLogRepository.getStatistics(params);
    }

    /**
     * Get user activity summary
     */
    async getUserActivitySummary(userId: string, days: number = 30) {
        return this.activityLogRepository.getUserActivitySummary(userId, days);
    }

    /**
     * Get entity history
     */
    async getEntityHistory(entityType: EntityType, entityId: string) {
        return this.activityLogRepository.getEntityHistory(
            entityType,
            entityId
        );
    }

    /**
     * Clean old logs (for scheduled task)
     */
    async cleanOldLogs(daysToKeep: number = 180) {
        return this.activityLogRepository.deleteOldLogs(daysToKeep);
    }

    /**
     * Get available filters (for dropdown)
     */
    async getAvailableFilters() {
        const [users, actions, entityTypes] = await Promise.all([
            // Get unique users who have activity logs
            this.activityLogRepository
                .findMany({
                    take: 1000,
                    orderBy: { createdAt: 'desc' },
                })
                .then((result) => {
                    const uniqueUsers = new Map();
                    result.logs.forEach((log) => {
                        if (log.userId && !uniqueUsers.has(log.userId)) {
                            uniqueUsers.set(log.userId, {
                                id: log.userId,
                                username: log.username,
                                fullName: log.user?.fullName,
                            });
                        }
                    });
                    return Array.from(uniqueUsers.values());
                }),

            // Get all action types
            Promise.resolve(Object.values(ActivityAction)),

            // Get all entity types
            Promise.resolve(Object.values(EntityType)),
        ]);

        return {
            users,
            actions,
            entityTypes,
        };
    }
}
