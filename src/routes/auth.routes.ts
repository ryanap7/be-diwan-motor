import { AuthController } from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { authLimiter } from '@/middlewares/rateLimiter';
import { validate } from '@/middlewares/validation';
import { loginSchema, refreshTokenSchema } from '@/validators/auth.validator';
import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login - Login
router.post(
    '/login',
    authLimiter,
    validate(z.object({ body: loginSchema })),
    authController.login
);

// POST /api/auth/refresh - Refresh access token
router.post(
    '/refresh',
    validate(z.object({ body: refreshTokenSchema })),
    authController.refreshToken
);

// POST /api/auth/logout - Logout (delete refresh token)
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/logout-all - Logout from all devices
router.post('/logout-all', authenticate, authController.logoutAll);

// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticate, authController.getProfile);

export default router;
