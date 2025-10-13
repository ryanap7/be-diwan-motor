import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import {
    createBrandSchema,
    deleteBrandSchema,
    getBrandByIdSchema,
    toggleBrandStatusSchema,
    updateBrandSchema,
} from '../validators/brand.validator';

const router = Router();
const brandController = new BrandController();

// All routes require authentication
router.use(authenticate);

// GET ALL BRANDS
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    brandController.getBrands
);

// GET BRAND BY ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getBrandByIdSchema),
    brandController.getBrandById
);

// CREATE NEW BRAND
router.post(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(createBrandSchema),
    brandController.createBrand
);

// UPDATE BRAND
router.put(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(updateBrandSchema),
    brandController.updateBrand
);

// TOGGLE BRAND STATUS
router.patch(
    '/:id/status',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(toggleBrandStatusSchema),
    brandController.toggleBrandStatus
);

// DELETE BRAND
router.delete(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(deleteBrandSchema),
    brandController.deleteBrand
);

export default router;
