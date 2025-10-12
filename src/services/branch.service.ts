import { BranchRepository } from '@/repositories/branch.repository';
import { UserRepository } from '@/repositories/user.repository';
import { AppError } from '@/utils/errors';
import { Prisma, BranchStatus, UserRole } from '@prisma/client';
import prisma from '@/config/database';
import {
    AssignUserDTO,
    CreateBranchDTO,
    UpdateBranchDTO,
} from '@/types/branch.types';

export class BranchService {
    private branchRepository: BranchRepository;
    private userRepository: UserRepository;

    constructor() {
        this.branchRepository = new BranchRepository();
        this.userRepository = new UserRepository();
    }

    async createBranch(data: CreateBranchDTO) {
        // Validate branch code uniqueness
        const existingBranch = await this.branchRepository.findByCode(
            data.code
        );
        if (existingBranch) {
            throw new AppError(
                409,
                'Branch code already exists',
                'BRANCH_CODE_EXISTS'
            );
        }

        // Create branch in transaction with audit log
        const branch = await prisma.$transaction(async (tx) => {
            const newBranch = await tx.branch.create({
                data: {
                    code: data.code.toUpperCase(),
                    name: data.name,
                    address: data.address,
                    city: data.city,
                    province: data.province,
                    postalCode: data.postalCode,
                    phone: data.phone,
                    email: data.email,
                    operatingHours: data.operatingHours || {},
                    notes: data.notes,
                    status: BranchStatus.DRAFT,
                    isActive: false,
                },
            });

            return newBranch;
        });

        return branch;
    }

    async assignManager(branchId: string, data: AssignUserDTO) {
        const { userId } = data;

        // Validate branch exists and not deleted
        const branch = await this.branchRepository.findById(branchId);
        if (!branch) {
            throw new AppError(404, 'Branch not found', 'BRANCH_NOT_FOUND');
        }

        if (branch.managerId) {
            throw new AppError(
                400,
                'Branch already has a manager assigned',
                'MANAGER_ALREADY_EXISTS'
            );
        }

        // Validate user exists and is a BRANCH_MANAGER
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        if (user.role !== UserRole.BRANCH_MANAGER) {
            throw new AppError(
                400,
                'User is not a Branch Manager',
                'INVALID_USER_ROLE'
            );
        }

        if (!user.isActive) {
            throw new AppError(400, 'User is not active', 'USER_INACTIVE');
        }

        if (user.branchId) {
            throw new AppError(
                400,
                'User is already assigned to another branch',
                'USER_ALREADY_ASSIGNED'
            );
        }

        // Assign manager in transaction
        const result = await prisma.$transaction(async (tx) => {
            const updatedBranch = await tx.branch.update({
                where: { id: branchId },
                data: {
                    managerId: userId,
                    status: branch.cashierId
                        ? BranchStatus.PENDING
                        : BranchStatus.DRAFT,
                },
                include: {
                    manager: true,
                    cashier: true,
                },
            });

            // Update user's branchId
            await tx.user.update({
                where: { id: userId },
                data: { branchId },
            });

            return updatedBranch;
        });

        return result;
    }

    async assignCashier(branchId: string, data: AssignUserDTO) {
        const { userId } = data;

        // Validate branch exists
        const branch = await this.branchRepository.findById(branchId);
        if (!branch) {
            throw new AppError(404, 'Branch not found', 'BRANCH_NOT_FOUND');
        }

        if (branch.cashierId) {
            throw new AppError(
                400,
                'Branch already has a cashier assigned',
                'CASHIER_ALREADY_EXISTS'
            );
        }

        // Validate user exists and is a CASHIER
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        if (user.role !== UserRole.CASHIER) {
            throw new AppError(
                400,
                'User is not a Cashier',
                'INVALID_USER_ROLE'
            );
        }

        if (!user.isActive) {
            throw new AppError(400, 'User is not active', 'USER_INACTIVE');
        }

        if (user.branchId) {
            throw new AppError(
                400,
                'User is already assigned to another branch',
                'USER_ALREADY_ASSIGNED'
            );
        }

        // Assign cashier in transaction
        const result = await prisma.$transaction(async (tx) => {
            const updatedBranch = await tx.branch.update({
                where: { id: branchId },
                data: {
                    cashierId: userId,
                    status: branch.managerId
                        ? BranchStatus.PENDING
                        : BranchStatus.DRAFT,
                },
                include: {
                    manager: true,
                    cashier: true,
                },
            });

            // Update user's branchId
            await tx.user.update({
                where: { id: userId },
                data: { branchId },
            });

            return updatedBranch;
        });

        return result;
    }

