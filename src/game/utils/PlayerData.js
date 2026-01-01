/**
 * PlayerData - Manages all player progression, unlocks, and rewards
 * Persists data to localStorage for retention
 */

const STORAGE_KEY = 'cosmic_cadet_player';

// Rank definitions - XP thresholds and titles
export const RANKS = [
    { level: 1, name: 'Space Recruit', xpRequired: 0, icon: '🌱', color: 0x888888 },
    { level: 2, name: 'Cadet', xpRequired: 100, icon: '⭐', color: 0x00ff00 },
    { level: 3, name: 'Junior Pilot', xpRequired: 300, icon: '✈️', color: 0x00ffff },
    { level: 4, name: 'Pilot', xpRequired: 600, icon: '🛩️', color: 0x0088ff },
    { level: 5, name: 'Senior Pilot', xpRequired: 1000, icon: '🚀', color: 0x0044ff },
    { level: 6, name: 'Flight Lieutenant', xpRequired: 1500, icon: '💫', color: 0x8800ff },
    { level: 7, name: 'Wing Commander', xpRequired: 2200, icon: '🌟', color: 0xff00ff },
    { level: 8, name: 'Squadron Leader', xpRequired: 3000, icon: '⚡', color: 0xff8800 },
    { level: 9, name: 'Captain', xpRequired: 4000, icon: '🔥', color: 0xff4400 },
    { level: 10, name: 'Commander', xpRequired: 5500, icon: '💎', color: 0xff0088 },
    { level: 11, name: 'Vice Admiral', xpRequired: 7500, icon: '👑', color: 0xffd700 },
    { level: 12, name: 'Admiral', xpRequired: 10000, icon: '🏆', color: 0xffd700 },
    { level: 13, name: 'Fleet Admiral', xpRequired: 15000, icon: '⚜️', color: 0xffffff },
    { level: 14, name: 'Grand Admiral', xpRequired: 25000, icon: '🌌', color: 0x00ffff },
    { level: 15, name: 'Legend', xpRequired: 50000, icon: '✨', color: 0xff00ff }
];

// Ship trail effects
export const TRAILS = {
    none: { id: 'none', name: 'None', color: null, cost: 0 },
    cyan: { id: 'cyan', name: 'Cyan Spark', color: 0x00ffff, cost: 0 },
    fire: { id: 'fire', name: 'Fire Trail', color: 0xff4400, cost: 200 },
    electric: { id: 'electric', name: 'Electric Blue', color: 0x0088ff, cost: 300 },
    toxic: { id: 'toxic', name: 'Toxic Green', color: 0x00ff44, cost: 300 },
    purple: { id: 'purple', name: 'Nebula Purple', color: 0x8800ff, cost: 400 },
    gold: { id: 'gold', name: 'Golden Streak', color: 0xffd700, cost: 500 },
    rainbow: { id: 'rainbow', name: 'Prismatic', color: 'rainbow', cost: 1000 },
    ghost: { id: 'ghost', name: 'Ghost Trail', color: 0xffffff, alpha: 0.3, cost: 750 },
    plasma: { id: 'plasma', name: 'Plasma Core', color: 0xff00ff, particles: true, cost: 1500 }
};

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

