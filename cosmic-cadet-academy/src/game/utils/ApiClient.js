/**
 * ApiClient - HTTP API Communication
 *
 * Handles all REST API calls to the backend server:
 * - Score submission
 * - Leaderboard retrieval
 * - Progress synchronization
 * - Achievement updates
 *
 * Uses fetch API with automatic retry and error handling.
 */

import { GAME_CONSTANTS } from '../config/gameConfig.js';

class ApiClient {
    constructor() {
        this.baseUrl = GAME_CONSTANTS.API_BASE_URL;
        this.token = null;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    /**
     * Get stored authentication token
     * @returns {string|null}
     */
    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('auth_token');
        }
        return this.token;
    }

    /**
     * Clear authentication
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    /**
     * Build request headers
     * @returns {Object}
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Make HTTP request with retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        let lastError;

        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, config);

                // Handle non-OK responses
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));

                    // Don't retry on client errors (except 429 rate limit)
                    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        throw new ApiError(
                            error.message || `Request failed: ${response.status}`,
                            response.status,
                            error
                        );
                    }

                    throw new Error(`Server error: ${response.status}`);
                }

                return await response.json();

            } catch (error) {
                lastError = error;

                // Don't retry on client errors
                if (error instanceof ApiError) {
                    throw error;
                }

                // Wait before retry (exponential backoff)
                if (attempt < this.retryAttempts - 1) {
                    await this.delay(this.retryDelay * Math.pow(2, attempt));
                }
            }
        }

        throw lastError || new Error('Request failed after retries');
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================
    // Authentication Endpoints
    // ========================================

    /**
     * Register a new user
     * @param {Object} userData - { username, email?, parentalEmail? }
     * @returns {Promise<Object>}
     */
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    /**
     * Login existing user
     * @param {Object} credentials - { username, password }
     * @returns {Promise<Object>}
     */
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    /**
     * Guest login (no account required)
     * @param {string} username - Display name
     * @returns {Promise<Object>}
     */
    async guestLogin(username) {
        const response = await this.request('/auth/guest', {
            method: 'POST',
            body: JSON.stringify({ username })
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    // ========================================
    // Leaderboard Endpoints
    // ========================================

    /**
     * Get top scores
     * @param {Object} options - { level?, limit?, offset? }
     * @returns {Promise<Array>}
     */
    async getLeaderboard(options = {}) {
        const params = new URLSearchParams();

        if (options.level) params.set('level', options.level);
        if (options.limit) params.set('limit', options.limit.toString());
        if (options.offset) params.set('offset', options.offset.toString());

        const query = params.toString();
        const endpoint = `/leaderboard${query ? `?${query}` : ''}`;

        return await this.request(endpoint);
    }

    /**
     * Submit a score
     * @param {Object} scoreData - { level, score, stars, time }
     * @returns {Promise<Object>}
     */
    async submitScore(scoreData) {
        return await this.request('/leaderboard', {
            method: 'POST',
            body: JSON.stringify(scoreData)
        });
    }

    /**
     * Get user's rank for a level
     * @param {string} levelId - Level identifier
     * @returns {Promise<Object>}
     */
    async getUserRank(levelId) {
        return await this.request(`/leaderboard/rank/${levelId}`);
    }

    // ========================================
    // Progress Endpoints
    // ========================================

    /**
     * Get user's saved progress
     * @returns {Promise<Object>}
     */
    async getProgress() {
        return await this.request('/progress');
    }

    /**
     * Save user's progress
     * @param {Object} progressData - Game progress object
     * @returns {Promise<Object>}
     */
    async saveProgress(progressData) {
        return await this.request('/progress', {
            method: 'PUT',
            body: JSON.stringify(progressData)
        });
    }

    // ========================================
    // Achievement Endpoints
    // ========================================

    /**
     * Get all achievements
     * @returns {Promise<Array>}
     */
    async getAchievements() {
        return await this.request('/achievements');
    }

    /**
     * Unlock an achievement
     * @param {string} achievementId - Achievement identifier
     * @returns {Promise<Object>}
     */
    async unlockAchievement(achievementId) {
        return await this.request(`/achievements/${achievementId}`, {
            method: 'POST'
        });
    }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// Export singleton instance
export default new ApiClient();
export { ApiError };
