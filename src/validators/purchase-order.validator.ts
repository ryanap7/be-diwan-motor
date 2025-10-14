import { z } from 'zod';

// Create Purchase Order schema
export const createPurchaseOrderSchema = z.object({
    body: z.object({
        supplierId: z.string().uuid('Invalid supplier ID'),
        branchId: z.string().uuid('Invalid branch ID'),
        expectedDate: z.coerce.date().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        items: z
            .array(
                z.object({
                    productId: z.string().uuid('Invalid product ID'),
                    orderedQty: z
                        .number()
                        .int()
                        .positive('Quantity must be positive'),
                    unitPrice: z
                        .number()
                        .positive('Unit price must be positive'),
                    notes: z.string().optional(),
                })
            )
            .min(1, 'At least one item is required'),
        taxAmount: z.number().min(0).default(0),
        discountAmount: z.number().min(0).default(0),
        shippingCost: z.number().min(0).default(0),
    }),
});

export type CreatePurchaseOrderInput = z.infer<
    typeof createPurchaseOrderSchema
>['body'];

// Update Purchase Order schema
export const updatePurchaseOrderSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid purchase order ID'),
    }),
    body: z.object({
        supplierId: z.string().uuid('Invalid supplier ID').optional(),
        branchId: z.string().uuid('Invalid branch ID').optional(),
        expectedDate: z.coerce.date().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        items: z
            .array(
                z.object({
                    id: z.string().uuid().optional(), // Existing item ID
                    productId: z.string().uuid('Invalid product ID'),
                    orderedQty: z
                        .number()
                        .int()
                        .positive('Quantity must be positive'),
                    unitPrice: z
                        .number()
                        .positive('Unit price must be positive'),
                    notes: z.string().optional(),
                })
            )
            .min(1, 'At least one item is required')
            .optional(),
        taxAmount: z.number().min(0).optional(),
        discountAmount: z.number().min(0).optional(),
        shippingCost: z.number().min(0).optional(),
    }),
});

export type UpdatePurchaseOrderInput = z.infer<
    typeof updatePurchaseOrderSchema
>['body'];

// Get Purchase Order by ID schema
export const getPurchaseOrderByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid purchase order ID'),
    }),
});

// Get Purchase Orders query schema
export const getPurchaseOrdersQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
        search: z.string().optional(), // Search by PO number
        supplierId: z.string().uuid().optional(),
        branchId: z.string().uuid().optional(),
        status: z
            .enum([
                'DRAFT',
                'PENDING',
                'APPROVED',
                'PARTIALLY_RECEIVED',
                'RECEIVED',
                'CANCELLED',
            ])
            .optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        sortBy: z
            .enum(['poNumber', 'orderDate', 'totalAmount'])
            .default('orderDate'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
});

export type GetPurchaseOrdersQuery = z.infer<
    typeof getPurchaseOrdersQuerySchema
>['query'];

// Approve Purchase Order schema
export const approvePurchaseOrderSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid purchase order ID'),
    }),
    body: z.object({
        notes: z.string().optional(),
    }),
});

// Receive Purchase Order schema
export const receivePurchaseOrderSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid purchase order ID'),
    }),
    body: z.object({
        items: z.array(
            z.object({
                itemId: z.string().uuid('Invalid item ID'),
                receivedQty: z
                    .number()
                    .int()
                    .min(0, 'Received quantity cannot be negative'),
                notes: z.string().optional(),
            })
        ),
        receivedDate: z.coerce.date().optional(),
        notes: z.string().optional(),
    }),
});

export type ReceivePurchaseOrderInput = z.infer<
    typeof receivePurchaseOrderSchema
>['body'];

// Cancel Purchase Order schema
export const cancelPurchaseOrderSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid purchase order ID'),
    }),
    body: z.object({
        reason: z.string().min(1, 'Cancellation reason is required'),
    }),
});

// Delete Purchase Order schema
export const deletePurchaseOrderSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid purchase order ID'),
    }),
});
