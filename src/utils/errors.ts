import {
    PrismaClientKnownRequestError,
    PrismaClientValidationError,
    PrismaClientRustPanicError,
    PrismaClientInitializationError,
} from '@prisma/client/runtime/library';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string,
        public isOperational = true
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad Request', code?: string) {
        super(400, message, code);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code?: string) {
        super(401, message, code);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code?: string) {
        super(403, message, code);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code?: string) {
        super(404, message, code);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Conflict', code?: string) {
        super(409, message, code);
    }
}

export class ValidationError extends AppError {
    constructor(
        message = 'Validation failed',
        public errors?: Record<string, string[]>
    ) {
        super(422, message, 'VALIDATION_ERROR');
    }
}

export class InternalServerError extends AppError {
    constructor(message = 'Internal Server Error', code?: string) {
        super(500, message, code);
    }
}

// Handle Prisma errors
export const handlePrismaError = (error: unknown): AppError => {
    if (error instanceof PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                const target = error.meta?.target as string[] | undefined;
                const field = target?.[0] || 'field';
                return new ConflictError(
                    `${field} already exists`,
                    'DUPLICATE_FIELD'
                );

            case 'P2025':
                // Record not found
                return new NotFoundError(
                    'Record not found',
                    'RECORD_NOT_FOUND'
                );

            case 'P2003':
                // Foreign key constraint failed
                return new BadRequestError(
                    'Foreign key constraint failed',
                    'FOREIGN_KEY_ERROR'
                );

            case 'P2014':
                // Relation violation
                return new BadRequestError(
                    'Invalid relation data',
                    'RELATION_ERROR'
                );

            case 'P2016':
                // Query interpretation error
                return new BadRequestError(
                    'Query interpretation error',
                    'QUERY_ERROR'
                );

            case 'P2021':
                // Table does not exist
                return new InternalServerError(
                    'Database table does not exist',
                    'TABLE_NOT_FOUND'
                );

            case 'P2022':
                // Column does not exist
                return new InternalServerError(
                    'Database column does not exist',
                    'COLUMN_NOT_FOUND'
                );

            default:
                return new InternalServerError(
                    'Database operation failed',
                    'DATABASE_ERROR'
                );
        }
    }

    if (error instanceof PrismaClientValidationError) {
        return new BadRequestError('Invalid data provided', 'VALIDATION_ERROR');
    }

    if (error instanceof PrismaClientRustPanicError) {
        return new InternalServerError(
            'Database panic error',
            'DATABASE_PANIC'
        );
    }

    if (error instanceof PrismaClientInitializationError) {
        return new InternalServerError(
            'Database connection failed',
            'DATABASE_CONNECTION_ERROR'
        );
    }

    // If not a Prisma error, return as internal server error
    if (error instanceof Error) {
        return new InternalServerError(error.message);
    }

    return new InternalServerError('An unexpected error occurred');
};
