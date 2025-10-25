import prisma from '@/config/database';
import { PurchaseOrderRepository } from '@/repositories/purchase-order.repository';
import { StockRepository } from '@/repositories/stock.repository';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import type {
    CreatePurchaseOrderInput,
    GetPurchaseOrdersQuery,
    ReceivePurchaseOrderInput,
    UpdatePurchaseOrderInput,
} from '@/validators/purchase-order.validator';
import { Prisma } from '@prisma/client';

export class PurchaseOrderService {
    private purchaseOrderRepository: PurchaseOrderRepository;
    private stockRepository: StockRepository;

    constructor() {
        this.purchaseOrderRepository = new PurchaseOrderRepository();
        this.stockRepository = new StockRepository();
    }

    async createPurchaseOrder(data: CreatePurchaseOrderInput, userId: string) {
        // Validate Supplier
        const supplier = await prisma.supplier.findFirst({
            where: {
                id: data.supplierId,
                isActive: true,
                deletedAt: null,
            },
        });

        if (!supplier) {
            throw new NotFoundError(
                'Supplier not found or inactive',
                'SUPPLIER_NOT_FOUND'
            );
        }

        // Validate Branch
        const branch = await prisma.branch.findFirst({
            where: {
                id: data.branchId,
                isActive: true,
                status: 'ACTIVE',
                deletedAt: null,
            },
        });

        if (!branch) {
            throw new NotFoundError(
                'Branch not found or inactive',
                'BRANCH_NOT_FOUND'
            );
        }

        // Validate Products
        const productIds = data.items.map((item) => item.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                isActive: true,
                deletedAt: null,
            },
        });

        if (products.length !== productIds.length) {
            throw new NotFoundError(
                'Some products not found or inactive',
                'PRODUCTS_NOT_FOUND'
            );
        }

        // Check for duplicate product IDs
        const uniqueProductIds = new Set(productIds);
        if (uniqueProductIds.size !== productIds.length) {
            throw new BadRequestError(
                'Duplicate products in order',
                'DUPLICATE_PRODUCTS'
            );
        }

        const poNumber = await this.purchaseOrderRepository.generatePONumber();

        const subtotal = data.items.reduce((sum, item) => {
            return sum + item.orderedQty * item.unitPrice;
        }, 0);

        const totalAmount =
            subtotal + data.taxAmount - data.discountAmount + data.shippingCost;

        // Validation: Check if amounts are valid
        if (subtotal <= 0) {
            throw new BadRequestError(
                'Subtotal must be greater than 0',
                'INVALID_SUBTOTAL'
            );
        }

        if (
            data.taxAmount < 0 ||
            data.discountAmount < 0 ||
            data.shippingCost < 0
        ) {
            throw new BadRequestError(
                'Tax, discount, and shipping cost cannot be negative',
                'INVALID_AMOUNTS'
            );
        }

        if (totalAmount <= 0) {
            throw new BadRequestError(
                'Total amount must be greater than 0',
                'INVALID_TOTAL'
            );
        }

        const items = data.items.map((item) => {
            // Validate item quantities and prices
            if (item.orderedQty <= 0) {
                throw new BadRequestError(
                    `Invalid quantity for product ${item.productId}`,
                    'INVALID_QUANTITY'
                );
            }

            if (item.unitPrice <= 0) {
                throw new BadRequestError(
                    `Invalid unit price for product ${item.productId}`,
                    'INVALID_PRICE'
                );
            }

            return {
                productId: item.productId,
                orderedQty: item.orderedQty,
                unitPrice: item.unitPrice,
                subtotal: item.orderedQty * item.unitPrice,
                notes: item.notes,
            };
        });

        const purchaseOrder = await this.purchaseOrderRepository.create({
            poNumber,
            supplierId: data.supplierId,
            branchId: data.branchId,
            orderDate: new Date(),
            expectedDate: data.expectedDate,
            paymentTerms: data.paymentTerms,
            notes: data.notes,
            subtotal,
            taxAmount: data.taxAmount,
            discountAmount: data.discountAmount,
            shippingCost: data.shippingCost,
            totalAmount,
            createdBy: userId,
            items,
        });

        return purchaseOrder;
    }

    async getPurchaseOrders(query: GetPurchaseOrdersQuery) {
        const {
            page = 1,
            limit = 10,
            search,
            supplierId,
            branchId,
            status,
            startDate,
            endDate,
            sortBy,
            sortOrder,
        } = query;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.PurchaseOrderWhereInput = {};

        if (search) {
            where.poNumber = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (branchId) {
            where.branchId = branchId;
        }

        if (status) {
            where.status = status;
        }

        if (startDate || endDate) {
            where.orderDate = {};
            if (startDate) where.orderDate.gte = startDate;
            if (endDate) where.orderDate.lte = endDate;
        }

        // Build orderBy
        const orderByClause: Prisma.PurchaseOrderOrderByWithRelationInput = {
            [sortBy]: sortOrder,
        };

        const { purchaseOrders, total } =
            await this.purchaseOrderRepository.findMany({
                skip,
                take: Number(limit),
                where,
                orderBy: orderByClause,
            });

        // Format response with summary
        const formattedPOs = purchaseOrders.map((po) => {
            const totalItems = po.items.reduce(
                (sum, item) => sum + item.orderedQty,
                0
            );
            const receivedItems = po.items.reduce(
                (sum, item) => sum + item.receivedQty,
                0
            );
            const progress =
                totalItems > 0 ? (receivedItems / totalItems) * 100 : 0;

            return {
                ...po,
                summary: {
                    totalItems,
                    receivedItems,
                    progress: Math.round(progress),
                },
            };
        });

        return {
            purchaseOrders: formattedPOs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPurchaseOrderById(id: string) {
        const purchaseOrder = await this.purchaseOrderRepository.findById(id);

        if (!purchaseOrder) {
            throw new NotFoundError('Purchase order not found', 'PO_NOT_FOUND');
        }

        return purchaseOrder;
    }

    async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderInput) {
        const existingPO = await this.purchaseOrderRepository.findById(id);

        if (!existingPO) {
            throw new NotFoundError('Purchase order not found', 'PO_NOT_FOUND');
        }

        // Only DRAFT can be edited
        if (existingPO.status !== 'DRAFT') {
            throw new BadRequestError(
                'Only DRAFT purchase orders can be edited',
                'PO_NOT_EDITABLE'
            );
        }

        // Calculate new totals if items are updated
        let updateData: Prisma.PurchaseOrderUpdateInput = {
            supplier: data.supplierId
                ? { connect: { id: data.supplierId } }
                : undefined,
            branch: data.branchId
                ? { connect: { id: data.branchId } }
                : undefined,
            expectedDate: data.expectedDate,
            paymentTerms: data.paymentTerms,
            notes: data.notes,
        };

        if (data.items) {
            const subtotal = data.items.reduce((sum, item) => {
                return sum + item.orderedQty * item.unitPrice;
            }, 0);

            const totalAmount =
                subtotal +
                (data.taxAmount ?? existingPO.taxAmount.toNumber()) -
                (data.discountAmount ?? existingPO.discountAmount.toNumber()) +
                (data.shippingCost ?? existingPO.shippingCost.toNumber());

            updateData = {
                ...updateData,
                subtotal,
                taxAmount: data.taxAmount,
                discountAmount: data.discountAmount,
                shippingCost: data.shippingCost,
                totalAmount,
                items: {
                    deleteMany: {}, // Delete all existing items
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        orderedQty: item.orderedQty,
                        unitPrice: item.unitPrice,
                        subtotal: item.orderedQty * item.unitPrice,
                        notes: item.notes,
                    })),
                },
            };
        }

        const updatedPO = await this.purchaseOrderRepository.update(
            id,
            updateData
        );

        return updatedPO;
    }

    async submitPurchaseOrder(id: string) {
        const purchaseOrder = await this.purchaseOrderRepository.findById(id);

        if (!purchaseOrder) {
            throw new NotFoundError('Purchase order not found', 'PO_NOT_FOUND');
        }

        if (purchaseOrder.status !== 'DRAFT') {
            throw new BadRequestError(
                'Only DRAFT purchase orders can be submitted',
                'INVALID_STATUS'
            );
        }

        return this.purchaseOrderRepository.updateStatus(id, 'PENDING');
    }

    async approvePurchaseOrder(id: string, userId: string) {
        const purchaseOrder = await this.purchaseOrderRepository.findById(id);

        if (!purchaseOrder) {
            throw new NotFoundError('Purchase order not found', 'PO_NOT_FOUND');
        }

        if (purchaseOrder.status !== 'PENDING') {
            throw new BadRequestError(
                'Only PENDING purchase orders can be approved',
                'INVALID_STATUS'
            );
        }

        return this.purchaseOrderRepository.updateStatus(
            id,
            'APPROVED',
            userId
        );
    }

    async receivePurchaseOrder(
        id: string,
        data: ReceivePurchaseOrderInput,
        userId: string
    ) {
        const purchaseOrder = await this.purchaseOrderRepository.findById(id);

        if (!purchaseOrder) {
            throw new NotFoundError('Purchase order not found', 'PO_NOT_FOUND');
        }

        if (
            purchaseOrder.status !== 'APPROVED' &&
            purchaseOrder.status !== 'PARTIALLY_RECEIVED'
        ) {
            throw new BadRequestError(
                'Only APPROVED or PARTIALLY_RECEIVED purchase orders can be received',
                'INVALID_STATUS'
            );
        }

        // Update received quantities and add to stock
        for (const item of data.items) {
            const poItem = purchaseOrder.items.find(
                (i) => i.id === item.itemId
            );

            if (!poItem) {
                throw new NotFoundError(
                    `Item ${item.itemId} not found in purchase order`,
                    'ITEM_NOT_FOUND'
                );
            }

            // Validate received quantity
            const newTotalReceived = poItem.receivedQty + item.receivedQty;
            if (newTotalReceived > poItem.orderedQty) {
                throw new BadRequestError(
                    `Received quantity exceeds ordered quantity for item ${poItem.product.name}`,
                    'EXCEEDED_ORDERED_QTY'
                );
            }

            // Update item received quantity
            await this.purchaseOrderRepository.updateItemReceivedQty(
                item.itemId,
                newTotalReceived
            );

            // Add to stock if received quantity > 0
            if (item.receivedQty > 0) {
                await this.stockRepository.updateStock(
                    poItem.productId,
                    purchaseOrder.branchId,
                    item.receivedQty,
                    'IN',
                    userId,
                    {
                        notes: `Received from PO ${purchaseOrder.poNumber}`,
                        referenceType: 'PURCHASE_ORDER',
                        referenceId: purchaseOrder.id,
                    }
                );
            }
        }

        // Check if all items are fully received
        const updatedPO = await this.purchaseOrderRepository.findById(id);
        const allReceived = updatedPO!.items.every(
            (item) => item.receivedQty >= item.orderedQty
        );

        const newStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

        // Update PO status and received date
        await this.purchaseOrderRepository.update(id, {
            status: newStatus,
            receivedDate: data.receivedDate || new Date(),
            receiver: { connect: { id: userId } },
            notes: data.notes
                ? `${purchaseOrder.notes || ''}\n${data.notes}`
                : purchaseOrder.notes,
        });

        return this.purchaseOrderRepository.findById(id);
    }

    async cancelPurchaseOrder(id: string, reason: string) {
        const purchaseOrder = await this.purchaseOrderRepository.findById(id);

        if (!purchaseOrder) {
            throw new NotFoundError('Purchase order not found', 'PO_NOT_FOUND');
        }

        if (
            purchaseOrder.status === 'RECEIVED' ||
            purchaseOrder.status === 'CANCELLED'
        ) {
            throw new BadRequestError(
                'Cannot cancel RECEIVED or already CANCELLED purchase orders',
                'CANNOT_CANCEL'
            );
        }

        return this.purchaseOrderRepository.update(id, {
            status: 'CANCELLED',
            notes: `${purchaseOrder.notes || ''}\nCancellation reason: ${reason}`,
        });
    }

    async deletePurchaseOrder(id: string) {
        const purchaseOrder = await this.purchaseOrderRepository.findById(id);

        if (!purchaseOrder) {
            throw new NotFoundError('Purchase order not found', 'PO_NOT_FOUND');
        }

        // Only DRAFT or CANCELLED can be deleted
        if (
            purchaseOrder.status !== 'DRAFT' &&
            purchaseOrder.status !== 'CANCELLED'
        ) {
            throw new BadRequestError(
                'Only DRAFT or CANCELLED purchase orders can be deleted',
                'CANNOT_DELETE'
            );
        }

        return this.purchaseOrderRepository.softDelete(id);
    }

    async getStatistics(branchId?: string) {
        return this.purchaseOrderRepository.getStatistics(branchId);
    }
}
