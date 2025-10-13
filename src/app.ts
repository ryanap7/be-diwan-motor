import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';
import logger from './config/logger';
import cookieParser from 'cookie-parser';
import routes from '@/routes';

// Create Express app
const app: Application = express();

// Security middlewares
app.use(helmet());
app.use(
    cors({
        origin: config.cors.allowedOrigins,
        credentials: true,
    })
);

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Rate limiting
// app.use(generalLimiter);

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// API Routes
app.use('/api', routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
