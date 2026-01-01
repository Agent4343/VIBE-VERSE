/**
 * BootScene - Initial Bootstrap Scene
 *
 * This is the first scene that loads. It handles:
 * - System detection and capability checks
 * - Initialization of game registries
 * - Creates loading graphics programmatically (no external files needed)
 *
 * Keep this scene lightweight for fast initial load.
 */

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    /**
     * Initialize scene data and check system capabilities
     */
    init() {
        // Log game start
        console.log('Cosmic Cadet Academy - Initializing...');

        // Check WebGL support
        this.hasWebGL = this.sys.game.renderer.type === Phaser.WEBGL;

        // Check touch support
        this.isTouchDevice = this.sys.game.device.input.touch;

        // Initialize game registry with default values
        this.initRegistry();
    }

    /**
     * Initialize the game registry with default player data
     * Registry persists across scenes and is used for global state
     */
    initRegistry() {
        const registry = this.registry;

        // Player progress (loaded from save later)
        registry.set('playerProgress', {
            currentChapter: 1,
            currentLevel: 1,
            totalStars: 0,
            unlockedLevels: ['1-1'],
            achievements: []
        });

        // Player settings
        registry.set('settings', {
            musicVolume: 0.7,
            sfxVolume: 1.0,
            vibration: true,
            showHints: true
        });

        // Session data
        registry.set('session', {
            score: 0,
            lives: 3,
            hintsUsed: 0,
            startTime: null
        });

        // Collected stars for current level
        registry.set('collectedStars', {
            bronze: 0,
            silver: 0,
            gold: 0
        });
    }

    /**
     * Create placeholder graphics programmatically
     */
    preload() {
        // Create placeholder textures programmatically (no external files needed)
        this.createPlaceholderTextures();
    }

    /**
     * Create simple placeholder textures for loading screen
     */
    createPlaceholderTextures() {
        // Create a simple logo texture (gradient rectangle)
        const logoGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        logoGraphics.fillGradientStyle(0x00ffff, 0x00ffff, 0x0066ff, 0x0066ff, 1);
        logoGraphics.fillRect(0, 0, 300, 80);
        logoGraphics.generateTexture('logo', 300, 80);
        logoGraphics.destroy();

        // Create loading background texture
        const bgGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        bgGraphics.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x2d1b4e, 0x2d1b4e, 1);
        bgGraphics.fillRect(0, 0, 1280, 720);
        bgGraphics.generateTexture('loading-bg', 1280, 720);
        bgGraphics.destroy();

        // Create a simple spinner texture (single frame - will rotate via tween)
        const spinnerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        spinnerGraphics.lineStyle(4, 0x00ffff, 1);
        spinnerGraphics.arc(32, 32, 24, 0, Math.PI * 1.5);
        spinnerGraphics.strokePath();
        spinnerGraphics.generateTexture('loading-spinner', 64, 64);
        spinnerGraphics.destroy();
    }

    /**
     * Create scene elements and transition to PreloadScene
     */
    create() {
        // Log system info
        console.log('System Info:', {
            webGL: this.hasWebGL,
            touch: this.isTouchDevice,
            resolution: `${this.scale.width}x${this.scale.height}`
        });

        // Hide the HTML loading screen
        const htmlLoader = document.getElementById('initial-loader');
        if (htmlLoader) {
            htmlLoader.classList.add('hidden');
            setTimeout(() => htmlLoader.remove(), 500);
        }

        // Small delay for visual smoothness, then start PreloadScene
        this.time.delayedCall(100, () => {
            this.scene.start('PreloadScene');
        });
    }
}
