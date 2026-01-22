export interface Service {
    id: number;
    name: string;
    description?: string;
    duration?: number;
    price?: number;
    createdAt: Date;
    updatedAt: Date;
}