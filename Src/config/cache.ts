type CacheEntry = {
  data: any;
  expiresAt: number;
};

const cacheStore: Record<string, CacheEntry> = {};

export function getCache(key: string): any | null {
  const entry = cacheStore[key];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete cacheStore[key];
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: any, ttlSeconds: number): void {
  if (ttlSeconds <= 0) return;
  cacheStore[key] = {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
}

export function clearCache(key: string): void {
  delete cacheStore[key];
}

export function clearCacheByPrefix(prefix: string): void {
  Object.keys(cacheStore).forEach((key) => {
    if (key.startsWith(prefix)) {
      delete cacheStore[key];
    }
  });
}
