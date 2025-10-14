import prisma from '@/config/database';
import { ActivityAction, EntityType, Prisma } from '@prisma/client';

interface CreateActivityLogData {
    userId?: string;
    username: string;
    userRole?: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId?: string;
    entityName?: string;
    description: string;
    beforeData?: any;
    afterData?: any;
    changes?: any;
    method?: string;
    endpoint?: string;
    statusCode?: number;
    ipAddress: string;
    userAgent?: string;
    metadata?: any;
    errorMessage?: string;
}

export class ActivityLogRepository {
    /**
     * Create activity log
     */
    async create(data: CreateActivityLogData) {
        return prisma.activityLog.create({
            data: {
                userId: data.userId,
                username: data.username,
                userRole: data.userRole,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                entityName: data.entityName,
                description: data.description,
                beforeData: data.beforeData,
                afterData: data.afterData,
                changes: data.changes,
                method: data.method,
                endpoint: data.endpoint,
                statusCode: data.statusCode,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                metadata: data.metadata,
                errorMessage: data.errorMessage,
            },
        });
    }

    /**
     * Find many with filters
     */
    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.ActivityLogWhereInput;
        orderBy?: Prisma.ActivityLogOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                skip,
                take,
                where,
                orderBy: orderBy || { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.activityLog.count({ where }),
        ]);

        return { logs, total };
    }

    /**
     * Find by ID
     */
    async findById(id: string) {
        return prisma.activityLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Get statistics
     */
    async getStatistics(params?: {
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const where: Prisma.ActivityLogWhereInput = {};

        if (params?.userId) {
            where.userId = params.userId;
        }

        if (params?.startDate || params?.endDate) {
            where.createdAt = {};
            if (params.startDate) where.createdAt.gte = params.startDate;
            if (params.endDate) where.createdAt.lte = params.endDate;
        }

        const [total, byAction, byEntityType, byUser, recentActivities] =
            await Promise.all([
                // Total logs
                prisma.activityLog.count({ where }),

                // Group by action
                prisma.activityLog.groupBy({
                    by: ['action'],
                    where,
                    _count: true,
                    orderBy: {
                        _count: {
                            action: 'desc',
                        },
                    },
                    take: 10,
                }),

                // Group by entity type
                prisma.activityLog.groupBy({
                    by: ['entityType'],
                    where,
                    _count: true,
                    orderBy: {
                        _count: {
                            entityType: 'desc',
                        },
                    },
                    take: 10,
                }),

                // Group by user (top 10 most active)
                prisma.activityLog.groupBy({
                    by: ['userId', 'username'],
                    where,
                    _count: true,
                    orderBy: {
                        _count: {
                            userId: 'desc',
                        },
                    },
                    take: 10,
                }),

                // Recent activities
                prisma.activityLog.findMany({
                    where,
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        action: true,
                        entityType: true,
                        description: true,
                        username: true,
                        createdAt: true,
                    },
                }),
            ]);

        return {
            total,
            byAction: byAction.map((item) => ({
                action: item.action,
                count: item._count,
            })),
            byEntityType: byEntityType.map((item) => ({
                entityType: item.entityType,
                count: item._count,
            })),
            topUsers: byUser.map((item) => ({
                userId: item.userId,
                username: item.username,
                count: item._count,
            })),
            recentActivities,
        };
    }

    /**
     * Delete old logs (retention policy)
     */
    async deleteOldLogs(daysToKeep: number = 180) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        return prisma.activityLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });
    }

    /**
     * Get user activity summary
     */
    async getUserActivitySummary(userId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [totalActions, actionsByType, recentActions] = await Promise.all([
            prisma.activityLog.count({
                where: {
                    userId,
                    createdAt: { gte: startDate },
                },
            }),

            prisma.activityLog.groupBy({
                by: ['action'],
                where: {
                    userId,
                    createdAt: { gte: startDate },
                },
                _count: true,
                orderBy: {
                    _count: {
                        action: 'desc',
                    },
                },
            }),

            prisma.activityLog.findMany({
                where: {
                    userId,
                    createdAt: { gte: startDate },
                },
                take: 20,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    action: true,
                    entityType: true,
                    description: true,
                    createdAt: true,
                },
            }),
        ]);

        return {
            totalActions,
            actionsByType: actionsByType.map((item) => ({
                action: item.action,
                count: item._count,
            })),
            recentActions,
        };
    }

    /**
     * Get entity activity history
     */
    async getEntityHistory(entityType: EntityType, entityId: string) {
        return prisma.activityLog.findMany({
            where: {
                entityType,
                entityId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        });
    }
}
