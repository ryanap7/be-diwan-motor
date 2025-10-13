import prisma from '@/config/database';
import { Prisma } from '@prisma/client';

export class CategoryRepository {
    async create(data: Prisma.CategoryCreateInput) {
        return prisma.category.create({
            data,
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                parentId: true,
                sortOrder: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                parent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async findById(id: string) {
        return prisma.category.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                parentId: true,
                sortOrder: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                parent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                children: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                        sortOrder: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
                _count: {
                    select: {
                        children: {
                            where: {
                                deletedAt: null,
                            },
                        },
                        products: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
        });
    }

    async findBySlug(slug: string) {
        return prisma.category.findFirst({
            where: {
                slug,
                deletedAt: null,
            },
        });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.CategoryWhereInput;
        orderBy?: Prisma.CategoryOrderByWithRelationInput;
        include?: Prisma.CategoryInclude;
    }) {
        const { skip, take, where, orderBy, include } = params;

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                skip,
                take,
                where,
                orderBy,
                include,
            }),
            prisma.category.count({ where }),
        ]);

        return { categories, total };
    }

    // Get root categories (no parent)
    async findRootCategories() {
        return prisma.category.findMany({
            where: {
                parentId: null,
                deletedAt: null,
            },
            orderBy: {
                sortOrder: 'asc',
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                sortOrder: true,
                isActive: true,
                _count: {
                    select: {
                        children: {
                            where: {
                                deletedAt: null,
                            },
                        },
                        products: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
        });
    }

    // Get nested tree structure
    async findTree() {
        const categories = await prisma.category.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: {
                sortOrder: 'asc',
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                parentId: true,
                sortOrder: true,
                isActive: true,
                _count: {
                    select: {
                        products: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
        });

        // Build tree structure
        const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));
        const tree: any[] = [];

        categories.forEach((category) => {
            if (!category.parentId) {
                tree.push({
                    ...category,
                    children: [],
                });
            } else {
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    if (!(parent as any).children) {
                        (parent as any).children = [];
                    }
                    (parent as any).children.push({
                        ...category,
                        children: [],
                    });
                }
            }
        });

        return tree;
    }

    // Get children categories
    async findChildren(parentId: string) {
        return prisma.category.findMany({
            where: {
                parentId,
                deletedAt: null,
            },
            orderBy: {
                sortOrder: 'asc',
            },
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                sortOrder: true,
                _count: {
                    select: {
                        children: {
                            where: {
                                deletedAt: null,
                            },
                        },
                        products: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
        });
    }

    // Check if category has children
    async hasChildren(id: string): Promise<boolean> {
        const count = await prisma.category.count({
            where: {
                parentId: id,
                deletedAt: null,
            },
        });
        return count > 0;
    }

    // Check if category has products
    async hasProducts(id: string): Promise<boolean> {
        const count = await prisma.product.count({
            where: {
                categoryId: id,
                deletedAt: null,
            },
        });
        return count > 0;
    }

    async update(id: string, data: Prisma.CategoryUpdateInput) {
        return prisma.category.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                parentId: true,
                sortOrder: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                parent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async toggleStatus(id: string, isActive: boolean) {
        return prisma.category.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                name: true,
                isActive: true,
            },
        });
    }

    async softDelete(id: string) {
        return prisma.category.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    // Cascade soft delete children
    async softDeleteWithChildren(id: string) {
        return prisma.$transaction(async (tx) => {
            // Get all children recursively
            const children = await this.getAllChildrenIds(id);

            // Soft delete all children
            await tx.category.updateMany({
                where: {
                    id: {
                        in: children,
                    },
                },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });

            // Soft delete parent
            return tx.category.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });
        });
    }

    // Helper: Get all children IDs recursively
    private async getAllChildrenIds(parentId: string): Promise<string[]> {
        const children = await prisma.category.findMany({
            where: {
                parentId,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });

        let allIds: string[] = children.map((c) => c.id);

        for (const child of children) {
            const grandChildren = await this.getAllChildrenIds(child.id);
            allIds = [...allIds, ...grandChildren];
        }

        return allIds;
    }
}
