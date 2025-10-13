import { SupplierController } from '@/controllers/supplier.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    createSupplierSchema,
    deleteSupplierSchema,
    getSupplierByIdSchema,
    getSuppliersQuerySchema,
    toggleSupplierStatusSchema,
    updateSupplierSchema,
} from '@/validators/supplier.validator';
import { Router } from 'express';

const router = Router();
const supplierController = new SupplierController();

// All routes require authentication
router.use(authenticate);

// GET ALL SUPPLIERS
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getSuppliersQuerySchema),
    supplierController.getSuppliers
);

// GET SUPPLIER BY ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getSupplierByIdSchema),
    supplierController.getSupplierById
);

// CREATE NEW SUPPLIER
router.post(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(createSupplierSchema),
    supplierController.createSupplier
);

// UPDATE SUPPLIER
router.put(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(updateSupplierSchema),
    supplierController.updateSupplier
);

// TOGGLE SUPPLIER STATUS
router.patch(
    '/:id/status',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(toggleSupplierStatusSchema),
    supplierController.toggleSupplierStatus
);

// DELETE SUPPLIER
router.delete(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(deleteSupplierSchema),
    supplierController.deleteSupplier
);

export default router;
