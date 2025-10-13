import { CustomerService } from '@/services/customer.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class CustomerController {
    private customerService: CustomerService;

    constructor() {
        this.customerService = new CustomerService();
    }

    createCustomer = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = req.body;
            const customer = await this.customerService.createCustomer(data);

            ResponseHandler.success(
                res,
                customer,
                'Customer created successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    };

    getCustomers = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                isActive,
                sortBy,
                sortOrder,
            } = req.query;

            const result = await this.customerService.getCustomers({
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                search: search as string,
                isActive: isActive as 'true' | 'false' | undefined,
                sortBy: (sortBy as 'name' | 'createdAt') || 'createdAt',
                sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
            });

            ResponseHandler.success(
                res,
                {
                    customers: result.customers,
                    pagination: result.pagination,
                },
                'Customers retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getCustomerById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const customer = await this.customerService.getCustomerById(id);

            ResponseHandler.success(
                res,
                customer,
                'Customer details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    updateCustomer = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const data = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const customer = await this.customerService.updateCustomer(
                id,
                data
            );

            ResponseHandler.success(
                res,
                customer,
                'Customer updated successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    toggleCustomerStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            const customer = await this.customerService.toggleCustomerStatus(
                id,
                isActive
            );

            ResponseHandler.success(
                res,
                customer,
                `Customer ${isActive ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error) {
            next(error);
        }
    };

    deleteCustomer = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;

            if (typeof id !== 'string') {
                throw new Error('Invalid or missing ID');
            }

            await this.customerService.deleteCustomer(id);

            ResponseHandler.success(res, null, 'Customer deleted successfully');
        } catch (error) {
            next(error);
        }
    };
}
