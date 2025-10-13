import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import branchRoutes from './branch.routes';
import categoryRoutes from './category.routes';
import brandRoutes from './brand.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

// Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);

export default router;
