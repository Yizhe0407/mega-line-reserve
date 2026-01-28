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

function extractHtmlErrorMessage(html: string, fallback: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim();
  }

  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 200) : fallback;
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
    const contentType = response.headers.get('content-type') || '';
    let errorData: ApiError = { error: '未知錯誤' };

    try {
      if (contentType.includes('application/json')) {
        errorData = (await response.json()) as ApiError;
      } else {
        const text = await response.text();
        if (contentType.includes('text/html')) {
          const fallback = response.statusText || `HTTP ${response.status}`;
          errorData = { error: extractHtmlErrorMessage(text, fallback) };
        } else {
          const trimmed = text.trim();
          errorData = { error: trimmed ? trimmed.slice(0, 200) : '未知錯誤' };
        }
      }
    } catch {
      errorData = { error: '未知錯誤' };
    }

    const message = errorData.error || `HTTP ${response.status}`;

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
