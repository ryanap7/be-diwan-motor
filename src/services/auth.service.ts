import { UserRepository } from '@/repositories/user.repository';
import { TokenRepository } from '@/repositories/token.repository';
import { comparePassword } from '@/utils/auth';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    JWTPayload,
} from '@/utils/auth';
import { AppError } from '@/utils/errors';
import { LoginInput } from '@/validators/auth.validator';

export class AuthService {
    private userRepository: UserRepository;
    private tokenRepository: TokenRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.tokenRepository = new TokenRepository();
    }

    async login(data: LoginInput) {
        // Find user by username
        const user = await this.userRepository.findByUsername(data.username);

        if (!user) {
            throw new AppError(
                401,
                'Invalid username or password',
                'INVALID_CREDENTIALS'
            );
        }

        // Check if user is active
        if (!user.isActive) {
            throw new AppError(
                403,
                'Account is inactive. Please contact administrator',
                'ACCOUNT_INACTIVE'
            );
        }

        // Verify password
        const isPasswordValid = await comparePassword(
            data.password,
            user.password
        );

        if (!isPasswordValid) {
            throw new AppError(
                401,
                'Invalid username or password',
                'INVALID_CREDENTIALS'
            );
        }

        // Check branch requirement for non-admin users
        if (user.role !== 'ADMIN') {
            // Check if user has been assigned to a branch
            if (!user.branchId || !user.branch) {
                throw new AppError(
                    403,
                    'User has not been assigned to any branch. Please contact administrator',
                    'BRANCH_NOT_ASSIGNED'
                );
            }

            // Check if branch is active
            if (!user.branch.isActive) {
                throw new AppError(
                    403,
                    'Branch is inactive. Please contact administrator',
                    'BRANCH_INACTIVE'
                );
            }
        }

        // Prepare JWT payload
        const payload: JWTPayload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        // Generate tokens
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Calculate refresh token expiration (7 days)
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

        // Save refresh token to database
        await this.tokenRepository.create({
            token: refreshToken,
            userId: user.id,
            expiresAt: refreshTokenExpiresAt,
        });

        // Update last login
        await this.userRepository.updateLastLogin(user.id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.fullName,
                phone: user.phone,
                role: user.role,
                is_active: user.isActive,
                branch: user.branch || null, // null for admin
            },
        };
    }

    async refreshToken(refreshToken: string) {
        // Verify refresh token
        let payload: JWTPayload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new AppError(
                401,
                'Invalid or expired refresh token',
                'INVALID_REFRESH_TOKEN'
            );
        }

        // Check if refresh token exists in database
        const storedToken =
            await this.tokenRepository.findByToken(refreshToken);

        if (!storedToken) {
            throw new AppError(
                401,
                'Refresh token not found',
                'TOKEN_NOT_FOUND'
            );
        }

        // Check if token is expired
        if (storedToken.expiresAt < new Date()) {
            await this.tokenRepository.deleteByToken(refreshToken);
            throw new AppError(401, 'Refresh token expired', 'TOKEN_EXPIRED');
        }

        // Get user data
        const user = await this.userRepository.findById(payload.userId);

        if (!user) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        if (!user.isActive) {
            throw new AppError(403, 'Account is inactive', 'ACCOUNT_INACTIVE');
        }

        // Generate new access token
        const newAccessToken = generateAccessToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        });

        return {
            accessToken: newAccessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.fullName,
                phone: user.phone,
                role: user.role,
                is_active: user.isActive,
                branch: user.branch,
            },
        };
    }

    async logout(refreshToken: string) {
        // Delete refresh token from database
        try {
            await this.tokenRepository.deleteByToken(refreshToken);
        } catch (error) {
            // Token might not exist, but that's okay
        }

        return { message: 'Logged out successfully' };
    }

    async logoutAll(userId: string) {
        // Delete all refresh tokens for user
        await this.tokenRepository.deleteByUserId(userId);

        return { message: 'Logged out from all devices successfully' };
    }

    async getProfile(userId: string) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        return user;
    }
}
