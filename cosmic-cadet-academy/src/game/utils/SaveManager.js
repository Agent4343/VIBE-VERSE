/**
 * SaveManager - Local Storage Management
 *
 * Handles saving and loading game data locally:
 * - Player progress
 * - Settings
 * - Offline scores (for later sync)
 *
 * Uses localStorage with JSON serialization and versioning.
 */

const STORAGE_KEYS = {
    PROGRESS: 'cosmic_academy_progress',
    SETTINGS: 'cosmic_academy_settings',
    OFFLINE_SCORES: 'cosmic_academy_offline_scores',
    VERSION: 'cosmic_academy_version'
};

const CURRENT_VERSION = '1.0.0';

class SaveManager {
    constructor() {
        this.isAvailable = this.checkStorage();
        this.migrateIfNeeded();
    }

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    checkStorage() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage not available:', e);
            return false;
        }
    }

    /**
     * Migrate data if version has changed
     */
    migrateIfNeeded() {
        if (!this.isAvailable) return;

        const savedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);

        if (savedVersion !== CURRENT_VERSION) {
            console.log(`Migrating save data from ${savedVersion || 'none'} to ${CURRENT_VERSION}`);
            // Add migration logic here if needed
            localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
        }
    }

    // ========================================
    // Progress Management
    // ========================================

    /**
     * Save player progress
     * @param {Object} progress - Progress data
     */
    saveProgress(progress) {
        if (!this.isAvailable) return false;

        try {
            const data = {
                ...progress,
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save progress:', error);
            return false;
        }
    }

    /**
     * Load player progress
     * @returns {Object|null}
     */
    loadProgress() {
        if (!this.isAvailable) return null;

        try {
            const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load progress:', error);
            return null;
        }
    }

    /**
     * Get default progress object
     * @returns {Object}
     */
    getDefaultProgress() {
        return {
            currentChapter: 1,
            currentLevel: 1,
            totalStars: 0,
            unlockedLevels: ['1-1'],
            achievements: [],
            playTime: 0,
            sessionsPlayed: 0
        };
    }

    /**
     * Reset progress to defaults
     */
    resetProgress() {
        this.saveProgress(this.getDefaultProgress());
    }

    // ========================================
    // Settings Management
    // ========================================

    /**
     * Save settings
     * @param {Object} settings - Settings data
     */
    saveSettings(settings) {
        if (!this.isAvailable) return false;

        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Load settings
     * @returns {Object|null}
     */
    loadSettings() {
        if (!this.isAvailable) return null;

        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }

    /**
     * Get default settings
     * @returns {Object}
     */
    getDefaultSettings() {
        return {
            musicVolume: 0.7,
            sfxVolume: 1.0,
            vibration: true,
            showHints: true,
            language: 'en',
            reducedMotion: false
        };
    }

    // ========================================
    // Offline Score Queue
    // ========================================

    /**
     * Queue a score for later submission (when offline)
     * @param {Object} scoreData - Score to queue
     */
    queueOfflineScore(scoreData) {
        if (!this.isAvailable) return false;

        try {
            const queue = this.getOfflineScoreQueue();
            queue.push({
                ...scoreData,
                queuedAt: Date.now()
            });
            localStorage.setItem(STORAGE_KEYS.OFFLINE_SCORES, JSON.stringify(queue));
            return true;
        } catch (error) {
            console.error('Failed to queue offline score:', error);
            return false;
        }
    }

    /**
     * Get queued offline scores
     * @returns {Array}
     */
    getOfflineScoreQueue() {
        if (!this.isAvailable) return [];

        try {
            const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_SCORES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load offline scores:', error);
            return [];
        }
    }

    /**
     * Remove a score from the offline queue
     * @param {number} index - Index to remove
     */
    removeOfflineScore(index) {
        if (!this.isAvailable) return;

        try {
            const queue = this.getOfflineScoreQueue();
            queue.splice(index, 1);
            localStorage.setItem(STORAGE_KEYS.OFFLINE_SCORES, JSON.stringify(queue));
        } catch (error) {
            console.error('Failed to remove offline score:', error);
        }
    }

    /**
     * Clear all queued offline scores
     */
    clearOfflineScoreQueue() {
        if (!this.isAvailable) return;
        localStorage.removeItem(STORAGE_KEYS.OFFLINE_SCORES);
    }

    // ========================================
    // Utility Methods
    // ========================================

    /**
     * Clear all saved data
     */
    clearAll() {
        if (!this.isAvailable) return;

        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    /**
     * Export all data as JSON string
     * @returns {string}
     */
    exportData() {
        if (!this.isAvailable) return '{}';

        const data = {};
        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            const value = localStorage.getItem(key);
            if (value) {
                data[name] = JSON.parse(value);
            }
        });

        return JSON.stringify(data, null, 2);
    }

    /**
     * Import data from JSON string
     * @param {string} jsonString - Data to import
     * @returns {boolean} Success
     */
    importData(jsonString) {
        if (!this.isAvailable) return false;

        try {
            const data = JSON.parse(jsonString);

            Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
                if (data[name]) {
                    localStorage.setItem(key, JSON.stringify(data[name]));
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * Get storage usage info
     * @returns {Object}
     */
    getStorageInfo() {
        if (!this.isAvailable) {
            return { used: 0, available: 0 };
        }

        let used = 0;
        Object.values(STORAGE_KEYS).forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                used += value.length * 2; // UTF-16 = 2 bytes per char
            }
        });

        return {
            used,
            usedKB: (used / 1024).toFixed(2),
            // Most browsers have 5MB limit
            available: 5 * 1024 * 1024 - used
        };
    }
}

// Export singleton instance
export default new SaveManager();
