import { UserRole } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                username: string;
                email: string;
                role: UserRole;
                branchId?: string;
            };
            // For activity logging
            startTime?: number;
            logContext?: {
                entityType?: string;
                entityId?: string;
                entityName?: string;
                beforeData?: any;
                skipLogging?: boolean;
            };
        }
    }
}

export {};
