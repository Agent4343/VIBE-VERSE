/**
 * SocketClient - Real-Time Communication
 *
 * Manages Socket.IO connection for:
 * - Real-time leaderboard updates
 * - Live score submissions
 * - Online presence
 * - Multiplayer features (future)
 *
 * Provides event-based API for game integration.
 */

import { io } from 'socket.io-client';
import { GAME_CONSTANTS } from '../config/gameConfig.js';

class SocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    /**
     * Connect to the Socket.IO server
     * @param {Object} options - Connection options
     */
    connect(options = {}) {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        const token = localStorage.getItem('auth_token');

        this.socket = io(GAME_CONSTANTS.SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            ...options
        });

        this.setupEventHandlers();
    }

    /**
     * Setup core event handlers
     */
    setupEventHandlers() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.connected = true;
            this.reconnectAttempts = 0;
            this.emit('connected', { id: this.socket.id });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.connected = false;
            this.emit('disconnected', { reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            this.reconnectAttempts++;
            this.emit('error', { error: error.message });
        });

        // Leaderboard events
        this.socket.on('leaderboard:data', (data) => {
            this.emit('leaderboard:data', data);
        });

        this.socket.on('leaderboard:update', (data) => {
            this.emit('leaderboard:update', data);
        });

        // Presence events
        this.socket.on('presence:online', (data) => {
            this.emit('presence:online', data);
        });
    }

    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    /**
     * Check if connected
     * @returns {boolean}
     */
    isConnected() {
        return this.connected && this.socket?.connected;
    }

    // ========================================
    // Leaderboard Methods
    // ========================================

    /**
     * Subscribe to leaderboard updates for a level
     * @param {string} levelId - Level identifier (null for global)
     */
    subscribeToLeaderboard(levelId = null) {
        if (!this.isConnected()) {
            console.warn('Socket not connected');
            return;
        }

        this.socket.emit('leaderboard:subscribe', levelId);
    }

    /**
     * Unsubscribe from leaderboard updates
     * @param {string} levelId - Level identifier
     */
    unsubscribeFromLeaderboard(levelId = null) {
        if (!this.isConnected()) return;

        this.socket.emit('leaderboard:unsubscribe', levelId);
    }

    /**
     * Submit score in real-time
     * @param {Object} scoreData - { level, score, stars, time }
     * @returns {Promise<Object>}
     */
    submitScore(scoreData) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                reject(new Error('Socket not connected'));
                return;
            }

            this.socket.emit('score:submit', scoreData, (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Get user's current rank
     * @param {string} levelId - Level identifier
     * @returns {Promise<Object>}
     */
    getRank(levelId = null) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                reject(new Error('Socket not connected'));
                return;
            }

            this.socket.emit('rank:get', levelId, (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }

    // ========================================
    // Presence Methods
    // ========================================

    /**
     * Set user as active
     */
    setActive() {
        if (!this.isConnected()) return;
        this.socket.emit('presence:active');
    }

    /**
     * Set user as idle
     */
    setIdle() {
        if (!this.isConnected()) return;
        this.socket.emit('presence:idle');
    }

    // ========================================
    // Event Emitter Pattern
    // ========================================

    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Emit event to local listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;

        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in socket listener for ${event}:`, error);
            }
        });
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Export singleton instance
export default new SocketClient();
