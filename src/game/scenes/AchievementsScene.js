/**
 * AchievementsScene - View unlocked achievements and progress
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';
import { PlayerData, ACHIEVEMENTS, DAILY_REWARDS } from '../utils/PlayerData.js';

export default class AchievementsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AchievementsScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;

        this.cameras.main.fadeIn(500);

        // Background
        this.createBackground(width, height);

        // Title
        this.add.text(centerX, 40, '🏆 ACHIEVEMENTS', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Stats summary
        this.createStatsSummary(centerX, 90);

        // Achievements grid
        this.createAchievementsGrid(centerX, height);

        // Daily reward section
        this.createDailyReward(centerX, height);

        // Back button
        this.add.text(20, 20, '← Back', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#888888'
        }).setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', function() { this.setColor('#ffffff'); })
            .on('pointerout', function() { this.setColor('#888888'); })
            .on('pointerdown', () => {
                this.cameras.main.fadeOut(300);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('MenuScene');
                });
            });
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2a1a4e, 0x2a1a4e, 1);
        bg.fillRect(0, 0, width, height);

        for (let i = 0; i < 80; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const star = this.add.circle(x, y, Math.random() * 1.5 + 0.5, 0xffffff, Math.random() * 0.6 + 0.2);

            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: Math.random() * 2000 + 1000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    createStatsSummary(centerX, y) {
        const data = PlayerData.data;
        const unlockedCount = data.unlockedAchievements.length;
        const totalCount = Object.keys(ACHIEVEMENTS).length;

        // Progress bar
        const barWidth = 300;
        const progress = unlockedCount / totalCount;

        const barBg = this.add.rectangle(centerX, y, barWidth, 20, 0x333333);
        barBg.setStrokeStyle(2, 0x00ffff);

        const barFill = this.add.rectangle(
            centerX - barWidth/2 + (barWidth * progress)/2,
            y,
            barWidth * progress,
            16,
            0x00ffff
        );

        this.add.text(centerX, y, `${unlockedCount}/${totalCount}`, {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#000000'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Quick stats
        this.add.text(centerX - 150, y + 25, `💰 ${data.coins}`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffd700'
        }).setOrigin(0, 0);

        this.add.text(centerX, y + 25, `🔥 ${data.currentStreak} days`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ff6600'
        }).setOrigin(0.5, 0);

        this.add.text(centerX + 150, y + 25, `⭐ ${data.totalStarsCollected}`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffff00'
        }).setOrigin(1, 0);
    }

    createAchievementsGrid(centerX, height) {
        const achievements = Object.values(ACHIEVEMENTS);
        const cols = 3;
        const cellWidth = 200;
        const cellHeight = 80;
        const startX = centerX - ((cols - 1) * cellWidth) / 2;
        const startY = 160;

        achievements.forEach((achievement, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * cellWidth;
            const y = startY + row * cellHeight;

            this.createAchievementCard(x, y, achievement);
        });
    }

    createAchievementCard(x, y, achievement) {
        const isUnlocked = PlayerData.hasAchievement(achievement.id);

        const card = this.add.container(x, y);

        // Background
        const bg = this.add.rectangle(0, 0, 180, 70, isUnlocked ? 0x1a3a1a : 0x1a1a2e, 0.9);
        bg.setStrokeStyle(2, isUnlocked ? 0x00ff00 : 0x333333);
        card.add(bg);

        // Icon
        const icon = this.add.text(-70, 0, isUnlocked ? achievement.icon : '🔒', {
            fontSize: '28px'
        }).setOrigin(0.5);
        if (!isUnlocked) icon.setAlpha(0.5);
        card.add(icon);

        // Name
        const name = this.add.text(-30, -15, achievement.name, {
            fontFamily: 'Arial Black',
            fontSize: '12px',
            color: isUnlocked ? '#ffffff' : '#666666'
        }).setOrigin(0, 0.5);
        card.add(name);

        // Description
        const desc = this.add.text(-30, 5, achievement.description, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#888888',
            wordWrap: { width: 130 }
        }).setOrigin(0, 0);
        card.add(desc);

        // Reward
        const reward = this.add.text(80, -20, `+${achievement.reward}💰`, {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: isUnlocked ? '#ffd700' : '#444444'
        }).setOrigin(1, 0.5);
        card.add(reward);

        card.setDepth(DEPTH.UI);
    }

    createDailyReward(centerX, height) {
        const reward = PlayerData.checkDailyReward();
        const y = height - 80;

        // Daily reward box
        const box = this.add.container(centerX, y);

        const bg = this.add.rectangle(0, 0, 300, 60, reward ? 0x2a1a4a : 0x1a1a2a, 0.9);
        bg.setStrokeStyle(2, reward ? 0xffd700 : 0x333333);
        box.add(bg);

        if (reward) {
            // Available to claim
            this.add.text(0, -15, `🎁 Daily Reward: Day ${PlayerData.data.dailyRewardDay + 1}`, {
                fontFamily: 'Arial Black',
                fontSize: '16px',
                color: '#ffd700'
            }).setOrigin(0.5);

            const claimBtn = this.add.text(0, 12, `CLAIM +${reward.coins}💰`, {
                fontFamily: 'Arial Black',
                fontSize: '18px',
                color: '#00ff00'
            }).setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.claimReward());
            box.add(claimBtn);

            // Pulsing effect
            this.tweens.add({
                targets: bg,
                scaleX: 1.02,
                scaleY: 1.02,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        } else {
            this.add.text(0, 0, '✓ Daily reward claimed! Come back tomorrow', {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#888888'
            }).setOrigin(0.5);
        }

        box.setDepth(DEPTH.UI);
    }

    claimReward() {
        const reward = PlayerData.claimDailyReward();
        if (reward) {
            // Flash effect
            this.cameras.main.flash(300, 255, 215, 0);

            // Refresh scene
            this.time.delayedCall(500, () => this.scene.restart());
        }
    }
}
