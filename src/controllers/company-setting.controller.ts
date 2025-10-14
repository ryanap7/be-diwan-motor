import { CompanySettingService } from '@/services/company-setting.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class CompanySettingController {
    private companySettingService: CompanySettingService;

    constructor() {
        this.companySettingService = new CompanySettingService();
    }

    /**
     * Get company settings
     */
    getSettings = async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const settings = await this.companySettingService.getSettings();

            ResponseHandler.success(
                res,
                settings,
                'Company settings retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update company settings (with form data & logo upload)
     */
    updateSettings = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;
            const logoFile = req.file; // from multer

            const settings = await this.companySettingService.updateSettings(
                data,
                logoFile
            );

            ResponseHandler.success(
                res,
                settings,
                'Company settings updated successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
