import { ProductController } from '@/controllers/product.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    handleMulterError,
    uploadImage,
} from '@/middlewares/upload.middleware';
import { validate } from '@/middlewares/validation';
import {
    createProductSchema,
    deleteImageSchema,
    deleteProductSchema,
    getProductByIdSchema,
    getProductsQuerySchema,
    productDiscountSchema,
    removeProductDiscountSchema,
    setMainImageSchema,
    toggleProductStatusSchema,
    updateProductSchema,
    uploadImagesSchema,
} from '@/validators/product.validator';
import { Router } from 'express';

const router = Router();
const productController = new ProductController();

// All routes require authentication
router.use(authenticate);

// GET ALL PRODUCTS
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getProductsQuerySchema),
    productController.getProducts
);

// GET PRODUCT BY ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getProductByIdSchema),
    productController.getProductById
);

// CREATE NEW PRODUCT
router.post(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(createProductSchema),
    productController.createProduct
);

// UPDATE PRODUCT
router.put(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(updateProductSchema),
    productController.updateProduct
);

// TOGGLE PRODUCT STATUS (Activate/Deactivate)
router.patch(
    '/:id/status',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(toggleProductStatusSchema),
    productController.toggleProductStatus
);

// ADD/UPDATE DISCOUNT TO PRODUCT
router.patch(
    '/:id/discount',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(productDiscountSchema),
    productController.addDiscount
);

// REMOVE DISCOUNT FROM PRODUCT
router.delete(
    '/:id/discount',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(removeProductDiscountSchema),
    productController.removeDiscount
);

// DELETE PRODUCT (Soft Delete)
router.delete(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(deleteProductSchema),
    productController.deleteProduct
);

// UPLOAD PRODUCT IMAGES
router.post(
    '/:id/images',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    uploadImage.array('images', 3),
    handleMulterError,
    validate(uploadImagesSchema),
    productController.uploadImages
);

// DELETE PRODUCT IMAGE
router.delete(
    '/:id/images',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(deleteImageSchema),
    productController.deleteImage
);

// SET MAIN PRODUCT IMAGE
router.patch(
    '/:id/images/main',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(setMainImageSchema),
    productController.setMainImage
);

export default router;
