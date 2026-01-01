/**
 * PlayerData - Manages all player progression, unlocks, and rewards
 * Persists data to localStorage for retention
 */

const STORAGE_KEY = 'cosmic_cadet_player';

// Ship definitions
export const SHIPS = {
    starter: {
        id: 'starter',
        name: 'Cadet Cruiser',
        description: 'Your trusty starter ship',
        color: 0x00ffff,
        speed: 350,
        cost: 0,
        unlocked: true
    },
    speedster: {
        id: 'speedster',
        name: 'Velocity Viper',
        description: 'Fast but fragile',
        color: 0x00ff00,
        speed: 450,
        cost: 500,
        unlocked: false
    },
    tank: {
        id: 'tank',
        name: 'Iron Guardian',
        description: 'Slow but sturdy',
        color: 0xff6600,
        speed: 250,
        extraHealth: 2,
        cost: 750,
        unlocked: false
    },
    stealth: {
        id: 'stealth',
        name: 'Shadow Phantom',
        description: 'Harder for enemies to track',
        color: 0x9900ff,
        speed: 350,
        stealthMode: true,
        cost: 1000,
        unlocked: false
    },
    golden: {
        id: 'golden',
        name: 'Golden Comet',
        description: 'Double star value!',
        color: 0xffd700,
        speed: 350,
        doubleStars: true,
        cost: 2000,
        unlocked: false
    },
    rainbow: {
        id: 'rainbow',
        name: 'Prismatic Nova',
        description: 'The ultimate ship',
        color: 0xff00ff,
        speed: 400,
        extraHealth: 1,
        doubleStars: true,
        cost: 5000,
        unlocked: false
    }
};

// Achievement definitions
export const ACHIEVEMENTS = {
    first_star: {
        id: 'first_star',
        name: 'Star Collector',
        description: 'Collect your first star',
        icon: '⭐',
        reward: 50
    },
    speedrun: {
        id: 'speedrun',
        name: 'Speed Demon',
        description: 'Complete a level with 60+ seconds remaining',
        icon: '⚡',
        reward: 100
    },
    perfect: {
        id: 'perfect',
        name: 'Untouchable',
        description: 'Complete a level without taking damage',
        icon: '🛡️',
        reward: 200
    },
    collector_100: {
        id: 'collector_100',
        name: 'Star Hoarder',
        description: 'Collect 100 total stars',
        icon: '💫',
        reward: 150
    },
    collector_500: {
        id: 'collector_500',
        name: 'Cosmic Collector',
        description: 'Collect 500 total stars',
        icon: '🌟',
        reward: 500
    },
    survivor: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive 60 seconds in Endless mode',
        icon: '💪',
        reward: 200
    },
    survivor_master: {
        id: 'survivor_master',
        name: 'Survival Master',
        description: 'Survive 180 seconds in Endless mode',
        icon: '🏆',
        reward: 500
    },
    chapter_complete: {
        id: 'chapter_complete',
        name: 'Chapter Champion',
        description: 'Complete all levels in a chapter',
        icon: '📖',
        reward: 300
    },
    all_ships: {
        id: 'all_ships',
        name: 'Fleet Commander',
        description: 'Unlock all ships',
        icon: '🚀',
        reward: 1000
    },
    streak_7: {
        id: 'streak_7',
        name: 'Dedicated Cadet',
        description: 'Play 7 days in a row',
        icon: '🔥',
        reward: 350
    },
    streak_30: {
        id: 'streak_30',
        name: 'Space Veteran',
        description: 'Play 30 days in a row',
        icon: '👑',
        reward: 1000
    }
};

// Daily reward tiers
export const DAILY_REWARDS = [
    { day: 1, coins: 25, bonus: null },
    { day: 2, coins: 50, bonus: null },
    { day: 3, coins: 75, bonus: null },
    { day: 4, coins: 100, bonus: null },
    { day: 5, coins: 150, bonus: null },
    { day: 6, coins: 200, bonus: null },
    { day: 7, coins: 500, bonus: 'mystery_box' }
];

class PlayerDataManager {
    constructor() {
        this.data = this.load();
    }

