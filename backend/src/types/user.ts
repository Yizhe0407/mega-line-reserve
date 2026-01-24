import { UserRole } from "@prisma/client";

export interface UserProfile {
    id: number;
    lineId: string;
    name: string | null;
    pictureUrl: string | null;
    phone: string;
    license: string | null;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateUserDTO = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;