import { StockController } from '@/controllers/stock.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    getStockOverviewSchema,
    getStockByProductSchema,
    adjustStockSchema,
    transferStockSchema,
    getStockMovementsSchema,
} from '@/validators/stock.validator';
import { Router } from 'express';

const router = Router();
const stockController = new StockController();

// All routes require authentication
router.use(authenticate);

// GET STOCK OVERVIEW
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getStockOverviewSchema),
    stockController.getStockOverview
);

// GET STOCK BY PRODUCT ID
router.get(
    '/product/:productId',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getStockByProductSchema),
    stockController.getStockByProduct
);

// ADJUST STOCK (IN/OUT/ADJUSTMENT)
router.post(
    '/adjust/:productId',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(adjustStockSchema),
    stockController.adjustStock
);

// TRANSFER STOCK BETWEEN BRANCHES
router.post(
    '/transfer/:productId',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(transferStockSchema),
    stockController.transferStock
);

// GET STOCK MOVEMENTS (HISTORY)
router.get(
    '/movements',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getStockMovementsSchema),
    stockController.getStockMovements
);

export default router;
