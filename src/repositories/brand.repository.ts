import prisma from '@/config/database';
import { Prisma } from '@prisma/client';

export class BrandRepository {
    async create(data: Prisma.BrandCreateInput) {
        return prisma.brand.create({
            data,
            select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findById(id: string) {
        return prisma.brand.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        products: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
        });
    }

    async findByName(name: string) {
        return prisma.brand.findFirst({
            where: {
                name,
                deletedAt: null,
            },
        });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.BrandWhereInput;
        orderBy?: Prisma.BrandOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const whereClause: Prisma.BrandWhereInput = {
            ...where,
            deletedAt: null,
        };

        const [brands, total] = await Promise.all([
            prisma.brand.findMany({
                skip,
                take,
                where: whereClause,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            products: {
                                where: {
                                    deletedAt: null,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.brand.count({ where: whereClause }),
        ]);

        return { brands, total };
    }

    async update(id: string, data: Prisma.BrandUpdateInput) {
        return prisma.brand.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async toggleStatus(id: string, isActive: boolean) {
        return prisma.brand.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                name: true,
                isActive: true,
            },
        });
    }

    async softDelete(id: string) {
        return prisma.brand.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    async hasProducts(id: string): Promise<boolean> {
        const count = await prisma.product.count({
            where: {
                brandId: id,
                deletedAt: null,
            },
        });
        return count > 0;
    }
}