    async activateBranch(branchId: string) {
        const branch = await this.branchRepository.findById(branchId);
        if (!branch) {
            throw new AppError(404, 'Branch not found', 'BRANCH_NOT_FOUND');
        }

        // Validate requirements
        if (!branch.managerId || !branch.cashierId) {
            throw new AppError(
                400,
                'Branch must have both Manager and Cashier assigned before activation',
                'INCOMPLETE_BRANCH_SETUP'
            );
        }

        if (branch.status === BranchStatus.ACTIVE) {
            throw new AppError(
                400,
                'Branch is already active',
                'BRANCH_ALREADY_ACTIVE'
            );
        }

        // Activate in transaction
        const result = await prisma.$transaction(async (tx) => {
            const activatedBranch = await tx.branch.update({
                where: { id: branchId },
                data: {
                    status: BranchStatus.ACTIVE,
                    isActive: true,
                    activatedAt: new Date(),
                },
                include: {
                    manager: true,
                    cashier: true,
                },
            });

            return activatedBranch;
        });

        return result;
    }

    async deactivateBranch(branchId: string) {
        const branch = await this.branchRepository.findById(branchId);
        if (!branch) {
            throw new AppError(404, 'Branch not found', 'BRANCH_NOT_FOUND');
        }

        if (branch.status !== BranchStatus.ACTIVE) {
            throw new AppError(
                400,
                'Only active branches can be deactivated',
                'BRANCH_NOT_ACTIVE'
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const deactivatedBranch = await tx.branch.update({
                where: { id: branchId },
                data: {
                    status: BranchStatus.INACTIVE,
                    isActive: false,
                    deactivatedAt: new Date(),
                },
                include: {
                    manager: true,
                    cashier: true,
                },
            });

            return deactivatedBranch;
        });

        return result;
    }

    async updateBranch(branchId: string, data: UpdateBranchDTO) {
        const branch = await this.branchRepository.findById(branchId);
        if (!branch) {
            throw new AppError(404, 'Branch not found', 'BRANCH_NOT_FOUND');
        }

        const updatedBranch = await this.branchRepository.update(
            branchId,
            data
        );

        return updatedBranch;
    }

    async getBranches(params: {
        page: number;
        limit: number;
        status?: BranchStatus;
        search?: string;
        city?: string;
        province?: string;
        isActive?: boolean;
    }) {
        const { page, limit, status, search, city, province, isActive } =
            params;
        const skip = (page - 1) * limit;

        const where: Prisma.BranchWhereInput = {
            ...(status && { status }),
            ...(isActive !== undefined && { isActive }),
            ...(city && { city: { contains: city, mode: 'insensitive' } }),
            ...(province && {
                province: { contains: province, mode: 'insensitive' },
            }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                    { address: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const { branches, total } = await this.branchRepository.findMany({
            skip,
            take: limit,
            where,
            orderBy: { createdAt: 'desc' },
        });

        return {
            branches,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getBranchById(branchId: string) {
        const branch = await this.branchRepository.findById(branchId);
        if (!branch) {
            throw new AppError(404, 'Branch not found', 'BRANCH_NOT_FOUND');
        }
        return branch;
    }

    async getBranchStatistics() {
        const [stats, byProvince, byCity] = await Promise.all([
            this.branchRepository.getStatistics(),
            this.branchRepository.groupByProvince(),
            this.branchRepository.groupByCity(),
        ]);

        return {
            overview: stats,
            byProvince,
            byCity,
        };
    }
}
