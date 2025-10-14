import { Request } from 'express';
import { ActivityAction, EntityType } from '@prisma/client';

interface ActivityLogData {
    userId?: string;
    username: string;
    userRole?: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId?: string;
    entityName?: string;
    description: string;
    beforeData?: any;
    afterData?: any;
    changes?: any;
    method?: string;
    endpoint?: string;
    statusCode?: number;
    ipAddress: string;
    userAgent?: string;
    metadata?: any;
    errorMessage?: string;
}

export class ActivityLoggerHelper {
    /**
     * Get client IP address from request
     */
    static getClientIp(req: Request): string {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0]?.trim() ?? '';
        } else if (
            Array.isArray(forwarded) &&
            forwarded.length > 0 &&
            typeof forwarded[0] === 'string'
        ) {
            return forwarded[0].split(',')[0]?.trim() ?? '';
        }

        // req.socket may be undefined, so check it safely
        const remoteAddress = req.socket?.remoteAddress;
        if (remoteAddress) return remoteAddress;

        if (req.ip) return req.ip;

        return 'unknown';
    }

    /**
     * Get user agent from request
     */
    static getUserAgent(req: Request): string {
        return req.headers['user-agent'] || 'unknown';
    }

    /**
     * Determine action from HTTP method and route
     */
    static determineAction(method: string, path: string): ActivityAction {
        // Authentication routes
        if (path.includes('/auth/login')) return ActivityAction.LOGIN;
        if (path.includes('/auth/logout')) return ActivityAction.LOGOUT;
        if (path.includes('/auth/refresh')) return ActivityAction.REFRESH_TOKEN;

        // Purchase Order specific
        if (path.includes('/submit')) return ActivityAction.SUBMIT_PO;
        if (path.includes('/approve')) return ActivityAction.APPROVE_PO;
        if (path.includes('/receive')) return ActivityAction.RECEIVE_PO;
        if (path.includes('/cancel')) return ActivityAction.CANCEL_PO;

        // Branch specific
        if (path.includes('/activate')) return ActivityAction.ACTIVATE_BRANCH;
        if (path.includes('/deactivate'))
            return ActivityAction.DEACTIVATE_BRANCH;

        // Stock operations
        if (path.includes('/stock/in')) return ActivityAction.STOCK_IN;
        if (path.includes('/stock/out')) return ActivityAction.STOCK_OUT;
        if (path.includes('/stock/transfer'))
            return ActivityAction.STOCK_TRANSFER;
        if (path.includes('/stock/adjustment'))
            return ActivityAction.STOCK_ADJUSTMENT;

        // Generic CRUD
        switch (method) {
            case 'POST':
                return ActivityAction.CREATE;
            case 'GET':
                return ActivityAction.READ;
            case 'PUT':
            case 'PATCH':
                return ActivityAction.UPDATE;
            case 'DELETE':
                return ActivityAction.DELETE;
            default:
                return ActivityAction.READ;
        }
    }

    /**
     * Determine entity type from route
     */
    static determineEntityType(path: string): EntityType {
        if (path.includes('/auth')) return EntityType.AUTHENTICATION;
        if (path.includes('/users')) return EntityType.USER;
        if (path.includes('/branches')) return EntityType.BRANCH;
        if (path.includes('/products')) return EntityType.PRODUCT;
        if (path.includes('/categories')) return EntityType.CATEGORY;
        if (path.includes('/brands')) return EntityType.BRAND;
        if (path.includes('/purchase-orders')) return EntityType.PURCHASE_ORDER;
        if (path.includes('/suppliers')) return EntityType.SUPPLIER;
        if (path.includes('/customers')) return EntityType.CUSTOMER;
        if (path.includes('/stocks')) return EntityType.STOCK;
        if (path.includes('/stock-movements')) return EntityType.STOCK_MOVEMENT;

        return EntityType.AUTHENTICATION;
    }

    /**
     * Generate human-readable description in English
     */
    static generateDescription(
        action: ActivityAction,
        entityType: EntityType,
        entityName?: string,
        username?: string
    ): string {
        const entity = entityName || entityType.toLowerCase();
        const user = username || 'User';

        const descriptions: Record<ActivityAction, string> = {
            LOGIN: `${user} successfully logged in`,
            LOGOUT: `${user} logged out`,
            REFRESH_TOKEN: `${user} refreshed the access token`,
            CREATE: `${user} created ${entity}`,
            READ: `${user} viewed ${entity}`,
            UPDATE: `${user} updated ${entity}`,
            DELETE: `${user} deleted ${entity}`,
            SUBMIT_PO: `${user} submitted purchase order ${entity}`,
            APPROVE_PO: `${user} approved purchase order ${entity}`,
            RECEIVE_PO: `${user} received items for purchase order ${entity}`,
            CANCEL_PO: `${user} canceled purchase order ${entity}`,
            STOCK_IN: `${user} added stock for ${entity}`,
            STOCK_OUT: `${user} deducted stock for ${entity}`,
            STOCK_TRANSFER: `${user} transferred stock for ${entity}`,
            STOCK_ADJUSTMENT: `${user} adjusted stock for ${entity}`,
            ACTIVATE_BRANCH: `${user} activated branch ${entity}`,
            DEACTIVATE_BRANCH: `${user} deactivated branch ${entity}`,
            CLOSE_BRANCH: `${user} closed branch ${entity}`,
            UPDATE_PROMO: `${user} updated promotion ${entity}`,
            ACTIVATE_PRODUCT: `${user} activated product ${entity}`,
            DEACTIVATE_PRODUCT: `${user} deactivated product ${entity}`,
            IMPORT: `${user} imported data for ${entity}`,
            EXPORT: `${user} exported data for ${entity}`,
            BULK_UPDATE: `${user} performed bulk update on ${entity}`,
            BULK_DELETE: `${user} performed bulk delete on ${entity}`,
        };

        return (
            descriptions[action] ||
            `${user} performed ${action.toLowerCase()} on ${entity}`
        );
    }

    /**
     * Calculate changes between before and after data
     */
    static calculateChanges(before: any, after: any): any {
        if (!before || !after) return null;

        const changes: any = {};

        for (const key in after) {
            if (after[key] !== before[key]) {
                changes[key] = {
                    from: before[key],
                    to: after[key],
                };
            }
        }

        return Object.keys(changes).length > 0 ? changes : null;
    }

    /**
     * Sanitize sensitive data before logging
     */
    static sanitizeData(data: any): any {
        if (!data) return null;

        const sensitiveFields = [
            'password',
            'token',
            'refreshToken',
            'accessToken',
            'secret',
            'apiKey',
            'creditCard',
            'cvv',
        ];

        const sanitized = { ...data };

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    /**
     * Check if route should be logged
     */
    static shouldLogRoute(path: string, method: string): boolean {
        // Skip logging for these routes
        const skipRoutes = [
            '/health',
            '/metrics',
            '/favicon.ico',
            '/activity-logs', // Don't log activity log queries
        ];

        // Skip GET requests to list endpoints (optional, can be enabled)
        const skipGetLists: any[] = [
            // '/api/products',
            // '/api/categories',
        ];

        if (skipRoutes.some((route) => path.includes(route))) {
            return false;
        }

        if (method === 'GET' && skipGetLists.some((route) => path === route)) {
            return false;
        }

        return true;
    }

    /**
     * Extract entity ID from path
     */
    static extractEntityId(path: string): string | undefined {
        // Match UUID pattern in path
        const uuidPattern =
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = path.match(uuidPattern);
        return match ? match[0] : undefined;
    }

    /**
     * Format duration in ms
     */
    static formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }

    /**
     * Prepare activity log data
     */
    static prepareLogData(
        req: Request,
        action: ActivityAction,
        entityType: EntityType,
        options: {
            entityId?: string;
            entityName?: string;
            beforeData?: any;
            afterData?: any;
            statusCode?: number;
            errorMessage?: string;
            metadata?: any;
        } = {}
    ): ActivityLogData {
        const username = req.user?.username || 'System';
        const description = this.generateDescription(
            action,
            entityType,
            options.entityName,
            username
        );

        const changes = this.calculateChanges(
            options.beforeData,
            options.afterData
        );

        return {
            userId: req.user?.userId,
            username,
            userRole: req.user?.role,
            action,
            entityType,
            entityId: options.entityId,
            entityName: options.entityName,
            description,
            beforeData: this.sanitizeData(options.beforeData),
            afterData: this.sanitizeData(options.afterData),
            changes,
            method: req.method,
            endpoint: req.originalUrl,
            statusCode: options.statusCode,
            ipAddress: this.getClientIp(req),
            userAgent: this.getUserAgent(req),
            metadata: options.metadata,
            errorMessage: options.errorMessage,
        };
    }
}
