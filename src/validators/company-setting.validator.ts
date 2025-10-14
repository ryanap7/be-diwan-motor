import { z } from 'zod';

// Update Company Settings schema (with form data support)
export const updateCompanySettingSchema = z.object({
    body: z.object({
        companyName: z
            .string()
            .min(1, 'Company name is required')
            .max(200)
            .optional(),
        address: z.string().max(1000).optional(),
        phone: z
            .string()
            .regex(/^[0-9+\-() ]*$/, 'Invalid phone format')
            .max(20)
            .optional(),
        email: z.string().email('Invalid email format').optional(),
        taxNumber: z.string().max(50).optional(),
        currency: z
            .enum(['IDR', 'USD', 'EUR', 'SGD', 'MYR'])
            .default('IDR')
            .optional(),
        timezone: z.string().max(50).optional(),
        dateFormat: z
            .enum([
                'DD/MM/YYYY',
                'MM/DD/YYYY',
                'YYYY-MM-DD',
                'DD-MM-YYYY',
                'MM-DD-YYYY',
            ])
            .optional(),
        settings: z.string().optional(), // JSON string from form data
        removeLogo: z.enum(['true', 'false']).optional(), // Flag to remove logo
    }),
});

export type UpdateCompanySettingInput = z.infer<
    typeof updateCompanySettingSchema
>['body'];
