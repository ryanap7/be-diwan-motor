import { TransactionController } from '@/controllers/transaction.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation';
import {
    createTransactionSchema,
    getProductsForPOSSchema,
    getTransactionByIdSchema,
    getTransactionByInvoiceSchema,
    getTransactionsQuerySchema,
    getTransactionStatsSchema,
    quickCreateCustomerSchema,
    updateTransactionStatusSchema,
} from '@/validators/transaction.validator';
import { Router } from 'express';

const router = Router();
const transactionController = new TransactionController();

// All routes require authentication
router.use(authenticate);

// GET ALL TRANSACTIONS
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getTransactionsQuerySchema),
    transactionController.getTransactions
);

// GET TRANSACTION BY ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getTransactionByIdSchema),
    transactionController.getTransactionById
);

// GET TRANSACTION BY INVOICE NUMBER
router.get(
    '/invoice/:invoiceNumber',
    authorize('ADMIN', 'BRANCH_MANAGER', 'CASHIER'),
    validate(getTransactionByInvoiceSchema),
    transactionController.getTransactionByInvoice
);

// CREATE NEW TRANSACTION (POS)
router.post(
    '/',
    authorize('CASHIER', 'BRANCH_MANAGER', 'ADMIN'),
    validate(createTransactionSchema),
    transactionController.createTransaction
);

// UPDATE TRANSACTION STATUS (Cancel/Refund)
router.patch(
    '/:id/status',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(updateTransactionStatusSchema),
    transactionController.updateTransactionStatus
);

// GET TRANSACTION STATISTICS
router.get(
    '/stats/summary',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(getTransactionStatsSchema),
    transactionController.getTransactionStats
);

// QUICK CREATE CUSTOMER (for walk-in during transaction)
router.post(
    '/customers/quick',
    authorize('CASHIER', 'BRANCH_MANAGER', 'ADMIN'),
    validate(quickCreateCustomerSchema),
    transactionController.quickCreateCustomer
);

// SEARCH CUSTOMER BY PHONE
router.get(
    '/customers/search',
    authorize('CASHIER', 'BRANCH_MANAGER', 'ADMIN'),
    transactionController.searchCustomerByPhone
);

// GET PRODUCTS FOR POS (with stock info)
router.get(
    '/products/pos',
    authorize('CASHIER', 'BRANCH_MANAGER', 'ADMIN'),
    validate(getProductsForPOSSchema),
    transactionController.getProductsForPOS
);

export default router;
