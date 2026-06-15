type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

// 上限筆數，避免長時間運行下（例如大量不同 token）造成無界記憶體成長
const MAX_ENTRIES = 1000;

const cache = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs = 30_000) {
  if (!cache.has(key) && cache.size >= MAX_ENTRIES) {
    // Map 依插入順序迭代，移除最舊的一筆 (簡易 FIFO 淘汰)
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
