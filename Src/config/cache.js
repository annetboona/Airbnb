"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
exports.clearCache = clearCache;
exports.clearCacheByPrefix = clearCacheByPrefix;
const cacheStore = {};
function getCache(key) {
    const entry = cacheStore[key];
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        delete cacheStore[key];
        return null;
    }
    return entry.data;
}
function setCache(key, data, ttlSeconds) {
    if (ttlSeconds <= 0)
        return;
    cacheStore[key] = {
        data,
        expiresAt: Date.now() + ttlSeconds * 1000,
    };
}
function clearCache(key) {
    delete cacheStore[key];
}
function clearCacheByPrefix(prefix) {
    Object.keys(cacheStore).forEach((key) => {
        if (key.startsWith(prefix)) {
            delete cacheStore[key];
        }
    });
}
//# sourceMappingURL=cache.js.map