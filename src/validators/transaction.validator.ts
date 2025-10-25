import { z } from 'zod';

// Payment method enum
export const paymentMethodEnum = z.enum([
    'CASH',
    'DEBIT_CARD',
    'CREDIT_CARD',
    'TRANSFER',
    'QRIS',
]);

// Transaction status enum
export const transactionStatusEnum = z.enum([
    'COMPLETED',
    'CANCELLED',
    'REFUNDED',
]);

// Transaction item schema
const transactionItemSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    subtotal: z.number().positive('Subtotal must be positive'),
});

// Create transaction schema
export const createTransactionSchema = z.object({
    body: z.object({
        customerId: z.string().uuid('Invalid customer ID').optional(),
        items: z
            .array(transactionItemSchema)
            .min(1, 'At least one item is required'),
        subtotal: z.number().positive('Subtotal must be positive'),
        taxAmount: z
            .number()
            .min(0, 'Tax amount cannot be negative')
            .default(0),
        discountAmount: z
            .number()
            .min(0, 'Discount amount cannot be negative')
            .default(0),
        totalAmount: z.number().positive('Total amount must be positive'),
        paymentMethod: paymentMethodEnum.default('CASH'),
        amountPaid: z.number().positive('Amount paid must be positive'),
        changeAmount: z.number().min(0, 'Change amount cannot be negative'),
        notes: z.string().max(500).optional(),
    }),
});

export type CreateTransactionInput = z.infer<
    typeof createTransactionSchema
>['body'];

// Get transaction by ID schema
export const getTransactionByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid transaction ID'),
    }),
});

// Get transaction by invoice number schema
export const getTransactionByInvoiceSchema = z.object({
    params: z.object({
        invoiceNumber: z.string().min(1, 'Invoice number is required'),
    }),
});

// Get transactions query schema
export const getTransactionsQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(1000).default(10),
        search: z.string().optional(), // Search by invoice number
        branchId: z.string().uuid().optional(),
        cashierId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
        status: transactionStatusEnum.optional(),
        paymentMethod: paymentMethodEnum.optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        sortBy: z
            .enum(['transactionDate', 'totalAmount', 'createdAt'])
            .default('transactionDate'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
});

export type GetTransactionsQuery = z.infer<
    typeof getTransactionsQuerySchema
>['query'];

// Update transaction status schema
export const updateTransactionStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid transaction ID'),
    }),
    body: z.object({
        status: transactionStatusEnum,
        notes: z.string().max(500).optional(),
    }),
});

// Get transaction statistics schema
export const getTransactionStatsSchema = z.object({
    query: z.object({
        branchId: z.string().uuid().optional(),
        cashierId: z.string().uuid().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
    }),
});

export type GetTransactionStatsQuery = z.infer<
    typeof getTransactionStatsSchema
>['query'];

// Quick create customer schema (for POS)
export const quickCreateCustomerSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Customer name is required').max(255),
        phone: z.string().min(1, 'Phone number is required'),
    }),
});

export type QuickCreateCustomerInput = z.infer<
    typeof quickCreateCustomerSchema
>['body'];

// Get products for POS schema
export const getProductsForPOSSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(1000).default(20),
        search: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        brandId: z.string().uuid().optional(),
        priceType: z.enum(['normal', 'promo']).optional(),
    }),
});
