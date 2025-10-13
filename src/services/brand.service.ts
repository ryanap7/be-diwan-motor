import { BrandRepository } from '@/repositories/brand.repository';
import { AppError } from '@/utils/errors';
import { Prisma } from '@prisma/client';

interface CreateBrandInput {
    name: string;
    description?: string;
    isActive?: boolean;
}

interface UpdateBrandInput {
    name?: string;
    description?: string;
    isActive?: boolean;
}

interface GetBrandsQuery {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    sortBy: 'name' | 'createdAt';
    sortOrder: 'asc' | 'desc';
}

export class BrandService {
    private brandRepository: BrandRepository;

    constructor() {
        this.brandRepository = new BrandRepository();
    }

    async createBrand(data: CreateBrandInput) {
        // Check if brand name already exists
        const existingBrand = await this.brandRepository.findByName(data.name);
        if (existingBrand) {
            throw new AppError(
                409,
                'Brand with this name already exists',
                'BRAND_EXISTS'
            );
        }

        const brand = await this.brandRepository.create({
            name: data.name,
            description: data.description,
            isActive: data.isActive ?? true,
        });

        return brand;
    }

    async getBrands(query: GetBrandsQuery) {
        const {
            page = 1,
            limit = 10,
            search,
            isActive,
            sortBy,
            sortOrder,
        } = query;

        const skip = (page - 1) * limit;

        const where: Prisma.BrandWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const orderByClause: Prisma.BrandOrderByWithRelationInput = {
            [sortBy]: sortOrder,
        };

        const { brands, total } = await this.brandRepository.findMany({
            skip,
            take: limit,
            where,
            orderBy: orderByClause,
        });

        return {
            brands,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getBrandById(id: string) {
        const brand = await this.brandRepository.findById(id);

        if (!brand) {
            throw new AppError(404, 'Brand not found', 'BRAND_NOT_FOUND');
        }

        return brand;
    }

    async updateBrand(id: string, data: UpdateBrandInput) {
        const existingBrand = await this.brandRepository.findById(id);
        if (!existingBrand) {
            throw new AppError(404, 'Brand not found', 'BRAND_NOT_FOUND');
        }

        // Check if new name already exists (if name is being changed)
        if (data.name && data.name !== existingBrand.name) {
            const brandWithName = await this.brandRepository.findByName(
                data.name
            );
            if (brandWithName && brandWithName.id !== id) {
                throw new AppError(
                    409,
                    'Brand with this name already exists',
                    'BRAND_EXISTS'
                );
            }
        }

        const updateData: Prisma.BrandUpdateInput = {
            name: data.name,
            description: data.description,
            isActive: data.isActive,
        };

        const updatedBrand = await this.brandRepository.update(id, updateData);

        return updatedBrand;
    }

    async toggleBrandStatus(id: string, isActive: boolean) {
        const brand = await this.brandRepository.findById(id);
        if (!brand) {
            throw new AppError(404, 'Brand not found', 'BRAND_NOT_FOUND');
        }

        return this.brandRepository.toggleStatus(id, isActive);
    }

    async deleteBrand(id: string) {
        const brand = await this.brandRepository.findById(id);
        if (!brand) {
            throw new AppError(404, 'Brand not found', 'BRAND_NOT_FOUND');
        }

        const hasProducts = await this.brandRepository.hasProducts(id);
        if (hasProducts) {
            throw new AppError(
                400,
                'Cannot delete brand with associated products',
                'HAS_PRODUCTS'
            );
        }

        return this.brandRepository.softDelete(id);
    }
}
