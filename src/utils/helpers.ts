// Generate slug from string
export const generateSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Generate SKU (Stock Keeping Unit)
export const generateSKU = (prefix: string, length = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sku = prefix.toUpperCase() + '-';

    for (let i = 0; i < length; i++) {
        sku += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return sku;
};

// Generate random string
export const generateRandomString = (length = 32): string => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

// Format currency (Indonesian Rupiah)
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Format date to Indonesian format
export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};

// Format datetime to Indonesian format
export const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
};

// Clean object from undefined/null values
export const cleanObject = <T extends Record<string, unknown>>(
    obj: T
): Partial<T> => {
    const cleaned: Partial<T> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined && value !== null) {
                cleaned[key] = value;
            }
        }
    }
    return cleaned;
};
// Calculate percentage
export const calculatePercentage = (part: number, total: number): number => {
    if (total === 0) return 0;
    return (part / total) * 100;
};

// Round to decimal places
export const roundTo = (num: number, decimals = 2): number => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// Capitalize first letter
export const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Parse boolean from string
export const parseBoolean = (value: string | boolean): boolean => {
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};
