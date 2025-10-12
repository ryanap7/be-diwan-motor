import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { validate } from '@/middlewares/validation';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    createUserSchema,
    updateUserSchema,
    getUsersQuerySchema,
} from '@/validators/user.validator';
import { z } from 'zod';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

// GET /api/users - Get all users with pagination
router.get(
    '/',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    validate(z.object({ query: getUsersQuerySchema })),
    userController.getUsers
);

// POST /api/users - Create new user (Admin only)
router.post(
    '/',
    authorize('ADMIN'),
    validate(z.object({ body: createUserSchema })),
    userController.createUser
);

// GET /api/users/:id - Get user by ID
router.get(
    '/:id',
    authorize('ADMIN', 'BRANCH_MANAGER'),
    userController.getUserById
);

// PUT /api/users/:id - Update user (Admin only)
router.put(
    '/:id',
    authorize('ADMIN'),
    validate(z.object({ body: updateUserSchema })),
    userController.updateUser
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

export default router;
