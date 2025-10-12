import { verifyAccessToken } from '@/utils/auth';
import { ResponseHandler } from '@/utils/response';
import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            ResponseHandler.error(
                res,
                'Access token is required',
                401,
                'NO_TOKEN'
            );
            return;
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error) {
        ResponseHandler.error(
            res,
            'Invalid or expired token',
            401,
            'INVALID_TOKEN'
        );
        return;
    }
};

export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            ResponseHandler.error(res, 'Unauthorized', 401, 'UNAUTHORIZED');
            return;
        }

        if (!allowedRoles.includes(req.user.role as UserRole)) {
            ResponseHandler.error(
                res,
                'You do not have permission to access this resource',
                403,
                'FORBIDDEN'
            );
            return;
        }

        next();
    };
};
