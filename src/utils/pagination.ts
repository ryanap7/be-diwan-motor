import { config } from '@/config/env';

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationResult {
    skip: number;
    take: number;
    page: number;
    limit: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export const parsePagination = (params: PaginationParams): PaginationResult => {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(
        params.limit || config.pagination.defaultPageSize,
        config.pagination.maxPageSize
    );

    const skip = (page - 1) * limit;
    const take = limit;

    return {
        skip,
        take,
        page,
        limit,
    };
};

export const createPaginationMeta = (
    page: number,
    limit: number,
    total: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};
