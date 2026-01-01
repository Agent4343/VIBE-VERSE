/**
 * Player Entity - Spaceship/Character Controller
 *
 * Handles:
 * - Movement physics
 * - Animation states
 * - Health and damage
 * - Boost ability
 * - Invincibility frames
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS, DEPTH } from '../config/gameConfig.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Setup
        this.setDepth(DEPTH.PLAYER);
        this.setCollideWorldBounds(true);
        this.setDrag(50);
        this.setMaxVelocity(GAME_CONSTANTS.PLAYER_BOOST_SPEED);

        // Player state
        this.health = GAME_CONSTANTS.PLAYER_INITIAL_HEALTH;
        this.isBoosting = false;
        this.isInvincible = false;
        this.canBoost = true;
        this.boostEnergy = 100;

        // Physics body adjustments
        this.body.setSize(48, 48);
        this.body.setOffset(8, 8);

        // Start idle animation
        this.play('player-idle');

        // Create engine trail effect
        this.createEngineTrail();
    }

    /**
     * Create particle emitter for engine trail
     */
    createEngineTrail() {
        this.engineTrail = this.scene.add.particles(0, 0, 'sparkle', {
            follow: this,
            followOffset: { x: -30, y: 0 },
            speed: { min: 50, max: 100 },
            angle: { min: 160, max: 200 },
            scale: { start: 0.5, end: 0 },
            lifespan: 300,
            frequency: 50,
            tint: 0x00ffff,
            blendMode: 'ADD'
        });
        this.engineTrail.setDepth(DEPTH.PLAYER - 1);
    }

    /**
     * Update player based on input
     * @param {Object} cursors - Arrow key input
     * @param {Object} wasd - WASD key input
     * @param {Phaser.Math.Vector2} joystickVector - Virtual joystick input
     */
    update(cursors, wasd, joystickVector) {
        // Calculate input direction
        let velocityX = 0;
        let velocityY = 0;

        // Keyboard input
        if (cursors.left.isDown || wasd.left.isDown) {
            velocityX = -1;
        } else if (cursors.right.isDown || wasd.right.isDown) {
            velocityX = 1;
        }

        if (cursors.up.isDown || wasd.up.isDown) {
            velocityY = -1;
        } else if (cursors.down.isDown || wasd.down.isDown) {
            velocityY = 1;
        }

        // Joystick input (override keyboard if active)
        if (joystickVector && (joystickVector.x !== 0 || joystickVector.y !== 0)) {
            velocityX = joystickVector.x;
            velocityY = joystickVector.y;
        }

        // Check for boost input
        const boostKey = wasd.boost?.isDown;
        if ((boostKey || this.isBoosting) && this.canBoost && this.boostEnergy > 0) {
            this.activateBoost();
        } else {
            this.deactivateBoost();
        }

        // Calculate speed
        const speed = this.isBoosting
            ? GAME_CONSTANTS.PLAYER_BOOST_SPEED
            : GAME_CONSTANTS.PLAYER_SPEED;

        // Apply velocity
        this.setVelocity(velocityX * speed, velocityY * speed);

        // Update animation based on movement
        this.updateAnimation(velocityX, velocityY);

        // Update rotation to face movement direction
        if (velocityX !== 0 || velocityY !== 0) {
            const angle = Math.atan2(velocityY, velocityX);
            this.setRotation(angle);
        }

        // Regenerate boost energy
        if (!this.isBoosting && this.boostEnergy < 100) {
            this.boostEnergy = Math.min(100, this.boostEnergy + 0.5);
        }
    }

    /**
     * Update player animation based on movement state
     */
    updateAnimation(velocityX, velocityY) {
        const isMoving = velocityX !== 0 || velocityY !== 0;

        if (this.isBoosting && isMoving) {
            if (this.anims.currentAnim?.key !== 'player-boost') {
                this.play('player-boost', true);
            }
        } else if (isMoving) {
            if (this.anims.currentAnim?.key !== 'player-move') {
                this.play('player-move', true);
            }
        } else {
            if (this.anims.currentAnim?.key !== 'player-idle') {
                this.play('player-idle', true);
            }
        }
    }

    /**
     * Activate boost mode
     */
    activateBoost() {
        if (!this.isBoosting) {
            this.isBoosting = true;
            this.scene.sound.play('sfx-boost', { volume: 0.4 });
        }

        // Consume boost energy
        this.boostEnergy = Math.max(0, this.boostEnergy - 1);

        // Enhanced engine trail
        this.engineTrail.setEmitterProperty('frequency', 20);
        this.engineTrail.setEmitterProperty('tint', 0xff8800);

        if (this.boostEnergy <= 0) {
            this.deactivateBoost();
            this.canBoost = false;

            // Cooldown before can boost again
            this.scene.time.delayedCall(2000, () => {
                this.canBoost = true;
            });
        }
    }

    /**
     * Deactivate boost mode
     */
    deactivateBoost() {
        this.isBoosting = false;
        this.engineTrail.setEmitterProperty('frequency', 50);
        this.engineTrail.setEmitterProperty('tint', 0x00ffff);
    }

    /**
     * Take damage from obstacles
     * @param {number} amount - Damage amount
     */
    takeDamage(amount) {
        if (this.isInvincible) return;

        this.health -= amount;

        // Visual feedback
        this.setTint(0xff0000);

        // Invincibility frames
        this.isInvincible = true;

        // Flash effect during invincibility
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.clearTint();
                this.setAlpha(1);
                this.isInvincible = false;
            }
        });

        // Knockback
        const angle = Math.random() * Math.PI * 2;
        this.setVelocity(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200
        );
    }

    /**
     * Heal the player
     * @param {number} amount - Heal amount
     */
    heal(amount) {
        this.health = Math.min(
            GAME_CONSTANTS.PLAYER_INITIAL_HEALTH,
            this.health + amount
        );

        // Visual feedback
        this.setTint(0x00ff00);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        this.engineTrail?.destroy();
        super.destroy();
    }
}
