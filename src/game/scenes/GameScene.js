/**
 * GameScene - Core Gameplay Scene (Simplified for Demo)
 *
 * Works without external assets using programmatic graphics.
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

        this.registry.set('collectedStars', {
            bronze: 0,
            silver: 0,
            gold: 0
        });

        this.isPaused = false;
        this.isComplete = false;
    }

    create() {
        const { width, height } = this.cameras.main;

        this.cameras.main.fadeIn(500);

        // Create simple background
        this.createBackground(width, height);

        // Create player (simple shape)
        this.createPlayer();

        // Create stars
        this.createStars();

        // Create HUD
        this.createHUD(width);

        // Setup controls
        this.setupControls();

        // Setup camera
        this.physics.world.setBounds(0, 0, 2560, 1440);
        this.cameras.main.setBounds(0, 0, 2560, 1440);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        console.log(`Started level ${this.levelKey}`);
    }

    createBackground(width, height) {
        // Use the pre-generated background
        this.add.image(width / 2, height / 2, 'bg-space-1')
            .setDisplaySize(2560, 1440)
            .setScrollFactor(0.5)
            .setDepth(DEPTH.BACKGROUND);

        // Add some animated stars
        for (let i = 0; i < 100; i++) {
            const star = this.add.circle(
                Math.random() * 2560,
                Math.random() * 1440,
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
        }
    }

    createPlayer() {
        // Create player as simple triangle ship
        const startX = 200;
        const startY = 700;

        this.player = this.add.triangle(startX, startY, 0, 40, 20, 0, 40, 40, 0x00ffff);
        this.player.setDepth(DEPTH.PLAYER);

        // Add physics
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setDrag(100);
        this.player.body.setMaxVelocity(400);

        // Engine glow
        this.engineGlow = this.add.circle(startX - 15, startY, 8, 0xff6600, 0.8);
        this.engineGlow.setDepth(DEPTH.PLAYER - 1);

        // Player properties
        this.player.health = 3;
        this.player.speed = 300;
    }

    createStars() {
        this.stars = this.physics.add.group();

        // Generate random stars
        const starTypes = [
            { color: 0xcd7f32, value: 1, count: 20 },  // Bronze
            { color: 0xc0c0c0, value: 5, count: 8 },   // Silver
            { color: 0xffd700, value: 10, count: 3 }   // Gold
        ];

        starTypes.forEach(type => {
            for (let i = 0; i < type.count; i++) {
                const x = Phaser.Math.Between(100, 2400);
                const y = Phaser.Math.Between(100, 1300);

                const star = this.add.star(x, y, 5, 8, 16, type.color);
                star.setDepth(DEPTH.COLLECTIBLES);
                this.physics.add.existing(star);
                star.body.setImmovable(true);
                star.value = type.value;
                star.color = type.color;
                this.stars.add(star);

                // Rotate animation
                this.tweens.add({
                    targets: star,
                    angle: 360,
                    duration: 2000,
                    repeat: -1,
                    ease: 'Linear'
                });
            }
        });

        // Stellar core at end
        const core = this.add.star(2400, 720, 6, 20, 40, 0xff00ff);
        core.setDepth(DEPTH.COLLECTIBLES);
        this.physics.add.existing(core);
        core.body.setImmovable(true);
        core.isCore = true;
        core.value = 50;
        this.stars.add(core);

        // Pulsing effect for core
        this.tweens.add({
            targets: core,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Collision with stars
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    }

    collectStar(player, star) {
        if (star.collected) return;
        star.collected = true;

        const session = this.registry.get('session');
        session.score += star.value;
        this.registry.set('session', session);

        this.updateScoreDisplay();

        // Collection effect
        this.tweens.add({
            targets: star,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                if (star.isCore) {
                    this.levelComplete();
                }
                star.destroy();
            }
        });

        // Floating score text
        const floatText = this.add.text(star.x, star.y, `+${star.value}`, {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(DEPTH.EFFECTS);

        this.tweens.add({
            targets: floatText,
            y: star.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => floatText.destroy()
        });
    }

    createHUD(width) {
        // Score display
        this.scoreText = this.add.text(width - 150, 30, 'Score: 0', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        })
            .setScrollFactor(0)
            .setDepth(DEPTH.UI);

        // Level display
        this.add.text(20, 30, `Level ${this.levelKey}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        })
            .setScrollFactor(0)
            .setDepth(DEPTH.UI);

        // Health hearts
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.text(20 + i * 35, 60, '❤️', {
                fontSize: '28px'
            })
                .setScrollFactor(0)
                .setDepth(DEPTH.UI);
            this.hearts.push(heart);
        }

        // Instructions
        this.add.text(width / 2, 30, 'Arrow keys or WASD to move | Collect stars | Reach the purple core!', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#888888'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.UI);

        // Back button
        const backBtn = this.add.text(width - 80, 70, '← Menu', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#aaaaaa'
        })
            .setScrollFactor(0)
            .setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }

    updateScoreDisplay() {
        const session = this.registry.get('session');
        this.scoreText.setText(`Score: ${session.score}`);

        // Pop animation
        this.tweens.add({
            targets: this.scoreText,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    levelComplete() {
        if (this.isComplete) return;
        this.isComplete = true;

        const session = this.registry.get('session');
        const { width, height } = this.cameras.main;

        // Stop player
        this.player.body.setVelocity(0);

        // Overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY);

        // Title
        this.add.text(width / 2, height / 2 - 80, 'LEVEL COMPLETE!', {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 6
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1);

        // Score
        this.add.text(width / 2, height / 2, `Final Score: ${session.score}`, {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1);

        // Buttons
        this.add.text(width / 2, height / 2 + 80, 'PLAY AGAIN', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#00ff00'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.restart());

        this.add.text(width / 2, height / 2 + 130, 'Back to Menu', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#aaaaaa'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(DEPTH.OVERLAY + 1)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }

    update(time, delta) {
        if (this.isPaused || this.isComplete) return;

        const speed = this.player.speed;
        let vx = 0;
        let vy = 0;

        // Keyboard input
        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

        this.player.body.setVelocity(vx, vy);

        // Rotate player towards movement
        if (vx !== 0 || vy !== 0) {
            const angle = Math.atan2(vy, vx) + Math.PI / 2;
            this.player.setRotation(angle);
        }

        // Update engine glow position
        const offset = 25;
        const angle = this.player.rotation - Math.PI / 2;
        this.engineGlow.x = this.player.x - Math.cos(angle) * offset;
        this.engineGlow.y = this.player.y - Math.sin(angle) * offset;

        // Engine glow visibility
        this.engineGlow.setAlpha(vx !== 0 || vy !== 0 ? 0.8 : 0.3);
    }
}
