import { CompanySettingController } from '@/controllers/company-setting.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { uploadImage } from '@/middlewares/upload.middleware';
import { validate } from '@/middlewares/validation';
import { updateCompanySettingSchema } from '@/validators/company-setting.validator';
import { Router } from 'express';

const router = Router();
const companySettingController = new CompanySettingController();

// All routes require authentication
router.use(authenticate);

// GET COMPANY SETTING
router.get('/', companySettingController.getSettings);

// UPDATE COMPANY SETTING
router.put(
    '/',
    authorize('ADMIN'),
    uploadImage.single('logo'),
    validate(updateCompanySettingSchema),
    companySettingController.updateSettings
);

export default router;
