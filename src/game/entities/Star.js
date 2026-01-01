/**
 * Star Entity - Collectible Stars
 *
 * Different star types with varying values:
 * - Bronze: Common, 1 point
 * - Silver: Rare, 5 points
 * - Gold: Epic, 10 points
 * - Stellar: Legendary, 50 points + level completion
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';

export default class Star extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'bronze') {
        const textureKey = `star-${type}`;
        super(scene, x, y, type === 'stellar' ? 'stellar-core' : textureKey);

        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Store type
        this.starType = type;
        this.collected = false;

        // Configure based on type
        this.setupByType(type);

        // Setup physics body
        this.body.setAllowGravity(false);
        this.setImmovable(true);

        // Set depth
        this.setDepth(DEPTH.COLLECTIBLES);

        // Create ambient effects
        this.createAmbientEffects();

        // Start spinning animation
        this.startAnimation();
    }

    /**
     * Configure star properties based on type
     */
    setupByType(type) {
        switch (type) {
            case 'bronze':
                this.value = 1;
                this.setScale(0.8);
                this.glowColor = 0xcd7f32;
                break;

            case 'silver':
                this.value = 5;
                this.setScale(0.9);
                this.glowColor = 0xc0c0c0;
                break;

            case 'gold':
                this.value = 10;
                this.setScale(1);
                this.glowColor = 0xffd700;
                break;

            case 'stellar':
                this.value = 50;
                this.setScale(1.2);
                this.glowColor = 0x00ffff;
                break;

            default:
                this.value = 1;
                this.glowColor = 0xffffff;
        }
    }

    /**
     * Create glow and particle effects
     */
    createAmbientEffects() {
        // Glow effect (using a slightly larger, tinted duplicate)
        this.glow = this.scene.add.sprite(this.x, this.y, this.texture.key)
            .setScale(this.scaleX * 1.3)
            .setTint(this.glowColor)
            .setAlpha(0.3)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTH.COLLECTIBLES - 1);

        // Pulsing glow animation
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.6,
            scale: this.scaleX * 1.5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Floating motion
        this.scene.tweens.add({
            targets: [this, this.glow],
            y: this.y + 5,
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Stellar cores have extra particle effects
        if (this.starType === 'stellar') {
            this.createStellarParticles();
        }
    }

    /**
     * Create particle effects for stellar cores
     */
    createStellarParticles() {
        this.particles = this.scene.add.particles(this.x, this.y, 'sparkle', {
            speed: { min: 20, max: 50 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            lifespan: 1000,
            frequency: 100,
            tint: [0x00ffff, 0xff00ff, 0xffff00],
            blendMode: 'ADD'
        });
        this.particles.setDepth(DEPTH.COLLECTIBLES - 2);
    }

    /**
     * Start the spinning animation
     */
    startAnimation() {
        const animKey = `star-${this.starType}-spin`;

        // Check if animation exists
        if (this.scene.anims.exists(animKey)) {
            this.play(animKey);
        } else {
            // Fallback rotation
            this.scene.tweens.add({
                targets: this,
                rotation: Math.PI * 2,
                duration: 2000,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    /**
     * Play collection animation and callback
     * @param {Function} onComplete - Callback when animation finishes
     */
    playCollectAnimation(onComplete) {
        // Stop ambient effects
        this.scene.tweens.killTweensOf([this, this.glow]);

        // Collection burst
        this.scene.add.particles(this.x, this.y, 'sparkle', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            quantity: 20,
            tint: this.glowColor,
            blendMode: 'ADD',
            emitting: false
        }).explode();

        // Scale up and fade out
        this.scene.tweens.add({
            targets: [this, this.glow],
            scale: this.scaleX * 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.glow?.destroy();
                this.particles?.destroy();
                if (onComplete) onComplete();
            }
        });
    }

    /**
     * Update glow position to follow star
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.glow) {
            this.glow.x = this.x;
            this.glow.y = this.y;
        }

        if (this.particles) {
            this.particles.setPosition(this.x, this.y);
        }
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        this.glow?.destroy();
        this.particles?.destroy();
        super.destroy();
    }
}
