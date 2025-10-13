import prisma from '@/config/database';
import { Prisma, StockMovementType } from '@prisma/client';

export class StockRepository {
    // Get or create stock
    async getOrCreateStock(productId: string, branchId: string) {
        let stock = await prisma.stock.findUnique({
            where: {
                productId_branchId: { productId, branchId },
            },
        });

        if (!stock) {
            stock = await prisma.stock.create({
                data: {
                    productId,
                    branchId,
                    quantity: 0,
                    isLowStock: true,
                },
            });
        }

        return stock;
    }

    // Get stock quantity
    async getStockQuantity(
        productId: string,
        branchId: string
    ): Promise<number> {
        const stock = await prisma.stock.findUnique({
            where: {
                productId_branchId: { productId, branchId },
            },
        });

        return stock?.quantity || 0;
    }

    // Get stocks by product (all branches)
    async getStocksByProduct(productId: string) {
        const allBranches = await prisma.branch.findMany({
            where: { isActive: true, deletedAt: null },
            select: {
                id: true,
                name: true,
                code: true,
            },
        });

        const stocks = await prisma.stock.findMany({
            where: { productId },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        // Merge with all branches (fill missing with quantity 0)
        return allBranches.map((branch) => {
            const existingStock = stocks.find((s) => s.branchId === branch.id);
            return {
                branchId: branch.id,
                branchName: branch.name,
                branchCode: branch.code,
                quantity: existingStock?.quantity || 0,
                isLowStock: existingStock?.isLowStock || true,
                lastRestockDate: existingStock?.lastRestockDate || null,
                lastSaleDate: existingStock?.lastSaleDate || null,
            };
        });
    }

    // Get total stock for a product
    async getTotalStock(productId: string): Promise<number> {
        const result = await prisma.stock.aggregate({
            where: { productId },
            _sum: { quantity: true },
        });

        return result._sum.quantity || 0;
    }

    // Update stock
    async updateStock(
        productId: string,
        branchId: string,
        quantity: number,
        type: StockMovementType,
        userId: string,
        options?: {
            reason?: string;
            notes?: string;
            referenceType?: string;
            referenceId?: string;
            fromBranchId?: string;
            toBranchId?: string;
        }
    ) {
        return prisma.$transaction(async (tx) => {
            // Get or create stock
            let stock = await tx.stock.findUnique({
                where: {
                    productId_branchId: { productId, branchId },
                },
                include: {
                    product: true,
                },
            });

            const previousStock = stock?.quantity || 0;
            const newStock = previousStock + quantity;

            if (newStock < 0) {
                throw new Error('Insufficient stock');
            }

            if (!stock) {
                stock = await tx.stock.create({
                    data: {
                        productId,
                        branchId,
                        quantity: newStock,
                        isLowStock: newStock <= 0,
                        lastRestockDate: type === 'IN' ? new Date() : null,
                        lastSaleDate: type === 'OUT' ? new Date() : null,
                    },
                    include: {
                        product: true,
                    },
                });
            } else {
                stock = await tx.stock.update({
                    where: { id: stock.id },
                    data: {
                        quantity: newStock,
                        isLowStock: newStock <= (stock.product.minStock || 0),
                        lastRestockDate: type === 'IN' ? new Date() : undefined,
                        lastSaleDate: type === 'OUT' ? new Date() : undefined,
                    },
                    include: {
                        product: true,
                    },
                });
            }

            // Create movement record
            await tx.stockMovement.create({
                data: {
                    productId,
                    branchId,
                    type,
                    quantity,
                    previousStock,
                    newStock,
                    performedBy: userId,
                    reason: options?.reason,
                    notes: options?.notes,
                    referenceType: options?.referenceType,
                    referenceId: options?.referenceId,
                    fromBranchId: options?.fromBranchId,
                    toBranchId: options?.toBranchId,
                },
            });

            return stock;
        });
    }

    // Get stock overview with pagination
    async getStockOverview(params: {
        skip: number;
        take: number;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
        branchId?: string;
    }) {
        const { skip, take, where, orderBy, branchId } = params;

        const products = await prisma.product.findMany({
            skip,
            take,
            where: {
                ...where,
                deletedAt: null,
            },
            orderBy,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                stocks: {
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
            },
        });

        const total = await prisma.product.count({
            where: {
                ...where,
                deletedAt: null,
            },
        });

        // Get all branches for consistent display
        const allBranches = await prisma.branch.findMany({
            where: { isActive: true, deletedAt: null },
            select: {
                id: true,
                name: true,
                code: true,
            },
        });

        // Format the response
        const formattedProducts = products.map((product) => {
            const stocksByBranch = allBranches.map((branch) => {
                const stock = product.stocks.find(
                    (s) => s.branchId === branch.id
                );
                return {
                    branchId: branch.id,
                    branchName: branch.name,
                    branchCode: branch.code,
                    quantity: stock?.quantity || 0,
                    isLowStock: stock?.isLowStock || true,
                };
            });

            const totalStock = stocksByBranch.reduce(
                (sum, s) => sum + s.quantity,
                0
            );
            const hasLowStock = stocksByBranch.some((s) => s.isLowStock);

            return {
                id: product.id,
                sku: product.sku,
                name: product.name,
                mainImage: product.mainImage,
                unit: product.unit,
                minStock: product.minStock,
                category: product.category,
                brand: product.brand,
                totalStock,
                hasLowStock,
                stocksByBranch: branchId
                    ? stocksByBranch.filter((s) => s.branchId === branchId)
                    : stocksByBranch,
            };
        });

        return { products: formattedProducts, total };
    }

    // Get stock movements
    async getStockMovements(params: {
        skip: number;
        take: number;
        where?: Prisma.StockMovementWhereInput;
    }) {
        const { skip, take, where } = params;

        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                skip,
                take,
                where,
                include: {
                    product: {
                        select: {
                            id: true,
                            sku: true,
                            name: true,
                            mainImage: true,
                        },
                    },
                    branch: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    fromBranch: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    toBranch: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.stockMovement.count({ where }),
        ]);

        return { movements, total };
    }
}
