import prisma from '@/config/database';
import { Prisma, UserRole } from '@prisma/client';

export class UserRepository {
    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                isActive: true,
                branchId: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async findByUsername(username: string) {
        return prisma.user.findUnique({
            where: { username },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        isActive: true,
                    },
                },
            },
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.UserCreateInput) {
        return prisma.user.create({
            data,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                isActive: true,
                branchId: true,
                createdAt: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take,
                where,
                orderBy,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    branchId: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true,
                    branch: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return { users, total };
    }

    async update(id: string, data: Prisma.UserUpdateInput) {
        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                isActive: true,
                branchId: true,
                updatedAt: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
    }

    async delete(id: string) {
        return prisma.user.delete({
            where: { id },
        });
    }

    async updateLastLogin(id: string) {
        return prisma.user.update({
            where: { id },
            data: { lastLogin: new Date() },
        });
    }

    async countByRole(role: UserRole) {
        return prisma.user.count({
            where: { role, isActive: true },
        });
    }

    async countByBranch(branchId: string) {
        return prisma.user.count({
            where: { branchId, isActive: true },
        });
    }
}
