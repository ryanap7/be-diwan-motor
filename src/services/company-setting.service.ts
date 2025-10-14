import { CompanySettingRepository } from '@/repositories/company-setting.repository';
import { ImageService } from '@/services/image.service';
import type { UpdateCompanySettingInput } from '@/validators/company-setting.validator';

export class CompanySettingService {
    private companySettingRepository: CompanySettingRepository;
    private imageService: ImageService;

    constructor() {
        this.companySettingRepository = new CompanySettingRepository();
        this.imageService = new ImageService();
    }

    /**
     * Get company settings
     */
    async getSettings() {
        return this.companySettingRepository.getSettings();
    }

    /**
     * Update company settings (with optional logo upload)
     */
    async updateSettings(
        data: UpdateCompanySettingInput,
        logoFile?: Express.Multer.File
    ) {
        // Get existing settings
        const existingSettings =
            await this.companySettingRepository.getSettings();

        // Prepare update data
        const updateData: any = {};

        // Handle text fields
        if (data.companyName) updateData.companyName = data.companyName;
        if (data.address) updateData.address = data.address;
        if (data.phone) updateData.phone = data.phone;
        if (data.email) updateData.email = data.email;
        if (data.taxNumber !== undefined) updateData.taxNumber = data.taxNumber;
        if (data.currency) updateData.currency = data.currency;
        if (data.timezone) updateData.timezone = data.timezone;
        if (data.dateFormat) updateData.dateFormat = data.dateFormat;

        // Handle settings JSON
        if (data.settings) {
            try {
                updateData.settings = JSON.parse(data.settings);
            } catch (error) {
                // If not valid JSON, ignore
            }
        }

        // Handle logo removal
        if (data.removeLogo === 'true' && existingSettings.logoUrl) {
            await this.imageService.deleteImage(existingSettings.logoUrl);
            updateData.logoUrl = null;
        }

        // Handle logo upload
        if (logoFile) {
            // Validate file
            this.imageService.validateImageFile(
                logoFile.mimetype,
                logoFile.size
            );

            // Delete old logo if exists
            if (existingSettings.logoUrl) {
                await this.imageService.deleteImage(existingSettings.logoUrl);
            }

            // Upload new logo
            const logoUrl = await this.imageService.processAndSaveCompanyLogo(
                logoFile.buffer,
                logoFile.originalname
            );

            updateData.logoUrl = logoUrl;
        }

        // Update settings
        return this.companySettingRepository.updateSettings(updateData);
    }

    /**
     * Initialize default settings if not exists
     */
    async initializeSettings() {
        const exists = await this.companySettingRepository.exists();
        if (!exists) {
            return this.companySettingRepository.createDefaultSettings();
        }
        return this.companySettingRepository.getSettings();
    }
}
