import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/user.service';
import { ResponseHandler } from '@/utils/response';
import {
    CreateUserInput,
    UpdateUserInput,
    GetUsersQuery,
} from '@/validators/user.validator';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    createUser = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data: CreateUserInput = req.body;
            const user = await this.userService.createUser(data);

            ResponseHandler.success(
                res,
                user,
                'User created successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    };

    getUsers = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query as unknown as GetUsersQuery;
            const result = await this.userService.getUsers(query);

            ResponseHandler.success(
                res,
                {
                    users: result.users,
                    pagination: result.pagination,
                },
                'Users retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    getUserById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (typeof id !== 'string') {
                throw new Error('Invalid or missing user ID');
            }
            const user = await this.userService.getUserById(id);

            ResponseHandler.success(res, user, 'User retrieved successfully');
        } catch (error) {
            next(error);
        }
    };

    updateUser = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (typeof id !== 'string') {
                throw new Error('Invalid or missing user ID');
            }
            const data: UpdateUserInput = req.body;
            const user = await this.userService.updateUser(id, data);

            ResponseHandler.success(res, user, 'User updated successfully');
        } catch (error) {
            next(error);
        }
    };

    deleteUser = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (typeof id !== 'string') {
                throw new Error('Invalid or missing user ID');
            }
            await this.userService.deleteUser(id);

            ResponseHandler.success(res, null, 'User deleted successfully');
        } catch (error) {
            next(error);
        }
    };
}
