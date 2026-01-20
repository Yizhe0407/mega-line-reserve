import { ApiError } from '@/types/common';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class FetchError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'FetchError';
  }
}

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * 統一的 fetch 封裝函式
 */
async function fetchWrapper<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers, ...restOptions } = options;

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // 處理錯誤回應
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: '未知錯誤',
    }));
    throw new FetchError(response.status, errorData.error);
  }

  return response.json();
}

/**
 * GET 請求
 */
export function get<T>(endpoint: string, token?: string): Promise<T> {
  return fetchWrapper<T>(endpoint, { method: 'GET', token });
}

/**
 * POST 請求
 */
export function post<T>(
  endpoint: string,
  data?: unknown,
  token?: string
): Promise<T> {
  return fetchWrapper<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    token,
  });
}

/**
 * PUT 請求
 */
export function put<T>(
  endpoint: string,
  data: unknown,
  token?: string
): Promise<T> {
  return fetchWrapper<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * DELETE 請求
 */
export function del<T>(endpoint: string, token?: string): Promise<T> {
  return fetchWrapper<T>(endpoint, { method: 'DELETE', token });
}
