/**
 * PreloadScene - Asset Loading Scene
 *
 * Simplified version that works without external assets.
 * Creates placeholder graphics programmatically.
 */

import Phaser from 'phaser';
import SaveManager from '../utils/SaveManager.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    init() {
        this.loadProgress = 0;
        this.loadComplete = false;
    }

    preload() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Background
        this.add.image(centerX, centerY, 'loading-bg')
            .setDisplaySize(width, height);

        // Logo
        this.add.image(centerX, centerY - 100, 'logo')
            .setScale(0.5);

        // Loading spinner (rotate via tween instead of animation)
        this.spinner = this.add.image(centerX, centerY + 50, 'loading-spinner');
        this.tweens.add({
            targets: this.spinner,
            angle: 360,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });

        // Progress bar background
        this.progressBg = this.add.graphics();
        this.progressBg.fillStyle(0x1a1a4e, 0.8);
        this.progressBg.fillRoundedRect(centerX - 200, centerY + 120, 400, 30, 15);

        // Progress bar fill
        this.progressBar = this.add.graphics();

        // Loading text
        this.loadingText = this.add.text(centerX, centerY + 170, 'Creating game world...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create placeholder graphics for the game
        this.createPlaceholderAssets();
    }

    /**
     * Create all placeholder graphics programmatically
     */
    createPlaceholderAssets() {
        // Player ship
        const playerG = this.make.graphics({ add: false });
        playerG.fillStyle(0x00ffff, 1);
        playerG.fillTriangle(32, 0, 0, 64, 64, 64);
        playerG.fillStyle(0x0088ff, 1);
        playerG.fillCircle(32, 40, 12);
        playerG.generateTexture('player', 64, 64);
        playerG.destroy();

        // Stars
        this.createStarTexture('star-bronze', 0xcd7f32, 32);
        this.createStarTexture('star-silver', 0xc0c0c0, 32);
        this.createStarTexture('star-gold', 0xffd700, 48);

        // Buttons
        this.createButtonTexture('btn-play', 0x00ff88, 200, 60);
        this.createButtonTexture('btn-settings', 0x8888ff, 60, 60);
        this.createButtonTexture('btn-leaderboard', 0xffaa00, 60, 60);
        this.createButtonTexture('btn-back', 0xff6666, 50, 50);
        this.createButtonTexture('btn-pause', 0xffffff, 50, 50);

        // Background
        const bgG = this.make.graphics({ add: false });
        bgG.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
        bgG.fillRect(0, 0, 1280, 720);
        // Add stars
        for (let i = 0; i < 100; i++) {
            bgG.fillStyle(0xffffff, Math.random() * 0.5 + 0.5);
            bgG.fillCircle(Math.random() * 1280, Math.random() * 720, Math.random() * 2 + 1);
        }
        bgG.generateTexture('bg-space-1', 1280, 720);
        bgG.destroy();

        // Simulate loading progress
        this.simulateLoading();
    }

    createStarTexture(key, color, size) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(color, 1);
        // Draw a 5-pointed star
        const cx = size / 2, cy = size / 2;
        const outerR = size / 2 - 2;
        const innerR = outerR * 0.4;
        g.beginPath();
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 72 - 90) * Math.PI / 180;
            const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
            if (i === 0) {
                g.moveTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
            } else {
                g.lineTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
            }
            g.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
        }
        g.closePath();
        g.fillPath();
        g.generateTexture(key, size, size);
        g.destroy();
    }

    createButtonTexture(key, color, width, height) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, width, height, 10);
        g.fillStyle(0xffffff, 0.3);
        g.fillRoundedRect(4, 4, width - 8, height / 2 - 4, 6);
        g.generateTexture(key, width, height);
        g.destroy();
    }

    simulateLoading() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        let progress = 0;
        const loadingItems = ['stars', 'planets', 'spaceship', 'sounds', 'levels'];
        let itemIndex = 0;

        this.time.addEvent({
            delay: 200,
            repeat: 10,
            callback: () => {
                progress += 0.1;

                // Update progress bar
                this.progressBar.clear();
                this.progressBar.fillStyle(0x00ffff, 1);
                this.progressBar.fillRoundedRect(
                    centerX - 195,
                    centerY + 125,
                    390 * progress,
                    20,
                    10
                );

                // Update loading text
                if (itemIndex < loadingItems.length) {
                    this.loadingText.setText(`Loading ${loadingItems[itemIndex]}...`);
                    itemIndex++;
                }

                if (progress >= 1) {
                    this.loadComplete = true;
                    this.loadingText.setText('Tap anywhere to start!');
                    this.tweens.killTweensOf(this.spinner);
                    this.spinner.setVisible(false);
                }
            }
        });
    }

    create() {
        // Load saved data
        this.loadSavedData();

        // Wait for loading to complete and player tap
        this.input.on('pointerdown', () => {
            if (this.loadComplete) {
                this.startGame();
            }
        });
    }

    loadSavedData() {
        try {
            const savedProgress = SaveManager.loadProgress();
            if (savedProgress) {
                this.registry.set('playerProgress', savedProgress);
            }
            const savedSettings = SaveManager.loadSettings();
            if (savedSettings) {
                this.registry.set('settings', savedSettings);
            }
        } catch (error) {
            console.warn('Could not load saved data:', error);
        }
    }

    startGame() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }
}
