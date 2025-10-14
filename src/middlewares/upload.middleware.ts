import { BadRequestError } from '@/utils/errors';
import { Request } from 'express';
import multer from 'multer';

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new BadRequestError(
                'Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed',
                'INVALID_FILE_TYPE'
            )
        );
    }
};

// Configure multer
export const uploadImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 3, // Maximum 3 files
    },
});

// Middleware to handle multer errors
export const handleMulterError = (
    err: any,
    _req: Request,
    _res: any,
    next: any
) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            throw new BadRequestError(
                `File size exceeds maximum limit of 5MB`,
                'FILE_TOO_LARGE'
            );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            throw new BadRequestError(
                `Maximum 3 images allowed per upload`,
                'TOO_MANY_FILES'
            );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            throw new BadRequestError(
                `Unexpected field name`,
                'UNEXPECTED_FIELD'
            );
        }
    }
    next(err);
};
