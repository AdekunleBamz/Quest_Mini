/**
 * Quest Mini - API Client
 * HTTP client for backend API calls (future use)
 */

const QuestAPI = (function() {
  'use strict';

  // API configuration
  const config = {
    baseUrl: '/api',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000
  };

  /**
   * Make an HTTP request
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<any>}
   */
  async function request(endpoint, options = {}) {
    const url = `${config.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    let lastError;
    
    for (let attempt = 1; attempt <= config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
          ...mergedOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        
        if (attempt < config.retries && !error.name?.includes('Abort')) {
          await sleep(config.retryDelay * attempt);
          continue;
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  function get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  function post(endpoint, data = {}) {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  function put(endpoint, data = {}) {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  function del(endpoint) {
    return request(endpoint, { method: 'DELETE' });
  }

  // ============================================
  // API Endpoints (Future Implementation)
  // ============================================

  const users = {
    getProfile: (address) => get(`/users/${address}`),
    updateProfile: (address, data) => put(`/users/${address}`, data),
    getStats: (address) => get(`/users/${address}/stats`),
    getHistory: (address, page = 1) => get(`/users/${address}/history`, { page })
  };

  const quests = {
    getAll: () => get('/quests'),
    getById: (id) => get(`/quests/${id}`),
    getCompleted: (address) => get(`/quests/completed/${address}`),
    getLeaderboard: (questId) => get(`/quests/${questId}/leaderboard`)
  };

  const rewards = {
    getPending: (address) => get(`/rewards/pending/${address}`),
    getHistory: (address) => get(`/rewards/history/${address}`),
    getTotal: (address) => get(`/rewards/total/${address}`)
  };

  const leaderboard = {
    getTop: (limit = 100) => get('/leaderboard', { limit }),
    getRank: (address) => get(`/leaderboard/rank/${address}`),
    getByStreak: (limit = 100) => get('/leaderboard/streak', { limit })
  };

  const analytics = {
    trackEvent: (event, data) => post('/analytics/event', { event, ...data }),
    getStats: () => get('/analytics/stats')
  };

  // Public API
  return {
    // Configure
    setBaseUrl: (url) => { config.baseUrl = url; },
    setTimeout: (ms) => { config.timeout = ms; },
    
    // Raw methods
    get,
    post,
    put,
    delete: del,
    
    // Namespaced endpoints
    users,
    quests,
    rewards,
    leaderboard,
    analytics
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestAPI;
}
