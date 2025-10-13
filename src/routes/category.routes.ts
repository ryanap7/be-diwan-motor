import { CategoryController } from '@/controllers/category.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    createCategorySchema,
    deleteCategorySchema,
    getCategoryByIdSchema,
    toggleCategoryStatusSchema,
    updateCategorySchema,
} from '@/validators/category.validator';
import { Router } from 'express';

const router = Router();
const categoryController = new CategoryController();

// All routes require authentication
router.use(authenticate);

// GET ALL CATEGORIES
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    categoryController.getCategories
);

// GET ROOT CATEGORIES
router.get(
    '/roots',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    categoryController.getRootCategories
);

// GET CATEGORY BY ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getCategoryByIdSchema),
    categoryController.getCategoryById
);

// CREATE NEW CATEGORY
router.post(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(createCategorySchema),
    categoryController.createCategory
);

// UPDATE CATEGORY
router.put(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(updateCategorySchema),
    categoryController.updateCategory
);

// TOGGLE CATEGORY STATUS
router.patch(
    '/:id/status',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(toggleCategoryStatusSchema),
    categoryController.toggleCategoryStatus
);

// DELETE CATEGORY
router.delete(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(deleteCategorySchema),
    categoryController.deleteCategory
);

export default router;
