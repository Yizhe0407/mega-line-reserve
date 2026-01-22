export interface Service {
  id: number;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDTO {
  name: string;
  description?: string;
  price?: number;
  duration?: number;
}

export type UpdateServiceDTO = Partial<CreateServiceDTO> & {
  isActive?: boolean;
};
