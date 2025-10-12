export interface CreateBranchDTO {
    code: string;
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    email: string;
    operatingHours?: any;
    notes?: string;
}

export interface UpdateBranchDTO {
    name?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    operatingHours?: any;
    notes?: string;
}

export interface AssignUserDTO {
    userId: string;
}
