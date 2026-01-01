/**
 * PreloadScene - Asset Loading Scene
 *
 * This scene handles loading all game assets with a visual progress bar.
 * It also initializes audio contexts and loads saved game data.
 *
 * Assets loaded here:
 * - Sprite sheets (player, enemies, collectibles)
 * - Background images
 * - UI elements
 * - Audio files (music and sound effects)
 * - Level data (JSON)
 * - Font files
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/gameConfig.js';
import SaveManager from '../utils/SaveManager.js';
import ApiClient from '../utils/ApiClient.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    /**
     * Initialize loading state
     */
    init() {
        this.loadProgress = 0;
        this.loadComplete = false;
    }

    /**
     * Create visual elements for the loading screen
     */
    preload() {
        // Get screen center
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Background
        this.add.image(centerX, centerY, 'loading-bg')
            .setDisplaySize(width, height);

        // Logo
        this.add.image(centerX, centerY - 100, 'logo')
            .setScale(0.5);

        // Loading spinner
        this.spinner = this.add.sprite(centerX, centerY + 50, 'loading-spinner')
            .play('spin');

        // Progress bar background
        this.progressBg = this.add.graphics();
        this.progressBg.fillStyle(0x1a1a4e, 0.8);
        this.progressBg.fillRoundedRect(centerX - 200, centerY + 120, 400, 30, 15);

        // Progress bar fill
        this.progressBar = this.add.graphics();

        // Loading text
        this.loadingText = this.add.text(centerX, centerY + 170, 'Loading...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Percentage text
        this.percentText = this.add.text(centerX, centerY + 135, '0%', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Setup loading event listeners
        this.setupLoadingEvents();

        // Load all game assets
        this.loadGameAssets();
    }

    /**
     * Setup progress and complete event handlers
     */
    setupLoadingEvents() {
        // Update progress bar on file load
        this.load.on('progress', (value) => {
            this.loadProgress = value;
            this.updateProgressBar(value);
            this.percentText.setText(`${Math.round(value * 100)}%`);
        });

        // Update loading text with current file
        this.load.on('fileprogress', (file) => {
            this.loadingText.setText(`Loading: ${file.key}`);
        });

        // Handle load complete
        this.load.on('complete', () => {
            this.loadComplete = true;
            this.loadingText.setText('Press anywhere to start!');
            this.spinner.stop();
            this.spinner.setVisible(false);
        });
    }

    /**
     * Update the progress bar visual
     * @param {number} progress - Progress value from 0 to 1
     */
    updateProgressBar(progress) {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        this.progressBar.clear();

        // Gradient-like effect with multiple rectangles
        const barWidth = 390 * progress;
        const barHeight = 20;
        const barX = centerX - 195;
        const barY = centerY + 125;

        // Main bar (cyan gradient simulation)
        this.progressBar.fillStyle(0x00ffff, 1);
        this.progressBar.fillRoundedRect(barX, barY, barWidth, barHeight, 10);

        // Highlight on top
        this.progressBar.fillStyle(0x80ffff, 0.5);
        this.progressBar.fillRoundedRect(barX, barY, barWidth, barHeight / 2, { tl: 10, tr: 10 });
    }

    /**
     * Load all game assets
     * Organized by category for maintainability
     */
    loadGameAssets() {
        // ========================================
        // SPRITE SHEETS
        // ========================================

        // Player spaceship/character
        this.load.spritesheet('player', 'assets/images/sprites/player.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Player with animations
        this.load.atlas(
            'player-atlas',
            'assets/images/sprites/player-atlas.png',
            'assets/images/sprites/player-atlas.json'
        );

        // Collectible stars
        this.load.spritesheet('star-bronze', 'assets/images/sprites/star-bronze.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('star-silver', 'assets/images/sprites/star-silver.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('star-gold', 'assets/images/sprites/star-gold.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('stellar-core', 'assets/images/sprites/stellar-core.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // ORBIT companion
        this.load.spritesheet('orbit', 'assets/images/sprites/orbit.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        // Obstacles
        this.load.spritesheet('asteroid', 'assets/images/sprites/asteroid.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Effects
        this.load.spritesheet('explosion', 'assets/images/sprites/explosion.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('sparkle', 'assets/images/sprites/sparkle.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // ========================================
        // BACKGROUNDS
        // ========================================

        this.load.image('bg-space-1', 'assets/images/backgrounds/space-1.png');
        this.load.image('bg-space-2', 'assets/images/backgrounds/space-2.png');
        this.load.image('bg-nebula', 'assets/images/backgrounds/nebula.png');
        this.load.image('bg-asteroid-field', 'assets/images/backgrounds/asteroid-field.png');
        this.load.image('bg-station', 'assets/images/backgrounds/station.png');
        this.load.image('bg-planet-mars', 'assets/images/backgrounds/planet-mars.png');
        this.load.image('bg-planet-jupiter', 'assets/images/backgrounds/planet-jupiter.png');

        // Parallax layers
        this.load.image('parallax-stars-1', 'assets/images/backgrounds/parallax-stars-1.png');
        this.load.image('parallax-stars-2', 'assets/images/backgrounds/parallax-stars-2.png');
        this.load.image('parallax-nebula', 'assets/images/backgrounds/parallax-nebula.png');

        // ========================================
        // UI ELEMENTS
        // ========================================

        // Buttons
        this.load.image('btn-play', 'assets/images/ui/btn-play.png');
        this.load.image('btn-play-hover', 'assets/images/ui/btn-play-hover.png');
        this.load.image('btn-settings', 'assets/images/ui/btn-settings.png');
        this.load.image('btn-leaderboard', 'assets/images/ui/btn-leaderboard.png');
        this.load.image('btn-back', 'assets/images/ui/btn-back.png');
        this.load.image('btn-pause', 'assets/images/ui/btn-pause.png');
        this.load.image('btn-hint', 'assets/images/ui/btn-hint.png');

        // Panels
        this.load.image('panel-main', 'assets/images/ui/panel-main.png');
        this.load.image('panel-dialog', 'assets/images/ui/panel-dialog.png');
        this.load.image('panel-score', 'assets/images/ui/panel-score.png');

        // HUD elements
        this.load.image('hud-star-counter', 'assets/images/ui/hud-star-counter.png');
        this.load.image('hud-health', 'assets/images/ui/hud-health.png');
        this.load.image('heart-full', 'assets/images/ui/heart-full.png');
        this.load.image('heart-empty', 'assets/images/ui/heart-empty.png');

        // Level select
        this.load.image('level-locked', 'assets/images/ui/level-locked.png');
        this.load.image('level-unlocked', 'assets/images/ui/level-unlocked.png');
        this.load.image('level-completed', 'assets/images/ui/level-completed.png');

        // Virtual joystick
        this.load.image('joystick-base', 'assets/images/ui/joystick-base.png');
        this.load.image('joystick-thumb', 'assets/images/ui/joystick-thumb.png');

        // ========================================
        // AUDIO - SOUND EFFECTS
        // ========================================

        this.load.audio('sfx-star-collect', 'assets/audio/sfx/star-collect.mp3');
        this.load.audio('sfx-star-gold', 'assets/audio/sfx/star-gold.mp3');
        this.load.audio('sfx-boost', 'assets/audio/sfx/boost.mp3');
        this.load.audio('sfx-hit', 'assets/audio/sfx/hit.mp3');
        this.load.audio('sfx-button', 'assets/audio/sfx/button-click.mp3');
        this.load.audio('sfx-success', 'assets/audio/sfx/success.mp3');
        this.load.audio('sfx-fail', 'assets/audio/sfx/fail.mp3');
        this.load.audio('sfx-level-complete', 'assets/audio/sfx/level-complete.mp3');
        this.load.audio('sfx-achievement', 'assets/audio/sfx/achievement.mp3');
        this.load.audio('sfx-hint', 'assets/audio/sfx/hint.mp3');

        // ========================================
        // AUDIO - MUSIC
        // ========================================

        this.load.audio('music-menu', 'assets/audio/music/menu-theme.mp3');
        this.load.audio('music-game-1', 'assets/audio/music/game-theme-1.mp3');
        this.load.audio('music-game-2', 'assets/audio/music/game-theme-2.mp3');
        this.load.audio('music-boss', 'assets/audio/music/boss-theme.mp3');
        this.load.audio('music-victory', 'assets/audio/music/victory.mp3');

        // ========================================
        // LEVEL DATA
        // ========================================

        // Load level configurations
        for (let chapter = 1; chapter <= 8; chapter++) {
            for (let level = 1; level <= 5; level++) {
                this.load.json(`level-${chapter}-${level}`, `assets/data/levels/${chapter}-${level}.json`);
            }
        }

        // Load achievement definitions
        this.load.json('achievements', 'assets/data/achievements.json');

        // ========================================
        // TILEMAPS
        // ========================================

        this.load.image('tileset-space', 'assets/images/tilesets/space-tileset.png');
        this.load.image('tileset-station', 'assets/images/tilesets/station-tileset.png');
    }

    /**
     * Create animations and wait for player input
     */
    create() {
        // Create all animations
        this.createAnimations();

        // Load saved game data
        this.loadSavedData();

        // Wait for player to tap/click
        this.input.once('pointerdown', () => {
            if (this.loadComplete) {
                this.startGame();
            }
        });
    }

    /**
     * Create all game animations
     */
    createAnimations() {
        // Player animations
        this.anims.create({
            key: 'player-idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'player-move',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'player-boost',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 16,
            repeat: -1
        });

        // Star animations
        this.anims.create({
            key: 'star-bronze-spin',
            frames: this.anims.generateFrameNumbers('star-bronze', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'star-silver-spin',
            frames: this.anims.generateFrameNumbers('star-silver', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'star-gold-spin',
            frames: this.anims.generateFrameNumbers('star-gold', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });

        // ORBIT companion
        this.anims.create({
            key: 'orbit-idle',
            frames: this.anims.generateFrameNumbers('orbit', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'orbit-talk',
            frames: this.anims.generateFrameNumbers('orbit', { start: 4, end: 7 }),
            frameRate: 8,
            repeat: -1
        });

        // Effects
        this.anims.create({
            key: 'explosion',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 7 }),
            frameRate: 16,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'sparkle',
            frames: this.anims.generateFrameNumbers('sparkle', { start: 0, end: 5 }),
            frameRate: 12,
            hideOnComplete: true
        });
    }

    /**
     * Load saved game data from local storage
     */
    async loadSavedData() {
        try {
            const savedProgress = SaveManager.loadProgress();
            if (savedProgress) {
                this.registry.set('playerProgress', savedProgress);
                console.log('Loaded saved progress:', savedProgress);
            }

            const savedSettings = SaveManager.loadSettings();
            if (savedSettings) {
                this.registry.set('settings', savedSettings);
            }
        } catch (error) {
            console.warn('Could not load saved data:', error);
        }
    }

    /**
     * Transition to the main menu
     */
    startGame() {
        // Play button sound
        this.sound.play('sfx-button', { volume: 0.5 });

        // Fade out and start menu
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }
}
