import prisma from '@/config/database';
import { Prisma } from '@prisma/client';

export class ProductRepository {
    private readonly selectFields = {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        slug: true,
        description: true,
        categoryId: true,
        brandId: true,
        unit: true,
        compatibleModels: true,
        purchasePrice: true,
        sellingPrice: true,
        wholesalePrice: true,
        minOrderWholesale: true,
        hasDiscount: true,
        discountPercent: true,
        discountPrice: true,
        minStock: true,
        weight: true,
        dimensions: true,
        specifications: true,
        storageLocation: true,
        tags: true,
        images: true,
        mainImage: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        category: {
            select: {
                id: true,
                name: true,
                slug: true,
            },
        },
        brand: {
            select: {
                id: true,
                name: true,
            },
        },
    };

    async create(data: Prisma.ProductCreateInput) {
        return prisma.product.create({
            data,
            select: this.selectFields,
        });
    }

    async findById(id: string) {
        return prisma.product.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            select: this.selectFields,
        });
    }

    async findBySku(sku: string) {
        return prisma.product.findFirst({
            where: {
                sku,
                deletedAt: null,
            },
        });
    }

    async findByBarcode(barcode: string) {
        return prisma.product.findFirst({
            where: {
                barcode,
                deletedAt: null,
            },
        });
    }

    async findBySlug(slug: string) {
        return prisma.product.findFirst({
            where: {
                slug,
                deletedAt: null,
            },
        });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        // Always exclude soft deleted
        const whereClause: Prisma.ProductWhereInput = {
            ...where,
            deletedAt: null,
        };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                skip,
                take,
                where: whereClause,
                orderBy,
                select: this.selectFields,
            }),
            prisma.product.count({ where: whereClause }),
        ]);

        return { products, total };
    }

    async findManyWithStocks(params: {
        skip: number;
        take: number;
        where: Prisma.ProductWhereInput;
        orderBy: Prisma.ProductOrderByWithRelationInput;
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
                stocks: branchId
                    ? {
                          where: {
                              branchId: branchId,
                          },
                          select: {
                              quantity: true,
                              isLowStock: true,
                              branchId: true,
                          },
                      }
                    : {
                          select: {
                              quantity: true,
                              branchId: true,
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

        return { products, total };
    }

    async update(id: string, data: Prisma.ProductUpdateInput) {
        return prisma.product.update({
            where: { id },
            data,
            select: this.selectFields,
        });
    }

    async toggleStatus(id: string, isActive: boolean) {
        return prisma.product.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                name: true,
                sku: true,
                isActive: true,
            },
        });
    }

    async updateDiscount(
        id: string,
        discountPercent: number,
        discountPrice: number
    ) {
        return prisma.product.update({
            where: { id },
            data: {
                hasDiscount: true,
                discountPercent,
                discountPrice,
            },
            select: this.selectFields,
        });
    }

    async removeDiscount(id: string) {
        return prisma.product.update({
            where: { id },
            data: {
                hasDiscount: false,
                discountPercent: 0,
                discountPrice: null,
            },
            select: this.selectFields,
        });
    }

    async softDelete(id: string) {
        return prisma.product.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    async checkCategoryExists(categoryId: string): Promise<boolean> {
        const count = await prisma.category.count({
            where: {
                id: categoryId,
                deletedAt: null,
            },
        });
        return count > 0;
    }

    async checkBrandExists(brandId: string): Promise<boolean> {
        const count = await prisma.brand.count({
            where: {
                id: brandId,
                deletedAt: null,
            },
        });
        return count > 0;
    }
}
