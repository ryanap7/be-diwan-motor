import { TransactionRepository } from '@/repositories/transaction.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import prisma from '@/config/database';
import { BadRequestError, NotFoundError, ConflictError } from '@/utils/errors';
import type {
    CreateTransactionInput,
    GetTransactionsQuery,
    GetTransactionStatsQuery,
    QuickCreateCustomerInput,
} from '@/validators/transaction.validator';
import { Prisma } from '@prisma/client';

export class TransactionService {
    private transactionRepository: TransactionRepository;
    private productRepository: ProductRepository;
    private customerRepository: CustomerRepository;

    constructor() {
        this.transactionRepository = new TransactionRepository();
        this.productRepository = new ProductRepository();
        this.customerRepository = new CustomerRepository();
    }

    async createTransaction(
        data: CreateTransactionInput,
        cashierId: string,
        branchId: string
    ) {
        return await prisma.$transaction(async (tx) => {
            // Generate invoice number
            const invoiceNumber =
                await this.transactionRepository.generateInvoiceNumber(
                    branchId
                );

            // Validate customer if provided
            if (data.customerId) {
                const customer = await this.customerRepository.findById(
                    data.customerId
                );
                if (!customer) {
                    throw new NotFoundError(
                        'Customer not found',
                        'CUSTOMER_NOT_FOUND'
                    );
                }
            }

            // Validate products and check stock
            const stockUpdates: Array<{
                productId: string;
                branchId: string;
                quantity: number;
            }> = [];

            for (const item of data.items) {
                // Check product exists
                const product = await this.productRepository.findById(
                    item.productId
                );
                if (!product) {
                    throw new NotFoundError(
                        `Product not found: ${item.productId}`,
                        'PRODUCT_NOT_FOUND'
                    );
                }

                // Check stock availability
                const stock = await tx.stock.findUnique({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: branchId,
                        },
                    },
                });

                if (!stock || stock.quantity < item.quantity) {
                    throw new BadRequestError(
                        `Insufficient stock for product: ${product.name}. Available: ${stock?.quantity || 0}, Requested: ${item.quantity}`,
                        'INSUFFICIENT_STOCK'
                    );
                }

                // Prepare stock update
                stockUpdates.push({
                    productId: item.productId,
                    branchId: branchId,
                    quantity: item.quantity,
                });
            }

            // Create transaction with items
            const transaction = await tx.transaction.create({
                data: {
                    invoiceNumber,
                    branch: { connect: { id: branchId } },
                    cashier: { connect: { id: cashierId } },
                    customer: data.customerId
                        ? { connect: { id: data.customerId } }
                        : undefined,
                    subtotal: data.subtotal,
                    taxAmount: data.taxAmount,
                    discountAmount: data.discountAmount,
                    totalAmount: data.totalAmount,
                    paymentMethod: data.paymentMethod,
                    amountPaid: data.amountPaid,
                    changeAmount: data.changeAmount,
                    notes: data.notes,
                    status: 'COMPLETED',
                    items: {
                        create: await Promise.all(
                            data.items.map(async (item) => {
                                const product =
                                    await this.productRepository.findById(
                                        item.productId
                                    );
                                return {
                                    product: {
                                        connect: { id: item.productId },
                                    },
                                    productName: product!.name,
                                    productSku: product!.sku ?? '',
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    subtotal: item.subtotal,
                                };
                            })
                        ),
                    },
                },
                select: {
                    id: true,
                    invoiceNumber: true,
                    branchId: true,
                    cashierId: true,
                    customerId: true,
                    subtotal: true,
                    totalAmount: true,
                    paymentMethod: true,
                    amountPaid: true,
                    changeAmount: true,
                    status: true,
                    transactionDate: true,
                    branch: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    cashier: {
                        select: {
                            id: true,
                            fullName: true,
                            username: true,
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                    items: {
                        select: {
                            id: true,
                            productName: true,
                            productSku: true,
                            quantity: true,
                            unitPrice: true,
                            subtotal: true,
                        },
                    },
                },
            });

            // Update stock and create stock movements
            for (const stockUpdate of stockUpdates) {
                const currentStock = await tx.stock.findUnique({
                    where: {
                        productId_branchId: {
                            productId: stockUpdate.productId,
                            branchId: stockUpdate.branchId,
                        },
                    },
                });

                const newQuantity =
                    currentStock!.quantity - stockUpdate.quantity;

                // Update stock
                await tx.stock.update({
                    where: {
                        productId_branchId: {
                            productId: stockUpdate.productId,
                            branchId: stockUpdate.branchId,
                        },
                    },
                    data: {
                        quantity: newQuantity,
                        lastSaleDate: new Date(),
                        isLowStock: newQuantity <= 0, // You can adjust this logic
                    },
                });

                // Create stock movement record
                await tx.stockMovement.create({
                    data: {
                        product: { connect: { id: stockUpdate.productId } },
                        branch: { connect: { id: stockUpdate.branchId } },
                        type: 'OUT',
                        quantity: stockUpdate.quantity,
                        previousStock: currentStock!.quantity,
                        newStock: newQuantity,
                        referenceType: 'TRANSACTION',
                        referenceId: transaction.id,
                        notes: `Sale via transaction ${transaction.invoiceNumber}`,
                        user: { connect: { id: cashierId } },
                    },
                });
            }

            return transaction;
        });
    }

