import { UserRepository } from '@/repositories/user.repository';
import { TokenRepository } from '@/repositories/token.repository';
import { ActivityLogRepository } from '@/repositories/activity-log.repository';
import { comparePassword } from '@/utils/auth';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    JWTPayload,
} from '@/utils/auth';
import { AppError } from '@/utils/errors';
import { ActivityLoggerHelper } from '@/utils/activity-logger.helper';
import { LoginInput } from '@/validators/auth.validator';
import { ActivityAction, EntityType } from '@prisma/client';
import { Request } from 'express';

export class AuthService {
    private userRepository: UserRepository;
    private tokenRepository: TokenRepository;
    private activityLogRepository: ActivityLogRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.tokenRepository = new TokenRepository();
        this.activityLogRepository = new ActivityLogRepository();
    }

    async login(data: LoginInput, req: Request) {
        let username = data.username;
        let userId: string | undefined;

        try {
            // Find user by username
            const user = await this.userRepository.findByUsername(
                data.username
            );

            if (!user) {
                // Log failed login - user not found
                await this.logFailedLogin(username, 'User not found', req);
                throw new AppError(
                    401,
                    'Invalid username or password',
                    'INVALID_CREDENTIALS'
                );
            }

            username = user.username;
            userId = user.id;

            // Check if user is active
            if (!user.isActive) {
                // Log failed login - inactive account
                await this.logFailedLogin(
                    username,
                    'Account is inactive',
                    req,
                    userId
                );
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
                // Log failed login - wrong password
                await this.logFailedLogin(
                    username,
                    'Invalid password',
                    req,
                    userId
                );
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
                    // Log failed login - no branch
                    await this.logFailedLogin(
                        username,
                        'User has not been assigned to any branch',
                        req,
                        userId
                    );
                    throw new AppError(
                        403,
                        'User has not been assigned to any branch. Please contact administrator',
                        'BRANCH_NOT_ASSIGNED'
                    );
                }

                // Check if branch is active
                if (!user.branch.isActive) {
                    // Log failed login - inactive branch
                    await this.logFailedLogin(
                        username,
                        'Branch is inactive',
                        req,
                        userId
                    );
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
                branchId: user.branch?.id ?? null,
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

            // ✅ LOG SUCCESSFUL LOGIN
            await this.logSuccessfulLogin(user, req);

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
        } catch (error) {
            // Re-throw AppError
            throw error;
        }
    }

    async refreshToken(refreshToken: string, req: Request) {
        try {
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
                throw new AppError(
                    401,
                    'Refresh token expired',
                    'TOKEN_EXPIRED'
                );
            }

            // Get user data
            const user = await this.userRepository.findById(payload.userId);

            if (!user) {
                throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
            }

            if (!user.isActive) {
                throw new AppError(
                    403,
                    'Account is inactive',
                    'ACCOUNT_INACTIVE'
                );
            }

            // Generate new access token
            const newAccessToken = generateAccessToken({
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                branchId: user.branch?.id ?? null,
            });

            // ✅ LOG REFRESH TOKEN
            await this.logRefreshToken(user, req);

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
        } catch (error) {
            throw error;
        }
    }

    async logout(refreshToken: string, req: Request) {
        try {
            // Get user info before deleting token
            let user;
            try {
                const payload = verifyRefreshToken(refreshToken);
                user = await this.userRepository.findById(payload.userId);
            } catch (error) {
                // Token might be invalid, but we still want to attempt logout
            }

            // Delete refresh token from database
            await this.tokenRepository.deleteByToken(refreshToken);

            // ✅ LOG LOGOUT
            if (user) {
                await this.logLogout(user, req);
            }

            return { message: 'Logged out successfully' };
        } catch (error) {
            // Token might not exist, but that's okay
            return { message: 'Logged out successfully' };
        }
    }

    async logoutAll(userId: string, req: Request) {
        // Get user info
        const user = await this.userRepository.findById(userId);

        // Delete all refresh tokens for user
        await this.tokenRepository.deleteByUserId(userId);

        // ✅ LOG LOGOUT ALL
        if (user) {
            await this.logLogoutAll(user, req);
        }

        return { message: 'Logged out from all devices successfully' };
    }

    async getProfile(userId: string) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        return user;
    }

    // ============================================
    // PRIVATE LOGGING METHODS
    // ============================================

    /**
     * Log successful login
     */
    private async logSuccessfulLogin(user: any, req: Request): Promise<void> {
        try {
            const logData = {
                userId: user.id,
                username: user.username,
                userRole: user.role,
                action: ActivityAction.LOGIN,
                entityType: EntityType.AUTHENTICATION,
                entityId: user.id,
                entityName: user.username,
                description: `User ${user.username} successfully logged in`,
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                ipAddress: ActivityLoggerHelper.getClientIp(req),
                userAgent: ActivityLoggerHelper.getUserAgent(req),
                metadata: {
                    success: true,
                    role: user.role,
                    branchId: user.branchId,
                    branchName: user.branch?.name,
                },
            };

            await this.activityLogRepository.create(logData);
        } catch (error) {
            console.error('Failed to log successful login:', error);
        }
    }

    /**
     * Log failed login attempt
     */
    private async logFailedLogin(
        username: string,
        reason: string,
        req: Request,
        userId?: string
    ): Promise<void> {
        try {
            const logData = {
                userId: userId,
                username: username,
                userRole: undefined,
                action: ActivityAction.LOGIN,
                entityType: EntityType.AUTHENTICATION,
                entityId: userId,
                entityName: username,
                description: `Login attempt failed for user ${username}`,
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 401,
                ipAddress: ActivityLoggerHelper.getClientIp(req),
                userAgent: ActivityLoggerHelper.getUserAgent(req),
                errorMessage: reason,
                metadata: {
                    success: false,
                    reason: reason,
                },
            };

            await this.activityLogRepository.create(logData);
        } catch (error) {
            console.error('Failed to log failed login:', error);
        }
    }

    /**
     * Log refresh token action
     */
    private async logRefreshToken(user: any, req: Request): Promise<void> {
        try {
            const logData = {
                userId: user.id,
                username: user.username,
                userRole: user.role,
                action: ActivityAction.REFRESH_TOKEN,
                entityType: EntityType.AUTHENTICATION,
                entityId: user.id,
                entityName: user.username,
                description: `User ${user.username} refreshed the access token`,
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                ipAddress: ActivityLoggerHelper.getClientIp(req),
                userAgent: ActivityLoggerHelper.getUserAgent(req),
                metadata: {
                    role: user.role,
                    branchId: user.branchId,
                },
            };

            await this.activityLogRepository.create(logData);
        } catch (error) {
            console.error('Failed to log refresh token:', error);
        }
    }

    /**
     * Log logout action
     */
    private async logLogout(user: any, req: Request): Promise<void> {
        try {
            const logData = {
                userId: user.id,
                username: user.username,
                userRole: user.role,
                action: ActivityAction.LOGOUT,
                entityType: EntityType.AUTHENTICATION,
                entityId: user.id,
                entityName: user.username,
                description: `User ${user.username} logged out`,
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                ipAddress: ActivityLoggerHelper.getClientIp(req),
                userAgent: ActivityLoggerHelper.getUserAgent(req),
                metadata: {
                    role: user.role,
                    branchId: user.branchId,
                },
            };

            await this.activityLogRepository.create(logData);
        } catch (error) {
            console.error('Failed to log logout:', error);
        }
    }

    /**
     * Log logout all devices action
     */
    private async logLogoutAll(user: any, req: Request): Promise<void> {
        try {
            const logData = {
                userId: user.id,
                username: user.username,
                userRole: user.role,
                action: ActivityAction.LOGOUT,
                entityType: EntityType.AUTHENTICATION,
                entityId: user.id,
                entityName: user.username,
                description: `User ${user.username} logged out from all devices`,
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                ipAddress: ActivityLoggerHelper.getClientIp(req),
                userAgent: ActivityLoggerHelper.getUserAgent(req),
                metadata: {
                    role: user.role,
                    branchId: user.branchId,
                    logoutAll: true,
                },
            };

            await this.activityLogRepository.create(logData);
        } catch (error) {
            console.error('Failed to log logout all:', error);
        }
    }
}
