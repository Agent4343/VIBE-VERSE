/**
 * LeaderboardScene - Online Leaderboards
 *
 * Displays top scores globally and per-level.
 * Real-time updates via Socket.IO.
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';
import ApiClient from '../utils/ApiClient.js';
import SocketClient from '../utils/SocketClient.js';

export default class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    init() {
        this.currentTab = 'global';
        this.scores = [];
        this.isLoading = true;
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;

        // Fade in
        this.cameras.main.fadeIn(500);

        // Background (procedural)
        this.createBackground(width, height);

        // Title
        this.add.text(centerX, 50, 'LEADERBOARD', {
            fontFamily: 'Arial Black',
            fontSize: '42px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Create tabs
        this.createTabs(centerX, 110);

        // Scores container
        this.scoresContainer = this.add.container(centerX, 180);
        this.scoresContainer.setDepth(DEPTH.UI);

        // Loading indicator
        this.loadingText = this.add.text(centerX, 350, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#888888'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Back button
        this.createBackButton();

        // Load initial data
        this.loadLeaderboard();

        // Subscribe to real-time updates
        this.setupSocketListeners();
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
        bg.fillRect(0, 0, width, height);
        bg.setDepth(DEPTH.BACKGROUND);

        for (let i = 0; i < 80; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const star = this.add.circle(x, y, Math.random() * 1.5 + 0.5, 0xffffff, Math.random() * 0.6 + 0.2);
            star.setDepth(DEPTH.BACKGROUND + 1);
        }
    }

    createTabs(x, y) {
        const tabs = ['GLOBAL', 'WEEKLY', 'MY RANK'];
        const tabWidth = 120;
        const startX = x - ((tabs.length - 1) * tabWidth) / 2;

        this.tabButtons = [];

        tabs.forEach((tab, index) => {
            const tabX = startX + index * tabWidth;
            const tabKey = tab.toLowerCase().replace(' ', '_');

            const btn = this.add.text(tabX, y, tab, {
                fontFamily: 'Arial Black',
                fontSize: '18px',
                color: this.currentTab === tabKey ? '#00ffff' : '#666666'
            })
                .setOrigin(0.5)
                .setDepth(DEPTH.UI)
                .setInteractive({ useHandCursor: true })
                .setData('key', tabKey);

            btn.on('pointerdown', () => {
                this.switchTab(tabKey);
            });

            this.tabButtons.push(btn);
        });
    }

    switchTab(tabKey) {
        this.currentTab = tabKey;

        // Update tab visuals
        this.tabButtons.forEach(btn => {
            btn.setColor(btn.getData('key') === tabKey ? '#00ffff' : '#666666');
        });

        // Reload data
        this.loadLeaderboard();
    }

    async loadLeaderboard() {
        this.isLoading = true;
        this.loadingText.setVisible(true);
        this.scoresContainer.removeAll(true);

        try {
            let data;

            if (this.currentTab === 'my_rank') {
                data = await ApiClient.getUserRank('global');
                this.displayUserRank(data);
            } else {
                const options = {
                    limit: 10,
                    timeframe: this.currentTab === 'weekly' ? 'weekly' : 'all'
                };
                data = await ApiClient.getLeaderboard(options);
                this.displayScores(data.scores || []);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.displayError();
        }

        this.isLoading = false;
        this.loadingText.setVisible(false);
    }

    displayScores(scores) {
        const startY = 0;
        const rowHeight = 50;

        scores.forEach((score, index) => {
            const y = startY + index * rowHeight;

            // Rank
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
            const rank = this.add.text(-250, y, `${index + 1}.`, {
                fontFamily: 'Arial Black',
                fontSize: '24px',
                color: rankColor
            }).setOrigin(0, 0.5);

            // Username
            const username = this.add.text(-200, y, score.username || 'Unknown', {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: score.isCurrentUser ? '#00ffff' : '#ffffff'
            }).setOrigin(0, 0.5);

            // Score
            const scoreText = this.add.text(200, y, score.score?.toLocaleString() || '0', {
                fontFamily: 'Arial Black',
                fontSize: '22px',
                color: '#ffff00'
            }).setOrigin(1, 0.5);

            this.scoresContainer.add([rank, username, scoreText]);
        });

        if (scores.length === 0) {
            const noScores = this.add.text(0, 100, 'No scores yet!', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#888888'
            }).setOrigin(0.5);
            this.scoresContainer.add(noScores);
        }
    }

    displayUserRank(data) {
        if (!data || data.rank === null) {
            const noRank = this.add.text(0, 100, 'Play some levels to get ranked!', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#888888'
            }).setOrigin(0.5);
            this.scoresContainer.add(noRank);
            return;
        }

        // Rank display
        const rankText = this.add.text(0, 50, `#${data.rank}`, {
            fontFamily: 'Arial Black',
            fontSize: '72px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Score
        const scoreText = this.add.text(0, 130, `Score: ${data.score?.toLocaleString() || 0}`, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Percentile
        if (data.percentile) {
            const percentileText = this.add.text(0, 180, `Top ${100 - data.percentile}% of players!`, {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#00ff88'
            }).setOrigin(0.5);
            this.scoresContainer.add(percentileText);
        }

        this.scoresContainer.add([rankText, scoreText]);
    }

    displayError() {
        const errorText = this.add.text(0, 100, 'Failed to load leaderboard', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ff6666'
        }).setOrigin(0.5);
        this.scoresContainer.add(errorText);
    }

    setupSocketListeners() {
        SocketClient.on('leaderboard:update', (data) => {
            if (!this.isLoading) {
                this.loadLeaderboard();
            }
        });
    }

    createBackButton() {
        this.add.text(20, 20, '← Back', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#888888'
        }).setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', function() { this.setColor('#ffffff'); })
            .on('pointerout', function() { this.setColor('#888888'); })
            .on('pointerdown', () => {
                this.goBack();
            });
    }

    goBack() {
        SocketClient.removeAllListeners('leaderboard:update');
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }
}
