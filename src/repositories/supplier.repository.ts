import prisma from '@/config/database';
import { Prisma } from '@prisma/client';

export class SupplierRepository {
    async create(data: Prisma.SupplierCreateInput) {
        return prisma.supplier.create({
            data,
            select: {
                id: true,
                name: true,
                contactPerson: true,
                phone: true,
                email: true,
                address: true,
                paymentTerms: true,
                deliveryTerms: true,
                notes: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findById(id: string) {
        return prisma.supplier.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                contactPerson: true,
                phone: true,
                email: true,
                address: true,
                paymentTerms: true,
                deliveryTerms: true,
                notes: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findByName(name: string) {
        return prisma.supplier.findFirst({
            where: {
                name,
                deletedAt: null,
            },
        });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.SupplierWhereInput;
        orderBy?: Prisma.SupplierOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
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
                    contactPerson: true,
                    phone: true,
                    email: true,
                    address: true,
                    paymentTerms: true,
                    deliveryTerms: true,
                    notes: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.supplier.count({
                where: {
                    ...where,
                    deletedAt: null,
                },
            }),
        ]);

        return { suppliers, total };
    }

    async update(id: string, data: Prisma.SupplierUpdateInput) {
        return prisma.supplier.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                contactPerson: true,
                phone: true,
                email: true,
                address: true,
                paymentTerms: true,
                deliveryTerms: true,
                notes: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async toggleStatus(id: string, isActive: boolean) {
        return prisma.supplier.update({
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
        return prisma.supplier.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }
}
