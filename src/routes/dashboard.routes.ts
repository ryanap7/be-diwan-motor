import { DashboardController } from '@/controllers/dashboard.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    getDashboardAnalyticsSchema,
    getInventoryAlertsSchema,
    getSalesChartSchema,
} from '@/validators/dashboard.validator';
import { Router } from 'express';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authenticate);

// Comprehensive Dashboard Analytics
router.get(
    '/analytics',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getDashboardAnalyticsSchema),
    dashboardController.getDashboardAnalytics
);

// Sales Chart data for visualization
router.get(
    '/sales-chart',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getSalesChartSchema),
    dashboardController.getSalesChartData
);

// Inventory Alerts (low stock & out of stock products)
router.get(
    '/inventory-alerts',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getInventoryAlertsSchema),
    dashboardController.getInventoryAlerts
);

export default router;
