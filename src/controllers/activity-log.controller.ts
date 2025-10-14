import { ActivityLogService } from '@/services/activity-log.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';
import { EntityType } from '@prisma/client';

export class ActivityLogController {
    private activityLogService: ActivityLogService;

    constructor() {
        this.activityLogService = new ActivityLogService();
    }

    /**
     * Get all activity logs with filters
     */
    getActivityLogs = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const result = await this.activityLogService.getActivityLogs(
                query as any
            );

            ResponseHandler.success(
                res,
                result,
                'Activity logs retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get activity log by ID
     */
    getActivityLogById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const log = await this.activityLogService.getActivityLogById(id);

            ResponseHandler.success(
                res,
                log,
                'Activity log details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get statistics
     */
    getStatistics = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { userId, startDate, endDate } = req.query;

            const statistics = await this.activityLogService.getStatistics({
                userId: userId as string | undefined,
                startDate: startDate
                    ? new Date(startDate as string)
                    : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
            });

            ResponseHandler.success(
                res,
                statistics,
                'Activity log statistics retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get user activity summary
     */
    getUserActivitySummary = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { userId } = req.params;
            const { days } = req.query;

            if (typeof userId !== 'string') {
                throw new Error('Invalid or missing user ID');
            }

            const summary =
                await this.activityLogService.getUserActivitySummary(
                    userId,
                    days ? parseInt(days as string) : 30
                );

            ResponseHandler.success(
                res,
                summary,
                'User activity summary retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get entity history
     */
    getEntityHistory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { entityType, entityId } = req.params;

            if (
                typeof entityType !== 'string' ||
                typeof entityId !== 'string'
            ) {
                throw new Error('Invalid parameters');
            }

            const history = await this.activityLogService.getEntityHistory(
                entityType as EntityType,
                entityId
            );

            ResponseHandler.success(
                res,
                history,
                'Entity history retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get available filters
     */
    getAvailableFilters = async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const filters = await this.activityLogService.getAvailableFilters();

            ResponseHandler.success(
                res,
                filters,
                'Available filters retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
