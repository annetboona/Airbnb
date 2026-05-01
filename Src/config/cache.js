const cacheStore = {};
export function getCache(key) {
    const entry = cacheStore[key];
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        delete cacheStore[key];
        return null;
    }
    return entry.data;
}
export function setCache(key, data, ttlSeconds) {
    if (ttlSeconds <= 0)
        return;
    cacheStore[key] = {
        data,
        expiresAt: Date.now() + ttlSeconds * 1000,
    };
}
export function clearCache(key) {
    delete cacheStore[key];
}
export function clearCacheByPrefix(prefix) {
    Object.keys(cacheStore).forEach((key) => {
        if (key.startsWith(prefix)) {
            delete cacheStore[key];
        }
    });
}
