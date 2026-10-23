export interface Service {
    id: number;
    name: string;
    description?: string | null;
    duration?: number | null;
    price?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateServiceDTO {
    name: string;
    description?: string;
    duration?: number;
    price?: number;
    isActive?: boolean;
}

export type UpdateServiceDTO = Partial<CreateServiceDTO>;
