import { ReportController } from '@/controllers/report.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    getCashierPerformanceSchema,
    getDeadStockProductsSchema,
    getInventoryReportSchema,
    getLowStockProductsSchema,
    getSalesByCategorySchema,
    getSalesReportSchema,
    getSlowMovingProductsSchema,
    getStockValuationSchema,
    getTopSellingProductsSchema,
} from '@/validators/report.validator';
import { Router } from 'express';

const router = Router();
const reportController = new ReportController();

// All routes require authentication
router.use(authenticate);

// ===================================
// SALES REPORTS
// ===================================

// GET SALES REPORT SUMMARY
router.get(
    '/sales/summary',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getSalesReportSchema),
    reportController.getSalesReport
);

// GET TOP SELLING PRODUCTS
router.get(
    '/sales/top-products',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getTopSellingProductsSchema),
    reportController.getTopSellingProducts
);

// GET SLOW MOVING PRODUCTS
router.get(
    '/sales/slow-moving',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getSlowMovingProductsSchema),
    reportController.getSlowMovingProducts
);

// GET SALES BY CATEGORY
router.get(
    '/sales/by-category',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getSalesByCategorySchema),
    reportController.getSalesByCategory
);

// GET CASHIER PERFORMANCE
router.get(
    '/sales/cashier-performance',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getCashierPerformanceSchema),
    reportController.getCashierPerformance
);

// ===================================
// INVENTORY REPORTS
// ===================================

// GET INVENTORY REPORT SUMMARY
router.get(
    '/inventory/summary',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getInventoryReportSchema),
    reportController.getInventoryReport
);

// GET LOW STOCK PRODUCTS (REORDER ALERT)
router.get(
    '/inventory/low-stock',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getLowStockProductsSchema),
    reportController.getLowStockProducts
);

// GET DEAD STOCK PRODUCTS
router.get(
    '/inventory/dead-stock',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getDeadStockProductsSchema),
    reportController.getDeadStockProducts
);

// GET STOCK VALUATION
router.get(
    '/inventory/stock-valuation',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getStockValuationSchema),
    reportController.getStockValuation
);

export default router;
