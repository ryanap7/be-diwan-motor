import routes from '@/routes';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import { config } from './config/env';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import path from 'path';

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

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
