import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class ImageService {
    private productUploadDir = path.join(process.cwd(), 'uploads', 'products');
    private companyUploadDir = path.join(process.cwd(), 'uploads', 'company');
    private baseUrl = process.env.BASE_URL || 'http://localhost:8000';

    constructor() {
        this.ensureUploadDirs();
    }

    private async ensureUploadDirs() {
        try {
            await fs.access(this.productUploadDir);
        } catch {
            await fs.mkdir(this.productUploadDir, { recursive: true });
        }

        try {
            await fs.access(this.companyUploadDir);
        } catch {
            await fs.mkdir(this.companyUploadDir, { recursive: true });
        }
    }

    /**
     * Process and save product image
     */
    async processAndSaveProductImage(
        buffer: Buffer,
        filename: string
    ): Promise<string> {
        const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(
            filename
        )}`;
        const filepath = path.join(this.productUploadDir, uniqueFilename);

        // Process image with sharp
        await sharp(buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .jpeg({ quality: 90 })
            .toFile(filepath);

        return `${this.baseUrl}/uploads/products/${uniqueFilename}`;
    }

    /**
     * Process and save company logo
     */
    async processAndSaveCompanyLogo(
        buffer: Buffer,
        filename: string
    ): Promise<string> {
        const uniqueFilename = `logo-${uuidv4()}-${Date.now()}${path.extname(
            filename
        )}`;
        const filepath = path.join(this.companyUploadDir, uniqueFilename);

        // Process logo with sharp (smaller size for logo)
        await sharp(buffer)
            .resize(500, 500, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .png({ quality: 90 }) // Use PNG for logo to support transparency
            .toFile(filepath);

        return `${this.baseUrl}/uploads/company/${uniqueFilename}`;
    }

    /**
     * Delete image by URL
     */
    async deleteImage(imageUrl: string): Promise<void> {
        try {
            const filename = path.basename(imageUrl);

            // Check if it's a product or company image
            let filepath: string;
            if (imageUrl.includes('/uploads/products/')) {
                filepath = path.join(this.productUploadDir, filename);
            } else if (imageUrl.includes('/uploads/company/')) {
                filepath = path.join(this.companyUploadDir, filename);
            } else {
                return; // Unknown path, skip deletion
            }

            await fs.unlink(filepath);
        } catch (error) {
            console.error('Error deleting image:', error);
            // Don't throw error if file doesn't exist
        }
    }

    /**
     * Delete multiple images
     */
    async deleteMultipleImages(imageUrls: string[]): Promise<void> {
        await Promise.all(imageUrls.map((url) => this.deleteImage(url)));
    }

    /**
     * Validate image file
     */
    validateImageFile(mimetype: string, size: number): void {
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
        ];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedMimes.includes(mimetype)) {
            throw new Error(
                'Invalid file type. Only JPEG, PNG, and WebP are allowed'
            );
        }

        if (size > maxSize) {
            throw new Error('File size too large. Maximum size is 5MB');
        }
    }
}
