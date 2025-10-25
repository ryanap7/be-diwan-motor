import { SupplierRepository } from '@/repositories/supplier.repository';
import { AppError } from '@/utils/errors';
import type {
    CreateSupplierInput,
    GetSuppliersQuery,
    UpdateSupplierInput,
} from '@/validators/supplier.validator';
import { Prisma } from '@prisma/client';

export class SupplierService {
    private supplierRepository: SupplierRepository;

    constructor() {
        this.supplierRepository = new SupplierRepository();
    }

    async createSupplier(data: CreateSupplierInput) {
        // Check if supplier with same name already exists
        const existingSupplier = await this.supplierRepository.findByName(
            data.name
        );

        if (existingSupplier) {
            throw new AppError(
                409,
                'Supplier with this name already exists',
                'SUPPLIER_EXISTS'
            );
        }

        // Create supplier
        const supplier = await this.supplierRepository.create({
            name: data.name,
            contactPerson: data.contactPerson,
            phone: data.phone,
            email: data.email,
            address: data.address,
            paymentTerms: data.paymentTerms,
            deliveryTerms: data.deliveryTerms,
            notes: data.notes,
            isActive: data.isActive ?? true,
        });

        return supplier;
    }

    async getSuppliers(query: GetSuppliersQuery) {
        const {
            page = 1,
            limit = 10,
            search,
            isActive,
            sortBy,
            sortOrder,
        } = query;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.SupplierWhereInput = {};

        // Search by name, contact person, phone, or email
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { contactPerson: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filter by status
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        // Build orderBy
        const orderByClause: Prisma.SupplierOrderByWithRelationInput = {
            [sortBy]: sortOrder,
        };

        // Get suppliers
        const { suppliers, total } = await this.supplierRepository.findMany({
            skip,
            take: Number(limit),
            where,
            orderBy: orderByClause,
        });

        return {
            suppliers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getSupplierById(id: string) {
        const supplier = await this.supplierRepository.findById(id);

        if (!supplier) {
            throw new AppError(404, 'Supplier not found', 'SUPPLIER_NOT_FOUND');
        }

        return supplier;
    }

    async updateSupplier(id: string, data: UpdateSupplierInput) {
        // Check if supplier exists
        const existingSupplier = await this.supplierRepository.findById(id);
        if (!existingSupplier) {
            throw new AppError(404, 'Supplier not found', 'SUPPLIER_NOT_FOUND');
        }

        // Check if name is being updated and if it's unique
        if (data.name && data.name !== existingSupplier.name) {
            const supplierWithName = await this.supplierRepository.findByName(
                data.name
            );
            if (supplierWithName && supplierWithName.id !== id) {
                throw new AppError(
                    409,
                    'Supplier with this name already exists',
                    'SUPPLIER_EXISTS'
                );
            }
        }

        // Update supplier
        const updatedSupplier = await this.supplierRepository.update(id, data);

        return updatedSupplier;
    }

    async toggleSupplierStatus(id: string, isActive: boolean) {
        // Check if supplier exists
        const supplier = await this.supplierRepository.findById(id);
        if (!supplier) {
            throw new AppError(404, 'Supplier not found', 'SUPPLIER_NOT_FOUND');
        }

        return this.supplierRepository.toggleStatus(id, isActive);
    }

    async deleteSupplier(id: string) {
        // Check if supplier exists
        const supplier = await this.supplierRepository.findById(id);
        if (!supplier) {
            throw new AppError(404, 'Supplier not found', 'SUPPLIER_NOT_FOUND');
        }

        // Soft delete supplier
        return this.supplierRepository.softDelete(id);
    }
}
