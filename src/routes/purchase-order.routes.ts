import { PurchaseOrderController } from '@/controllers/purchase-order.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    createPurchaseOrderSchema,
    updatePurchaseOrderSchema,
    getPurchaseOrderByIdSchema,
    getPurchaseOrdersQuerySchema,
    approvePurchaseOrderSchema,
    receivePurchaseOrderSchema,
    cancelPurchaseOrderSchema,
    deletePurchaseOrderSchema,
} from '@/validators/purchase-order.validator';
import { Router } from 'express';

const router = Router();
const purchaseOrderController = new PurchaseOrderController();

// All routes require authentication
router.use(authenticate);

// GET STATISTICS
router.get(
    '/statistics',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    purchaseOrderController.getStatistics
);

// GET ALL PURCHASE ORDERS
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getPurchaseOrdersQuerySchema),
    purchaseOrderController.getPurchaseOrders
);

// GET PURCHASE ORDER BY ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getPurchaseOrderByIdSchema),
    purchaseOrderController.getPurchaseOrderById
);

// CREATE NEW PURCHASE ORDER
router.post(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(createPurchaseOrderSchema),
    purchaseOrderController.createPurchaseOrder
);

// UPDATE PURCHASE ORDER (DRAFT only)
router.put(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(updatePurchaseOrderSchema),
    purchaseOrderController.updatePurchaseOrder
);

// SUBMIT PURCHASE ORDER (DRAFT -> PENDING)
router.patch(
    '/:id/submit',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getPurchaseOrderByIdSchema),
    purchaseOrderController.submitPurchaseOrder
);

// APPROVE PURCHASE ORDER (PENDING -> APPROVED)
router.patch(
    '/:id/approve',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(approvePurchaseOrderSchema),
    purchaseOrderController.approvePurchaseOrder
);

// RECEIVE PURCHASE ORDER (APPROVED -> PARTIALLY_RECEIVED/RECEIVED)
router.patch(
    '/:id/receive',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(receivePurchaseOrderSchema),
    purchaseOrderController.receivePurchaseOrder
);

// CANCEL PURCHASE ORDER
router.patch(
    '/:id/cancel',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(cancelPurchaseOrderSchema),
    purchaseOrderController.cancelPurchaseOrder
);

// DELETE PURCHASE ORDER (DRAFT/CANCELLED only)
router.delete(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(deletePurchaseOrderSchema),
    purchaseOrderController.deletePurchaseOrder
);

export default router;
