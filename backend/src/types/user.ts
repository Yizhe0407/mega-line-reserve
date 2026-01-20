import { UserRole } from "@prisma/client";

export interface UserProfile {
    id: number;
    lineId: string;
    name: string;
    pictureUrl: string;
    phone: string;
    license: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateUserDTO = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;