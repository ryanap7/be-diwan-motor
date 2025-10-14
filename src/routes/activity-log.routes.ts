import { ActivityLogController } from '@/controllers/activity-log.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    getActivityLogsQuerySchema,
    getActivityLogByIdSchema,
    getUserActivitySummarySchema,
    getEntityHistorySchema,
    getStatisticsQuerySchema,
} from '@/validators/activity-log.validator';
import { Router } from 'express';

const router = Router();
const activityLogController = new ActivityLogController();

// All routes require authentication
router.use(authenticate);

// GET STATISTICS - Admin & Branch Manager only
router.get(
    '/statistics',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getStatisticsQuerySchema),
    activityLogController.getStatistics
);

// GET AVAILABLE FILTERS - For dropdown population
router.get(
    '/filters',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    activityLogController.getAvailableFilters
);

// GET ALL ACTIVITY LOGS - Admin & Branch Manager only
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getActivityLogsQuerySchema),
    activityLogController.getActivityLogs
);

// GET USER ACTIVITY SUMMARY
router.get(
    '/users/:userId/summary',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getUserActivitySummarySchema),
    activityLogController.getUserActivitySummary
);

// GET ENTITY HISTORY
router.get(
    '/entities/:entityType/:entityId',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getEntityHistorySchema),
    activityLogController.getEntityHistory
);

// GET ACTIVITY LOG BY ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getActivityLogByIdSchema),
    activityLogController.getActivityLogById
);

export default router;
