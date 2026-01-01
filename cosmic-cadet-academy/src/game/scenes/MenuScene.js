/**
 * MenuScene - Main Menu Scene
 *
 * The hub scene where players can:
 * - Start a new game or continue
 * - Access level selection
 * - View leaderboards
 * - Adjust settings
 * - View achievements
 *
 * Features animated background and interactive buttons.
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    /**
     * Initialize scene data
     */
    init() {
        this.buttons = [];
        this.currentSelection = 0;
    }

    /**
     * Create menu elements
     */
    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Fade in
        this.cameras.main.fadeIn(500);

        // Create background layers
        this.createBackground(width, height);

        // Create logo
        this.createLogo(centerX);

        // Create menu buttons
        this.createMenuButtons(centerX, centerY);

        // Create decorative elements
        this.createDecorations(width, height);

        // Start background music
        this.startMusic();

        // Setup input handlers
        this.setupInput();

        // Create version text
        this.add.text(10, height - 30, 'v1.0.0', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#666666'
        }).setDepth(DEPTH.UI);
    }

    /**
     * Create animated parallax background
     */
    createBackground(width, height) {
        // Static space background
        this.bg = this.add.image(width / 2, height / 2, 'bg-space-1')
            .setDisplaySize(width, height)
            .setDepth(DEPTH.BACKGROUND);

        // Parallax star layers
        this.stars1 = this.add.tileSprite(0, 0, width, height, 'parallax-stars-1')
            .setOrigin(0)
            .setDepth(DEPTH.BACKGROUND + 1);

        this.stars2 = this.add.tileSprite(0, 0, width, height, 'parallax-stars-2')
            .setOrigin(0)
            .setDepth(DEPTH.BACKGROUND + 2);

        // Nebula layer
        this.nebula = this.add.tileSprite(0, 0, width, height, 'parallax-nebula')
            .setOrigin(0)
            .setAlpha(0.5)
            .setDepth(DEPTH.BACKGROUND + 3);
    }

    /**
     * Create and animate the game logo
     */
    createLogo(centerX) {
        this.logo = this.add.image(centerX, 120, 'logo')
            .setDepth(DEPTH.UI)
            .setScale(0);

        // Bounce in animation
        this.tweens.add({
            targets: this.logo,
            scale: 0.8,
            duration: 800,
            ease: 'Back.out',
            delay: 200
        });

        // Floating animation
        this.tweens.add({
            targets: this.logo,
            y: '+=10',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Subtle glow effect
        const glow = this.add.image(centerX, 120, 'logo')
            .setDepth(DEPTH.UI - 1)
            .setScale(0.85)
            .setTint(0x00ffff)
            .setAlpha(0);

        this.tweens.add({
            targets: glow,
            alpha: 0.3,
            scale: 0.9,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            delay: 1000
        });
    }

    /**
     * Create interactive menu buttons
     */
    createMenuButtons(centerX, centerY) {
        const buttonConfig = [
            { key: 'play', text: 'PLAY', y: centerY + 20, callback: () => this.onPlay() },
            { key: 'levels', text: 'LEVELS', y: centerY + 90, callback: () => this.onLevels() },
            { key: 'leaderboard', text: 'LEADERBOARD', y: centerY + 160, callback: () => this.onLeaderboard() },
            { key: 'settings', text: 'SETTINGS', y: centerY + 230, callback: () => this.onSettings() }
        ];

        buttonConfig.forEach((config, index) => {
            const button = this.createButton(centerX, config.y, config.text, config.callback, index);
            this.buttons.push(button);
        });
    }

    /**
     * Create a single interactive button
     */
    createButton(x, y, text, callback, index) {
        // Button container
        const container = this.add.container(x, y).setDepth(DEPTH.UI);

        // Button background
        const bg = this.add.image(0, 0, 'btn-play')
            .setDisplaySize(280, 60);

        // Button text
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Arial Black, Arial',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        container.add([bg, label]);

        // Make interactive
        container.setSize(280, 60);
        container.setInteractive({ useHandCursor: true });

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
            this.tweens.add({
                targets: container,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                ease: 'Power1'
            });
            bg.setTexture('btn-play-hover');
            this.sound.play('sfx-button', { volume: 0.3 });
        });

        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Power1'
            });
            bg.setTexture('btn-play');
        });

        // Click handler
        container.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
            this.sound.play('sfx-button', { volume: 0.5 });
        });

        return container;
    }

    /**
     * Create decorative animated elements
     */
    createDecorations(width, height) {
        // Floating asteroids
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const y = Phaser.Math.Between(50, height - 50);
            const scale = Phaser.Math.FloatBetween(0.3, 0.6);

            const asteroid = this.add.sprite(x, y, 'asteroid', 0)
                .setScale(scale)
                .setDepth(DEPTH.DECORATIONS)
                .setAlpha(0.6);

            // Random floating motion
            this.tweens.add({
                targets: asteroid,
                x: x + Phaser.Math.Between(-50, 50),
                y: y + Phaser.Math.Between(-30, 30),
                rotation: Phaser.Math.FloatBetween(-0.5, 0.5),
                duration: Phaser.Math.Between(3000, 6000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }

        // ORBIT companion floating near logo
        this.orbit = this.add.sprite(width - 150, 150, 'orbit')
            .setScale(1.5)
            .setDepth(DEPTH.DECORATIONS)
            .play('orbit-idle');

        this.tweens.add({
            targets: this.orbit,
            y: '+=20',
            x: '+=10',
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    /**
     * Start and configure background music
     */
    startMusic() {
        // Check if music is already playing
        if (this.sound.get('music-menu')?.isPlaying) {
            return;
        }

        const settings = this.registry.get('settings');
        this.bgMusic = this.sound.add('music-menu', {
            volume: settings.musicVolume,
            loop: true
        });
        this.bgMusic.play();
    }

    /**
     * Setup keyboard input for accessibility
     */
    setupInput() {
        // Arrow key navigation
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

    /**
     * Update visual selection indicator
     */
    updateSelection() {
        this.buttons.forEach((button, index) => {
            if (index === this.currentSelection) {
                button.emit('pointerover');
            } else {
                button.emit('pointerout');
            }
        });
    }

    /**
     * Scene update loop - animate backgrounds
     */
    update(time, delta) {
        // Scroll star layers for parallax effect
        this.stars1.tilePositionX += 0.1;
        this.stars2.tilePositionX += 0.2;
        this.nebula.tilePositionX += 0.05;
        this.nebula.tilePositionY += 0.02;
    }

    // ========================================
    // Button Callbacks
    // ========================================

    /**
     * Handle Play button - continue or start new game
     */
    onPlay() {
        const progress = this.registry.get('playerProgress');

        // Go directly to the current level
        this.registry.set('selectedLevel', {
            chapter: progress.currentChapter,
            level: progress.currentLevel
        });

        this.transitionTo('GameScene');
    }

    /**
     * Handle Levels button - open level selection
     */
    onLevels() {
        this.transitionTo('LevelScene');
    }

    /**
     * Handle Leaderboard button - open leaderboards
     */
    onLeaderboard() {
        this.transitionTo('LeaderboardScene');
    }

    /**
     * Handle Settings button - open settings
     */
    onSettings() {
        this.transitionTo('SettingsScene');
    }

    /**
     * Smooth transition to another scene
     */
    transitionTo(sceneKey) {
        // Stop listening to input
        this.input.keyboard.removeAllListeners();

        // Fade out
        this.cameras.main.fadeOut(300);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Stop menu music if going to game
            if (sceneKey === 'GameScene' && this.bgMusic) {
                this.bgMusic.stop();
            }
            this.scene.start(sceneKey);
        });
    }

    /**
     * Cleanup when leaving scene
     */
    shutdown() {
        this.input.keyboard.removeAllListeners();
    }
}
