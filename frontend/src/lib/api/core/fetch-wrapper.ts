import { ApiError } from '@/types/common';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class FetchError<T = unknown> extends Error {
  public data?: T; // 保留完整的錯誤資料

  constructor(public status: number, message: string, data?: T) {
    super(message);
    this.name = 'FetchError';
    this.data = data;
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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, config);
  } catch (err) {
    console.error('網路請求失敗:', err);
    throw new FetchError(0, '網路連線失敗，請稍後再試', {
      url: `${API_URL}${endpoint}`,
    });
  }

  // 處理錯誤回應
  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let errorData: ApiError = { error: '伺服器發生錯誤，請稍後再試' };

    try {
      if (contentType.includes('application/json')) {
        errorData = (await response.json()) as ApiError;
      } else {
        // 非 JSON 回應（例如代理伺服器或框架產生的錯誤頁面）
        // 內容可能包含技術細節，僅記錄於 console，不直接顯示給使用者
        const text = await response.text();
        console.error('非預期的錯誤回應內容:', text);
        errorData = { error: '伺服器發生錯誤，請稍後再試' };
      }
    } catch {
      errorData = { error: '伺服器發生錯誤，請稍後再試' };
    }

    const message = errorData.error || `伺服器發生錯誤，請稍後再試`;

    // 如果是 401 Unauthorized，發送全域事件通知前端登出
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    throw new FetchError(response.status, message, {
      ...errorData,
      status: response.status,
      statusText: response.statusText,
      url: `${API_URL}${endpoint}`,
    });
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