// Weekly challenge templates
const CHALLENGE_TEMPLATES = [
    { id: 'stars_weekly', name: 'Star Hunter', description: 'Collect {target} stars', target: 50, xpReward: 150, coinReward: 100, type: 'stars' },
    { id: 'levels_weekly', name: 'Level Crusher', description: 'Complete {target} levels', target: 5, xpReward: 200, coinReward: 150, type: 'levels' },
    { id: 'endless_weekly', name: 'Endurance Test', description: 'Survive {target} seconds in Endless', target: 120, xpReward: 250, coinReward: 200, type: 'endless' },
    { id: 'perfect_weekly', name: 'Flawless Pilot', description: 'Complete {target} levels without damage', target: 3, xpReward: 300, coinReward: 250, type: 'perfect' },
    { id: 'score_weekly', name: 'High Scorer', description: 'Earn {target} total points', target: 1000, xpReward: 200, coinReward: 150, type: 'score' },
    { id: 'games_weekly', name: 'Dedicated Player', description: 'Play {target} games', target: 10, xpReward: 150, coinReward: 100, type: 'games' },
    { id: 'combo_weekly', name: 'Combo Master', description: 'Get a {target}x combo', target: 5, xpReward: 200, coinReward: 150, type: 'combo' },
    { id: 'speed_weekly', name: 'Speed Runner', description: 'Beat {target} levels with 45+ seconds left', target: 3, xpReward: 250, coinReward: 200, type: 'speedrun' }
];

// Achievement definitions (including hidden ones)
export const ACHIEVEMENTS = {
    first_star: {
        id: 'first_star',
        name: 'Star Collector',
        description: 'Collect your first star',
        icon: '⭐',
        reward: 50,
        xpReward: 25
    },
    speedrun: {
        id: 'speedrun',
        name: 'Speed Demon',
        description: 'Complete a level with 60+ seconds remaining',
        icon: '⚡',
        reward: 100,
        xpReward: 50
    },
    perfect: {
        id: 'perfect',
        name: 'Untouchable',
        description: 'Complete a level without taking damage',
        icon: '🛡️',
        reward: 200,
        xpReward: 75
    },
    collector_100: {
        id: 'collector_100',
        name: 'Star Hoarder',
        description: 'Collect 100 total stars',
        icon: '💫',
        reward: 150,
        xpReward: 50
    },
    collector_500: {
        id: 'collector_500',
        name: 'Cosmic Collector',
        description: 'Collect 500 total stars',
        icon: '🌟',
        reward: 500,
        xpReward: 150
    },
    collector_1000: {
        id: 'collector_1000',
        name: 'Galaxy Gatherer',
        description: 'Collect 1000 total stars',
        icon: '🌌',
        reward: 1000,
        xpReward: 300
    },
    survivor: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive 60 seconds in Endless mode',
        icon: '💪',
        reward: 200,
        xpReward: 75
    },
    survivor_master: {
        id: 'survivor_master',
        name: 'Survival Master',
        description: 'Survive 180 seconds in Endless mode',
        icon: '🏆',
        reward: 500,
        xpReward: 200
    },
    survivor_legend: {
        id: 'survivor_legend',
        name: 'Immortal',
        description: 'Survive 300 seconds in Endless mode',
        icon: '👑',
        reward: 1000,
        xpReward: 500
    },
    chapter_complete: {
        id: 'chapter_complete',
        name: 'Chapter Champion',
        description: 'Complete all levels in a chapter',
        icon: '📖',
        reward: 300,
        xpReward: 100
    },
    all_ships: {
        id: 'all_ships',
        name: 'Fleet Commander',
        description: 'Unlock all ships',
        icon: '🚀',
        reward: 1000,
        xpReward: 400
    },
    streak_7: {
        id: 'streak_7',
        name: 'Dedicated Cadet',
        description: 'Play 7 days in a row',
        icon: '🔥',
        reward: 350,
        xpReward: 150
    },
    streak_30: {
        id: 'streak_30',
        name: 'Space Veteran',
        description: 'Play 30 days in a row',
        icon: '👑',
        reward: 1000,
        xpReward: 500
    },
    // Hidden achievements
    close_call: {
        id: 'close_call',
        name: 'Close Call',
        description: 'Finish a level with exactly 1 health',
        icon: '😰',
        reward: 150,
        xpReward: 75,
        hidden: true
    },
    combo_king: {
        id: 'combo_king',
        name: 'Combo King',
        description: 'Get a 10x combo',
        icon: '🔗',
        reward: 300,
        xpReward: 150,
        hidden: true
    },
    speed_freak: {
        id: 'speed_freak',
        name: 'Speed Freak',
        description: 'Complete a level in under 20 seconds',
        icon: '⏱️',
        reward: 400,
        xpReward: 200,
        hidden: true
    },
    night_owl: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Play between midnight and 4am',
        icon: '🦉',
        reward: 100,
        xpReward: 50,
        hidden: true
    },
    comeback_kid: {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Win a level after losing 2 lives',
        icon: '💪',
        reward: 200,
        xpReward: 100,
        hidden: true
    },
    explorer: {
        id: 'explorer',
        name: 'Explorer',
        description: 'Reach the edge of the map',
        icon: '🗺️',
        reward: 100,
        xpReward: 50,
        hidden: true
    },
    rank_up_5: {
        id: 'rank_up_5',
        name: 'Rising Star',
        description: 'Reach rank 5',
        icon: '📈',
        reward: 200,
        xpReward: 100,
        hidden: true
    },
    rank_up_10: {
        id: 'rank_up_10',
        name: 'Elite Pilot',
        description: 'Reach rank 10',
        icon: '🎖️',
        reward: 500,
        xpReward: 250,
        hidden: true
    },
    first_challenge: {
        id: 'first_challenge',
        name: 'Challenger',
        description: 'Complete your first weekly challenge',
        icon: '🎯',
        reward: 100,
        xpReward: 50,
        hidden: true
    }
};

