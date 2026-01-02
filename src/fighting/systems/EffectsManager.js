/**
 * EffectsManager - Professional visual effects system
 * Handles particles, impacts, trails, and screen effects
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/fightConfig.js';

export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = [];
        this.particlePools = new Map();

        // Pre-generate effect textures
        this.generateEffectTextures();
    }

    generateEffectTextures() {
        // Hit spark texture
        if (!this.scene.textures.exists('hit_spark')) {
            const g = this.scene.make.graphics({ add: false });
            g.fillStyle(0xffffff, 1);
            g.fillCircle(16, 16, 16);
            g.fillStyle(0xffff00, 0.8);
            g.fillCircle(16, 16, 12);
            g.fillStyle(0xff6600, 0.6);
            g.fillCircle(16, 16, 8);
            g.generateTexture('hit_spark', 32, 32);
            g.destroy();
        }

        // Energy particle
        if (!this.scene.textures.exists('energy_particle')) {
            const g = this.scene.make.graphics({ add: false });
            g.fillGradientStyle(0xffffff, 0xffffff, 0x00ffff, 0x00ffff, 1, 1, 0.5, 0.5);
            g.fillCircle(8, 8, 8);
            g.generateTexture('energy_particle', 16, 16);
            g.destroy();
        }

        // Fire particle
        if (!this.scene.textures.exists('fire_particle')) {
            const g = this.scene.make.graphics({ add: false });
            g.fillStyle(0xff6600, 1);
            g.fillCircle(12, 12, 12);
            g.fillStyle(0xffff00, 0.8);
            g.fillCircle(12, 12, 8);
            g.fillStyle(0xffffff, 0.5);
            g.fillCircle(12, 12, 4);
            g.generateTexture('fire_particle', 24, 24);
            g.destroy();
        }

        // Dust particle
        if (!this.scene.textures.exists('dust_particle')) {
            const g = this.scene.make.graphics({ add: false });
            g.fillStyle(0x998877, 0.6);
            g.fillCircle(6, 6, 6);
            g.generateTexture('dust_particle', 12, 12);
            g.destroy();
        }

        // Star/sparkle
        if (!this.scene.textures.exists('sparkle')) {
            const g = this.scene.make.graphics({ add: false });
            g.fillStyle(0xffffff, 1);
            // 4-pointed star
            g.fillTriangle(8, 0, 6, 8, 10, 8);
            g.fillTriangle(8, 16, 6, 8, 10, 8);
            g.fillTriangle(0, 8, 8, 6, 8, 10);
            g.fillTriangle(16, 8, 8, 6, 8, 10);
            g.generateTexture('sparkle', 16, 16);
            g.destroy();
        }

        // Speed line
        if (!this.scene.textures.exists('speed_line')) {
            const g = this.scene.make.graphics({ add: false });
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 2, 64, 4);
            g.generateTexture('speed_line', 64, 8);
            g.destroy();
        }

        // Impact ring
        if (!this.scene.textures.exists('impact_ring')) {
            const g = this.scene.make.graphics({ add: false });
            g.lineStyle(4, 0xffffff, 1);
            g.strokeCircle(32, 32, 28);
            g.generateTexture('impact_ring', 64, 64);
            g.destroy();
        }

        // Slash effect
        if (!this.scene.textures.exists('slash_effect')) {
            const g = this.scene.make.graphics({ add: false });
            g.lineStyle(6, 0xffffff, 1);
            g.beginPath();
            g.moveTo(0, 40);
            g.lineTo(20, 20);
            g.lineTo(80, 0);
            g.stroke();
            g.lineStyle(3, 0x00ffff, 0.8);
            g.beginPath();
            g.moveTo(0, 40);
            g.lineTo(20, 20);
            g.lineTo(80, 0);
            g.stroke();
            g.generateTexture('slash_effect', 80, 40);
            g.destroy();
        }
    }

    /**
     * Create hit impact effect at location
     */
    createHitImpact(x, y, damage, attackType, color = 0xffffff) {
        // Impact flash
        const flash = this.scene.add.circle(x, y, 5, 0xffffff, 1);
        flash.setDepth(DEPTH.EFFECTS_FRONT + 5);

        this.scene.tweens.add({
            targets: flash,
            radius: 40 + damage,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });

        // Expanding rings based on damage
        const ringCount = Math.min(4, Math.floor(damage / 8) + 1);
        for (let i = 0; i < ringCount; i++) {
            const ring = this.scene.add.image(x, y, 'impact_ring');
            ring.setTint(i === 0 ? 0xffffff : (i === 1 ? 0xffff00 : color));
            ring.setDepth(DEPTH.EFFECTS_FRONT + 4 - i);
            ring.setScale(0.3);
            ring.setAlpha(1 - i * 0.2);

            this.scene.tweens.add({
                targets: ring,
                scale: 1.5 + i * 0.4,
                alpha: 0,
                duration: 200 + i * 50,
                delay: i * 30,
                onComplete: () => ring.destroy()
            });
        }

        // Hit sparks
        this.createHitSparks(x, y, damage, color);

        // Attack-specific effects
        switch (attackType) {
            case 'punch':
                this.createPunchEffect(x, y, color);
                break;
            case 'kick':
                this.createKickEffect(x, y, color);
                break;
            case 'uppercut':
                this.createUppercutEffect(x, y, color);
                break;
            case 'sweep':
                this.createSweepEffect(x, y, color);
                break;
            case 'special':
                this.createSpecialEffect(x, y, color);
                break;
        }
    }

    createHitSparks(x, y, damage, color) {
        const count = 8 + Math.floor(damage / 3);

        for (let i = 0; i < count; i++) {
            const spark = this.scene.add.image(x, y, 'hit_spark');
            spark.setTint(Phaser.Math.RND.pick([0xffffff, 0xffff00, 0xff6600, color]));
            spark.setDepth(DEPTH.EFFECTS_FRONT + 3);
            spark.setScale(Phaser.Math.FloatBetween(0.3, 0.8));
            spark.setAlpha(1);

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(80, 180);
            const duration = Phaser.Math.Between(150, 350);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed + 20,
                scale: 0,
                alpha: 0,
                rotation: Phaser.Math.FloatBetween(-2, 2),
                duration: duration,
                ease: 'Power2.out',
                onComplete: () => spark.destroy()
            });
        }
    }

    createPunchEffect(x, y, color) {
        // Quick horizontal slash lines
        for (let i = 0; i < 3; i++) {
            const line = this.scene.add.image(x - 20, y + (i - 1) * 15, 'speed_line');
            line.setTint(color);
            line.setDepth(DEPTH.EFFECTS_FRONT + 2);
            line.setScale(0.8, 0.5);
            line.setAlpha(0.8);

            this.scene.tweens.add({
                targets: line,
                x: x + 40,
                alpha: 0,
                scaleX: 1.5,
                duration: 120,
                delay: i * 20,
                onComplete: () => line.destroy()
            });
        }
    }

    createKickEffect(x, y, color) {
        // Arc effect
        const arc = this.scene.add.graphics();
        arc.setDepth(DEPTH.EFFECTS_FRONT + 2);

        arc.lineStyle(4, color, 0.8);
        arc.beginPath();
        arc.arc(x - 30, y, 50, -0.5, 1, false);
        arc.stroke();

        this.scene.tweens.add({
            targets: arc,
            alpha: 0,
            duration: 200,
            onComplete: () => arc.destroy()
        });

        // Dust kick-up
        this.createDustCloud(x, y + 30, 5);
    }

    createUppercutEffect(x, y, color) {
        // Vertical energy trail
        for (let i = 0; i < 6; i++) {
            const particle = this.scene.add.image(x, y + i * 10, 'energy_particle');
            particle.setTint(color);
            particle.setDepth(DEPTH.EFFECTS_FRONT + 2);
            particle.setScale(1 - i * 0.1);
            particle.setAlpha(1 - i * 0.15);

            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 80,
                alpha: 0,
                scale: 0,
                duration: 250,
                delay: i * 20,
                ease: 'Power2.out',
                onComplete: () => particle.destroy()
            });
        }

        // Rising slash
        const slash = this.scene.add.image(x, y, 'slash_effect');
        slash.setTint(color);
        slash.setRotation(-Math.PI / 2);
        slash.setDepth(DEPTH.EFFECTS_FRONT + 1);
        slash.setAlpha(0.9);

        this.scene.tweens.add({
            targets: slash,
            y: y - 60,
            alpha: 0,
            scaleY: 1.5,
            duration: 200,
            onComplete: () => slash.destroy()
        });
    }

    createSweepEffect(x, y, color) {
        // Ground sweep arc
        const sweep = this.scene.add.graphics();
        sweep.setDepth(DEPTH.EFFECTS_FRONT + 2);

        sweep.lineStyle(6, color, 0.9);
        sweep.beginPath();
        sweep.arc(x, y + 10, 60, 0, Math.PI, false);
        sweep.stroke();

        this.scene.tweens.add({
            targets: sweep,
            alpha: 0,
            duration: 250,
            onComplete: () => sweep.destroy()
        });

        // Heavy dust cloud
        this.createDustCloud(x, y, 12);
    }

    createSpecialEffect(x, y, color) {
        // Massive energy burst
        const burstCount = 20;
        for (let i = 0; i < burstCount; i++) {
            const particle = this.scene.add.image(x, y, 'energy_particle');
            particle.setTint(Phaser.Math.RND.pick([color, 0xffffff, 0xffff00]));
            particle.setDepth(DEPTH.EFFECTS_FRONT + 3);
            particle.setScale(Phaser.Math.FloatBetween(0.5, 1.5));

            const angle = (i / burstCount) * Math.PI * 2;
            const distance = Phaser.Math.Between(100, 200);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                scale: 0,
                alpha: 0,
                rotation: angle,
                duration: 400,
                ease: 'Power2.out',
                onComplete: () => particle.destroy()
            });
        }

        // Energy shockwave
        for (let i = 0; i < 3; i++) {
            const shockwave = this.scene.add.circle(x, y, 20, color, 0);
            shockwave.setStrokeStyle(6 - i * 2, color);
            shockwave.setDepth(DEPTH.EFFECTS_FRONT + 1);

            this.scene.tweens.add({
                targets: shockwave,
                radius: 150 + i * 30,
                alpha: 0,
                duration: 400,
                delay: i * 80,
                ease: 'Power2.out',
                onComplete: () => shockwave.destroy()
            });
        }

        // Sparkle stars
        this.createSparkles(x, y, 15, color);
    }

    createDustCloud(x, y, count) {
        for (let i = 0; i < count; i++) {
            const dust = this.scene.add.image(
                x + Phaser.Math.Between(-30, 30),
                y,
                'dust_particle'
            );
            dust.setDepth(DEPTH.EFFECTS_FRONT);
            dust.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
            dust.setAlpha(0.7);

            this.scene.tweens.add({
                targets: dust,
                x: dust.x + Phaser.Math.Between(-40, 40),
                y: dust.y - Phaser.Math.Between(20, 60),
                scale: 0,
                alpha: 0,
                duration: Phaser.Math.Between(300, 600),
                ease: 'Power2.out',
                onComplete: () => dust.destroy()
            });
        }
    }

    createSparkles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const sparkle = this.scene.add.image(
                x + Phaser.Math.Between(-40, 40),
                y + Phaser.Math.Between(-40, 40),
                'sparkle'
            );
            sparkle.setTint(Phaser.Math.RND.pick([color, 0xffffff]));
            sparkle.setDepth(DEPTH.EFFECTS_FRONT + 4);
            sparkle.setScale(0);
            sparkle.setAlpha(0);

            this.scene.tweens.add({
                targets: sparkle,
                scale: Phaser.Math.FloatBetween(0.5, 1),
                alpha: 1,
                duration: 100,
                delay: i * 30,
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: sparkle,
                        scale: 0,
                        alpha: 0,
                        rotation: Math.PI,
                        duration: 200,
                        delay: 100,
                        onComplete: () => sparkle.destroy()
                    });
                }
            });
        }
    }

    /**
     * Create energy aura around fighter
     */
    createEnergyAura(fighter, color, intensity = 1) {
        const x = fighter.container.x;
        const y = fighter.container.y - 50;

        // Pulsing aura circles
        for (let i = 0; i < 3; i++) {
            const aura = this.scene.add.circle(x, y, 50 + i * 20, color, 0.15 * intensity);
            aura.setDepth(DEPTH.FIGHTERS - 1);

            this.scene.tweens.add({
                targets: aura,
                scale: { from: 0.9, to: 1.2 },
                alpha: { from: 0.15 * intensity, to: 0.05 },
                duration: 600 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });

            this.activeEffects.push(aura);
        }

        // Rising energy particles
        const particleEvent = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                const particle = this.scene.add.image(
                    x + Phaser.Math.Between(-30, 30),
                    y + 80,
                    'energy_particle'
                );
                particle.setTint(color);
                particle.setDepth(DEPTH.FIGHTERS - 1);
                particle.setScale(Phaser.Math.FloatBetween(0.3, 0.7));
                particle.setAlpha(0.8);

                this.scene.tweens.add({
                    targets: particle,
                    y: y - 50,
                    alpha: 0,
                    duration: 600,
                    onComplete: () => particle.destroy()
                });
            },
            loop: true
        });

        return particleEvent;
    }

    /**
     * Create rage mode fire effect
     */
    createRageEffect(fighter) {
        const x = fighter.container.x;
        const y = fighter.container.y;

        const rageEvent = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                // Fire particles rising
                const fire = this.scene.add.image(
                    fighter.container.x + Phaser.Math.Between(-25, 25),
                    fighter.container.y + Phaser.Math.Between(-20, 60),
                    'fire_particle'
                );
                fire.setDepth(DEPTH.EFFECTS_FRONT);
                fire.setScale(Phaser.Math.FloatBetween(0.4, 1));
                fire.setAlpha(0.9);

                this.scene.tweens.add({
                    targets: fire,
                    y: fire.y - Phaser.Math.Between(60, 120),
                    x: fire.x + Phaser.Math.Between(-20, 20),
                    scale: 0,
                    alpha: 0,
                    duration: Phaser.Math.Between(300, 500),
                    onComplete: () => fire.destroy()
                });
            },
            loop: true
        });

        return rageEvent;
    }

    /**
     * Create victory celebration effect
     */
    createVictoryEffect(fighter, color) {
        const x = fighter.container.x;
        const y = fighter.container.y - 50;

        // Confetti explosion
        for (let i = 0; i < 50; i++) {
            const confetti = this.scene.add.rectangle(
                x,
                y - 100,
                Phaser.Math.Between(6, 12),
                Phaser.Math.Between(6, 12),
                Phaser.Math.RND.pick([color, 0xffffff, 0xffff00, 0xff6600, 0x00ff00]),
                1
            );
            confetti.setDepth(DEPTH.EFFECTS_FRONT + 5);
            confetti.setRotation(Math.random() * Math.PI * 2);

            const angle = Phaser.Math.FloatBetween(-0.8, 0.8);
            const speed = Phaser.Math.Between(150, 300);

            this.scene.tweens.add({
                targets: confetti,
                x: x + Math.sin(angle) * speed,
                y: y + 150,
                rotation: confetti.rotation + Phaser.Math.FloatBetween(-4, 4),
                duration: Phaser.Math.Between(1500, 2500),
                delay: i * 20,
                ease: 'Power1.out',
                onComplete: () => confetti.destroy()
            });
        }

        // Rising stars
        for (let i = 0; i < 20; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                const star = this.scene.add.image(
                    x + Phaser.Math.Between(-80, 80),
                    y + Phaser.Math.Between(50, 100),
                    'sparkle'
                );
                star.setTint(Phaser.Math.RND.pick([color, 0xffffff, 0xffff00]));
                star.setDepth(DEPTH.EFFECTS_FRONT + 4);
                star.setScale(0);

                this.scene.tweens.add({
                    targets: star,
                    scale: Phaser.Math.FloatBetween(0.8, 1.5),
                    y: star.y - 150,
                    rotation: Math.PI * 2,
                    duration: 800,
                    ease: 'Power2.out',
                    onComplete: () => {
                        this.scene.tweens.add({
                            targets: star,
                            alpha: 0,
                            scale: 0,
                            duration: 200,
                            onComplete: () => star.destroy()
                        });
                    }
                });
            });
        }

        // Spotlight beams
        for (let i = 0; i < 3; i++) {
            const beam = this.scene.add.graphics();
            beam.setDepth(DEPTH.EFFECTS_FRONT);

            beam.fillStyle(color, 0.3);
            beam.beginPath();
            beam.moveTo(x - 30 + i * 30, 0);
            beam.lineTo(x - 60 + i * 30, y + 100);
            beam.lineTo(x + i * 30, y + 100);
            beam.lineTo(x + 30 + i * 30, 0);
            beam.closePath();
            beam.fill();

            beam.setAlpha(0);

            this.scene.tweens.add({
                targets: beam,
                alpha: 1,
                duration: 300,
                delay: 500 + i * 150,
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: beam,
                        alpha: { from: 1, to: 0.3 },
                        duration: 1000,
                        yoyo: true,
                        repeat: -1
                    });
                }
            });
        }
    }

    /**
     * Create KO effect
     */
    createKOEffect(x, y, winnerColor) {
        // Massive shockwave
        for (let i = 0; i < 5; i++) {
            const wave = this.scene.add.circle(x, y, 30, 0xffffff, 0);
            wave.setStrokeStyle(10 - i * 2, i === 0 ? 0xffffff : (i === 1 ? 0xffff00 : 0xff0000));
            wave.setDepth(DEPTH.EFFECTS_FRONT + 10);

            this.scene.tweens.add({
                targets: wave,
                radius: 200 + i * 50,
                alpha: 0,
                duration: 500,
                delay: i * 80,
                ease: 'Power2.out',
                onComplete: () => wave.destroy()
            });
        }

        // Screen crack effect
        this.createScreenCrack(x, y);

        // Massive spark explosion
        for (let i = 0; i < 40; i++) {
            const spark = this.scene.add.image(x, y, 'hit_spark');
            spark.setTint(Phaser.Math.RND.pick([0xffffff, 0xffff00, 0xff6600, 0xff0000]));
            spark.setDepth(DEPTH.EFFECTS_FRONT + 8);
            spark.setScale(Phaser.Math.FloatBetween(0.5, 1.5));

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(150, 350);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                scale: 0,
                alpha: 0,
                rotation: Phaser.Math.FloatBetween(-3, 3),
                duration: Phaser.Math.Between(300, 600),
                ease: 'Power2.out',
                onComplete: () => spark.destroy()
            });
        }
    }

    createScreenCrack(x, y) {
        const crack = this.scene.add.graphics();
        crack.setDepth(DEPTH.EFFECTS_FRONT + 15);

        // Draw crack lines radiating from impact
        crack.lineStyle(3, 0xffffff, 0.9);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
            const length = Phaser.Math.Between(80, 180);

            crack.beginPath();
            crack.moveTo(x, y);

            // Jagged line
            let px = x, py = y;
            for (let j = 0; j < 4; j++) {
                const progress = (j + 1) / 4;
                px = x + Math.cos(angle) * length * progress + Phaser.Math.Between(-15, 15);
                py = y + Math.sin(angle) * length * progress + Phaser.Math.Between(-15, 15);
                crack.lineTo(px, py);
            }
            crack.stroke();

            // Branch cracks
            if (Math.random() > 0.5) {
                const branchAngle = angle + Phaser.Math.FloatBetween(-0.5, 0.5);
                crack.beginPath();
                crack.moveTo(px, py);
                crack.lineTo(
                    px + Math.cos(branchAngle) * Phaser.Math.Between(30, 60),
                    py + Math.sin(branchAngle) * Phaser.Math.Between(30, 60)
                );
                crack.stroke();
            }
        }

        // Fade out crack
        this.scene.tweens.add({
            targets: crack,
            alpha: 0,
            duration: 1500,
            delay: 500,
            onComplete: () => crack.destroy()
        });
    }

    /**
     * Create block effect
     */
    createBlockEffect(x, y) {
        // Shield flash
        const shield = this.scene.add.circle(x, y, 40, 0x00ffff, 0.6);
        shield.setDepth(DEPTH.EFFECTS_FRONT);

        this.scene.tweens.add({
            targets: shield,
            scale: 1.5,
            alpha: 0,
            duration: 150,
            onComplete: () => shield.destroy()
        });

        // Block sparks (fewer, more directional)
        for (let i = 0; i < 6; i++) {
            const spark = this.scene.add.image(x, y, 'hit_spark');
            spark.setTint(0x00ffff);
            spark.setDepth(DEPTH.EFFECTS_FRONT);
            spark.setScale(0.4);

            // Sparks go outward from defender
            const angle = Phaser.Math.FloatBetween(-0.8, 0.8) - Math.PI;
            const speed = Phaser.Math.Between(60, 120);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                scale: 0,
                alpha: 0,
                duration: 200,
                onComplete: () => spark.destroy()
            });
        }
    }

    /**
     * Create landing dust
     */
    createLandingDust(x, y) {
        this.createDustCloud(x, y, 8);

        // Small impact ring
        const ring = this.scene.add.circle(x, y, 10, 0xffffff, 0);
        ring.setStrokeStyle(2, 0xaaaaaa);
        ring.setDepth(DEPTH.EFFECTS_FRONT - 1);

        this.scene.tweens.add({
            targets: ring,
            radius: 40,
            alpha: 0,
            duration: 200,
            onComplete: () => ring.destroy()
        });
    }

    /**
     * Create footstep dust
     */
    createFootstepDust(x, y, direction) {
        for (let i = 0; i < 3; i++) {
            const dust = this.scene.add.image(x - direction * 10, y, 'dust_particle');
            dust.setDepth(DEPTH.EFFECTS_FRONT - 2);
            dust.setScale(0.3);
            dust.setAlpha(0.5);

            this.scene.tweens.add({
                targets: dust,
                x: dust.x - direction * 20,
                y: dust.y - 15,
                scale: 0,
                alpha: 0,
                duration: 300,
                delay: i * 30,
                onComplete: () => dust.destroy()
            });
        }
    }

    /**
     * Clean up all active effects
     */
    cleanup() {
        this.activeEffects.forEach(effect => {
            if (effect && effect.destroy) {
                effect.destroy();
            }
        });
        this.activeEffects = [];
    }
}
