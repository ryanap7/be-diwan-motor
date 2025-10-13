import prisma from '@/config/database';
import { Prisma } from '@prisma/client';

export class CustomerRepository {
    async create(data: Prisma.CustomerCreateInput) {
        return prisma.customer.create({
            data,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
                notes: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findById(id: string) {
        return prisma.customer.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
                notes: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findByPhone(phone: string) {
        return prisma.customer.findFirst({
            where: {
                phone,
                deletedAt: null,
            },
        });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.CustomerWhereInput;
        orderBy?: Prisma.CustomerOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                skip,
                take,
                where: {
                    ...where,
                    deletedAt: null,
                },
                orderBy,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    address: true,
                    notes: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.customer.count({
                where: {
                    ...where,
                    deletedAt: null,
                },
            }),
        ]);

        return { customers, total };
    }

    async update(id: string, data: Prisma.CustomerUpdateInput) {
        return prisma.customer.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
                notes: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async toggleStatus(id: string, isActive: boolean) {
        return prisma.customer.update({
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
        return prisma.customer.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }
}