// Daily reward tiers
export const DAILY_REWARDS = [
    { day: 1, coins: 25, xp: 10, bonus: null },
    { day: 2, coins: 50, xp: 20, bonus: null },
    { day: 3, coins: 75, xp: 30, bonus: null },
    { day: 4, coins: 100, xp: 40, bonus: null },
    { day: 5, coins: 150, xp: 50, bonus: null },
    { day: 6, coins: 200, xp: 75, bonus: null },
    { day: 7, coins: 500, xp: 150, bonus: 'mystery_box' }
];

class PlayerDataManager {
    constructor() {
        this.data = this.load();
    }

    getDefaultData() {
        return {
            // Profile
            username: 'Cadet',

            // Currency & XP
            coins: 0,
            totalCoinsEarned: 0,
            xp: 0,
            totalXpEarned: 0,

            // Ships & Customization
            currentShip: 'starter',
            unlockedShips: ['starter'],
            currentTrail: 'cyan',
            unlockedTrails: ['none', 'cyan'],

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

            // Weekly Challenges
            weeklyChallenges: [],
            weeklyProgress: {},
            lastWeeklyReset: null,
            challengesCompleted: 0,

            // Stats
            totalPlayTime: 0,
            totalDeaths: 0,
            totalLevelsCompleted: 0,
            endlessBestTime: 0,
            totalGamesPlayed: 0,
            perfectLevels: 0,
            highestCombo: 0,
            totalScore: 0,

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

        // Award XP for achievements
        if (achievement.xpReward) {
            this.addXP(achievement.xpReward);
        }

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

        // Award XP for daily login
        if (reward.xp) {
            this.addXP(reward.xp);
        }

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
    completeLevel(chapter, level, score, timeLeft, damageTaken, completionTime = 0) {
        const levelKey = `${chapter}-${level}`;

        // Update completed levels
        if (!this.data.completedLevels.includes(levelKey)) {
            this.data.completedLevels.push(levelKey);
            this.data.totalLevelsCompleted++;
            this.updateChallengeProgress('levels', 1);
        }

        // Update high score
        if (!this.data.highScores[levelKey] || score > this.data.highScores[levelKey]) {
            this.data.highScores[levelKey] = score;
        }

        // Track total score
        this.addToTotalScore(score);

        // Award coins based on performance
        const baseCoins = Math.floor(score / 10);
        const timeBonus = timeLeft * 2;
        const totalCoins = baseCoins + timeBonus;
        this.addCoins(totalCoins);

        // Award XP based on performance
        const baseXP = 20 + (chapter * 5);
        const timeBonusXP = Math.floor(timeLeft / 2);
        const perfectBonusXP = damageTaken === 0 ? 25 : 0;
        const totalXP = baseXP + timeBonusXP + perfectBonusXP;
        this.addXP(totalXP);

        // Record game played
        this.recordGamePlayed();

        // Check achievements
        if (timeLeft >= 60) {
            this.unlockAchievement('speedrun');
            this.recordSpeedrun();
        }

        // Speed freak - under 20 seconds (hidden achievement)
        if (completionTime > 0 && completionTime < 20) {
            this.unlockAchievement('speed_freak');
        }

        if (damageTaken === 0) {
            this.unlockAchievement('perfect');
            this.recordPerfectLevel();
        }

        // Check chapter complete
        const chapterLevels = [1, 2, 3, 4, 5].map(l => `${chapter}-${l}`);
        if (chapterLevels.every(l => this.data.completedLevels.includes(l))) {
            this.unlockAchievement('chapter_complete');
        }

        this.save();
        return { coins: totalCoins, xp: totalXP };
    }

    addStarsCollected(amount) {
        this.data.totalStarsCollected += amount;

        // Update challenge progress
        this.updateChallengeProgress('stars', amount);

        // Star achievements
        if (this.data.totalStarsCollected >= 1) {
            this.unlockAchievement('first_star');
        }
        if (this.data.totalStarsCollected >= 100) {
            this.unlockAchievement('collector_100');
        }
        if (this.data.totalStarsCollected >= 500) {
            this.unlockAchievement('collector_500');
        }
        if (this.data.totalStarsCollected >= 1000) {
            this.unlockAchievement('collector_1000');
        }

        this.save();
    }

    // Endless Mode
    updateEndlessBest(time) {
        const isNewRecord = time > this.data.endlessBestTime;

        if (isNewRecord) {
            this.data.endlessBestTime = time;
            // Award coins for new record
            this.addCoins(Math.floor(time));
        }

        // Award XP based on survival time
        const xpGained = Math.floor(time / 3) + 10;
        this.addXP(xpGained);

        // Update challenge progress
        this.updateChallengeProgress('endless', time);

        // Record game played
        this.recordGamePlayed();

        // Check achievements
        if (time >= 60) {
            this.unlockAchievement('survivor');
        }
        if (time >= 180) {
            this.unlockAchievement('survivor_master');
        }
        if (time >= 300) {
            this.unlockAchievement('survivor_legend');
        }

        this.save();
        return { bestTime: this.data.endlessBestTime, isNewRecord, xpGained };
    }

    // Stats
    recordDeath() {
        this.data.totalDeaths++;
        this.save();
    }

    recordGamePlayed() {
        this.data.totalGamesPlayed++;
        this.updateChallengeProgress('games', 1);

        // Check night owl achievement
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 4) {
            this.unlockAchievement('night_owl');
        }

        this.save();
    }

    // XP & Rank System
    addXP(amount) {
        const oldRank = this.getRank();
        this.data.xp += amount;
        this.data.totalXpEarned += amount;
        const newRank = this.getRank();

        // Check for rank up
        if (newRank.level > oldRank.level) {
            // Check rank achievements
            if (newRank.level >= 5) {
                this.unlockAchievement('rank_up_5');
            }
            if (newRank.level >= 10) {
                this.unlockAchievement('rank_up_10');
            }
        }

        this.save();
        return { xpGained: amount, oldRank, newRank, leveledUp: newRank.level > oldRank.level };
    }

    getRank() {
        const xp = this.data.xp || 0;
        let currentRank = RANKS[0];

        for (const rank of RANKS) {
            if (xp >= rank.xpRequired) {
                currentRank = rank;
            } else {
                break;
            }
        }

        return currentRank;
    }

    getNextRank() {
        const currentRank = this.getRank();
        const nextRankIndex = RANKS.findIndex(r => r.level === currentRank.level) + 1;

        if (nextRankIndex >= RANKS.length) {
            return null; // Max rank
        }

        return RANKS[nextRankIndex];
    }

    getXPProgress() {
        const currentRank = this.getRank();
        const nextRank = this.getNextRank();

        if (!nextRank) {
            return { current: this.data.xp, needed: 0, progress: 1 };
        }

        const xpIntoRank = this.data.xp - currentRank.xpRequired;
        const xpNeeded = nextRank.xpRequired - currentRank.xpRequired;

        return {
            current: xpIntoRank,
            needed: xpNeeded,
            progress: xpIntoRank / xpNeeded
        };
    }

    // Trail System
    getCurrentTrail() {
        return TRAILS[this.data.currentTrail] || TRAILS.cyan;
    }

    selectTrail(trailId) {
        if (this.data.unlockedTrails.includes(trailId)) {
            this.data.currentTrail = trailId;
            this.save();
            return true;
        }
        return false;
    }

    unlockTrail(trailId) {
        const trail = TRAILS[trailId];
        if (!trail || this.data.unlockedTrails.includes(trailId)) {
            return false;
        }

        if (this.spendCoins(trail.cost)) {
            this.data.unlockedTrails.push(trailId);
            this.save();
            return true;
        }
        return false;
    }

    isTrailUnlocked(trailId) {
        return this.data.unlockedTrails.includes(trailId);
    }

    // Weekly Challenges
    getWeeklyChallenges() {
        this.checkWeeklyReset();
        return this.data.weeklyChallenges;
    }

    checkWeeklyReset() {
        const now = new Date();
        const monday = this.getMonday(now);
        const mondayStr = monday.toDateString();

        if (this.data.lastWeeklyReset !== mondayStr) {
            this.generateWeeklyChallenges();
            this.data.lastWeeklyReset = mondayStr;
            this.data.weeklyProgress = {};
            this.save();
        }
    }

    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    generateWeeklyChallenges() {
        // Pick 3 random challenges
        const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
        this.data.weeklyChallenges = shuffled.slice(0, 3).map(template => ({
            ...template,
            description: template.description.replace('{target}', template.target),
            completed: false
        }));
    }

    updateChallengeProgress(type, amount) {
        if (!this.data.weeklyProgress) {
            this.data.weeklyProgress = {};
        }

        this.data.weeklyProgress[type] = (this.data.weeklyProgress[type] || 0) + amount;

        // Check if any challenges are completed
        for (const challenge of this.data.weeklyChallenges || []) {
            if (!challenge.completed && challenge.type === type) {
                if (this.data.weeklyProgress[type] >= challenge.target) {
                    this.completeChallenge(challenge);
                }
            }
        }

        this.save();
    }

    completeChallenge(challenge) {
        challenge.completed = true;
        this.data.challengesCompleted++;

        // Award rewards
        this.addCoins(challenge.coinReward);
        this.addXP(challenge.xpReward);

        // First challenge achievement
        if (this.data.challengesCompleted === 1) {
            this.unlockAchievement('first_challenge');
        }

        this.save();
        return challenge;
    }

    getChallengeProgress(challengeType) {
        return this.data.weeklyProgress?.[challengeType] || 0;
    }

    // Combo tracking
    updateHighestCombo(combo) {
        if (combo > this.data.highestCombo) {
            this.data.highestCombo = combo;
            this.save();
        }

        // Update challenge progress
        this.updateChallengeProgress('combo', combo);

        // Check combo achievement
        if (combo >= 10) {
            this.unlockAchievement('combo_king');
        }
    }

    // Enhanced level completion with more tracking
    recordPerfectLevel() {
        this.data.perfectLevels++;
        this.updateChallengeProgress('perfect', 1);
        this.save();
    }

    recordSpeedrun() {
        this.updateChallengeProgress('speedrun', 1);
    }

    addToTotalScore(score) {
        this.data.totalScore += score;
        this.updateChallengeProgress('score', score);
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
