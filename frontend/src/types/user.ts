// 使用者角色
export type UserRole = 'ADMIN' | 'CUSTOMER';

// 使用者資料
export interface User {
  id: number;
  lineId: string;
  name: string;
  pictureUrl: string;
  phone: string;
  license: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

// 建立使用者 DTO
export interface CreateUserDTO {
  lineId: string;
  name: string;
  pictureUrl: string;
  phone: string;
  license?: string;
  role: UserRole;
}

// 更新使用者 DTO
export interface UpdateUserDTO {
  name?: string;
  pictureUrl?: string;
  phone?: string;
  license?: string;
}
