import prisma from '@/config/database';
import { Prisma, BranchStatus } from '@prisma/client';

export class BranchRepository {
    // Create new branch (status: DRAFT by default)
    async create(data: Prisma.BranchCreateInput) {
        return prisma.branch.create({
            data,
            include: {
                manager: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
                cashier: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    // Find branch by ID
    async findById(id: string) {
        return prisma.branch.findUnique({
            where: {
                id,
                deletedAt: null, // Exclude soft deleted
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        role: true,
                        isActive: true,
                    },
                },
                cashier: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        role: true,
                        isActive: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });
    }

    // Find branch by code
    async findByCode(code: string) {
        return prisma.branch.findUnique({
            where: {
                code,
                deletedAt: null,
            },
        });
    }

    // Get all branches with filters and pagination
    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.BranchWhereInput;
        orderBy?: Prisma.BranchOrderByWithRelationInput;
        includeUsers?: boolean;
    }) {
        const { skip, take, where, orderBy, includeUsers } = params;

        const baseWhere: Prisma.BranchWhereInput = {
            ...where,
            deletedAt: null, // Exclude soft deleted
        };

        const [branches, total] = await Promise.all([
            prisma.branch.findMany({
                skip,
                take,
                where: baseWhere,
                orderBy: orderBy || { createdAt: 'desc' },
                include: {
                    manager: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                    cashier: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                    ...(includeUsers && {
                        users: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                role: true,
                                isActive: true,
                            },
                        },
                    }),
                    _count: {
                        select: {
                            users: true,
                        },
                    },
                },
            }),
            prisma.branch.count({ where: baseWhere }),
        ]);

        return { branches, total };
    }

    // Update branch
    async update(id: string, data: Prisma.BranchUpdateInput) {
        return prisma.branch.update({
            where: { id },
            data,
            include: {
                manager: true,
                cashier: true,
            },
        });
    }

    // Assign manager to branch
    async assignManager(branchId: string, managerId: string) {
        return prisma.branch.update({
            where: { id: branchId },
            data: {
                managerId,
                status: {
                    set: BranchStatus.PENDING, // Auto update status
                },
            },
            include: {
                manager: true,
                cashier: true,
            },
        });
    }

    // Assign cashier to branch
    async assignCashier(branchId: string, cashierId: string) {
        return prisma.branch.update({
            where: { id: branchId },
            data: {
                cashierId,
                status: {
                    set: BranchStatus.PENDING, // Auto update status
                },
            },
            include: {
                manager: true,
                cashier: true,
            },
        });
    }

    // Activate branch (requires manager AND cashier)
    async activate(id: string) {
        return prisma.branch.update({
            where: { id },
            data: {
                status: BranchStatus.ACTIVE,
                isActive: true,
                activatedAt: new Date(),
            },
        });
    }

    // Deactivate branch
    async deactivate(id: string) {
        return prisma.branch.update({
            where: { id },
            data: {
                status: BranchStatus.INACTIVE,
                isActive: false,
                deactivatedAt: new Date(),
            },
        });
    }

    // Close branch permanently
    async close(id: string) {
        return prisma.branch.update({
            where: { id },
            data: {
                status: BranchStatus.CLOSED,
                isActive: false,
                closedAt: new Date(),
            },
        });
    }

    // Soft delete branch
    async softDelete(id: string) {
        return prisma.branch.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    // Check if branch can be activated (has manager AND cashier)
    async canActivate(id: string): Promise<boolean> {
        const branch = await prisma.branch.findUnique({
            where: { id },
            select: {
                managerId: true,
                cashierId: true,
            },
        });

        return !!(branch?.managerId && branch?.cashierId);
    }

    // Get branch statistics
    async getStatistics() {
        const [total, active, inactive, draft, pending] = await Promise.all([
            prisma.branch.count({
                where: { deletedAt: null },
            }),
            prisma.branch.count({
                where: {
                    status: BranchStatus.ACTIVE,
                    deletedAt: null,
                },
            }),
            prisma.branch.count({
                where: {
                    status: BranchStatus.INACTIVE,
                    deletedAt: null,
                },
            }),
            prisma.branch.count({
                where: {
                    status: BranchStatus.DRAFT,
                    deletedAt: null,
                },
            }),
            prisma.branch.count({
                where: {
                    status: BranchStatus.PENDING,
                    deletedAt: null,
                },
            }),
        ]);

        return {
            total,
            active,
            inactive,
            draft,
            pending,
            closed: total - active - inactive - draft - pending,
        };
    }

    // Group branches by province
    async groupByProvince() {
        return prisma.branch.groupBy({
            by: ['province'],
            where: {
                deletedAt: null,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });
    }

    // Group branches by city
    async groupByCity(province?: string) {
        return prisma.branch.groupBy({
            by: ['city', 'province'],
            where: {
                deletedAt: null,
                ...(province && { province }),
            },
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });
    }
}
