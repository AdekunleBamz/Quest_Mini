/**
 * Quest Mini - Storage Module
 * Local storage utilities with caching
 */

const QuestStorage = (function() {
  'use strict';

  const STORAGE_PREFIX = 'quest_';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // In-memory cache
  const memoryCache = new Map();

  /**
   * Get prefixed key
   */
  function getKey(key) {
    return `${STORAGE_PREFIX}${key}`;
  }

  /**
   * Check if localStorage is available
   */
  function isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @param {number} [ttl] - Time to live in ms
   */
  function set(key, value, ttl = null) {
    const prefixedKey = getKey(key);
    const item = {
      value,
      timestamp: Date.now(),
      ttl
    };

    // Update memory cache
    memoryCache.set(key, item);

    // Update localStorage
    if (isAvailable()) {
      try {
        localStorage.setItem(prefixedKey, JSON.stringify(item));
      } catch (e) {
        // Storage full, try to clear expired items
        clearExpired();
        try {
          localStorage.setItem(prefixedKey, JSON.stringify(item));
        } catch {
          console.warn('Storage full, item not saved');
        }
      }
    }
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {*} [defaultValue] - Default if not found
   * @returns {*}
   */
  function get(key, defaultValue = null) {
    // Check memory cache first
    if (memoryCache.has(key)) {
      const item = memoryCache.get(key);
      if (!isExpired(item)) {
        return item.value;
      }
      memoryCache.delete(key);
    }

    // Check localStorage
    if (!isAvailable()) {
      return defaultValue;
    }

    const prefixedKey = getKey(key);
    const stored = localStorage.getItem(prefixedKey);

    if (!stored) {
      return defaultValue;
    }

    try {
      const item = JSON.parse(stored);
      
      if (isExpired(item)) {
        remove(key);
        return defaultValue;
      }

      // Populate memory cache
      memoryCache.set(key, item);
      return item.value;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Check if item is expired
   */
  function isExpired(item) {
    if (!item.ttl) return false;
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Remove item from storage
   */
  function remove(key) {
    memoryCache.delete(key);
    if (isAvailable()) {
      localStorage.removeItem(getKey(key));
    }
  }

  /**
   * Clear all Quest storage
   */
  function clear() {
    memoryCache.clear();
    if (isAvailable()) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  /**
   * Clear expired items
   */
  function clearExpired() {
    if (!isAvailable()) return;

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!key.startsWith(STORAGE_PREFIX)) return;
      
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (isExpired(item)) {
          localStorage.removeItem(key);
        }
      } catch {
        // Remove invalid items
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get all stored keys
   */
  function keys() {
    if (!isAvailable()) return [];
    
    return Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  }

  // ============================================
  // Typed Storage Helpers
  // ============================================

  const wallet = {
    getLastConnected: () => get('wallet_last_connected'),
    setLastConnected: (address) => set('wallet_last_connected', address),
    clearLastConnected: () => remove('wallet_last_connected')
  };

  const settings = {
    get: (key, defaultValue) => get(`settings_${key}`, defaultValue),
    set: (key, value) => set(`settings_${key}`, value),
    getAll: () => {
      const result = {};
      keys().forEach(key => {
        if (key.startsWith('settings_')) {
          result[key.replace('settings_', '')] = get(key);
        }
      });
      return result;
    }
  };

  const cache = {
    get: (key) => get(`cache_${key}`),
    set: (key, value, ttl = CACHE_DURATION) => set(`cache_${key}`, value, ttl),
    invalidate: (key) => remove(`cache_${key}`),
    invalidateAll: () => {
      keys().forEach(key => {
        if (key.startsWith('cache_')) {
          remove(key);
        }
      });
    }
  };

  const history = {
    addTransaction: (tx) => {
      const history = get('tx_history', []);
      history.unshift(tx);
      set('tx_history', history.slice(0, 100)); // Keep last 100
    },
    getTransactions: () => get('tx_history', []),
    clearTransactions: () => remove('tx_history')
  };

  // Public API
  return {
    // Core methods
    set,
    get,
    remove,
    clear,
    keys,
    isAvailable,
    clearExpired,

    // Typed helpers
    wallet,
    settings,
    cache,
    history
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestStorage;
}
