import { StockRepository } from '@/repositories/stock.repository';
import { AppError } from '@/utils/errors';
import type {
    GetStockOverviewQuery,
    AdjustStockInput,
    TransferStockInput,
    GetStockMovementsQuery,
} from '@/validators/stock.validator';
import { Prisma } from '@prisma/client';

export class StockService {
    private stockRepository: StockRepository;

    constructor() {
        this.stockRepository = new StockRepository();
    }

    async getStockOverview(query: GetStockOverviewQuery) {
        const {
            page = 1,
            limit = 10,
            search,
            branchId,
            categoryId,
            isLowStock,
            sortBy,
            sortOrder = 'asc',
        } = query;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.ProductWhereInput = {
            isActive: true,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (isLowStock === 'true') {
            where.stocks = {
                some: {
                    isLowStock: true,
                },
            };
        }

        // Build orderBy
        let orderBy: Prisma.ProductOrderByWithRelationInput = {};
        if (sortBy === 'name' || sortBy === 'sku') {
            orderBy = { [sortBy]: sortOrder };
        }

        const { products, total } = await this.stockRepository.getStockOverview(
            {
                skip,
                take: limit,
                where,
                orderBy,
                branchId,
            }
        );

        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getStockByProduct(productId: string) {
        const stocks = await this.stockRepository.getStocksByProduct(productId);
        const totalStock = await this.stockRepository.getTotalStock(productId);

        return {
            productId,
            totalStock,
            stocksByBranch: stocks,
        };
    }

    async adjustStock(
        productId: string,
        data: AdjustStockInput,
        userId: string
    ) {
        const { branchId, quantity, type, reason, notes } = data;

        // Validate quantity based on type
        if (type === 'OUT' && quantity > 0) {
            throw new AppError(
                400,
                'Quantity must be negative for OUT type',
                'INVALID_QUANTITY'
            );
        }

        if (type === 'IN' && quantity < 0) {
            throw new AppError(
                400,
                'Quantity must be positive for IN type',
                'INVALID_QUANTITY'
            );
        }

        // Check current stock for OUT operations
        if (type === 'OUT') {
            const currentStock = await this.stockRepository.getStockQuantity(
                productId,
                branchId
            );
            if (currentStock + quantity < 0) {
                throw new AppError(
                    400,
                    'Insufficient stock',
                    'INSUFFICIENT_STOCK'
                );
            }
        }

        const stock = await this.stockRepository.updateStock(
            productId,
            branchId,
            quantity,
            type,
            userId,
            { reason, notes }
        );

        return stock;
    }

    async transferStock(
        productId: string,
        data: TransferStockInput,
        userId: string
    ) {
        const { fromBranchId, toBranchId, quantity, notes } = data;

        if (fromBranchId === toBranchId) {
            throw new AppError(
                400,
                'Cannot transfer to the same branch',
                'INVALID_TRANSFER'
            );
        }

        // Check stock availability
        const currentStock = await this.stockRepository.getStockQuantity(
            productId,
            fromBranchId
        );
        if (currentStock < quantity) {
            throw new AppError(
                400,
                'Insufficient stock for transfer',
                'INSUFFICIENT_STOCK'
            );
        }

        // Perform transfer (deduct from source, add to destination)
        await this.stockRepository.updateStock(
            productId,
            fromBranchId,
            -quantity,
            'TRANSFER',
            userId,
            {
                notes,
                fromBranchId,
                toBranchId,
                referenceType: 'TRANSFER',
            }
        );

        await this.stockRepository.updateStock(
            productId,
            toBranchId,
            quantity,
            'TRANSFER',
            userId,
            {
                notes,
                fromBranchId,
                toBranchId,
                referenceType: 'TRANSFER',
            }
        );

        return {
            productId,
            fromBranchId,
            toBranchId,
            quantity,
            message: 'Stock transferred successfully',
        };
    }

    async getStockMovements(query: GetStockMovementsQuery) {
        const {
            page = 1,
            limit = 10,
            productId,
            branchId,
            type,
            startDate,
            endDate,
        } = query;

        const skip = (page - 1) * limit;

        const where: Prisma.StockMovementWhereInput = {};

        if (productId) where.productId = productId;
        if (branchId) where.branchId = branchId;
        if (type) where.type = type;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const { movements, total } =
            await this.stockRepository.getStockMovements({
                skip,
                take: limit,
                where,
            });

        return {
            movements,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
