import { Router } from 'express';
import { BranchController } from '@/controllers/branch.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    createBranchSchema,
    updateBranchSchema,
    assignUserSchema,
    deactivateBranchSchema,
} from '@/validators/branch.validator';

const router = Router();
const branchController = new BranchController();

// All routes require authentication
router.use(authenticate);

// CREATE BRANCH (ADMIN only)
router.post(
    '/',
    authorize('ADMIN'),
    validate(createBranchSchema),
    branchController.createBranch
);

// GET ALL BRANCHES (ADMIN and BRANCH_MANAGER)
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    branchController.getBranches
);

// GET BRANCH BY ID
router.get(
    '/:branchId',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    branchController.getBranchById
);

// UPDATE BRANCH (ADMIN only)
router.patch(
    '/:branchId',
    authorize('ADMIN'),
    validate(updateBranchSchema),
    branchController.updateBranch
);

// ASSIGN MANAGER (ADMIN only)
router.post(
    '/:branchId/assign-manager',
    authorize('ADMIN'),
    validate(assignUserSchema),
    branchController.assignManager
);

// ASSIGN CASHIER (ADMIN or BRANCH_MANAGER)
router.post(
    '/:branchId/assign-cashier',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(assignUserSchema),
    branchController.assignCashier
);

// ACTIVATE BRANCH (ADMIN only)
router.post(
    '/:branchId/activate',
    authorize('ADMIN'),
    branchController.activateBranch
);

// DEACTIVATE BRANCH (ADMIN only)
router.post(
    '/:branchId/deactivate',
    authorize('ADMIN'),
    validate(deactivateBranchSchema),
    branchController.deactivateBranch
);

export default router;
