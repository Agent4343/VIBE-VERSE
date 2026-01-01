/**
 * BootScene - Initial Bootstrap Scene
 *
 * This is the first scene that loads. It handles:
 * - Minimal asset loading for the preloader UI
 * - System detection and capability checks
 * - Initialization of game registries
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
     * Load minimal assets needed for the preload screen
     */
    preload() {
        // Loading bar background/border (simple graphics, no external files)
        // We'll create these programmatically in PreloadScene

        // Load only the essential preloader assets
        this.load.image('logo', 'assets/images/ui/logo.png');
        this.load.image('loading-bg', 'assets/images/ui/loading-background.png');

        // Load a minimal spritesheet for loading animation
        this.load.spritesheet('loading-spinner', 'assets/images/ui/spinner.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    /**
     * Create scene elements and transition to PreloadScene
     */
    create() {
        // Create loading spinner animation
        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('loading-spinner', {
                start: 0,
                end: 7
            }),
            frameRate: 10,
            repeat: -1
        });

        // Log system info in development
        if (process.env.NODE_ENV === 'development') {
            console.log('System Info:', {
                webGL: this.hasWebGL,
                touch: this.isTouchDevice,
                resolution: `${this.scale.width}x${this.scale.height}`
            });
        }

        // Small delay for visual smoothness, then start PreloadScene
        this.time.delayedCall(100, () => {
            this.scene.start('PreloadScene');
        });
    }
}
