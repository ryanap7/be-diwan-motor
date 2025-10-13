import { CustomerController } from '@/controllers/customer.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    createCustomerSchema,
    deleteCustomerSchema,
    getCustomerByIdSchema,
    getCustomersQuerySchema,
    toggleCustomerStatusSchema,
    updateCustomerSchema,
} from '@/validators/customer.validator';
import { Router } from 'express';

const router = Router();
const customerController = new CustomerController();

// All routes require authentication
router.use(authenticate);

// GET ALL CUSTOMERS
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getCustomersQuerySchema),
    customerController.getCustomers
);

// GET CUSTOMER BY ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getCustomerByIdSchema),
    customerController.getCustomerById
);

// CREATE NEW CUSTOMER
router.post(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(createCustomerSchema),
    customerController.createCustomer
);

// UPDATE CUSTOMER
router.put(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(updateCustomerSchema),
    customerController.updateCustomer
);

// TOGGLE CUSTOMER STATUS
router.patch(
    '/:id/status',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(toggleCustomerStatusSchema),
    customerController.toggleCustomerStatus
);

// DELETE CUSTOMER
router.delete(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(deleteCustomerSchema),
    customerController.deleteCustomer
);

export default router;
