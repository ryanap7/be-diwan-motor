import { Request, Response, NextFunction } from 'express';
import { AppError, handlePrismaError } from '@/utils/errors';
import { ResponseHandler } from '@/utils/response';
import logger from '@/config/logger';
import { ZodError } from 'zod';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Log error
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const errors = err.issues.reduce(
            (acc, error) => {
                const path = error.path.join('.');
                if (!acc[path]) {
                    acc[path] = [];
                }
                acc[path].push(error.message);
                return acc;
            },
            {} as Record<string, string[]>
        );

        return ResponseHandler.error(
            res,
            'Validation failed',
            422,
            'VALIDATION_ERROR',
            errors
        );
    }

    // Handle AppError (our custom errors)
    if (err instanceof AppError) {
        return ResponseHandler.error(
            res,
            err.message,
            err.statusCode,
            err.code,
            undefined,
            err.stack
        );
    }

    // Handle Prisma errors
    const prismaError = handlePrismaError(err);
    if (prismaError instanceof AppError) {
        return ResponseHandler.error(
            res,
            prismaError.message,
            prismaError.statusCode,
            prismaError.code,
            undefined,
            prismaError.stack
        );
    }

    // Handle unexpected errors
    return ResponseHandler.error(
        res,
        'Internal Server Error',
        500,
        'INTERNAL_ERROR',
        undefined,
        process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
};

// Not found handler
export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    return ResponseHandler.error(
        res,
        `Route ${req.method} ${req.url} not found`,
        404,
        'ROUTE_NOT_FOUND'
    );
};
