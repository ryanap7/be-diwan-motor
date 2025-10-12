import { UserRepository } from '@/repositories/user.repository';
import { hashPassword } from '@/utils/auth';
import { AppError } from '@/utils/errors';
import {
    CreateUserInput,
    UpdateUserInput,
    GetUsersQuery,
} from '@/validators/user.validator';
import { Prisma } from '@prisma/client';
import prisma from '@/config/database';

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async createUser(data: CreateUserInput) {
        // Check if username already exists
        const existingUsername = await this.userRepository.findByUsername(
            data.username
        );
        if (existingUsername) {
            throw new AppError(
                409,
                'Username already exists',
                'USERNAME_EXISTS'
            );
        }

        // Check if email already exists
        const existingEmail = await this.userRepository.findByEmail(data.email);
        if (existingEmail) {
            throw new AppError(409, 'Email already exists', 'EMAIL_EXISTS');
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Create user without branch assignment
        const user = await this.userRepository.create({
            username: data.username,
            password: hashedPassword,
            email: data.email,
            fullName: data.fullName,
            phone: data.phone,
            role: data.role,
            isActive: data.isActive ?? true,
        });

        return user;
    }

    async getUsers(query: GetUsersQuery) {
        const { search, role, branchId, isActive } = query;

        const page = query.page ? Number(query.page) : 1;
        const limit = query.limit ? Number(query.limit) : 10;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (branchId) {
            where.branchId = branchId;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Fetch users with pagination
        const { users, total } = await this.userRepository.findMany({
            skip,
            take: limit,
            where,
            orderBy: { createdAt: 'desc' },
        });

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getUserById(id: string) {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        return user;
    }

    async updateUser(id: string, data: UpdateUserInput) {
        // Check if user exists
        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        // Check username uniqueness if changed
        if (data.username && data.username !== existingUser.username) {
            const usernameExists = await this.userRepository.findByUsername(
                data.username
            );
            if (usernameExists) {
                throw new AppError(
                    409,
                    'Username already exists',
                    'USERNAME_EXISTS'
                );
            }
        }

        // Check email uniqueness if changed
        if (data.email && data.email !== existingUser.email) {
            const emailExists = await this.userRepository.findByEmail(
                data.email
            );
            if (emailExists) {
                throw new AppError(409, 'Email already exists', 'EMAIL_EXISTS');
            }
        }

        // Verify branch if changed
        if (data.branchId && data.branchId !== existingUser.branchId) {
            const branch = await prisma.branch.findUnique({
                where: { id: data.branchId },
            });

            if (!branch) {
                throw new AppError(404, 'Branch not found', 'BRANCH_NOT_FOUND');
            }

            if (!branch.isActive) {
                throw new AppError(
                    400,
                    'Cannot assign user to inactive branch',
                    'BRANCH_INACTIVE'
                );
            }
        }

        // Prepare update data
        const updateData: Prisma.UserUpdateInput = {
            ...(data.username && { username: data.username }),
            ...(data.email && { email: data.email }),
            ...(data.fullName && { fullName: data.fullName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.role && { role: data.role }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.branchId && {
                branch: {
                    connect: { id: data.branchId },
                },
            }),
        };

        // Hash password if provided
        if (data.password) {
            updateData.password = await hashPassword(data.password);
        }

        // Update user
        const user = await this.userRepository.update(id, updateData);

        return user;
    }

    async deleteUser(id: string) {
        // Check if user exists
        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        // Delete user
        await this.userRepository.delete(id);

        return { message: 'User deleted successfully' };
    }
}
