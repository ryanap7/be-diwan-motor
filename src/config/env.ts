import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    // Application
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: z.string().default('8000').transform(Number),
    APP_NAME: z.string().default('HD MOTOPART Inventory API'),
    API_VERSION: z.string().default('v1'),

    // Database
    DATABASE_URL: z.string().url(),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // CORS
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FILE: z.string().default('logs/app.log'),

    // Pagination
    DEFAULT_PAGE_SIZE: z.string().default('20').transform(Number),
    MAX_PAGE_SIZE: z.string().default('100').transform(Number),
});

// Validate environment variables
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Invalid environment variables:');
            console.error(JSON.stringify(error.issues, null, 2));
            process.exit(1);
        }
        throw error;
    }
};

export const env = parseEnv();

// Export typed environment config
export const config = {
    app: {
        env: env.NODE_ENV,
        port: env.PORT,
        name: env.APP_NAME,
        apiVersion: env.API_VERSION,
    },
    database: {
        url: env.DATABASE_URL,
    },
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshSecret: env.JWT_REFRESH_SECRET,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    cors: {
        allowedOrigins: env.ALLOWED_ORIGINS.split(','),
    },
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    logging: {
        level: env.LOG_LEVEL,
        file: env.LOG_FILE,
    },
    pagination: {
        defaultPageSize: env.DEFAULT_PAGE_SIZE,
        maxPageSize: env.MAX_PAGE_SIZE,
    },
} as const;
