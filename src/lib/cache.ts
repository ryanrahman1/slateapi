// memory-based cache; update to redis eventually

// src/utils/cache.ts

interface CacheEntry<T> {
    data: T
    expiresAt: number
}

class Cache {
    private cache: Map<string, CacheEntry<any>>

    constructor() {
        this.cache = new Map()
    }

    /**
     * Generate cache key from user ID and endpoint
     */
    getCacheKey(userId: string, endpoint: string): string {
        return `${userId}:${endpoint}`
    }

    /**
     * Get cached data or fetch new data
     */
    async getCachedOrFetch<T>(
        userId: string,
        endpoint: string,
        fetchFn: () => Promise<T>,
        ttlMinutes: number = 30
    ): Promise<T> {
        const key = this.getCacheKey(userId, endpoint)
        const cached = this.cache.get(key)

        // Return cached data if valid
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data as T
        }

        // Fetch fresh data
        const data = await fetchFn()

        // Store in cache
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
        })

        return data
    }

    /**
     * Clear cache for specific user and endpoint
     */
    clear(userId: string, endpoint: string): void {
        const key = this.getCacheKey(userId, endpoint)
        this.cache.delete(key)
    }

    /**
     * Clear all cache for a user
     */
    clearUser(userId: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${userId}:`)) {
                this.cache.delete(key)
            }
        }
    }

    /**
     * Clear all cache
     */
    clearAll(): void {
        this.cache.clear()
    }

    /**
     * Clean up expired entries (run periodically)
     */
    cleanupExpired(): void {
        const now = Date.now()
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key)
            }
        }
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        }
    }
}

// Export singleton instance
export const cache = new Cache()

// Export the main function for convenience
export const getCachedOrFetch = cache.getCachedOrFetch.bind(cache)

// Optional: Run cleanup every hour
setInterval(() => {
    cache.cleanupExpired()
    console.log('Cache cleanup completed. Current size:', cache.getStats().size)
}, 60 * 60 * 1000) // 1 hour