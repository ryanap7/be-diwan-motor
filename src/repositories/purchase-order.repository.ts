import prisma from '@/config/database';
import { Prisma, PurchaseOrderStatus } from '@prisma/client';

export class PurchaseOrderRepository {
    // Generate PO Number
    async generatePONumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

        // Get count of POs created today
        const count = await prisma.purchaseOrder.count({
            where: {
                poNumber: {
                    startsWith: `PO-${dateStr}`,
                },
            },
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `PO-${dateStr}-${sequence}`;
    }

    // Create Purchase Order
    async create(data: {
        poNumber: string;
        supplierId: string;
        branchId: string;
        orderDate: Date;
        expectedDate?: Date;
        paymentTerms?: string;
        notes?: string;
        subtotal: number;
        taxAmount: number;
        discountAmount: number;
        shippingCost: number;
        totalAmount: number;
        createdBy: string;
        items: Array<{
            productId: string;
            orderedQty: number;
            unitPrice: number;
            subtotal: number;
            notes?: string;
        }>;
    }) {
        return prisma.purchaseOrder.create({
            data: {
                poNumber: data.poNumber,
                supplierId: data.supplierId,
                branchId: data.branchId,
                orderDate: data.orderDate,
                expectedDate: data.expectedDate,
                paymentTerms: data.paymentTerms,
                notes: data.notes,
                subtotal: data.subtotal,
                taxAmount: data.taxAmount,
                discountAmount: data.discountAmount,
                shippingCost: data.shippingCost,
                totalAmount: data.totalAmount,
                createdBy: data.createdBy,
                status: 'DRAFT',
                items: {
                    create: data.items,
                },
            },
            include: {
                supplier: true,
                branch: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    }

    // Find by ID
    async findById(id: string) {
        return prisma.purchaseOrder.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                supplier: true,
                branch: true,
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                unit: true,
                                mainImage: true,
                            },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    }

    // Find many with filters
    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.PurchaseOrderWhereInput;
        orderBy?: Prisma.PurchaseOrderOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const [purchaseOrders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                skip,
                take,
                where: {
                    ...where,
                    deletedAt: null,
                },
                orderBy,
                include: {
                    supplier: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    branch: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    items: {
                        select: {
                            id: true,
                            orderedQty: true,
                            receivedQty: true,
                        },
                    },
                },
            }),
            prisma.purchaseOrder.count({
                where: {
                    ...where,
                    deletedAt: null,
                },
            }),
        ]);

        return { purchaseOrders, total };
    }

    // Update Purchase Order
    async update(id: string, data: Prisma.PurchaseOrderUpdateInput) {
        return prisma.purchaseOrder.update({
            where: { id },
            data,
            include: {
                supplier: true,
                branch: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    // Update status
    async updateStatus(
        id: string,
        status: PurchaseOrderStatus,
        userId?: string
    ) {
        const updateData: Prisma.PurchaseOrderUpdateInput = { status };

        if (status === 'APPROVED' && userId) {
            updateData.approver = {
                connect: { id: userId },
            };
        }

        return prisma.purchaseOrder.update({
            where: { id },
            data: updateData,
        });
    }

    // Soft delete
    async softDelete(id: string) {
        return prisma.purchaseOrder.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    // Update items received quantity
    async updateItemReceivedQty(itemId: string, receivedQty: number) {
        return prisma.purchaseOrderItem.update({
            where: { id: itemId },
            data: { receivedQty },
        });
    }

    // Get PO statistics
    async getStatistics(branchId?: string) {
        const where: Prisma.PurchaseOrderWhereInput = {
            deletedAt: null,
        };

        if (branchId) {
            where.branchId = branchId;
        }

        const [total, draft, pending, approved, received, cancelled] =
            await Promise.all([
                prisma.purchaseOrder.count({ where }),
                prisma.purchaseOrder.count({
                    where: { ...where, status: 'DRAFT' },
                }),
                prisma.purchaseOrder.count({
                    where: { ...where, status: 'PENDING' },
                }),
                prisma.purchaseOrder.count({
                    where: { ...where, status: 'APPROVED' },
                }),
                prisma.purchaseOrder.count({
                    where: { ...where, status: 'RECEIVED' },
                }),
                prisma.purchaseOrder.count({
                    where: { ...where, status: 'CANCELLED' },
                }),
            ]);

        return {
            total,
            draft,
            pending,
            approved,
            received,
            cancelled,
        };
    }
}
