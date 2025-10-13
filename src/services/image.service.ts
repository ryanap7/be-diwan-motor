import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class ImageService {
    private uploadDir = path.join(process.cwd(), 'uploads', 'products');
    private baseUrl = process.env.BASE_URL || 'http://localhost:8000';

    constructor() {
        this.ensureUploadDir();
    }

    private async ensureUploadDir() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    async processAndSaveImage(
        buffer: Buffer,
        filename: string
    ): Promise<string> {
        const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(
            filename
        )}`;
        const filepath = path.join(this.uploadDir, uniqueFilename);

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

    async deleteImage(imageUrl: string): Promise<void> {
        try {
            const filename = path.basename(imageUrl);
            const filepath = path.join(this.uploadDir, filename);
            await fs.unlink(filepath);
        } catch (error) {
            console.error('Error deleting image:', error);
            // Don't throw error if file doesn't exist
        }
    }

    async deleteMultipleImages(imageUrls: string[]): Promise<void> {
        await Promise.all(imageUrls.map((url) => this.deleteImage(url)));
    }
}
