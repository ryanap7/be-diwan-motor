import { ActivityLogService } from '@/services/activity-log.service';
import { ActivityLoggerHelper } from '@/utils/activity-logger.helper';
import { NextFunction, Request, Response } from 'express';

const activityLogService = new ActivityLogService();

/**
 * Middleware to automatically log HTTP requests
 * NOTE: This should be placed AFTER authentication middleware in the app
 */
export const activityLogger = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // Skip logging if explicitly set
    if (req.logContext?.skipLogging) {
        next();
        return;
    }

    // Check if route should be logged
    if (!ActivityLoggerHelper.shouldLogRoute(req.path, req.method)) {
        next();
        return;
    }

    // Record start time
    req.startTime = Date.now();

    // Store original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let responseBody: any;
    let responseSent = false;

    // Override res.json to capture response
    res.json = function (body: any) {
        if (!responseSent) {
            responseBody = body;
            responseSent = true;
            logActivity();
        }
        return originalJson(body);
    };

    // Override res.send to capture response
    res.send = function (body: any) {
        if (!responseSent) {
            responseBody = body;
            responseSent = true;
            logActivity();
        }
        return originalSend(body);
    };

    // Function to log activity
    const logActivity = async () => {
        try {
            // Only log if user is authenticated OR it's a login attempt
            const isLoginAttempt = req.path.includes('/auth/login');
            const isAuthenticated = !!req.user;

            if (!isAuthenticated && !isLoginAttempt) {
                return; // Skip logging for unauthenticated requests
            }

            const action = ActivityLoggerHelper.determineAction(
                req.method,
                req.path
            );
            const entityType = ActivityLoggerHelper.determineEntityType(
                req.path
            );

            // Get entity ID from path or response
            let entityId = ActivityLoggerHelper.extractEntityId(req.path);
            let entityName: string | undefined;

            // Try to get entity info from response
            if (responseBody?.data) {
                if (responseBody.data.id) {
                    entityId = responseBody.data.id;
                }
                if (responseBody.data.name) {
                    entityName = responseBody.data.name;
                } else if (responseBody.data.poNumber) {
                    entityName = responseBody.data.poNumber;
                } else if (responseBody.data.username) {
                    entityName = responseBody.data.username;
                } else if (responseBody.data.sku) {
                    entityName = responseBody.data.sku;
                }
            }

            // Use logContext if available
            if (req.logContext) {
                entityId = req.logContext.entityId || entityId;
                entityName = req.logContext.entityName || entityName;
            }

            // Log the activity
            await activityLogService.logActivity(req, action, entityType, {
                entityId,
                entityName,
                beforeData: req.logContext?.beforeData,
                afterData: req.body,
                statusCode: res.statusCode,
                errorMessage:
                    res.statusCode >= 400 ? responseBody?.message : undefined,
                metadata: {
                    duration: req.startTime
                        ? Date.now() - req.startTime
                        : undefined,
                    query: req.query,
                    params: req.params,
                },
            });
        } catch (error) {
            // Silently fail - don't break the request
            console.error('Activity logging failed:', error);
        }
    };

    // Handle response end event as fallback
    res.on('finish', () => {
        if (!responseSent) {
            responseSent = true;
            logActivity();
        }
    });

    next();
};

/**
 * Manual logger for specific actions
 * Use this in services when you need more control
 */
export const manualLog = async (
    req: Request,
    options: {
        action: string;
        entityType: string;
        entityId?: string;
        entityName?: string;
        beforeData?: any;
        afterData?: any;
        description?: string;
    }
): Promise<void> => {
    try {
        await activityLogService.logActivity(
            req,
            options.action as any,
            options.entityType as any,
            {
                entityId: options.entityId,
                entityName: options.entityName,
                beforeData: options.beforeData,
                afterData: options.afterData,
            }
        );
    } catch (error) {
        console.error('Manual activity logging failed:', error);
    }
};