    getDefaultData() {
        return {
            // Profile
            username: 'Cadet',

            // Currency
            coins: 0,
            totalCoinsEarned: 0,

            // Ships
            currentShip: 'starter',
            unlockedShips: ['starter'],

            // Progress
            currentChapter: 1,
            currentLevel: 1,
            completedLevels: [],
            totalStarsCollected: 0,
            highScores: {},

            // Achievements
            unlockedAchievements: [],

            // Streaks & Daily
            lastPlayDate: null,
            currentStreak: 0,
            longestStreak: 0,
            dailyRewardDay: 0,
            lastDailyReward: null,

            // Stats
            totalPlayTime: 0,
            totalDeaths: 0,
            totalLevelsCompleted: 0,
            endlessBestTime: 0,

            // Settings
            soundEnabled: true,
            musicEnabled: true
        };
    }

    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to handle new fields
                return { ...this.getDefaultData(), ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load player data:', e);
        }
        return this.getDefaultData();
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save player data:', e);
        }
    }

    // Currency
    addCoins(amount) {
        this.data.coins += amount;
        this.data.totalCoinsEarned += amount;
        this.save();
        return this.data.coins;
    }

    spendCoins(amount) {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    // Ships
    getCurrentShip() {
        return SHIPS[this.data.currentShip] || SHIPS.starter;
    }

    selectShip(shipId) {
        if (this.data.unlockedShips.includes(shipId)) {
            this.data.currentShip = shipId;
            this.save();
            return true;
        }
        return false;
    }

    unlockShip(shipId) {
        const ship = SHIPS[shipId];
        if (!ship || this.data.unlockedShips.includes(shipId)) {
            return false;
        }

        if (this.spendCoins(ship.cost)) {
            this.data.unlockedShips.push(shipId);
            this.save();

            // Check all ships achievement
            if (this.data.unlockedShips.length === Object.keys(SHIPS).length) {
                this.unlockAchievement('all_ships');
            }

            return true;
        }
        return false;
    }

    isShipUnlocked(shipId) {
        return this.data.unlockedShips.includes(shipId);
    }

    // Achievements
    unlockAchievement(achievementId) {
        if (this.data.unlockedAchievements.includes(achievementId)) {
            return null;
        }

        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return null;

        this.data.unlockedAchievements.push(achievementId);
        this.addCoins(achievement.reward);
        this.save();

        return achievement;
    }

    hasAchievement(achievementId) {
        return this.data.unlockedAchievements.includes(achievementId);
    }

    // Daily Rewards
    checkDailyReward() {
        const today = new Date().toDateString();
        const lastReward = this.data.lastDailyReward;

        if (lastReward === today) {
            return null; // Already claimed today
        }

        // Check if streak continues
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastReward === yesterday.toDateString()) {
            // Continue streak
            this.data.dailyRewardDay = (this.data.dailyRewardDay % 7) + 1;
        } else {
            // Reset streak
            this.data.dailyRewardDay = 1;
        }

        return DAILY_REWARDS[this.data.dailyRewardDay - 1];
    }

    claimDailyReward() {
        const reward = this.checkDailyReward();
        if (!reward) return null;

        const today = new Date().toDateString();
        this.data.lastDailyReward = today;
        this.addCoins(reward.coins);

        // Update play streak
        this.updatePlayStreak();

        this.save();
        return reward;
    }

    updatePlayStreak() {
        const today = new Date().toDateString();
        const lastPlay = this.data.lastPlayDate;

        if (lastPlay === today) {
            return; // Already played today
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastPlay === yesterday.toDateString()) {
            this.data.currentStreak++;
        } else {
            this.data.currentStreak = 1;
        }

        if (this.data.currentStreak > this.data.longestStreak) {
            this.data.longestStreak = this.data.currentStreak;
        }

        this.data.lastPlayDate = today;

        // Check streak achievements
        if (this.data.currentStreak >= 7) {
            this.unlockAchievement('streak_7');
        }
        if (this.data.currentStreak >= 30) {
            this.unlockAchievement('streak_30');
        }

        this.save();
    }

    // Level Progress
    completeLevel(chapter, level, score, timeLeft, damageTaken) {
        const levelKey = `${chapter}-${level}`;

        // Update completed levels
        if (!this.data.completedLevels.includes(levelKey)) {
            this.data.completedLevels.push(levelKey);
            this.data.totalLevelsCompleted++;
        }

        // Update high score
        if (!this.data.highScores[levelKey] || score > this.data.highScores[levelKey]) {
            this.data.highScores[levelKey] = score;
        }

        // Award coins based on performance
        const baseCoins = Math.floor(score / 10);
        const timeBonus = timeLeft * 2;
        const totalCoins = baseCoins + timeBonus;
        this.addCoins(totalCoins);

        // Check achievements
        if (timeLeft >= 60) {
            this.unlockAchievement('speedrun');
        }
        if (damageTaken === 0) {
            this.unlockAchievement('perfect');
        }

        // Check chapter complete
        const chapterLevels = [1, 2, 3, 4, 5].map(l => `${chapter}-${l}`);
        if (chapterLevels.every(l => this.data.completedLevels.includes(l))) {
            this.unlockAchievement('chapter_complete');
        }

        this.save();
        return totalCoins;
    }

    addStarsCollected(amount) {
        this.data.totalStarsCollected += amount;

        // First star achievement
        if (this.data.totalStarsCollected >= 1) {
            this.unlockAchievement('first_star');
        }
        if (this.data.totalStarsCollected >= 100) {
            this.unlockAchievement('collector_100');
        }
        if (this.data.totalStarsCollected >= 500) {
            this.unlockAchievement('collector_500');
        }

        this.save();
    }

    // Endless Mode
    updateEndlessBest(time) {
        if (time > this.data.endlessBestTime) {
            this.data.endlessBestTime = time;

            // Award coins for new record
            this.addCoins(Math.floor(time));
        }

        // Check achievements
        if (time >= 60) {
            this.unlockAchievement('survivor');
        }
        if (time >= 180) {
            this.unlockAchievement('survivor_master');
        }

        this.save();
        return this.data.endlessBestTime;
    }

    // Stats
    recordDeath() {
        this.data.totalDeaths++;
        this.save();
    }

    // Reset (for testing)
    reset() {
        this.data = this.getDefaultData();
        this.save();
    }
}

// Singleton instance
export const PlayerData = new PlayerDataManager();
export default PlayerData;
