import { Response } from 'express';

interface SuccessResponse<T = unknown> {
    success: true;
    message: string;
    data: T;
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

interface ErrorResponse {
    success: false;
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
    meta?: {
        timestamp: string;
        requestId?: string;
    };
    stack?: string;
}

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface PaginatedResponse<T = unknown> {
    success: true;
    message: string;
    data: T;
    pagination: PaginationMeta;
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

export class ResponseHandler {
    static success<T>(
        res: Response,
        data: T,
        message = 'Success',
        statusCode = 200
    ): Response<SuccessResponse<T>> {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    static created<T>(
        res: Response,
        data: T,
        message = 'Resource created successfully'
    ): Response<SuccessResponse<T>> {
        return this.success(res, data, message, 201);
    }

    static noContent(res: Response): Response {
        return res.status(204).send();
    }

    static paginated<T>(
        res: Response,
        data: T,
        pagination: PaginationMeta,
        message = 'Success'
    ): Response<PaginatedResponse<T>> {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination,
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    static error(
        res: Response,
        message: string,
        statusCode = 500,
        code?: string,
        errors?: Record<string, string[]>,
        stack?: string
    ): Response<ErrorResponse> {
        const response: ErrorResponse = {
            success: false,
            message,
            meta: {
                timestamp: new Date().toISOString(),
            },
        };

        if (code) response.code = code;
        if (errors) response.errors = errors;
        if (stack && process.env.NODE_ENV === 'development') {
            response.stack = stack;
        }

        return res.status(statusCode).json(response);
    }
}
