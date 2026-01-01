/**
 * MenuScene - Main Menu Scene
 *
 * Simplified version that works without external assets.
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    init() {
        this.buttons = [];
        this.currentSelection = 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Fade in
        this.cameras.main.fadeIn(500);

        // Create background
        this.createBackground(width, height);

        // Create title
        this.createTitle(centerX);

        // Create menu buttons
        this.createMenuButtons(centerX, centerY);

        // Create decorative stars
        this.createDecorations(width, height);

        // Version text
        this.add.text(10, height - 30, 'v1.0.0 - Demo', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#666666'
        }).setDepth(DEPTH.UI);

        // Setup input
        this.setupInput();
    }

    createBackground(width, height) {
        // Use pre-created background
        this.bg = this.add.image(width / 2, height / 2, 'bg-space-1')
            .setDisplaySize(width, height)
            .setDepth(DEPTH.BACKGROUND);

        // Create animated stars manually
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            const star = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 2 + 1,
                0xffffff,
                Math.random() * 0.5 + 0.5
            ).setDepth(DEPTH.BACKGROUND + 1);

            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Math.random() * 2000 + 1000,
                yoyo: true,
                repeat: -1
            });

            this.stars.push(star);
        }
    }

    createTitle(centerX) {
        // Title text instead of logo image
        const title = this.add.text(centerX, 100, 'COSMIC CADET\nACADEMY', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '48px',
            color: '#00ffff',
            align: 'center',
            stroke: '#003366',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Subtitle
        this.add.text(centerX, 180, 'Space Adventure for Young Explorers', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#aaaaff'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Floating animation
        this.tweens.add({
            targets: title,
            y: '+=8',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    createMenuButtons(centerX, centerY) {
        const buttonConfig = [
            { text: 'PLAY', y: centerY + 40, callback: () => this.onPlay() },
            { text: 'LEVELS', y: centerY + 110, callback: () => this.onLevels() },
            { text: 'LEADERBOARD', y: centerY + 180, callback: () => this.onLeaderboard() },
            { text: 'SETTINGS', y: centerY + 250, callback: () => this.onSettings() }
        ];

        buttonConfig.forEach((config, index) => {
            const button = this.createButton(centerX, config.y, config.text, config.callback, index);
            this.buttons.push(button);
        });
    }

    createButton(x, y, text, callback, index) {
        const container = this.add.container(x, y).setDepth(DEPTH.UI);

        // Button background (graphics)
        const bg = this.add.graphics();
        bg.fillStyle(0x1a4a6e, 1);
        bg.fillRoundedRect(-140, -30, 280, 60, 10);
        bg.lineStyle(2, 0x00ffff, 1);
        bg.strokeRoundedRect(-140, -30, 280, 60, 10);

        // Button text
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Arial Black, Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, label]);
        container.setSize(280, 60);
        container.setInteractive({ useHandCursor: true });

        // Store reference for hover effects
        container.bg = bg;
        container.label = label;

        // Entrance animation
        container.setAlpha(0);
        container.x = x - 100;

        this.tweens.add({
            targets: container,
            alpha: 1,
            x: x,
            duration: 400,
            ease: 'Power2',
            delay: 400 + (index * 100)
        });

        // Hover effects
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x2a6a9e, 1);
            bg.fillRoundedRect(-140, -30, 280, 60, 10);
            bg.lineStyle(3, 0x00ffff, 1);
            bg.strokeRoundedRect(-140, -30, 280, 60, 10);
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x1a4a6e, 1);
            bg.fillRoundedRect(-140, -30, 280, 60, 10);
            bg.lineStyle(2, 0x00ffff, 1);
            bg.strokeRoundedRect(-140, -30, 280, 60, 10);
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

    createDecorations(width, height) {
        // Floating decorative elements
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const y = Phaser.Math.Between(50, height - 50);

            // Create a simple asteroid shape
            const asteroid = this.add.graphics();
            asteroid.fillStyle(0x666677, 0.6);
            asteroid.fillCircle(0, 0, 15 + Math.random() * 10);
            asteroid.x = x;
            asteroid.y = y;
            asteroid.setDepth(DEPTH.DECORATIONS);

            this.tweens.add({
                targets: asteroid,
                x: x + Phaser.Math.Between(-30, 30),
                y: y + Phaser.Math.Between(-20, 20),
                duration: Phaser.Math.Between(3000, 6000),
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
        const progress = this.registry.get('playerProgress');
        this.registry.set('selectedLevel', {
            chapter: progress.currentChapter,
            level: progress.currentLevel
        });
        this.transitionTo('GameScene');
    }

    onLevels() {
        this.transitionTo('LevelScene');
    }

    onLeaderboard() {
        this.transitionTo('LeaderboardScene');
    }

    onSettings() {
        this.transitionTo('SettingsScene');
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
