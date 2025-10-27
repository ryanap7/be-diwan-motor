import { CategoryRepository } from '@/repositories/category.repository';
import { AppError } from '@/utils/errors';
import type {
    CreateCategoryInput,
    GetCategoriesQuery,
    UpdateCategoryInput,
} from '@/validators/category.validator';
import { Prisma } from '@prisma/client';

export class CategoryService {
    private categoryRepository: CategoryRepository;

    constructor() {
        this.categoryRepository = new CategoryRepository();
    }

    private generateSlug(name: string): string {
        const baseSlug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        const timestamp = Date.now();

        return `${baseSlug}-${timestamp}`;
    }

    async createCategory(data: CreateCategoryInput) {
        // Generate slug from name
        const slug = this.generateSlug(data.name);

        // Check if slug already exists
        const existingCategory = await this.categoryRepository.findBySlug(slug);
        if (existingCategory) {
            throw new AppError(
                409,
                'Category with this name already exists',
                'CATEGORY_EXISTS'
            );
        }

        // Validate parent category if provided
        if (data.parentId) {
            const parentCategory = await this.categoryRepository.findById(
                data.parentId
            );
            if (!parentCategory) {
                throw new AppError(
                    404,
                    'Parent category not found',
                    'PARENT_NOT_FOUND'
                );
            }

            if (!parentCategory.isActive) {
                throw new AppError(
                    400,
                    'Parent category is not active',
                    'PARENT_INACTIVE'
                );
            }
        }

        // Create category
        const category = await this.categoryRepository.create({
            name: data.name,
            slug,
            description: data.description,
            parent: data.parentId
                ? { connect: { id: data.parentId } }
                : undefined,
            sortOrder: data.sortOrder ?? 0,
            isActive: data.isActive ?? true,
        });

        return category;
    }

    async getCategories(query: GetCategoriesQuery) {
        const {
            page = 1,
            limit = 10,
            search,
            isActive,
            sortBy,
            sortOrder,
        } = query;

        const skip = (page - 1) * limit;

        // Build where clause - hanya ambil parent categories (yang tidak punya parent)
        const where: Prisma.CategoryWhereInput = {
            parentId: null,
        };

        // Search by name
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filter by status
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Build orderBy
        const orderByClause: Prisma.CategoryOrderByWithRelationInput = {
            [sortBy]: sortOrder,
        };

        // Ambil parent categories dengan children-nya
        const { categories, total } = await this.categoryRepository.findMany({
            skip,
            take: Number(limit),
            where,
            orderBy: orderByClause,
            include: {
                children: {
                    where: isActive !== undefined ? { isActive } : undefined,
                    orderBy: orderByClause,
                },
            },
        });

        return {
            categories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getRootCategories() {
        return this.categoryRepository.findRootCategories();
    }

    async getCategoryById(id: string) {
        const category = await this.categoryRepository.findById(id);

        if (!category) {
            throw new AppError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
        }

        return category;
    }

    async updateCategory(id: string, data: UpdateCategoryInput) {
        // Check if category exists
        const existingCategory = await this.categoryRepository.findById(id);
        if (!existingCategory) {
            throw new AppError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
        }

        // Check circular reference if parentId is being updated
        if (data.parentId !== undefined) {
            if (data.parentId === id) {
                throw new AppError(
                    400,
                    'Category cannot be its own parent',
                    'CIRCULAR_REFERENCE'
                );
            }

            if (data.parentId) {
                // Check if new parent exists
                const parentCategory = await this.categoryRepository.findById(
                    data.parentId
                );
                if (!parentCategory) {
                    throw new AppError(
                        404,
                        'Parent category not found',
                        'PARENT_NOT_FOUND'
                    );
                }

                // Check if the new parent is actually a child of this category
                const isChild = await this.isDescendant(data.parentId, id);
                if (isChild) {
                    throw new AppError(
                        400,
                        'Parent category cannot be a descendant of this category',
                        'CIRCULAR_REFERENCE'
                    );
                }
            }
        }

        // Generate new slug if name is changed
        let slug = existingCategory.slug;
        if (data.name && data.name !== existingCategory.name) {
            slug = this.generateSlug(data.name);

            // Check if new slug already exists
            const categoryWithSlug =
                await this.categoryRepository.findBySlug(slug);
            if (categoryWithSlug && categoryWithSlug.id !== id) {
                throw new AppError(
                    409,
                    'Category with this name already exists',
                    'CATEGORY_EXISTS'
                );
            }
        }

        // Build update data with proper Prisma relation syntax
        const updateData: Prisma.CategoryUpdateInput = {
            name: data.name,
            slug: data.name ? slug : undefined,
            description: data.description,
            sortOrder: data.sortOrder,
            isActive: data.isActive,
        };

        // Handle parent relationship
        if (data.parentId !== undefined) {
            if (data.parentId === null) {
                updateData.parent = { disconnect: true };
            } else {
                updateData.parent = { connect: { id: data.parentId } };
            }
        }

        // Update category
        const updatedCategory = await this.categoryRepository.update(
            id,
            updateData
        );

        return updatedCategory;
    }

    async toggleCategoryStatus(id: string, isActive: boolean) {
        // Check if category exists
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw new AppError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
        }

        // If deactivating, warn about children
        if (!isActive) {
            const hasChildren = await this.categoryRepository.hasChildren(id);
            if (hasChildren) {
                throw new AppError(
                    400,
                    'Cannot deactivate category with active sub-categories',
                    'HAS_ACTIVE_CHILDREN'
                );
            }
        }

        return this.categoryRepository.toggleStatus(id, isActive);
    }

    async deleteCategory(id: string, cascade: boolean = false) {
        // Check if category exists
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw new AppError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
        }

        // Check if category has products
        const hasProducts = await this.categoryRepository.hasProducts(id);
        if (hasProducts) {
            throw new AppError(
                400,
                'Cannot delete category with associated products',
                'HAS_PRODUCTS'
            );
        }

        // Check if category has children
        const hasChildren = await this.categoryRepository.hasChildren(id);
        if (hasChildren && !cascade) {
            throw new AppError(
                400,
                'Cannot delete category with sub-categories. Use cascade=true parameter to delete all sub-categories',
                'HAS_CHILDREN'
            );
        }

        // Delete category
        if (cascade && hasChildren) {
            return this.categoryRepository.softDeleteWithChildren(id);
        }

        return this.categoryRepository.softDelete(id);
    }

    private async isDescendant(
        childId: string,
        ancestorId: string
    ): Promise<boolean> {
        const child = await this.categoryRepository.findById(childId);
        if (!child || !child.parentId) {
            return false;
        }

        if (child.parentId === ancestorId) {
            return true;
        }

        return this.isDescendant(child.parentId, ancestorId);
    }
}
