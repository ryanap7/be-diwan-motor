import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';
import { ResponseHandler } from '@/utils/response';
import { LoginInput, RefreshTokenInput } from '@/validators/auth.validator';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    login = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data: LoginInput = req.body;
            // Pass req for activity logging
            const result = await this.authService.login(data, req);

            ResponseHandler.success(res, result, 'Login successful', 200);
        } catch (error) {
            next(error);
        }
    };

    refreshToken = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { refreshToken }: RefreshTokenInput = req.body;
            // Pass req for activity logging
            const result = await this.authService.refreshToken(
                refreshToken,
                req
            );

            ResponseHandler.success(
                res,
                result,
                'Token refreshed successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    };

    logout = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { refreshToken } = req.body;
            // Pass req for activity logging
            const result = await this.authService.logout(refreshToken, req);

            ResponseHandler.success(res, null, result.message, 200);
        } catch (error) {
            next(error);
        }
    };

    logoutAll = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user!.userId;
            // Pass req for activity logging
            const result = await this.authService.logoutAll(userId, req);

            ResponseHandler.success(res, null, result.message, 200);
        } catch (error) {
            next(error);
        }
    };

    getProfile = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const user = await this.authService.getProfile(userId);

            ResponseHandler.success(
                res,
                user,
                'Profile retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    };
}
