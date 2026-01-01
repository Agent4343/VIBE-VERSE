/**
 * GameScene - Core Gameplay Scene
 *
 * The main gameplay scene where players:
 * - Control their spaceship/character
 * - Collect stars
 * - Solve puzzles
 * - Navigate obstacles
 *
 * Handles:
 * - Player movement and physics
 * - Collision detection
 * - Star collection
 * - Score management
 * - Level completion
 * - HUD display
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS, DEPTH } from '../config/gameConfig.js';
import Player from '../entities/Player.js';
import Star from '../entities/Star.js';
import ApiClient from '../utils/ApiClient.js';
import SocketClient from '../utils/SocketClient.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    /**
     * Initialize scene with level data
     */
    init(data) {
        // Get selected level from registry or data
        const selectedLevel = data.level || this.registry.get('selectedLevel');
        this.chapter = selectedLevel?.chapter || 1;
        this.level = selectedLevel?.level || 1;
        this.levelKey = `${this.chapter}-${this.level}`;

        // Reset session data
        this.registry.set('session', {
            score: 0,
            lives: GAME_CONSTANTS.PLAYER_INITIAL_HEALTH,
            hintsUsed: 0,
            startTime: Date.now()
        });

        this.registry.set('collectedStars', {
            bronze: 0,
            silver: 0,
            gold: 0
        });

        // Game state
        this.isPaused = false;
        this.isComplete = false;
    }

    /**
     * Create all game objects
     */
    create() {
        const { width, height } = this.cameras.main;

        // Fade in
        this.cameras.main.fadeIn(500);

        // Load level data
        this.levelData = this.cache.json.get(`level-${this.levelKey}`);

        // Create world
        this.createBackground();
        this.createWorld();
        this.createPlayer();
        this.createStars();
        this.createObstacles();

        // Setup physics
        this.setupCollisions();

        // Create HUD
        this.createHUD();

        // Setup controls
        this.setupControls();

        // Setup camera
        this.setupCamera();

        // Start game music
        this.startMusic();

        // Connect to real-time services
        this.connectSocket();

        // Pause handling
        this.events.on('pause', this.onPause, this);
        this.events.on('resume', this.onResume, this);

        console.log(`Started level ${this.levelKey}`);
    }

    /**
     * Create parallax scrolling background
     */
    createBackground() {
        const { width, height } = this.cameras.main;

        // Determine background based on chapter
        const bgKey = this.getBackgroundForChapter(this.chapter);

        // Static background
        this.bg = this.add.image(0, 0, bgKey)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDisplaySize(width, height)
            .setDepth(DEPTH.BACKGROUND);

        // Parallax star layers
        this.parallaxLayers = [];

        const layer1 = this.add.tileSprite(0, 0, width, height, 'parallax-stars-1')
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(DEPTH.BACKGROUND + 1);
        this.parallaxLayers.push({ sprite: layer1, speed: 0.1 });

        const layer2 = this.add.tileSprite(0, 0, width, height, 'parallax-stars-2')
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(DEPTH.BACKGROUND + 2);
        this.parallaxLayers.push({ sprite: layer2, speed: 0.2 });
    }

    /**
     * Get background image key based on chapter
     */
    getBackgroundForChapter(chapter) {
        const backgrounds = {
            1: 'bg-space-1',
            2: 'bg-asteroid-field',
            3: 'bg-planet-mars',
            4: 'bg-planet-jupiter',
            5: 'bg-space-2',
            6: 'bg-nebula',
            7: 'bg-station',
            8: 'bg-nebula'
        };
        return backgrounds[chapter] || 'bg-space-1';
    }

    /**
     * Create world boundaries and platforms
     */
    createWorld() {
        // World bounds
        const worldWidth = this.levelData?.worldWidth || GAME_CONSTANTS.WORLD_WIDTH;
        const worldHeight = this.levelData?.worldHeight || GAME_CONSTANTS.WORLD_HEIGHT;

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Create platforms/obstacles from level data
        this.platforms = this.physics.add.staticGroup();

        if (this.levelData?.platforms) {
            this.levelData.platforms.forEach(platform => {
                const p = this.platforms.create(platform.x, platform.y, platform.texture || 'platform');
                if (platform.width && platform.height) {
                    p.setDisplaySize(platform.width, platform.height);
                    p.refreshBody();
                }
            });
        }
    }

    /**
     * Create player entity
     */
    createPlayer() {
        const startX = this.levelData?.playerStart?.x || 200;
        const startY = this.levelData?.playerStart?.y || 400;

        this.player = new Player(this, startX, startY);

        // Player health from session
        const session = this.registry.get('session');
        this.player.health = session.lives;
    }

    /**
     * Create star collectibles
     */
    createStars() {
        // Star groups by type
        this.bronzeStars = this.physics.add.group();
        this.silverStars = this.physics.add.group();
        this.goldStars = this.physics.add.group();
        this.stellarCores = this.physics.add.group();

        // Create stars from level data
        if (this.levelData?.stars) {
            this.levelData.stars.forEach(starData => {
                const star = new Star(this, starData.x, starData.y, starData.type);

                switch (starData.type) {
                    case 'bronze':
                        this.bronzeStars.add(star);
                        break;
                    case 'silver':
                        this.silverStars.add(star);
                        break;
                    case 'gold':
                        this.goldStars.add(star);
                        break;
                    case 'stellar':
                        this.stellarCores.add(star);
                        break;
                }
            });
        } else {
            // Generate default stars for testing
            this.generateDefaultStars();
        }
    }

    /**
     * Generate default star layout for testing
     */
    generateDefaultStars() {
        // Bronze stars scattered
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(100, 2400);
            const y = Phaser.Math.Between(100, 1300);
            const star = new Star(this, x, y, 'bronze');
            this.bronzeStars.add(star);
        }

        // Silver stars in harder to reach places
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(500, 2000);
            const y = Phaser.Math.Between(100, 600);
            const star = new Star(this, x, y, 'silver');
            this.silverStars.add(star);
        }

        // Gold stars for puzzle completion
        const goldStar = new Star(this, 2200, 700, 'gold');
        this.goldStars.add(goldStar);

        // Stellar core at level end
        const stellarCore = new Star(this, 2400, 700, 'stellar');
        this.stellarCores.add(stellarCore);
    }

    /**
     * Create obstacle entities
     */
    createObstacles() {
        this.obstacles = this.physics.add.group();

        if (this.levelData?.obstacles) {
            this.levelData.obstacles.forEach(obstacleData => {
                const obstacle = this.obstacles.create(
                    obstacleData.x,
                    obstacleData.y,
                    obstacleData.texture || 'asteroid'
                );
                obstacle.setImmovable(true);

                // Add rotation for asteroids
                if (obstacleData.rotate) {
                    this.tweens.add({
                        targets: obstacle,
                        rotation: Math.PI * 2,
                        duration: Phaser.Math.Between(3000, 8000),
                        repeat: -1
                    });
                }
            });
        }
    }

    /**
     * Setup physics collisions and overlaps
     */
    setupCollisions() {
        // Player vs world bounds
        this.player.body.setCollideWorldBounds(true);

        // Player vs platforms
        this.physics.add.collider(this.player, this.platforms);

        // Player vs obstacles (damage)
        this.physics.add.overlap(
            this.player,
            this.obstacles,
            this.onPlayerHitObstacle,
            null,
            this
        );

        // Player vs stars (collect)
        this.physics.add.overlap(
            this.player,
            this.bronzeStars,
            (player, star) => this.collectStar(star, 'bronze'),
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.silverStars,
            (player, star) => this.collectStar(star, 'silver'),
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.goldStars,
            (player, star) => this.collectStar(star, 'gold'),
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.stellarCores,
            (player, star) => this.collectStellarCore(star),
            null,
            this
        );
    }

    /**
     * Create HUD elements
     */
    createHUD() {
        const { width } = this.cameras.main;

        // HUD container (fixed to camera)
        this.hud = this.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(DEPTH.UI);

        // Star counter background
        const starCounterBg = this.add.image(width - 150, 40, 'hud-star-counter')
            .setScale(0.8);

        // Star count text
        this.starCountText = this.add.text(width - 100, 40, '0', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Health hearts
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(50 + (i * 45), 40, 'heart-full')
                .setScale(0.8);
            this.hearts.push(heart);
        }

        // Pause button
        const pauseBtn = this.add.image(width - 50, 40, 'btn-pause')
            .setScale(0.6)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.pauseGame());

        // Hint button
        const hintBtn = this.add.image(width - 50, 100, 'btn-hint')
            .setScale(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showHint());

        // Level indicator
        const levelText = this.add.text(20, 80, `Level ${this.levelKey}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        });

        // Add all to HUD container
        this.hud.add([starCounterBg, this.starCountText, ...this.hearts, pauseBtn, hintBtn, levelText]);
    }

    /**
     * Setup player controls (touch and keyboard)
     */
    setupControls() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            boost: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // Pause with ESC
        this.input.keyboard.on('keydown-ESC', () => this.pauseGame());

        // Touch/Virtual joystick
        this.createVirtualJoystick();
    }

    /**
     * Create virtual joystick for touch controls
     */
    createVirtualJoystick() {
        const { height } = this.cameras.main;

        // Only show on touch devices
        if (!this.sys.game.device.input.touch) {
            return;
        }

        // Joystick base
        this.joystickBase = this.add.image(120, height - 120, 'joystick-base')
            .setScrollFactor(0)
            .setDepth(DEPTH.UI)
            .setAlpha(0.7)
            .setScale(1.2);

        // Joystick thumb
        this.joystickThumb = this.add.image(120, height - 120, 'joystick-thumb')
            .setScrollFactor(0)
            .setDepth(DEPTH.UI + 1)
            .setAlpha(0.9);

        // Joystick state
        this.joystickActive = false;
        this.joystickVector = new Phaser.Math.Vector2();

        // Touch handlers
        this.input.on('pointerdown', (pointer) => {
            // Left side of screen for movement
            if (pointer.x < this.cameras.main.width / 2) {
                this.joystickActive = true;
                this.joystickBase.setPosition(pointer.x, pointer.y);
                this.joystickThumb.setPosition(pointer.x, pointer.y);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.joystickActive && pointer.isDown) {
                // Calculate joystick offset
                const maxDistance = 50;
                const dx = pointer.x - this.joystickBase.x;
                const dy = pointer.y - this.joystickBase.y;
                const distance = Math.min(maxDistance, Math.sqrt(dx * dx + dy * dy));
                const angle = Math.atan2(dy, dx);

                // Update thumb position
                this.joystickThumb.x = this.joystickBase.x + Math.cos(angle) * distance;
                this.joystickThumb.y = this.joystickBase.y + Math.sin(angle) * distance;

                // Update vector (normalized)
                this.joystickVector.set(dx / maxDistance, dy / maxDistance);
            }
        });

        this.input.on('pointerup', () => {
            this.joystickActive = false;
            this.joystickVector.set(0, 0);
            // Reset thumb to base
            this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
        });

        // Boost button (right side)
        const boostBtn = this.add.circle(
            this.cameras.main.width - 100,
            height - 120,
            50,
            0x00ffff,
            0.5
        )
            .setScrollFactor(0)
            .setDepth(DEPTH.UI)
            .setInteractive();

        const boostText = this.add.text(
            this.cameras.main.width - 100,
            height - 120,
            'BOOST',
            {
                fontFamily: 'Arial Black',
                fontSize: '16px',
                color: '#ffffff'
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.UI + 1);

        boostBtn.on('pointerdown', () => {
            this.player.isBoosting = true;
            boostBtn.setFillStyle(0xffffff, 0.7);
        });

        boostBtn.on('pointerup', () => {
            this.player.isBoosting = false;
            boostBtn.setFillStyle(0x00ffff, 0.5);
        });
    }

    /**
     * Setup camera to follow player
     */
    setupCamera() {
        const worldWidth = this.levelData?.worldWidth || GAME_CONSTANTS.WORLD_WIDTH;
        const worldHeight = this.levelData?.worldHeight || GAME_CONSTANTS.WORLD_HEIGHT;

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    /**
     * Start level music
     */
    startMusic() {
        const settings = this.registry.get('settings');
        const musicKey = this.chapter === 8 ? 'music-boss' : 'music-game-1';

        this.bgMusic = this.sound.add(musicKey, {
            volume: settings.musicVolume,
            loop: true
        });
        this.bgMusic.play();
    }

    /**
     * Connect to Socket.IO for real-time features
     */
    connectSocket() {
        SocketClient.connect();
        SocketClient.subscribeToLeaderboard(this.levelKey);
    }

    // ========================================
    // Game Logic
    // ========================================

    /**
     * Collect a star
     */
    collectStar(star, type) {
        // Prevent double collection
        if (star.collected) return;
        star.collected = true;

        // Get point value
        let points = 0;
        let sfxKey = 'sfx-star-collect';

        switch (type) {
            case 'bronze':
                points = GAME_CONSTANTS.BRONZE_STAR_VALUE;
                break;
            case 'silver':
                points = GAME_CONSTANTS.SILVER_STAR_VALUE;
                break;
            case 'gold':
                points = GAME_CONSTANTS.GOLD_STAR_VALUE;
                sfxKey = 'sfx-star-gold';
                break;
        }

        // Update score
        const session = this.registry.get('session');
        session.score += points;
        this.registry.set('session', session);

        // Update collected stars
        const collected = this.registry.get('collectedStars');
        collected[type]++;
        this.registry.set('collectedStars', collected);

        // Update HUD
        this.updateStarDisplay();

        // Play sound
        this.sound.play(sfxKey, { volume: 0.6 });

        // Collection effect
        star.playCollectAnimation(() => {
            star.destroy();
        });

        // Floating score text
        this.showFloatingText(star.x, star.y, `+${points}`, '#ffff00');
    }

    /**
     * Collect the stellar core (level complete trigger)
     */
    collectStellarCore(core) {
        if (core.collected || this.isComplete) return;
        core.collected = true;
        this.isComplete = true;

        // Add points
        const session = this.registry.get('session');
        session.score += GAME_CONSTANTS.STELLAR_CORE_VALUE;

        // Big celebration effect
        this.sound.play('sfx-level-complete', { volume: 0.8 });

        // Pause player
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;

        // Core collection animation
        core.playCollectAnimation(() => {
            core.destroy();
            this.levelComplete();
        });
    }

    /**
     * Handle player hitting an obstacle
     */
    onPlayerHitObstacle(player, obstacle) {
        // Invincibility frames check
        if (player.isInvincible) return;

        // Damage player
        player.takeDamage(1);

        // Update HUD
        this.updateHealthDisplay();

        // Sound effect
        this.sound.play('sfx-hit', { volume: 0.5 });

        // Camera shake
        this.cameras.main.shake(200, 0.01);

        // Check for game over
        if (player.health <= 0) {
            this.gameOver();
        }
    }

    /**
     * Update star count display
     */
    updateStarDisplay() {
        const session = this.registry.get('session');
        this.starCountText.setText(session.score.toString());

        // Pop animation
        this.tweens.add({
            targets: this.starCountText,
            scale: 1.3,
            duration: 100,
            yoyo: true
        });
    }

    /**
     * Update health hearts display
     */
    updateHealthDisplay() {
        this.hearts.forEach((heart, index) => {
            if (index < this.player.health) {
                heart.setTexture('heart-full');
            } else {
                heart.setTexture('heart-empty');
            }
        });
    }

    /**
     * Show floating text effect
     */
    showFloatingText(x, y, text, color = '#ffffff') {
        const floatText = this.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        })
            .setOrigin(0.5)
            .setDepth(DEPTH.EFFECTS);

        this.tweens.add({
            targets: floatText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => floatText.destroy()
        });
    }

    // ========================================
    // Game State Changes
    // ========================================

    /**
     * Pause the game
     */
    pauseGame() {
        if (this.isPaused || this.isComplete) return;

        this.isPaused = true;
        this.physics.pause();
        this.bgMusic?.pause();

        // Launch pause scene as overlay
        this.scene.launch('PauseScene', {
            parentScene: 'GameScene',
            levelKey: this.levelKey
        });
        this.scene.pause();
    }

    /**
     * Resume from pause
     */
    onResume() {
        this.isPaused = false;
        this.physics.resume();
        this.bgMusic?.resume();
    }

    /**
     * Handle level completion
     */
    async levelComplete() {
        const session = this.registry.get('session');
        const collected = this.registry.get('collectedStars');

        // Calculate completion time
        const completionTime = Math.floor((Date.now() - session.startTime) / 1000);

        // Calculate final score with time bonus
        const timeBonus = Math.max(0, (120 - completionTime) * 10);
        const hintPenalty = session.hintsUsed * 5;
        const finalScore = session.score + timeBonus - hintPenalty;

        // Stop music
        this.bgMusic?.stop();

        // Play victory music
        this.sound.play('music-victory', { volume: 0.7 });

        // Submit score to server
        try {
            await ApiClient.submitScore({
                level: this.levelKey,
                score: finalScore,
                stars: collected,
                time: completionTime
            });

            // Also emit via socket for real-time update
            SocketClient.submitScore({
                level: this.levelKey,
                score: finalScore,
                stars: collected,
                time: completionTime
            });
        } catch (error) {
            console.warn('Failed to submit score:', error);
        }

        // Update progress
        this.unlockNextLevel();

        // Show completion screen
        this.showCompletionScreen(finalScore, timeBonus, collected, completionTime);
    }

    /**
     * Unlock next level in progress
     */
    unlockNextLevel() {
        const progress = this.registry.get('playerProgress');
        const collected = this.registry.get('collectedStars');

        // Add stars to total
        progress.totalStars += collected.bronze + (collected.silver * 5) + (collected.gold * 10);

        // Determine next level
        let nextChapter = this.chapter;
        let nextLevel = this.level + 1;

        if (nextLevel > 5) {
            nextChapter++;
            nextLevel = 1;
        }

        const nextLevelKey = `${nextChapter}-${nextLevel}`;

        // Unlock if not already
        if (!progress.unlockedLevels.includes(nextLevelKey) && nextChapter <= 8) {
            progress.unlockedLevels.push(nextLevelKey);
        }

        // Update current position
        progress.currentChapter = nextChapter;
        progress.currentLevel = nextLevel;

        this.registry.set('playerProgress', progress);

        // Save progress locally
        import('../utils/SaveManager.js').then(module => {
            module.default.saveProgress(progress);
        });
    }

    /**
     * Show level completion screen
     */
    showCompletionScreen(finalScore, timeBonus, collected, time) {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Overlay
        const overlay = this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.7)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY);

        // Panel
        const panel = this.add.image(centerX, centerY, 'panel-main')
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1)
            .setScale(0);

        this.tweens.add({
            targets: panel,
            scale: 1,
            duration: 500,
            ease: 'Back.out'
        });

        // Title
        const title = this.add.text(centerX, centerY - 150, 'LEVEL COMPLETE!', {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 6
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 2);

        // Stats
        const statsText = [
            `Stars Collected: ${collected.bronze} bronze, ${collected.silver} silver, ${collected.gold} gold`,
            `Time: ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`,
            `Time Bonus: +${timeBonus}`,
            `Final Score: ${finalScore}`
        ].join('\n');

        this.add.text(centerX, centerY, statsText, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 10
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 2);

        // Next Level button
        const nextBtn = this.add.text(centerX, centerY + 130, 'NEXT LEVEL', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.goToNextLevel());

        // Menu button
        this.add.text(centerX, centerY + 180, 'BACK TO MENU', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#aaaaaa'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.goToMenu());
    }

    /**
     * Handle game over
     */
    gameOver() {
        this.isComplete = true;
        this.physics.pause();
        this.bgMusic?.stop();

        this.sound.play('sfx-fail', { volume: 0.6 });

        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Overlay
        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.8)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY);

        // Game Over text
        this.add.text(centerX, centerY - 50, 'GAME OVER', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1);

        // Retry button
        this.add.text(centerX, centerY + 50, 'TRY AGAIN', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#00ffff'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.restartLevel());

        // Menu button
        this.add.text(centerX, centerY + 110, 'BACK TO MENU', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#aaaaaa'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.goToMenu());
    }

    /**
     * Show hint to player
     */
    showHint() {
        if (this.isPaused || this.isComplete) return;

        const session = this.registry.get('session');
        const settings = this.registry.get('settings');

        if (!settings.showHints) return;

        // Cost stars for hints (optional)
        session.hintsUsed++;
        this.registry.set('session', session);

        this.sound.play('sfx-hint', { volume: 0.5 });

        // Get hint from level data or generate
        const hint = this.levelData?.hint || 'Try exploring the edges of the area!';

        // Show hint dialog
        const { width, height } = this.cameras.main;

        const hintBg = this.add.rectangle(width / 2, height - 100, width - 100, 80, 0x000000, 0.8)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY);

        const hintText = this.add.text(width / 2, height - 100, `ORBIT: ${hint}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#00ffff',
            wordWrap: { width: width - 150 }
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1);

        // Auto-dismiss after 5 seconds
        this.time.delayedCall(5000, () => {
            hintBg.destroy();
            hintText.destroy();
        });
    }

    // ========================================
    // Navigation
    // ========================================

    goToNextLevel() {
        const progress = this.registry.get('playerProgress');
        this.registry.set('selectedLevel', {
            chapter: progress.currentChapter,
            level: progress.currentLevel
        });
        this.scene.restart();
    }

    restartLevel() {
        this.scene.restart();
    }

    goToMenu() {
        SocketClient.disconnect();
        this.scene.start('MenuScene');
    }

    // ========================================
    // Update Loop
    // ========================================

    /**
     * Main update loop
     */
    update(time, delta) {
        if (this.isPaused || this.isComplete) return;

        // Update player
        this.player.update(this.cursors, this.wasd, this.joystickVector);

        // Update parallax
        this.updateParallax();
    }

    /**
     * Update parallax background layers
     */
    updateParallax() {
        const camera = this.cameras.main;

        this.parallaxLayers.forEach(layer => {
            layer.sprite.tilePositionX = camera.scrollX * layer.speed;
            layer.sprite.tilePositionY = camera.scrollY * layer.speed;
        });
    }

    /**
     * Cleanup on scene shutdown
     */
    shutdown() {
        this.bgMusic?.stop();
        SocketClient.unsubscribeFromLeaderboard(this.levelKey);
        this.input.keyboard.removeAllListeners();
    }
}
