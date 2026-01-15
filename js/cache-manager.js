// Cache Manager - Handles LocalStorage caching for API responses
// Provides methods to store, retrieve, and manage cached project data

/**
 * CacheManager - Manages caching of project data in LocalStorage
 */
export class CacheManager {
  /**
   * @param {string} cacheKey - Key to use for storing data in LocalStorage
   * @param {number} expiryMs - Cache expiry time in milliseconds
   */
  constructor(cacheKey, expiryMs) {
    this.cacheKey = cacheKey;
    this.expiryMs = expiryMs;
  }

  /**
   * Get cached data from LocalStorage
   * @returns {Array|null} Cached project data or null if not found/expired
   */
  get() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      
      if (!cached) {
        return null;
      }

      const cacheEntry = JSON.parse(cached);
      
      // Validate cache structure
      if (!cacheEntry.timestamp || !Array.isArray(cacheEntry.data)) {
        console.warn('Invalid cache structure, clearing cache');
        this.clear();
        return null;
      }

      // Check if cache is expired
      if (this.isExpired(cacheEntry.timestamp)) {
        console.log('Cache expired, will fetch fresh data');
        return null;
      }

      console.log('Using cached data from', new Date(cacheEntry.timestamp).toLocaleString());
      return cacheEntry.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      this.clear();
      return null;
    }
  }

  /**
   * Store data in LocalStorage with current timestamp
   * @param {Array} data - Project data to cache
   * @returns {boolean} True if successful, false otherwise
   */
  set(data) {
    try {
      const cacheEntry = {
        timestamp: Date.now(),
        data: data
      };

      localStorage.setItem(this.cacheKey, JSON.stringify(cacheEntry));
      console.log('Data cached successfully at', new Date(cacheEntry.timestamp).toLocaleString());
      return true;
    } catch (error) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded, clearing cache');
        this.clear();
      } else {
        console.error('Error writing to cache:', error);
      }
      return false;
    }
  }

  /**
   * Check if cached data has expired
   * @param {number} timestamp - Timestamp when data was cached
   * @returns {boolean} True if expired, false otherwise
   */
  isExpired(timestamp) {
    if (!timestamp) {
      return true;
    }

    const now = Date.now();
    const age = now - timestamp;
    return age > this.expiryMs;
  }

  /**
   * Clear cached data from LocalStorage
   */
  clear() {
    try {
      localStorage.removeItem(this.cacheKey);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
