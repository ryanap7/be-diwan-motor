import { Router } from 'express';
import activityLogRoutes from './activity-log.routes';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import brandRoutes from './brand.routes';
import categoryRoutes from './category.routes';
import settingRoutes from './company-setting.routes';
import customerRoutes from './customer.routes';
import productRoutes from './product.routes';
import purchaseOrderRoutes from './purchase-order.routes';
import stockRoutes from './stock.routes';
import supplierRoutes from './supplier.routes';
import transactionRoutes from './transaction.routes';
import userRoutes from './user.routes';

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
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/stocks', stockRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/settings', settingRoutes);
router.use('/transactions', transactionRoutes);

export default router;
