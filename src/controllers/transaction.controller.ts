import { ProductService } from '@/services/product.service';
import { TransactionService } from '@/services/transaction.service';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class TransactionController {
    private transactionService: TransactionService;
    private productService: ProductService;

    constructor() {
        this.transactionService = new TransactionService();
        this.productService = new ProductService();
    }

    createTransaction = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;
            const cashierId = req.user!.userId;
            const branchId = req.user!.branchId;

            // Validate that user has a branch
            if (!branchId) {
                throw new BadRequestError(
                    'User is not assigned to any branch',
                    'NO_BRANCH_ASSIGNED'
                );
            }

            const transaction = await this.transactionService.createTransaction(
                data,
                cashierId,
                branchId
            );

            ResponseHandler.created(
                res,
                transaction,
                'Transaction completed successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getTransactions = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const userRole = req.user!.role;
            const userId = req.user!.userId;
            const userBranchId = req.user!.branchId;

            const result = await this.transactionService.getTransactions(
                {
                    page: parseInt(query.page as string) || 1,
                    limit: parseInt(query.limit as string) || 10,
                    search: query.search as string,
                    branchId: query.branchId as string,
                    cashierId: query.cashierId as string,
                    customerId: query.customerId as string,
                    status: query.status as any,
                    paymentMethod: query.paymentMethod as any,
                    startDate: query.startDate
                        ? new Date(query.startDate as string)
                        : undefined,
                    endDate: query.endDate
                        ? new Date(query.endDate as string)
                        : undefined,
                    sortBy: (query.sortBy as any) || 'transactionDate',
                    sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
                },
                userRole,
                userId,
                userBranchId
            );

            ResponseHandler.success(
                res,
                {
                    transactions: result.transactions,
                    pagination: result.pagination,
                },
                'Transactions retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getTransactionById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const transaction =
                await this.transactionService.getTransactionById(id);

            ResponseHandler.success(
                res,
                transaction,
                'Transaction details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getTransactionByInvoice = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { invoiceNumber } = req.params;

            if (typeof invoiceNumber !== 'string') {
                throw new Error('Invalid or missing invoice number');
            }

            const transaction =
                await this.transactionService.getTransactionByInvoice(
                    invoiceNumber
                );

            ResponseHandler.success(
                res,
                transaction,
                'Transaction retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    updateTransactionStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const transaction =
                await this.transactionService.updateTransactionStatus(
                    id,
                    status,
                    notes
                );

            ResponseHandler.success(
                res,
                transaction,
                'Transaction status updated successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getTransactionStats = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;

            const stats = await this.transactionService.getTransactionStats({
                branchId: query.branchId as string,
                cashierId: query.cashierId as string,
                startDate: query.startDate
                    ? new Date(query.startDate as string)
                    : undefined,
                endDate: query.endDate
                    ? new Date(query.endDate as string)
                    : undefined,
            });

            ResponseHandler.success(
                res,
                stats,
                'Transaction statistics retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    // Helper endpoints for POS
    quickCreateCustomer = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;

            const customer =
                await this.transactionService.quickCreateCustomer(data);

            ResponseHandler.created(
                res,
                customer,
                'Customer created successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    searchCustomerByPhone = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { phone } = req.query;

            if (!phone || typeof phone !== 'string') {
                throw new BadRequestError(
                    'Phone number is required',
                    'PHONE_REQUIRED'
                );
            }

            const customer =
                await this.transactionService.searchCustomerByPhone(phone);

            if (!customer) {
                throw new NotFoundError(
                    'Customer not found',
                    'CUSTOMER_NOT_FOUND'
                );
            }

            ResponseHandler.success(
                res,
                customer,
                'Customer found successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getProductsForPOS = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const userBranchId = req.user!.branchId;

            if (!userBranchId) {
                throw new BadRequestError(
                    'User is not assigned to any branch',
                    'NO_BRANCH_ASSIGNED'
                );
            }

            // Get products with stock information for current branch
            const result = await this.productService.getProducts({
                page: parseInt(query.page as string) || 1,
                limit: parseInt(query.limit as string) || 20,
                search: query.search as string,
                categoryId: query.categoryId as string,
                brandId: query.brandId as string,
                isActive: 'true', // Only active products
                hasDiscount: query.priceType === 'promo' ? 'true' : undefined,
                sortBy: 'name',
                sortOrder: 'asc',
                branchId: userBranchId, // Pass branchId to get stock info
            });

            ResponseHandler.success(
                res,
                {
                    products: result.products,
                    pagination: result.pagination,
                },
                'Products for POS retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
