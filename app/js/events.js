/**
 * Quest Mini - Event System
 * Custom event handling and DOM event utilities
 */

const QuestEvents = (function() {
  'use strict';

  // Event listeners registry
  const listeners = new Map();

  // Custom event types
  const EventTypes = {
    // Wallet events
    WALLET_CONNECTED: 'wallet:connected',
    WALLET_DISCONNECTED: 'wallet:disconnected',
    WALLET_CHAIN_CHANGED: 'wallet:chainChanged',
    WALLET_ACCOUNT_CHANGED: 'wallet:accountChanged',

    // Quest events
    QUEST_STARTED: 'quest:started',
    QUEST_COMPLETED: 'quest:completed',
    QUEST_FAILED: 'quest:failed',

    // Reward events
    REWARD_EARNED: 'reward:earned',
    REWARD_CLAIMED: 'reward:claimed',
    REWARD_CLAIM_FAILED: 'reward:claimFailed',

    // Transaction events
    TX_SUBMITTED: 'tx:submitted',
    TX_CONFIRMED: 'tx:confirmed',
    TX_FAILED: 'tx:failed',

    // UI events
    MODAL_OPENED: 'ui:modalOpened',
    MODAL_CLOSED: 'ui:modalClosed',
    TOAST_SHOWN: 'ui:toastShown',
    LOADING_START: 'ui:loadingStart',
    LOADING_END: 'ui:loadingEnd',

    // Data events
    DATA_REFRESHED: 'data:refreshed',
    BALANCE_UPDATED: 'data:balanceUpdated',
    STATS_UPDATED: 'data:statsUpdated'
  };

  /**
   * Emit a custom event
   * @param {string} eventType - Event type from EventTypes
   * @param {object} data - Event data
   */
  function emit(eventType, data = {}) {
    const event = new CustomEvent(eventType, {
      detail: { ...data, timestamp: Date.now() },
      bubbles: true,
      cancelable: true
    });

    // Dispatch on document
    document.dispatchEvent(event);

    // Call registered listeners
    if (listeners.has(eventType)) {
      listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event handler error for ${eventType}:`, error);
        }
      });
    }

    // Debug logging in development
    if (typeof DEBUG !== 'undefined' && DEBUG) {
      console.log(`[Event] ${eventType}`, data);
    }
  }

  /**
   * Listen for a custom event
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  function on(eventType, callback) {
    if (!listeners.has(eventType)) {
      listeners.set(eventType, new Set());
    }
    listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => off(eventType, callback);
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   * @param {Function} callback - Handler to remove
   */
  function off(eventType, callback) {
    if (listeners.has(eventType)) {
      listeners.get(eventType).delete(callback);
    }
  }

  /**
   * Listen for event once
   * @param {string} eventType - Event type
   * @param {Function} callback - Handler function
   */
  function once(eventType, callback) {
    const wrapper = (data) => {
      off(eventType, wrapper);
      callback(data);
    };
    on(eventType, wrapper);
  }

  /**
   * Remove all listeners for an event type
   * @param {string} eventType - Event type (optional, clears all if not provided)
   */
  function clear(eventType) {
    if (eventType) {
      listeners.delete(eventType);
    } else {
      listeners.clear();
    }
  }

  // =============================================
  // DOM Event Utilities
  // =============================================

  /**
   * Delegate event handling for dynamic elements
   * @param {string} eventType - DOM event type (click, submit, etc.)
   * @param {string} selector - CSS selector for target elements
   * @param {Function} handler - Event handler
   * @param {Element} [parent=document] - Parent element to attach listener
   */
  function delegate(eventType, selector, handler, parent = document) {
    parent.addEventListener(eventType, (event) => {
      const target = event.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, event, target);
      }
    });
  }

  /**
   * Wait for DOM element to exist
   * @param {string} selector - CSS selector
   * @param {number} [timeout=5000] - Timeout in ms
   * @returns {Promise<Element>}
   */
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Minimum time between calls in ms
   * @returns {Function} Throttled function
   */
  function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Add event listener with automatic cleanup
   * @param {Element} element - Target element
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   * @param {object} [options] - Event listener options
   * @returns {Function} Cleanup function
   */
  function addListener(element, eventType, handler, options = {}) {
    element.addEventListener(eventType, handler, options);
    return () => element.removeEventListener(eventType, handler, options);
  }

  /**
   * Handle keyboard shortcuts
   * @param {object} shortcuts - Map of key combos to handlers
   * @returns {Function} Cleanup function
   */
  function registerShortcuts(shortcuts) {
    const handler = (event) => {
      const key = [];
      if (event.ctrlKey || event.metaKey) key.push('ctrl');
      if (event.shiftKey) key.push('shift');
      if (event.altKey) key.push('alt');
      key.push(event.key.toLowerCase());
      
      const combo = key.join('+');
      if (shortcuts[combo]) {
        event.preventDefault();
        shortcuts[combo](event);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  // =============================================
  // Intersection Observer Utility
  // =============================================

  /**
   * Observe element visibility
   * @param {Element} element - Element to observe
   * @param {Function} callback - Called when visibility changes
   * @param {object} [options] - Intersection observer options
   * @returns {Function} Stop observing function
   */
  function observeVisibility(element, callback, options = {}) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        callback(entry.isIntersecting, entry);
      });
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px'
    });

    observer.observe(element);
    return () => observer.disconnect();
  }

  // =============================================
  // Window Events
  // =============================================

  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      emit('app:hidden');
    } else {
      emit('app:visible');
    }
  });

  // Handle online/offline
  window.addEventListener('online', () => emit('network:online'));
  window.addEventListener('offline', () => emit('network:offline'));

  // Handle beforeunload for cleanup
  window.addEventListener('beforeunload', () => {
    emit('app:beforeUnload');
  });

  // Public API
  return {
    // Event types
    Types: EventTypes,

    // Core event methods
    emit,
    on,
    off,
    once,
    clear,

    // DOM utilities
    delegate,
    waitForElement,
    debounce,
    throttle,
    addListener,
    registerShortcuts,
    observeVisibility
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestEvents;
}
