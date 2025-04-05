import { LocalStorage } from "@raycast/api";

/**
 * Utility for caching cryptocurrency icons
 * This helps reduce API requests by storing icon URLs locally
 */

// Cache key prefix for icon URLs
const ICON_CACHE_PREFIX = "crypto_icon_";

// Cache expiration time (7 days in milliseconds)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

interface IconCacheEntry {
  url: string;
  timestamp: number;
}

/**
 * Get a cached icon URL for a cryptocurrency
 * @param symbol The cryptocurrency symbol (e.g., "BTC")
 * @returns The cached icon URL or undefined if not in cache
 */
export async function getCachedIconUrl(symbol: string): Promise<string | undefined> {
  try {
    const cacheKey = `${ICON_CACHE_PREFIX}${symbol.toUpperCase()}`;
    const cachedData = await LocalStorage.getItem<string>(cacheKey);
    
    if (!cachedData) {
      return undefined;
    }
    
    const cacheEntry: IconCacheEntry = JSON.parse(cachedData);
    
    // Check if the cache entry has expired
    if (Date.now() - cacheEntry.timestamp > CACHE_EXPIRATION) {
      // Cache expired, remove it
      await LocalStorage.removeItem(cacheKey);
      return undefined;
    }
    
    return cacheEntry.url;
  } catch {
    return undefined;
  }
}

/**
 * Store an icon URL in the cache
 * @param symbol The cryptocurrency symbol (e.g., "BTC")
 * @param url The icon URL to cache
 */
export async function cacheIconUrl(symbol: string, url: string): Promise<void> {
  try {
    const cacheKey = `${ICON_CACHE_PREFIX}${symbol.toUpperCase()}`;
    const cacheEntry: IconCacheEntry = {
      url,
      timestamp: Date.now()
    };
    
    await LocalStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch {
    // Silently fail if caching fails
  }
}

/**
 * Clear all cached icon URLs
 */
/**
 * Debug function to print the current state of the icon cache
 * This is useful for troubleshooting cache issues
 */
export async function debugIconCache(): Promise<void> {
  try {
    // This function is kept for debugging purposes but doesn't log anything in production
    await LocalStorage.allItems();
    // No-op in production
  } catch {
    // Silently fail if debugging fails
  }
}

/**
 * Clear all cached icon URLs
 */
export async function clearIconCache(): Promise<void> {
  try {
    const allItems = await LocalStorage.allItems();
    
    // Find all icon cache keys
    const iconCacheKeys = Object.keys(allItems).filter(key => 
      key.startsWith(ICON_CACHE_PREFIX)
    );
    
    // Remove each cached item
    for (const key of iconCacheKeys) {
      await LocalStorage.removeItem(key);
    }
  } catch {
    // Silently fail if clearing cache fails
  }
}
