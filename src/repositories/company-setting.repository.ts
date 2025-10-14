import prisma from '@/config/database';

interface UpdateCompanySettingData {
    companyName?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
    logoUrl?: string;
    currency?: string;
    timezone?: string;
    dateFormat?: string;
    settings?: any;
}

export class CompanySettingRepository {
    /**
     * Get company settings (singleton)
     */
    async getSettings() {
        // Try to get the first (and should be only) record
        let settings = await prisma.companySetting.findFirst();

        // If no settings exist, create default ones
        if (!settings) {
            settings = await this.createDefaultSettings();
        }

        return settings;
    }

    /**
     * Create default settings
     */
    async createDefaultSettings() {
        return prisma.companySetting.create({
            data: {
                companyName: 'Motorbike POS',
                address: '',
                phone: '',
                email: '',
                currency: 'IDR',
                timezone: 'Asia/Jakarta',
                dateFormat: 'DD/MM/YYYY',
            },
        });
    }

    /**
     * Update company settings
     */
    async updateSettings(data: UpdateCompanySettingData) {
        // Get existing settings
        const existing = await this.getSettings();

        // Update the settings
        return prisma.companySetting.update({
            where: { id: existing.id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Check if settings exist
     */
    async exists(): Promise<boolean> {
        const count = await prisma.companySetting.count();
        return count > 0;
    }
}
