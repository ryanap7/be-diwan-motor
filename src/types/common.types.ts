// Common query parameters
export interface QueryParams {
    page?: string;
    limit?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Common filter parameters
export interface FilterParams {
    startDate?: string;
    endDate?: string;
    status?: string;
    category?: string;
}

// Sort options
export interface SortOptions {
    field: string;
    order: 'asc' | 'desc';
}

// Date range filter
export interface DateRangeFilter {
    startDate: Date;
    endDate: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

export interface ApiError {
    success: false;
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
    stack?: string;
}

// Enum for user roles
export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    STAFF = 'STAFF',
}

// Enum for transaction types
export enum TransactionType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    RETURN = 'RETURN',
}

// Enum for order status
export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

// Enum for payment status
export enum PaymentStatus {
    UNPAID = 'UNPAID',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
}

// Base model with timestamps
export interface BaseModel {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
