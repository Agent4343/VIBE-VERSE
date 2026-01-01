/**
 * EndlessScene - Survival mode where difficulty increases over time
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';
import { PlayerData } from '../utils/PlayerData.js';

export default class EndlessScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndlessScene' });
    }

    init() {
        this.score = 0;
        this.survivalTime = 0;
        this.playerHealth = 3 + (PlayerData.getCurrentShip().extraHealth || 0);
        this.maxHealth = this.playerHealth;
        this.difficulty = 1;
        this.isGameOver = false;
        this.starsCollected = 0;
        this.ship = PlayerData.getCurrentShip();
    }

    create() {
        const { width, height } = this.cameras.main;

        this.cameras.main.fadeIn(500);

        // Initialize sound
        this.initSound();

        // Create world
        this.createBackground(width, height);
        this.createPlayer();
        this.createGroups();
        this.createHUD(width, height);
        this.setupControls(width, height);

        // Spawn timers
        this.startSpawners();

        // Survival timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isGameOver) return;
                this.survivalTime++;
                this.updateHUD();

                // Increase difficulty every 15 seconds
                if (this.survivalTime % 15 === 0) {
                    this.difficulty += 0.5;
                    this.showDifficultyIncrease();
                }
            },
            loop: true
        });

        console.log('Endless mode started with ship:', this.ship.name);
    }

    initSound() {
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
            }
        };
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a0a3e, 0x1a0a3e, 1);
        bg.fillRect(0, 0, width, height);
        bg.setDepth(DEPTH.BACKGROUND);

        // Animated stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 0.5;
            const star = this.add.circle(x, y, size, 0xffffff, Math.random() * 0.8 + 0.2);
            star.setDepth(DEPTH.BACKGROUND + 1);

            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: 0.1 },
                duration: Math.random() * 2000 + 1000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    createPlayer() {
        const { width, height } = this.cameras.main;

        this.player = this.add.container(width / 2, height / 2);
        this.player.setDepth(DEPTH.PLAYER);

        // Ship body with current ship color
        const shipBody = this.add.graphics();
        shipBody.fillStyle(this.ship.color, 1);
        shipBody.beginPath();
        shipBody.moveTo(0, -25);
        shipBody.lineTo(-18, 20);
        shipBody.lineTo(18, 20);
        shipBody.closePath();
        shipBody.fill();

        // Cockpit
        shipBody.fillStyle(0x0088ff, 1);
        shipBody.fillCircle(0, 0, 8);

        // Wings
        shipBody.fillStyle(this.ship.color, 0.8);
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

        // Physics
        this.physics.add.existing(this.player);
        this.player.body.setCircle(25);
        this.player.body.setOffset(-25, -25);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setDrag(150);
        this.player.body.setMaxVelocity(400);

        this.player.speed = this.ship.speed;
        this.player.isInvincible = false;
    }

    createGroups() {
        this.stars = this.physics.add.group();
        this.obstacles = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Collisions
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitObstacle, null, this);
    }

    createHUD(width, height) {
        // Survival time
        this.timeText = this.add.text(width / 2, 20, 'Time: 0s', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0).setDepth(DEPTH.UI);

        // Score
        this.scoreText = this.add.text(width - 20, 20, 'Score: 0', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0).setDepth(DEPTH.UI);

        // Best time
        this.add.text(width - 20, 55, `Best: ${PlayerData.data.endlessBestTime}s`, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(1, 0).setDepth(DEPTH.UI);

        // Health
        this.healthContainer = this.add.container(20, 20).setDepth(DEPTH.UI);
        this.updateHealthDisplay();

        // Difficulty indicator
        this.difficultyText = this.add.text(20, 55, 'Wave 1', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ff6600'
        }).setDepth(DEPTH.UI);

        // Mode label
        this.add.text(width / 2, 55, '∞ ENDLESS MODE', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ff00ff'
        }).setOrigin(0.5, 0).setDepth(DEPTH.UI);

        // Back/Menu button (top-left, below health)
        this.add.text(20, 85, '← Menu', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#666666'
        }).setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', function() { this.setColor('#ffffff'); })
            .on('pointerout', function() { this.setColor('#666666'); })
            .on('pointerdown', () => {
                this.cameras.main.fadeOut(300);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('MenuScene');
                });
            });
    }

    updateHUD() {
        this.timeText.setText(`Time: ${this.survivalTime}s`);
        this.scoreText.setText(`Score: ${this.score}`);
        this.difficultyText.setText(`Wave ${Math.floor(this.difficulty)}`);

        // Color changes based on survival time
        if (this.survivalTime >= 120) {
            this.timeText.setColor('#ff00ff');
        } else if (this.survivalTime >= 60) {
            this.timeText.setColor('#00ff00');
        }
    }

    updateHealthDisplay() {
        this.healthContainer.removeAll(true);

        for (let i = 0; i < this.maxHealth; i++) {
            const heart = this.add.graphics();
            if (i < this.playerHealth) {
                heart.fillStyle(0xff0000, 1);
            } else {
                heart.fillStyle(0x444444, 1);
            }
            heart.fillCircle(8, 5, 6);
            heart.fillCircle(18, 5, 6);
            heart.fillTriangle(2, 8, 24, 8, 13, 22);
            heart.x = i * 35;
            this.healthContainer.add(heart);
        }
    }

    setupControls(width, height) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Joystick state (always initialize)
        this.joystickVector = new Phaser.Math.Vector2();

        // ALWAYS create touch controls - they work on both mobile and desktop
        // and don't interfere with keyboard controls
        this.createTouchControls(width, height);
    }

    createTouchControls() {
        // Get current screen dimensions
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Joystick size scales with screen
        const joystickSize = Math.min(60, screenHeight * 0.12);
        const thumbSize = joystickSize * 0.4;
        const padding = joystickSize + 20;

        // Virtual joystick area (bottom-left, scaled for screen)
        this.joystickBase = this.add.circle(padding, screenHeight - padding, joystickSize, 0xffffff, 0.2);
        this.joystickBase.setScrollFactor(0).setDepth(DEPTH.UI);
        this.joystickBase.setStrokeStyle(3, 0x00ffff, 0.6);

        this.joystickThumb = this.add.circle(padding, screenHeight - padding, thumbSize, 0x00ffff, 0.5);
        this.joystickThumb.setScrollFactor(0).setDepth(DEPTH.UI + 1);

        this.joystickActive = false;
        this.joystickOrigin = { x: padding, y: screenHeight - padding };
        this.joystickMaxDist = joystickSize * 0.8;

        // Touch handlers
        this.input.on('pointerdown', (pointer) => {
            const currentWidth = this.cameras.main.width;
            if (pointer.x < currentWidth / 2) {
                this.joystickActive = true;
                this.joystickOrigin = { x: pointer.x, y: pointer.y };
                this.joystickBase.setPosition(pointer.x, pointer.y);
                this.joystickThumb.setPosition(pointer.x, pointer.y);
                this.joystickBase.setAlpha(0.4);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.joystickActive && pointer.isDown) {
                const maxDist = this.joystickMaxDist;
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
            if (this.joystickActive) {
                this.joystickActive = false;
                this.joystickVector.set(0, 0);
                const currentHeight = this.cameras.main.height;
                const resetPadding = Math.min(60, currentHeight * 0.12) + 20;
                this.joystickBase.setPosition(resetPadding, currentHeight - resetPadding);
                this.joystickThumb.setPosition(resetPadding, currentHeight - resetPadding);
                this.joystickBase.setAlpha(0.2);
            }
        });
    }

    startSpawners() {
        // Star spawner
        this.time.addEvent({
            delay: 2000,
            callback: () => this.spawnStar(),
            loop: true
        });

        // Obstacle spawner
        this.time.addEvent({
            delay: 3000,
            callback: () => this.spawnObstacle(),
            loop: true
        });

        // Enemy spawner (starts after 30 seconds)
        this.time.delayedCall(30000, () => {
            this.time.addEvent({
                delay: 5000,
                callback: () => this.spawnEnemy(),
                loop: true
            });
        });
    }

    spawnStar() {
        if (this.isGameOver) return;

        const { width, height } = this.cameras.main;
        const x = Phaser.Math.Between(50, width - 50);
        const y = Phaser.Math.Between(50, height - 50);

        const star = this.add.container(x, y);

        const colors = [0xcd7f32, 0xc0c0c0, 0xffd700];
        const values = [10, 25, 50];
        const sizes = [12, 14, 18];

        // Higher chance of better stars at higher difficulty
        let tier = 0;
        const roll = Math.random() + (this.difficulty * 0.05);
        if (roll > 0.9) tier = 2;
        else if (roll > 0.6) tier = 1;

        const shape = this.add.star(0, 0, 5, sizes[tier] * 0.4, sizes[tier], colors[tier]);
        star.add(shape);

        const glow = this.add.circle(0, 0, sizes[tier] + 5, colors[tier], 0.3);
        star.add(glow);
        star.sendToBack(glow);

        this.physics.add.existing(star);
        star.body.setCircle(sizes[tier]);
        star.body.setOffset(-sizes[tier], -sizes[tier]);

        star.value = values[tier] * (this.ship.doubleStars ? 2 : 1);
        star.collected = false;

        // Rotate animation
        this.tweens.add({
            targets: shape,
            angle: 360,
            duration: 3000,
            repeat: -1
        });

        // Despawn after 10 seconds
        this.time.delayedCall(10000, () => {
            if (!star.collected) {
                this.tweens.add({
                    targets: star,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => star.destroy()
                });
            }
        });

        this.stars.add(star);
    }

    spawnObstacle() {
        if (this.isGameOver) return;

        const { width, height } = this.cameras.main;

        // Spawn from edges
        const side = Phaser.Math.Between(0, 3);
        let x, y, vx, vy;

        const speed = 50 + (this.difficulty * 20);

        switch(side) {
            case 0: // Top
                x = Phaser.Math.Between(0, width);
                y = -50;
                vx = Phaser.Math.Between(-50, 50);
                vy = speed;
                break;
            case 1: // Right
                x = width + 50;
                y = Phaser.Math.Between(0, height);
                vx = -speed;
                vy = Phaser.Math.Between(-50, 50);
                break;
            case 2: // Bottom
                x = Phaser.Math.Between(0, width);
                y = height + 50;
                vx = Phaser.Math.Between(-50, 50);
                vy = -speed;
                break;
            case 3: // Left
                x = -50;
                y = Phaser.Math.Between(0, height);
                vx = speed;
                vy = Phaser.Math.Between(-50, 50);
                break;
        }

        const size = Phaser.Math.Between(20, 40);
        const asteroid = this.add.container(x, y);

        const shape = this.add.graphics();
        shape.fillStyle(0x555566, 1);
        shape.fillCircle(0, 0, size);
        shape.fillStyle(0x444455, 1);
        shape.fillCircle(size * 0.3, -size * 0.2, size * 0.2);
        asteroid.add(shape);

        this.physics.add.existing(asteroid);
        asteroid.body.setCircle(size);
        asteroid.body.setOffset(-size, -size);
        asteroid.body.setVelocity(vx, vy);

        // Rotate
        this.tweens.add({
            targets: asteroid,
            angle: 360,
            duration: Phaser.Math.Between(3000, 8000),
            repeat: -1
        });

        // Destroy when off screen
        this.time.delayedCall(15000, () => asteroid.destroy());

        this.obstacles.add(asteroid);
    }

    spawnEnemy() {
        if (this.isGameOver) return;

        const { width, height } = this.cameras.main;

        // Spawn at random edge
        const side = Phaser.Math.Between(0, 3);
        let x, y;

        switch(side) {
            case 0: x = Phaser.Math.Between(0, width); y = -30; break;
            case 1: x = width + 30; y = Phaser.Math.Between(0, height); break;
            case 2: x = Phaser.Math.Between(0, width); y = height + 30; break;
            case 3: x = -30; y = Phaser.Math.Between(0, height); break;
        }

        const enemy = this.add.container(x, y);

        const body = this.add.graphics();
        body.fillStyle(0xff3333, 1);
        body.fillCircle(0, 0, 18);
        body.fillStyle(0xffff00, 1);
        body.fillCircle(0, 0, 5);
        enemy.add(body);

        const glow = this.add.circle(0, 0, 25, 0xff0000, 0.3);
        enemy.add(glow);
        enemy.sendToBack(glow);

        this.physics.add.existing(enemy);
        enemy.body.setCircle(20);
        enemy.body.setOffset(-20, -20);

        enemy.speed = 60 + (this.difficulty * 10);
        enemy.isChaser = true;

        // Pulsing glow
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.6 },
            scale: { from: 1, to: 1.3 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.enemies.add(enemy);
    }

    collectStar(player, star) {
        if (star.collected) return;
        star.collected = true;

        this.score += star.value;
        this.starsCollected++;
        this.updateHUD();
        this.playSound('collect');

        // Floating text
        const floatText = this.add.text(star.x, star.y, `+${star.value}`, {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(DEPTH.EFFECTS);

        this.tweens.add({
            targets: floatText,
            y: star.y - 50,
            alpha: 0,
            duration: 600,
            onComplete: () => floatText.destroy()
        });

        // Destroy star
        this.tweens.add({
            targets: star,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => star.destroy()
        });
    }

    hitObstacle(player, obstacle) {
        if (this.player.isInvincible || this.isGameOver) return;

        this.playerHealth--;
        this.updateHealthDisplay();
        this.playSound('hit');

        this.cameras.main.shake(300, 0.02);
        this.cameras.main.flash(200, 255, 0, 0, false);

        // Knockback
        const angle = Phaser.Math.Angle.Between(obstacle.x, obstacle.y, player.x, player.y);
        player.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

        // Invincibility
        this.player.isInvincible = true;
        this.tweens.add({
            targets: this.player,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            yoyo: true,
            repeat: 10,
            onComplete: () => {
                this.player.isInvincible = false;
                this.player.setAlpha(1);
            }
        });

        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.player.body.setVelocity(0);

        // Record stats
        PlayerData.updateEndlessBest(this.survivalTime);
        PlayerData.addStarsCollected(this.starsCollected);
        PlayerData.recordDeath();

        const { width, height } = this.cameras.main;

        this.time.delayedCall(500, () => {
            this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8)
                .setDepth(DEPTH.OVERLAY);

            const isNewRecord = this.survivalTime >= PlayerData.data.endlessBestTime;

            this.add.text(width/2, height/2 - 100,
                isNewRecord ? '🏆 NEW RECORD! 🏆' : '💥 GAME OVER 💥',
                { fontFamily: 'Arial Black', fontSize: '40px', color: isNewRecord ? '#ffd700' : '#ff0000' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            this.add.text(width/2, height/2 - 40,
                `Survived: ${this.survivalTime} seconds`,
                { fontFamily: 'Arial', fontSize: '28px', color: '#ffffff' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            this.add.text(width/2, height/2,
                `Score: ${this.score}`,
                { fontFamily: 'Arial', fontSize: '24px', color: '#ffff00' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            this.add.text(width/2, height/2 + 35,
                `Stars: ${this.starsCollected}`,
                { fontFamily: 'Arial', fontSize: '20px', color: '#00ffff' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            // Coins earned
            const coinsEarned = Math.floor(this.survivalTime) + Math.floor(this.score / 10);
            this.add.text(width/2, height/2 + 70,
                `+${coinsEarned} 💰`,
                { fontFamily: 'Arial Black', fontSize: '24px', color: '#ffd700' }
            ).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

            // Buttons
            this.add.text(width/2, height/2 + 120, '↻ PLAY AGAIN', {
                fontFamily: 'Arial Black',
                fontSize: '28px',
                color: '#00ffff'
            }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.restart());

            this.add.text(width/2, height/2 + 170, 'Back to Menu', {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#888888'
            }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.start('MenuScene'));
        });
    }

    showDifficultyIncrease() {
        const { width, height } = this.cameras.main;

        const text = this.add.text(width/2, height/2, `WAVE ${Math.floor(this.difficulty)}`, {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#ff6600',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.EFFECTS).setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.5, to: 1.5 },
            duration: 500,
            yoyo: true,
            onComplete: () => text.destroy()
        });
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Input
        let vx = 0, vy = 0;
        const speed = this.player.speed;

        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

        if (this.joystickVector && this.joystickVector.length() > 0.1) {
            vx = this.joystickVector.x;
            vy = this.joystickVector.y;
        }

        if (vx !== 0 && vy !== 0) {
            const len = Math.sqrt(vx * vx + vy * vy);
            vx /= len;
            vy /= len;
        }

        this.player.body.setVelocity(vx * speed, vy * speed);

        // Rotate towards movement
        if (vx !== 0 || vy !== 0) {
            const targetAngle = Math.atan2(vy, vx) + Math.PI / 2;
            const diff = Phaser.Math.Angle.Wrap(targetAngle - this.player.rotation);
            this.player.rotation += diff * 0.15;
        }

        // Engine glow
        const moving = vx !== 0 || vy !== 0;
        this.engineGlow.setAlpha(moving ? 0.8 : 0.2);

        // Update chasing enemies
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.isChaser) {
                const angle = Phaser.Math.Angle.Between(
                    enemy.x, enemy.y,
                    this.player.x, this.player.y
                );

                // Stealth mode makes enemies slower to track
                const trackSpeed = this.ship.stealthMode ? enemy.speed * 0.6 : enemy.speed;

                enemy.body.setVelocity(
                    Math.cos(angle) * trackSpeed,
                    Math.sin(angle) * trackSpeed
                );
            }
        });
    }
}
