import { CustomerRepository } from '@/repositories/customer.repository';
import { AppError } from '@/utils/errors';
import type {
    CreateCustomerInput,
    GetCustomersQuery,
    UpdateCustomerInput,
} from '@/validators/customer.validator';
import { Prisma } from '@prisma/client';

export class CustomerService {
    private customerRepository: CustomerRepository;

    constructor() {
        this.customerRepository = new CustomerRepository();
    }

    async createCustomer(data: CreateCustomerInput) {
        // Check if customer with same phone already exists
        const existingCustomer = await this.customerRepository.findByPhone(
            data.phone
        );

        if (existingCustomer) {
            throw new AppError(
                409,
                'Customer with this phone number already exists',
                'CUSTOMER_EXISTS'
            );
        }

        // Create customer
        const customer = await this.customerRepository.create({
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            notes: data.notes,
            isActive: data.isActive ?? true,
        });

        return customer;
    }

    async getCustomers(query: GetCustomersQuery) {
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
        const where: Prisma.CustomerWhereInput = {};

        // Search by name, phone, or email
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filter by status
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        // Build orderBy
        const orderByClause: Prisma.CustomerOrderByWithRelationInput = {
            [sortBy]: sortOrder,
        };

        // Get customers
        const { customers, total } = await this.customerRepository.findMany({
            skip,
            take: Number(limit),
            where,
            orderBy: orderByClause,
        });

        return {
            customers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getCustomerById(id: string) {
        const customer = await this.customerRepository.findById(id);

        if (!customer) {
            throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
        }

        return customer;
    }

    async updateCustomer(id: string, data: UpdateCustomerInput) {
        // Check if customer exists
        const existingCustomer = await this.customerRepository.findById(id);
        if (!existingCustomer) {
            throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
        }

        // Check if phone is being updated and if it's unique
        if (data.phone && data.phone !== existingCustomer.phone) {
            const customerWithPhone = await this.customerRepository.findByPhone(
                data.phone
            );
            if (customerWithPhone && customerWithPhone.id !== id) {
                throw new AppError(
                    409,
                    'Customer with this phone number already exists',
                    'CUSTOMER_EXISTS'
                );
            }
        }

        // Update customer
        const updatedCustomer = await this.customerRepository.update(id, data);

        return updatedCustomer;
    }

    async toggleCustomerStatus(id: string, isActive: boolean) {
        // Check if customer exists
        const customer = await this.customerRepository.findById(id);
        if (!customer) {
            throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
        }

        return this.customerRepository.toggleStatus(id, isActive);
    }

    async deleteCustomer(id: string) {
        // Check if customer exists
        const customer = await this.customerRepository.findById(id);
        if (!customer) {
            throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
        }

        // Soft delete customer
        return this.customerRepository.softDelete(id);
    }
}