    async getTransactions(
        query: GetTransactionsQuery,
        userRole: string,
        userId: string,
        userBranchId?: string
    ) {
        const {
            page = 1,
            limit = 10,
            search,
            branchId,
            cashierId,
            customerId,
            status,
            paymentMethod,
            startDate,
            endDate,
            sortBy,
            sortOrder,
        } = query;

        const skip = (page - 1) * limit;

        // Build where clause with authorization
        const where: Prisma.TransactionWhereInput = {};

        // Authorization: Apply role-based filters
        if (userRole === 'CASHIER') {
            // Cashier can only see their own transactions
            where.cashierId = userId;
        } else if (userRole === 'BRANCH_MANAGER') {
            // Branch Manager can only see their branch transactions
            where.branchId = userBranchId;
        }
        // ADMIN can see all transactions (no filter)

        // Search by invoice number
        if (search) {
            where.invoiceNumber = {
                contains: search,
                mode: 'insensitive',
            };
        }

        // Filters
        if (branchId) where.branchId = branchId;
        if (cashierId) where.cashierId = cashierId;
        if (customerId) where.customerId = customerId;
        if (status) where.status = status;
        if (paymentMethod) where.paymentMethod = paymentMethod;

        // Date range filter
        if (startDate || endDate) {
            where.transactionDate = {};
            if (startDate) where.transactionDate.gte = startDate;
            if (endDate) where.transactionDate.lte = endDate;
        }

        // Build orderBy
        const orderByClause: Prisma.TransactionOrderByWithRelationInput = {
            [sortBy]: sortOrder,
        };

        const { transactions, total } =
            await this.transactionRepository.findMany({
                skip,
                take: limit,
                where,
                orderBy: orderByClause,
            });

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getTransactionById(id: string) {
        const transaction = await this.transactionRepository.findById(id);

        if (!transaction) {
            throw new NotFoundError(
                'Transaction not found',
                'TRANSACTION_NOT_FOUND'
            );
        }

        return transaction;
    }

    async getTransactionByInvoice(invoiceNumber: string) {
        const transaction =
            await this.transactionRepository.findByInvoiceNumber(invoiceNumber);

        if (!transaction) {
            throw new NotFoundError(
                'Transaction not found',
                'TRANSACTION_NOT_FOUND'
            );
        }

        return transaction;
    }

    async updateTransactionStatus(
        id: string,
        status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED',
        notes?: string
    ) {
        const transaction = await this.transactionRepository.findById(id);

        if (!transaction) {
            throw new NotFoundError(
                'Transaction not found',
                'TRANSACTION_NOT_FOUND'
            );
        }

        // Validate status transition
        if (transaction.status === 'CANCELLED') {
            throw new BadRequestError(
                'Cannot update cancelled transaction',
                'INVALID_STATUS_TRANSITION'
            );
        }

        return this.transactionRepository.updateStatus(id, status, notes);
    }

    async getTransactionStats(query: GetTransactionStatsQuery) {
        return this.transactionRepository.getTransactionStats(query);
    }

    // Helper: Quick create customer for POS
    async quickCreateCustomer(data: QuickCreateCustomerInput) {
        // Check if phone already exists
        const existing = await this.customerRepository.findByPhone(data.phone);
        if (existing) {
            throw new ConflictError(
                'Customer with this phone already exists',
                'CUSTOMER_EXISTS'
            );
        }

        return this.customerRepository.create({
            name: data.name,
            phone: data.phone,
            isActive: true,
        });
    }

    // Helper: Search customer by phone
    async searchCustomerByPhone(phone: string) {
        return this.customerRepository.findByPhone(phone);
    }
}
