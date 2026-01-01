/**
 * MenuScene - Main Menu Scene
 *
 * Enhanced with engagement features
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';
import { PlayerData } from '../utils/PlayerData.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    init() {
        this.buttons = [];
        this.currentSelection = 0;

        // Update play streak on menu load
        PlayerData.updatePlayStreak();
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        this.cameras.main.fadeIn(500);

        // Create background
        this.createBackground(width, height);

        // Create title
        this.createTitle(centerX);

        // Player stats bar
        this.createStatsBar(width);

        // Create menu buttons
        this.createMenuButtons(centerX, centerY);

        // Create quick action buttons
        this.createQuickButtons(width, height);

        // Weekly challenges panel
        this.createChallengesPanel(width, height);

        // Daily reward notification
        this.checkDailyReward(width, height);

        // Version text
        this.add.text(10, height - 30, 'v2.1.0', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#444444'
        }).setDepth(DEPTH.UI);

        // Setup input
        this.setupInput();
    }

    createBackground(width, height) {
        // Gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
        bg.fillRect(0, 0, width, height);
        bg.setDepth(DEPTH.BACKGROUND);

        // Animated stars
        for (let i = 0; i < 80; i++) {
            const star = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 2 + 0.5,
                0xffffff,
                Math.random() * 0.6 + 0.3
            ).setDepth(DEPTH.BACKGROUND + 1);

            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: Math.random() * 2000 + 1000,
                yoyo: true,
                repeat: -1
            });
        }

        // Nebula effect
        for (let i = 0; i < 3; i++) {
            const nebula = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 150 + 80,
                [0xff00ff, 0x00ffff, 0x6600ff][i],
                0.03
            ).setDepth(DEPTH.BACKGROUND + 2);
        }
    }

    createTitle(centerX) {
        const title = this.add.text(centerX, 80, 'COSMIC CADET\nACADEMY', {
            fontFamily: 'Arial Black',
            fontSize: '42px',
            color: '#00ffff',
            align: 'center',
            stroke: '#003366',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        this.add.text(centerX, 155, '🚀 Space Adventure for Young Explorers 🌟', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#aaaaff'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        this.tweens.add({
            targets: title,
            y: '+=6',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    createStatsBar(width) {
        const data = PlayerData.data;
        const rank = PlayerData.getRank();
        const xpProgress = PlayerData.getXPProgress();
        const y = 175;

        // Rank badge (left side)
        const rankBadge = this.add.container(80, y).setDepth(DEPTH.UI);

        // Rank icon and name
        this.add.text(0, 0, `${rank.icon} ${rank.name}`, {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#' + rank.color.toString(16).padStart(6, '0')
        }).setOrigin(0, 0.5).setDepth(DEPTH.UI);

        // XP Progress bar
        const barWidth = 100;
        const barHeight = 8;
        const barY = y + 18;
        const barX = 30;

        // Background
        this.add.rectangle(barX + barWidth/2, barY, barWidth, barHeight, 0x333333)
            .setDepth(DEPTH.UI);

        // Progress fill
        const fillWidth = Math.max(4, barWidth * xpProgress.progress);
        this.add.rectangle(barX + fillWidth/2, barY, fillWidth, barHeight - 2, rank.color)
            .setDepth(DEPTH.UI + 1);

        // XP text
        const nextRank = PlayerData.getNextRank();
        const xpText = nextRank ?
            `${xpProgress.current}/${xpProgress.needed} XP` :
            'MAX RANK';

        this.add.text(barX + barWidth + 10, barY, xpText, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#888888'
        }).setOrigin(0, 0.5).setDepth(DEPTH.UI);

        // Currency stats (right side)
        const statsX = width - 80;

        // Coins
        this.add.text(statsX, y - 10, `💰 ${data.coins}`, {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#ffd700'
        }).setOrigin(1, 0.5).setDepth(DEPTH.UI);

        // Stars
        this.add.text(statsX, y + 10, `⭐ ${data.totalStarsCollected}`, {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#ffff00'
        }).setOrigin(1, 0.5).setDepth(DEPTH.UI);

        // Streak (if active)
        if (data.currentStreak > 1) {
            this.add.text(statsX, y + 28, `🔥 ${data.currentStreak} day streak`, {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#ff6600'
            }).setOrigin(1, 0.5).setDepth(DEPTH.UI);
        }
    }

    createChallengesPanel(width, height) {
        const challenges = PlayerData.getWeeklyChallenges();
        if (!challenges || challenges.length === 0) return;

        const panelX = 15;
        const panelY = height - 160;
        const panelWidth = 200;

        // Panel background
        const panel = this.add.rectangle(panelX + panelWidth/2, panelY + 60, panelWidth, 130, 0x000000, 0.5)
            .setDepth(DEPTH.UI);
        panel.setStrokeStyle(1, 0x00ffff, 0.5);

        // Title
        this.add.text(panelX + 10, panelY + 5, '📋 Weekly Challenges', {
            fontFamily: 'Arial Black',
            fontSize: '12px',
            color: '#00ffff'
        }).setDepth(DEPTH.UI + 1);

        // Challenges list
        challenges.forEach((challenge, i) => {
            const cy = panelY + 30 + (i * 35);
            const progress = PlayerData.getChallengeProgress(challenge.type);
            const progressPercent = Math.min(1, progress / challenge.target);

            // Challenge name
            const statusIcon = challenge.completed ? '✅' : '⬜';
            const nameColor = challenge.completed ? '#00ff00' : '#ffffff';

            this.add.text(panelX + 10, cy, `${statusIcon} ${challenge.name}`, {
                fontFamily: 'Arial',
                fontSize: '11px',
                color: nameColor
            }).setDepth(DEPTH.UI + 1);

            // Progress bar (if not completed)
            if (!challenge.completed) {
                const barWidth = 80;
                const barX = panelX + panelWidth - barWidth - 10;

                this.add.rectangle(barX + barWidth/2, cy + 12, barWidth, 6, 0x333333)
                    .setDepth(DEPTH.UI + 1);

                const fillWidth = Math.max(2, barWidth * progressPercent);
                this.add.rectangle(barX + fillWidth/2, cy + 12, fillWidth, 4, 0x00ffff)
                    .setDepth(DEPTH.UI + 2);

                this.add.text(barX + barWidth + 5, cy + 12, `${progress}/${challenge.target}`, {
                    fontFamily: 'Arial',
                    fontSize: '9px',
                    color: '#888888'
                }).setOrigin(0, 0.5).setDepth(DEPTH.UI + 1);
            } else {
                this.add.text(panelX + panelWidth - 15, cy + 8, `+${challenge.xpReward}XP`, {
                    fontFamily: 'Arial',
                    fontSize: '10px',
                    color: '#00ff00'
                }).setOrigin(1, 0.5).setDepth(DEPTH.UI + 1);
            }
        });
    }

    createMenuButtons(centerX, centerY) {
        const buttonConfig = [
            { text: '▶ PLAY', y: centerY - 30, callback: () => this.onPlay(), primary: true },
            { text: '∞ ENDLESS', y: centerY + 35, callback: () => this.onEndless(), color: 0xff00ff },
            { text: '📋 LEVELS', y: centerY + 90, callback: () => this.onLevels() },
            { text: '🚀 SHIPS', y: centerY + 145, callback: () => this.onShips() },
            { text: '🥊 NEON FIGHTERS', y: centerY + 200, callback: () => this.onFighters(), color: 0x880044 }
        ];

        buttonConfig.forEach((config, index) => {
            const button = this.createButton(
                centerX,
                config.y,
                config.text,
                config.callback,
                index,
                config.primary,
                config.color
            );
            this.buttons.push(button);
        });
    }

    createButton(x, y, text, callback, index, primary = false, color = 0x1a4a6e) {
        const container = this.add.container(x, y).setDepth(DEPTH.UI);

        const width = primary ? 300 : 260;
        const height = primary ? 60 : 50;

        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
        bg.lineStyle(primary ? 3 : 2, primary ? 0x00ff00 : 0x00ffff, 1);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);

        const label = this.add.text(0, 0, text, {
            fontFamily: 'Arial Black',
            fontSize: primary ? '26px' : '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, label]);
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true });

        container.bg = bg;
        container.label = label;
        container.bgColor = color;
        container.buttonWidth = width;
        container.buttonHeight = height;
        container.isPrimary = primary;

        // Entrance animation
        container.setAlpha(0);
        container.x = x - 80;

        this.tweens.add({
            targets: container,
            alpha: 1,
            x: x,
            duration: 350,
            ease: 'Power2',
            delay: 300 + (index * 80)
        });

        // Hover effects
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(primary ? 0x00aa00 : 0x2a6a9e, 1);
            bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
            bg.lineStyle(3, primary ? 0x00ff00 : 0x00ffff, 1);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(container.bgColor, 1);
            bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
            bg.lineStyle(primary ? 3 : 2, primary ? 0x00ff00 : 0x00ffff, 1);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        container.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
        });

        return container;
    }

    createQuickButtons(width, height) {
        // Settings button (top right)
        const settingsBtn = this.add.text(width - 20, 20, '⚙️', {
            fontSize: '32px'
        }).setOrigin(1, 0).setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', function() { this.setScale(1.2); })
            .on('pointerout', function() { this.setScale(1); })
            .on('pointerdown', () => this.transitionTo('SettingsScene'));

        // Current ship indicator (bottom left)
        const ship = PlayerData.getCurrentShip();
        this.add.text(20, height - 60, `Ship: ${ship.name}`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#888888'
        }).setDepth(DEPTH.UI);

        // Best endless time (if any)
        if (PlayerData.data.endlessBestTime > 0) {
            this.add.text(width - 20, height - 30, `Best Endless: ${PlayerData.data.endlessBestTime}s`, {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ff00ff'
            }).setOrigin(1, 0).setDepth(DEPTH.UI);
        }
    }

    checkDailyReward(width, height) {
        const reward = PlayerData.checkDailyReward();
        if (reward) {
            // Show notification
            const notification = this.add.container(width - 100, 80).setDepth(DEPTH.UI + 10);

            const bg = this.add.rectangle(0, 0, 150, 50, 0xffd700, 0.9);
            bg.setStrokeStyle(2, 0xffaa00);
            notification.add(bg);

            const text = this.add.text(0, 0, '🎁 Claim Reward!', {
                fontFamily: 'Arial Black',
                fontSize: '14px',
                color: '#000000'
            }).setOrigin(0.5);
            notification.add(text);

            notification.setInteractive(new Phaser.Geom.Rectangle(-75, -25, 150, 50), Phaser.Geom.Rectangle.Contains)
                .on('pointerdown', () => this.transitionTo('AchievementsScene'));

            // Bounce animation
            this.tweens.add({
                targets: notification,
                y: 75,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }
    }

    setupInput() {
        this.input.keyboard.on('keydown-UP', () => {
            this.currentSelection = Math.max(0, this.currentSelection - 1);
            this.updateSelection();
        });

        this.input.keyboard.on('keydown-DOWN', () => {
            this.currentSelection = Math.min(this.buttons.length - 1, this.currentSelection + 1);
            this.updateSelection();
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            this.buttons[this.currentSelection].emit('pointerdown');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.buttons[this.currentSelection].emit('pointerdown');
        });
    }

    updateSelection() {
        this.buttons.forEach((button, index) => {
            if (index === this.currentSelection) {
                button.emit('pointerover');
            } else {
                button.emit('pointerout');
            }
        });
    }

    // Button callbacks
    onPlay() {
        const progress = PlayerData.data;
        this.registry.set('selectedLevel', {
            chapter: progress.currentChapter || 1,
            level: progress.currentLevel || 1
        });
        this.transitionTo('GameScene');
    }

    onEndless() {
        this.transitionTo('EndlessScene');
    }

    onLevels() {
        this.transitionTo('LevelScene');
    }

    onShips() {
        this.transitionTo('ShipSelectScene');
    }

    onAchievements() {
        this.transitionTo('AchievementsScene');
    }

    onFighters() {
        this.transitionTo('FightMenuScene');
    }

    transitionTo(sceneKey) {
        this.input.keyboard.removeAllListeners();
        this.cameras.main.fadeOut(300);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(sceneKey);
        });
    }

    shutdown() {
        this.input.keyboard.removeAllListeners();
    }
}
