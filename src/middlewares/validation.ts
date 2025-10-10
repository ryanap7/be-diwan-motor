import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ResponseHandler } from '@/utils/response';

export const validate =
    (schema: ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.reduce(
                    (acc, err) => {
                        const path = err.path.slice(1).join('.');
                        if (!acc[path]) {
                            acc[path] = [];
                        }
                        acc[path].push(err.message);
                        return acc;
                    },
                    {} as Record<string, string[]>
                );

                ResponseHandler.error(
                    res,
                    'Validation failed',
                    422,
                    'VALIDATION_ERROR',
                    errors
                );
                return;
            }
            next(error);
        }
    };
