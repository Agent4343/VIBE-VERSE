/**
 * GameScene - Enhanced Core Gameplay
 *
 * Features:
 * - Touch controls with virtual joystick
 * - Particle effects
 * - Obstacles (asteroids)
 * - Trail effects
 * - Screen shake
 * - Web Audio sound effects
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS, DEPTH } from '../config/gameConfig.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        const selectedLevel = data.level || this.registry.get('selectedLevel');
        this.chapter = selectedLevel?.chapter || 1;
        this.level = selectedLevel?.level || 1;
        this.levelKey = `${this.chapter}-${this.level}`;

        this.registry.set('session', {
            score: 0,
            lives: 3,
            hintsUsed: 0,
            startTime: Date.now()
        });

        this.isPaused = false;
        this.isComplete = false;
        this.playerHealth = 3;
        this.timeLeft = 90; // 90 second time limit
        this.enemies = [];
    }

    create() {
        const { width, height } = this.cameras.main;

        this.cameras.main.fadeIn(500);

        // Initialize sound
        this.initSound();

        // Create world
        this.createBackground(width, height);
        this.createPlayer();
        this.createStars();
        this.createObstacles();
        this.createEnemies();
        this.createParticles();
        this.createHUD(width, height);
        this.setupControls(width, height);
        this.startTimer();

        // Setup camera
        this.physics.world.setBounds(0, 0, 2560, 1440);
        this.cameras.main.setBounds(0, 0, 2560, 1440);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Collisions
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.enemyGroup, this.hitEnemy, null, this);

        console.log(`Started level ${this.levelKey}`);
    }

    initSound() {
        // Create sounds using Web Audio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.playSound = (type) => {
            if (!this.audioContext) return;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            switch(type) {
                case 'collect':
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                    break;
                case 'hit':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    break;
                case 'win':
                    const notes = [523, 659, 784, 1047];
                    notes.forEach((freq, i) => {
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(this.audioContext.destination);
                        osc.frequency.value = freq;
                        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + i * 0.15);
                        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.15 + 0.3);
                        osc.start(this.audioContext.currentTime + i * 0.15);
                        osc.stop(this.audioContext.currentTime + i * 0.15 + 0.3);
                    });
                    break;
            }
        };
    }

    createBackground(width, height) {
        // Gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a0a3e, 0x1a0a3e, 1);
        bg.fillRect(0, 0, 2560, 1440);
        bg.setDepth(DEPTH.BACKGROUND);

        // Animated stars
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 2560;
            const y = Math.random() * 1440;
            const size = Math.random() * 2 + 0.5;
            const star = this.add.circle(x, y, size, 0xffffff, Math.random() * 0.8 + 0.2);
            star.setDepth(DEPTH.BACKGROUND + 1);

            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: 0.1 },
                duration: Math.random() * 2000 + 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Nebula clouds
        for (let i = 0; i < 5; i++) {
            const nebula = this.add.circle(
                Math.random() * 2560,
                Math.random() * 1440,
                Math.random() * 200 + 100,
                Phaser.Display.Color.RandomRGB().color,
                0.05
            );
            nebula.setDepth(DEPTH.BACKGROUND + 2);
        }
    }

    createPlayer() {
        const startX = 200;
        const startY = 700;

        // Player container
        this.player = this.add.container(startX, startY);
        this.player.setDepth(DEPTH.PLAYER);

        // Ship body (triangle)
        const shipBody = this.add.graphics();
        shipBody.fillStyle(0x00ffff, 1);
        shipBody.beginPath();
        shipBody.moveTo(0, -25);
        shipBody.lineTo(-18, 20);
        shipBody.lineTo(18, 20);
        shipBody.closePath();
        shipBody.fill();

        // Cockpit
        shipBody.fillStyle(0x0088ff, 1);
        shipBody.fillCircle(0, 0, 8);

        // Wings detail
        shipBody.fillStyle(0x00aaff, 1);
        shipBody.fillTriangle(-15, 15, -25, 25, -5, 15);
        shipBody.fillTriangle(15, 15, 25, 25, 5, 15);

        this.player.add(shipBody);

        // Engine glow
        this.engineGlow = this.add.graphics();
        this.engineGlow.fillStyle(0xff6600, 0.8);
        this.engineGlow.fillCircle(0, 28, 6);
        this.engineGlow.fillStyle(0xffff00, 0.6);
        this.engineGlow.fillCircle(0, 28, 4);
        this.player.add(this.engineGlow);

        // Shield effect (for invincibility)
        this.shield = this.add.circle(0, 0, 35, 0x00ffff, 0);
        this.shield.setStrokeStyle(2, 0x00ffff, 0);
        this.player.add(this.shield);

        // Physics
        this.physics.add.existing(this.player);
        this.player.body.setCircle(25);
        this.player.body.setOffset(-25, -25);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setDrag(150);
        this.player.body.setMaxVelocity(400);

        // Player state
        this.player.speed = 350;
        this.player.isInvincible = false;

        // Trail
        this.trailPoints = [];
    }

    createStars() {
        this.stars = this.physics.add.group();

        const starConfigs = [
            { color: 0xcd7f32, value: 10, count: 25, size: 12, name: 'bronze' },
            { color: 0xc0c0c0, value: 25, count: 12, size: 14, name: 'silver' },
            { color: 0xffd700, value: 50, count: 5, size: 18, name: 'gold' }
        ];

        starConfigs.forEach(config => {
            for (let i = 0; i < config.count; i++) {
                const x = Phaser.Math.Between(150, 2400);
                const y = Phaser.Math.Between(150, 1300);
                this.createStar(x, y, config);
            }
        });

        // Stellar core
        this.createStellarCore(2400, 720);
    }

    createStar(x, y, config) {
        const star = this.add.container(x, y);

        // Star shape
        const shape = this.add.star(0, 0, 5, config.size * 0.4, config.size, config.color);
        star.add(shape);

        // Glow
        const glow = this.add.circle(0, 0, config.size + 5, config.color, 0.3);
        star.add(glow);
        star.sendToBack(glow);

        star.setDepth(DEPTH.COLLECTIBLES);
        this.physics.add.existing(star);
        star.body.setCircle(config.size);
        star.body.setOffset(-config.size, -config.size);
        star.body.setImmovable(true);

        star.value = config.value;
        star.starColor = config.color;
        star.collected = false;

        // Animations
        this.tweens.add({
            targets: shape,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });

        this.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.1 },
            scale: { from: 1, to: 1.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        this.stars.add(star);
    }

    createStellarCore(x, y) {
        const core = this.add.container(x, y);

        // Outer glow
        const outerGlow = this.add.circle(0, 0, 50, 0xff00ff, 0.2);
        core.add(outerGlow);

        // Core shape
        const coreShape = this.add.star(0, 0, 6, 15, 35, 0xff00ff);
        core.add(coreShape);

        // Inner glow
        const innerGlow = this.add.circle(0, 0, 20, 0xffffff, 0.5);
        core.add(innerGlow);

        core.setDepth(DEPTH.COLLECTIBLES);
        this.physics.add.existing(core);
        core.body.setCircle(40);
        core.body.setOffset(-40, -40);
        core.body.setImmovable(true);

        core.value = 100;
        core.isCore = true;
        core.collected = false;

        // Animations
        this.tweens.add({
            targets: coreShape,
            angle: 360,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
        });

        this.tweens.add({
            targets: [core, outerGlow],
            scale: { from: 1, to: 1.2 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: innerGlow,
            alpha: { from: 0.5, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.stars.add(core);
    }

    createObstacles() {
        this.obstacles = this.physics.add.group();

        // Create asteroids
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(400, 2300);
            const y = Phaser.Math.Between(100, 1300);
            const size = Phaser.Math.Between(20, 50);

            this.createAsteroid(x, y, size);
        }
    }

    createAsteroid(x, y, size) {
        const asteroid = this.add.container(x, y);

        // Irregular asteroid shape using graphics
        const shape = this.add.graphics();
        shape.fillStyle(0x555566, 1);

        // Create bumpy circle
        const points = [];
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = size + Phaser.Math.Between(-size * 0.3, size * 0.3);
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }

        shape.beginPath();
        shape.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }
        shape.closePath();
        shape.fill();

        // Craters
        shape.fillStyle(0x444455, 1);
        shape.fillCircle(size * 0.3, -size * 0.2, size * 0.2);
        shape.fillCircle(-size * 0.2, size * 0.3, size * 0.15);

        asteroid.add(shape);
        asteroid.setDepth(DEPTH.COLLECTIBLES);

        this.physics.add.existing(asteroid);
        asteroid.body.setCircle(size);
        asteroid.body.setOffset(-size, -size);
        asteroid.body.setImmovable(true);

        // Slow rotation
        this.tweens.add({
            targets: asteroid,
            angle: Phaser.Math.Between(0, 1) ? 360 : -360,
            duration: Phaser.Math.Between(5000, 15000),
            repeat: -1,
            ease: 'Linear'
        });

        this.obstacles.add(asteroid);
    }

    createEnemies() {
        this.enemyGroup = this.physics.add.group();

        // Create patrol drones that move in patterns
        for (let i = 0; i < 4; i++) {
            const x = Phaser.Math.Between(600, 2200);
            const y = Phaser.Math.Between(200, 1200);
            this.createPatrolDrone(x, y);
        }

        // Create chaser enemy that hunts the player
        this.createChaserEnemy(1500, 700);
    }

    createPatrolDrone(x, y) {
        const drone = this.add.container(x, y);

        // Drone body
        const body = this.add.graphics();
        body.fillStyle(0xff3333, 1);
        body.fillCircle(0, 0, 18);
        body.fillStyle(0x880000, 1);
        body.fillCircle(0, 0, 10);
        // Evil eye
        body.fillStyle(0xffff00, 1);
        body.fillCircle(0, 0, 5);
        drone.add(body);

        // Danger glow
        const glow = this.add.circle(0, 0, 25, 0xff0000, 0.3);
        drone.add(glow);
        drone.sendToBack(glow);

        this.physics.add.existing(drone);
        drone.body.setCircle(20);
        drone.body.setOffset(-20, -20);
        drone.setDepth(DEPTH.ENEMIES || DEPTH.PLAYER - 1);

        // Patrol movement pattern
        const patrolDist = Phaser.Math.Between(100, 200);
        const patrolDuration = Phaser.Math.Between(2000, 4000);
        const horizontal = Phaser.Math.Between(0, 1) === 0;

        this.tweens.add({
            targets: drone,
            x: horizontal ? x + patrolDist : x,
            y: horizontal ? y : y + patrolDist,
            duration: patrolDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Pulsing glow
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.6 },
            scale: { from: 1, to: 1.3 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.enemyGroup.add(drone);
        this.enemies.push(drone);
    }

    createChaserEnemy(x, y) {
        const chaser = this.add.container(x, y);

        // Chaser body - more menacing
        const body = this.add.graphics();
        // Spiky shape
        body.fillStyle(0xff0066, 1);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const nextAngle = ((i + 1) / 6) * Math.PI * 2;
            body.fillTriangle(
                0, 0,
                Math.cos(angle) * 25,
                Math.sin(angle) * 25,
                Math.cos((angle + nextAngle) / 2) * 12,
                Math.sin((angle + nextAngle) / 2) * 12
            );
        }
        // Core
        body.fillStyle(0xff00ff, 1);
        body.fillCircle(0, 0, 10);
        body.fillStyle(0xffffff, 1);
        body.fillCircle(0, 0, 4);
        chaser.add(body);

        // Warning indicator
        const warning = this.add.text(0, -35, '!', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ff0000'
        }).setOrigin(0.5);
        chaser.add(warning);

        this.tweens.add({
            targets: warning,
            alpha: { from: 1, to: 0.3 },
            scale: { from: 1, to: 1.2 },
            duration: 300,
            yoyo: true,
            repeat: -1
        });

        this.physics.add.existing(chaser);
        chaser.body.setCircle(25);
        chaser.body.setOffset(-25, -25);
        chaser.body.setMaxVelocity(150);
        chaser.setDepth(DEPTH.ENEMIES || DEPTH.PLAYER - 1);

        chaser.isChaser = true;
        chaser.speed = 120;

        this.enemyGroup.add(chaser);
        this.enemies.push(chaser);
        this.chaser = chaser;
    }

    startTimer() {
        // Timer display
        const { width } = this.cameras.main;
        this.timerText = this.add.text(width / 2, 25, `Time: ${this.timeLeft}`, {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        })
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(DEPTH.UI);

        // Countdown timer
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isComplete) return;

                this.timeLeft--;
                this.timerText.setText(`Time: ${this.timeLeft}`);

                // Warning when low on time
                if (this.timeLeft <= 10) {
                    this.timerText.setColor('#ff0000');
                    this.tweens.add({
                        targets: this.timerText,
                        scale: { from: 1.2, to: 1 },
                        duration: 200
                    });
                } else if (this.timeLeft <= 30) {
                    this.timerText.setColor('#ffff00');
                }

                // Time's up!
                if (this.timeLeft <= 0) {
                    this.timeUp();
                }
            },
            loop: true
        });
    }

    timeUp() {
        if (this.isComplete) return;
        this.isComplete = true;

        this.player.body.setVelocity(0);
        this.playSound('hit');

        const { width, height } = this.cameras.main;

        // Time up screen
        this.add.rectangle(
            this.cameras.main.scrollX + width/2,
            this.cameras.main.scrollY + height/2,
            width, height, 0x000000, 0.8
        ).setDepth(DEPTH.OVERLAY);

        this.add.text(
            this.cameras.main.scrollX + width/2,
            this.cameras.main.scrollY + height/2 - 60,
            '⏰ TIME UP! ⏰',
            { fontFamily: 'Arial Black', fontSize: '48px', color: '#ff6600' }
        ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

        const session = this.registry.get('session');
        this.add.text(
            this.cameras.main.scrollX + width/2,
            this.cameras.main.scrollY + height/2,
            `Score: ${session.score}`,
            { fontFamily: 'Arial', fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

        this.add.text(
            this.cameras.main.scrollX + width/2,
            this.cameras.main.scrollY + height/2 + 60,
            '↻ TRY AGAIN',
            { fontFamily: 'Arial Black', fontSize: '28px', color: '#00ffff' }
        ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.restart());

        this.add.text(
            this.cameras.main.scrollX + width/2,
            this.cameras.main.scrollY + height/2 + 110,
            'Back to Menu',
            { fontFamily: 'Arial', fontSize: '20px', color: '#888888' }
        ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }

    hitEnemy(player, enemy) {
        // Same as hitting obstacle
        this.hitObstacle(player, enemy);
    }

    createParticles() {
        // Create particle emitter for star collection
        this.collectParticles = this.add.particles(0, 0, {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            emitting: false
        });
        this.collectParticles.setDepth(DEPTH.EFFECTS);
    }

    createHUD(width, height) {
        // Score
        this.scoreText = this.add.text(width - 20, 20, 'Score: 0', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        })
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(DEPTH.UI);

        // Level
        this.add.text(20, 20, `Level ${this.levelKey}`, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#ffffff'
        })
            .setScrollFactor(0)
            .setDepth(DEPTH.UI);

        // Health
        this.healthContainer = this.add.container(20, 55).setScrollFactor(0).setDepth(DEPTH.UI);
        this.updateHealthDisplay();

        // Mini-map
        this.createMinimap(width);

        // Back button
        this.add.text(width - 20, 60, '← Menu', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#888888'
        })
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', function() { this.setColor('#ffffff'); })
            .on('pointerout', function() { this.setColor('#888888'); })
            .on('pointerdown', () => this.scene.start('MenuScene'));

        // Instructions (fades out)
        const instructions = this.add.text(width / 2, height - 30,
            this.sys.game.device.input.touch ?
            'Touch left side to move • Collect stars • Avoid asteroids!' :
            'Arrow keys/WASD to move • Collect stars • Avoid asteroids!', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#888888'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.UI);

        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: instructions,
                alpha: 0,
                duration: 1000
            });
        });
    }

    createMinimap(screenWidth) {
        const mapSize = 120;
        const mapX = screenWidth - mapSize - 20;
        const mapY = 100;

        // Background
        const mapBg = this.add.rectangle(mapX + mapSize/2, mapY + mapSize/2, mapSize, mapSize, 0x000000, 0.5);
        mapBg.setScrollFactor(0).setDepth(DEPTH.UI);
        mapBg.setStrokeStyle(1, 0x00ffff);

        // Player dot (will be updated)
        this.minimapPlayer = this.add.circle(mapX, mapY, 3, 0x00ffff);
        this.minimapPlayer.setScrollFactor(0).setDepth(DEPTH.UI + 1);

        // Core marker
        const coreX = mapX + (2400 / 2560) * mapSize;
        const coreY = mapY + (720 / 1440) * mapSize;
        this.add.circle(coreX, coreY, 4, 0xff00ff)
            .setScrollFactor(0).setDepth(DEPTH.UI + 1);

        this.minimapConfig = { x: mapX, y: mapY, size: mapSize };
    }

    updateHealthDisplay() {
        this.healthContainer.removeAll(true);

        for (let i = 0; i < 3; i++) {
            const heart = this.add.graphics();
            if (i < this.playerHealth) {
                heart.fillStyle(0xff0000, 1);
            } else {
                heart.fillStyle(0x444444, 1);
            }
            // Simple heart shape
            heart.fillCircle(8, 5, 6);
            heart.fillCircle(18, 5, 6);
            heart.fillTriangle(2, 8, 24, 8, 13, 22);
            heart.x = i * 35;
            this.healthContainer.add(heart);
        }
    }

    setupControls(width, height) {
        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Touch controls
        if (this.sys.game.device.input.touch) {
            this.createTouchControls(width, height);
        }

        // Joystick state
        this.joystickVector = new Phaser.Math.Vector2();
    }

    createTouchControls(width, height) {
        // Virtual joystick area (left side)
        this.joystickBase = this.add.circle(120, height - 120, 60, 0xffffff, 0.15);
        this.joystickBase.setScrollFactor(0).setDepth(DEPTH.UI);
        this.joystickBase.setStrokeStyle(2, 0x00ffff, 0.5);

        this.joystickThumb = this.add.circle(120, height - 120, 25, 0x00ffff, 0.4);
        this.joystickThumb.setScrollFactor(0).setDepth(DEPTH.UI + 1);

        this.joystickActive = false;
        this.joystickOrigin = { x: 120, y: height - 120 };

        // Touch handlers
        this.input.on('pointerdown', (pointer) => {
            if (pointer.x < width / 2) {
                this.joystickActive = true;
                this.joystickOrigin = { x: pointer.x, y: pointer.y };
                this.joystickBase.setPosition(pointer.x, pointer.y);
                this.joystickThumb.setPosition(pointer.x, pointer.y);
                this.joystickBase.setAlpha(0.3);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.joystickActive && pointer.isDown) {
                const maxDist = 50;
                const dx = pointer.x - this.joystickOrigin.x;
                const dy = pointer.y - this.joystickOrigin.y;
                const dist = Math.min(maxDist, Math.sqrt(dx * dx + dy * dy));
                const angle = Math.atan2(dy, dx);

                this.joystickThumb.x = this.joystickOrigin.x + Math.cos(angle) * dist;
                this.joystickThumb.y = this.joystickOrigin.y + Math.sin(angle) * dist;

                this.joystickVector.set(dx / maxDist, dy / maxDist);
                this.joystickVector.limit(1);
            }
        });

        this.input.on('pointerup', () => {
            this.joystickActive = false;
            this.joystickVector.set(0, 0);
            this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
            this.joystickBase.setAlpha(0.15);
        });
    }

    collectStar(player, star) {
        if (star.collected) return;
        star.collected = true;

        const session = this.registry.get('session');
        session.score += star.value;
        this.registry.set('session', session);

        this.scoreText.setText(`Score: ${session.score}`);
        this.playSound('collect');

        // Particles
        const color = star.starColor || 0xff00ff;
        this.collectParticles.setPosition(star.x, star.y);
        this.collectParticles.setParticleTint(color);
        this.collectParticles.explode(20);

        // Floating text
        const floatText = this.add.text(star.x, star.y, `+${star.value}`, {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(DEPTH.EFFECTS);

        this.tweens.add({
            targets: floatText,
            y: star.y - 60,
            alpha: 0,
            scale: 1.5,
            duration: 800,
            ease: 'Power2',
            onComplete: () => floatText.destroy()
        });

        // Score pop
        this.tweens.add({
            targets: this.scoreText,
            scale: { from: 1.3, to: 1 },
            duration: 200,
            ease: 'Back.out'
        });

        // Star animation
        this.tweens.add({
            targets: star,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                if (star.isCore) {
                    this.levelComplete();
                }
                star.destroy();
            }
        });
    }

    hitObstacle(player, obstacle) {
        if (this.player.isInvincible || this.isComplete) return;

        this.playerHealth--;
        this.updateHealthDisplay();
        this.playSound('hit');

        // Screen shake
        this.cameras.main.shake(300, 0.02);

        // Flash red
        this.cameras.main.flash(200, 255, 0, 0, false);

        // Knockback
        const angle = Phaser.Math.Angle.Between(obstacle.x, obstacle.y, player.x, player.y);
        player.body.setVelocity(
            Math.cos(angle) * 300,
            Math.sin(angle) * 300
        );

        // Invincibility frames
        this.player.isInvincible = true;
        this.shield.setAlpha(0.3);
        this.shield.setStrokeStyle(2, 0x00ffff, 0.5);

        this.tweens.add({
            targets: this.player,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            yoyo: true,
            repeat: 10,
            onComplete: () => {
                this.player.isInvincible = false;
                this.shield.setAlpha(0);
                this.player.setAlpha(1);
            }
        });

        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    levelComplete() {
        if (this.isComplete) return;
        this.isComplete = true;

        this.playSound('win');
        this.player.body.setVelocity(0);

        // Update player progress
        this.updateProgress();

        const session = this.registry.get('session');
        const { width, height } = this.cameras.main;

        // Celebration particles
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 200, () => {
                const x = Phaser.Math.Between(width * 0.2, width * 0.8);
                const y = Phaser.Math.Between(height * 0.2, height * 0.5);
                this.collectParticles.setPosition(x + this.cameras.main.scrollX, y + this.cameras.main.scrollY);
                this.collectParticles.setParticleTint(Phaser.Display.Color.RandomRGB().color);
                this.collectParticles.explode(30);
            });
        }

        // Calculate next level
        const nextLevel = this.getNextLevel();

        // Victory screen
        this.time.delayedCall(500, () => {
            const overlay = this.add.rectangle(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2,
                width, height, 0x000000, 0.8
            ).setDepth(DEPTH.OVERLAY);

            this.add.text(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2 - 120,
                '🎉 LEVEL COMPLETE! 🎉',
                { fontFamily: 'Arial Black', fontSize: '42px', color: '#00ffff' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            this.add.text(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2 - 50,
                `Final Score: ${session.score}`,
                { fontFamily: 'Arial', fontSize: '32px', color: '#ffffff' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            // Time bonus display
            const timeBonus = this.timeLeft * 10;
            this.add.text(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2 - 10,
                `Time Bonus: +${timeBonus}`,
                { fontFamily: 'Arial', fontSize: '20px', color: '#ffff00' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            if (nextLevel) {
                // Auto-advance countdown
                let countdown = 3;
                console.log('Next level available:', nextLevel, 'Starting countdown...');

                const countdownText = this.add.text(
                    this.cameras.main.scrollX + width/2,
                    this.cameras.main.scrollY + height/2 + 50,
                    `Next level in ${countdown}...`,
                    { fontFamily: 'Arial Black', fontSize: '28px', color: '#00ff00' }
                ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

                // Countdown timer
                const countdownTimer = this.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        countdown--;
                        console.log('Countdown:', countdown);
                        if (countdown > 0) {
                            countdownText.setText(`Next level in ${countdown}...`);
                        } else {
                            countdownText.setText('GO!');
                            console.log('Countdown finished, calling goToNextLevel...');
                            this.time.delayedCall(300, () => this.goToNextLevel());
                        }
                    },
                    repeat: 2
                });

                // Skip button (tap to go immediately)
                const skipText = this.add.text(
                    this.cameras.main.scrollX + width/2,
                    this.cameras.main.scrollY + height/2 + 100,
                    'Tap to skip',
                    { fontFamily: 'Arial', fontSize: '18px', color: '#888888' }
                ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => {
                        countdownTimer.remove();
                        this.goToNextLevel();
                    });
            } else {
                // All levels complete!
                this.add.text(
                    this.cameras.main.scrollX + width/2,
                    this.cameras.main.scrollY + height/2 + 50,
                    '🏆 ALL LEVELS COMPLETE! 🏆',
                    { fontFamily: 'Arial Black', fontSize: '28px', color: '#ffd700' }
                ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

                this.add.text(
                    this.cameras.main.scrollX + width/2,
                    this.cameras.main.scrollY + height/2 + 100,
                    'Back to Menu',
                    { fontFamily: 'Arial', fontSize: '20px', color: '#888888' }
                ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => this.scene.start('MenuScene'));
            }

            // Replay button (smaller, bottom)
            this.add.text(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2 + 150,
                '↻ Replay Level',
                { fontFamily: 'Arial', fontSize: '16px', color: '#666666' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', function() { this.setColor('#888888'); })
                .on('pointerout', function() { this.setColor('#666666'); })
                .on('pointerdown', () => this.scene.restart());
        });
    }

    getNextLevel() {
        const levelsPerChapter = 5;
        const totalChapters = 8;

        let nextChapter = this.chapter;
        let nextLevelNum = this.level + 1;

        // Move to next chapter if we finished all levels in current chapter
        if (nextLevelNum > levelsPerChapter) {
            nextChapter++;
            nextLevelNum = 1;
        }

        // Check if there are more levels
        if (nextChapter > totalChapters) {
            return null; // All levels complete!
        }

        return { chapter: nextChapter, level: nextLevelNum };
    }

    goToNextLevel() {
        const nextLevel = this.getNextLevel();
        console.log('goToNextLevel called, nextLevel:', nextLevel);

        if (!nextLevel) {
            console.log('No next level, going to menu');
            this.scene.start('MenuScene');
            return;
        }

        // Update registry with next level
        this.registry.set('selectedLevel', nextLevel);
        console.log('Starting level:', nextLevel.chapter, '-', nextLevel.level);

        // Transition to next level
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            console.log('Fade complete, starting GameScene');
            this.scene.start('GameScene', { level: nextLevel });
        });
    }

    updateProgress() {
        const progress = this.registry.get('playerProgress') || {
            currentChapter: 1,
            currentLevel: 1,
            totalStars: 0,
            unlockedLevels: ['1-1'],
            achievements: []
        };

        // Add score to total stars (simplified: 1 star per 100 points)
        const session = this.registry.get('session');
        const starsEarned = Math.floor(session.score / 100) + 1;
        progress.totalStars += starsEarned;

        // Unlock next level
        const nextLevel = this.getNextLevel();
        if (nextLevel) {
            const nextLevelKey = `${nextLevel.chapter}-${nextLevel.level}`;
            if (!progress.unlockedLevels.includes(nextLevelKey)) {
                progress.unlockedLevels.push(nextLevelKey);
            }
            progress.currentChapter = nextLevel.chapter;
            progress.currentLevel = nextLevel.level;
        }

        this.registry.set('playerProgress', progress);
    }

    gameOver() {
        this.isComplete = true;
        this.player.body.setVelocity(0);

        const { width, height } = this.cameras.main;

        this.time.delayedCall(500, () => {
            this.add.rectangle(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2,
                width, height, 0x000000, 0.8
            ).setDepth(DEPTH.OVERLAY);

            this.add.text(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2 - 60,
                '💥 GAME OVER 💥',
                { fontFamily: 'Arial Black', fontSize: '48px', color: '#ff0000' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            this.add.text(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2 + 30,
                '↻ TRY AGAIN',
                { fontFamily: 'Arial Black', fontSize: '28px', color: '#00ffff' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.restart());

            this.add.text(
                this.cameras.main.scrollX + width/2,
                this.cameras.main.scrollY + height/2 + 90,
                'Back to Menu',
                { fontFamily: 'Arial', fontSize: '20px', color: '#888888' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.start('MenuScene'));
        });
    }

    updateEnemies() {
        // Update chaser to follow player
        if (this.chaser && this.chaser.body) {
            const angle = Phaser.Math.Angle.Between(
                this.chaser.x, this.chaser.y,
                this.player.x, this.player.y
            );

            // Move towards player
            this.chaser.body.setVelocity(
                Math.cos(angle) * this.chaser.speed,
                Math.sin(angle) * this.chaser.speed
            );

            // Rotate to face player
            this.chaser.rotation = angle + Math.PI / 2;
        }
    }

    update(time, delta) {
        if (this.isPaused || this.isComplete) return;

        // Update chaser enemy AI
        this.updateEnemies();

        // Input
        let vx = 0, vy = 0;
        const speed = this.player.speed;

        // Keyboard
        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

        // Touch joystick
        if (this.joystickVector.length() > 0.1) {
            vx = this.joystickVector.x;
            vy = this.joystickVector.y;
        }

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const len = Math.sqrt(vx * vx + vy * vy);
            vx /= len;
            vy /= len;
        }

        this.player.body.setVelocity(vx * speed, vy * speed);

        // Rotate towards movement
        if (vx !== 0 || vy !== 0) {
            const targetAngle = Math.atan2(vy, vx) + Math.PI / 2;
            const currentAngle = this.player.rotation;
            const diff = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
            this.player.rotation += diff * 0.15;
        }

        // Engine glow
        const moving = vx !== 0 || vy !== 0;
        this.engineGlow.setAlpha(moving ? 0.8 : 0.2);
        if (moving) {
            this.engineGlow.setScale(0.8 + Math.random() * 0.4);
        }

        // Update minimap
        if (this.minimapConfig) {
            const { x, y, size } = this.minimapConfig;
            this.minimapPlayer.x = x + (this.player.x / 2560) * size;
            this.minimapPlayer.y = y + (this.player.y / 1440) * size;
        }

        // Trail effect
        if (moving && time % 50 < 20) {
            const trail = this.add.circle(this.player.x, this.player.y, 4, 0x00ffff, 0.5);
            trail.setDepth(DEPTH.PLAYER - 1);
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => trail.destroy()
            });
        }
    }
}
