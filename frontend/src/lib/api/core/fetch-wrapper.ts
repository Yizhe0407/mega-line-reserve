import type { ApiError } from '@/types/common';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '');
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

function buildRequestUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${normalizedEndpoint}`;
}

interface RequestAbortContext {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
}

function createRequestAbortContext(
  callerSignal: AbortSignal | null | undefined,
  timeoutMs: number
): RequestAbortContext {
  const controller = new AbortController();
  const effectiveTimeoutMs =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_REQUEST_TIMEOUT_MS;
  let timedOut = false;

  const abortFromCaller = () => {
    if (!controller.signal.aborted) {
      controller.abort(callerSignal?.reason);
    }
  };

  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  }

  const timeoutId = setTimeout(() => {
    if (!controller.signal.aborted) {
      timedOut = true;
      controller.abort();
    }
  }, effectiveTimeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    },
  };
}

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
  timeoutMs?: number;
}

export interface RequestControlOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * 統一的 fetch 封裝函式
 */
async function fetchWrapper<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    token,
    headers,
    signal: callerSignal,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    ...restOptions
  } = options;
  const requestAbortContext = createRequestAbortContext(
    callerSignal,
    timeoutMs
  );

  const config: RequestInit = {
    ...restOptions,
    signal: requestAbortContext.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  const requestUrl = buildRequestUrl(endpoint);

  try {
    const response = await fetch(requestUrl, config);

    // 處理錯誤回應
    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let errorData: ApiError = { error: '伺服器發生錯誤，請稍後再試' };

      if (contentType.includes('application/json')) {
        try {
          errorData = (await response.json()) as ApiError;
        } catch {
          errorData = { error: '伺服器發生錯誤，請稍後再試' };
        }
      } else {
        // 不讀取或輸出代理錯誤頁內容，避免技術細節出現在瀏覽器 console。
        errorData = { error: '伺服器發生錯誤，請稍後再試' };
      }

      const message = errorData.error || '伺服器發生錯誤，請稍後再試';

      // 如果是 401 Unauthorized，發送全域事件通知前端登出
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      throw new FetchError(response.status, message, {
        ...errorData,
        status: response.status,
        statusText: response.statusText,
        url: requestUrl,
      });
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof FetchError) {
      throw err;
    }

    if (requestAbortContext.didTimeout()) {
      throw new FetchError(408, '請求逾時，請稍後再試', {
        url: requestUrl,
        timeoutMs,
      });
    }

    // 呼叫端主動取消時保留原始 AbortError，避免誤判為網路故障。
    if (callerSignal?.aborted) {
      throw err;
    }

    console.error('網路請求失敗');
    throw new FetchError(0, '網路連線失敗，請稍後再試', {
      url: requestUrl,
    });
  } finally {
    requestAbortContext.cleanup();
  }
}

/**
 * GET 請求
 */
export function get<T>(
  endpoint: string,
  token?: string,
  controlOptions: RequestControlOptions = {}
): Promise<T> {
  return fetchWrapper<T>(endpoint, {
    ...controlOptions,
    method: 'GET',
    token,
  });
}

/**
 * POST 請求
 */
export function post<T>(
  endpoint: string,
  data?: unknown,
  token?: string,
  controlOptions: RequestControlOptions = {}
): Promise<T> {
  return fetchWrapper<T>(endpoint, {
    ...controlOptions,
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
  token?: string,
  controlOptions: RequestControlOptions = {}
): Promise<T> {
  return fetchWrapper<T>(endpoint, {
    ...controlOptions,
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * DELETE 請求
 */
export function del<T>(
  endpoint: string,
  token?: string,
  controlOptions: RequestControlOptions = {}
): Promise<T> {
  return fetchWrapper<T>(endpoint, {
    ...controlOptions,
    method: 'DELETE',
    token,
  });
}
