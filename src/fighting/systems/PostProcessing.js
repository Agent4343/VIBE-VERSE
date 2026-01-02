/**
 * PostProcessing - Screen-wide visual effects
 * Chromatic aberration, bloom, vignette, screen shake, flash
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/fightConfig.js';

export default class PostProcessing {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.width = this.camera.width;
        this.height = this.camera.height;

        // Effect states
        this.chromaticAberrationActive = false;
        this.bloomActive = false;
        this.vignetteActive = true;

        // Create overlays
        this.createVignette();
        this.createFlashOverlay();
        this.createChromaticLayers();
        this.createBloomOverlay();

        // Screen shake params
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
    }

    createVignette() {
        // Create vignette effect using gradients
        this.vignette = this.scene.add.graphics();
        this.vignette.setDepth(DEPTH.OVERLAY + 20);

        // Draw radial gradient vignette
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxRadius = Math.max(this.width, this.height) * 0.8;

        // Multiple layers for smooth gradient
        for (let i = 10; i >= 0; i--) {
            const radius = maxRadius * (i / 10);
            const alpha = (1 - i / 10) * 0.4;
            this.vignette.fillStyle(0x000000, alpha * 0.1);
            this.vignette.fillCircle(centerX, centerY, radius);
        }

        // Corner darkening
        this.vignette.fillStyle(0x000000, 0.3);
        this.vignette.fillTriangle(0, 0, 150, 0, 0, 150);
        this.vignette.fillTriangle(this.width, 0, this.width - 150, 0, this.width, 150);
        this.vignette.fillTriangle(0, this.height, 150, this.height, 0, this.height - 150);
        this.vignette.fillTriangle(this.width, this.height, this.width - 150, this.height, this.width, this.height - 150);
    }

    createFlashOverlay() {
        this.flashOverlay = this.scene.add.rectangle(
            this.width / 2,
            this.height / 2,
            this.width,
            this.height,
            0xffffff,
            0
        );
        this.flashOverlay.setDepth(DEPTH.OVERLAY + 25);
    }

    createChromaticLayers() {
        // Create color channel offset layers
        this.chromaticRed = this.scene.add.rectangle(
            this.width / 2,
            this.height / 2,
            this.width,
            this.height,
            0xff0000,
            0
        );
        this.chromaticRed.setDepth(DEPTH.OVERLAY + 15);
        this.chromaticRed.setBlendMode(Phaser.BlendModes.ADD);

        this.chromaticBlue = this.scene.add.rectangle(
            this.width / 2,
            this.height / 2,
            this.width,
            this.height,
            0x0000ff,
            0
        );
        this.chromaticBlue.setDepth(DEPTH.OVERLAY + 15);
        this.chromaticBlue.setBlendMode(Phaser.BlendModes.ADD);
    }

    createBloomOverlay() {
        this.bloomOverlay = this.scene.add.rectangle(
            this.width / 2,
            this.height / 2,
            this.width,
            this.height,
            0xffffff,
            0
        );
        this.bloomOverlay.setDepth(DEPTH.OVERLAY + 10);
        this.bloomOverlay.setBlendMode(Phaser.BlendModes.ADD);
    }

    /**
     * Trigger screen flash effect
     */
    flash(color = 0xffffff, intensity = 0.8, duration = 150) {
        this.flashOverlay.setFillStyle(color, intensity);

        this.scene.tweens.add({
            targets: this.flashOverlay,
            alpha: 0,
            duration: duration,
            ease: 'Power2.out'
        });
    }

    /**
     * Heavy hit flash - multiple rapid flashes
     */
    heavyHitFlash(color = 0xffffff) {
        // Immediate white flash
        this.flash(0xffffff, 1, 50);

        // Then colored flash
        this.scene.time.delayedCall(50, () => {
            this.flash(color, 0.5, 150);
        });
    }

    /**
     * KO flash sequence
     */
    koFlash() {
        // Multiple dramatic flashes
        this.flash(0xffffff, 1, 100);

        this.scene.time.delayedCall(100, () => {
            this.flash(0xff0000, 0.6, 150);
        });

        this.scene.time.delayedCall(250, () => {
            this.flash(0xffffff, 0.4, 200);
        });
    }

    /**
     * Trigger chromatic aberration effect
     */
    chromaticAberration(intensity = 0.1, duration = 200) {
        this.chromaticAberrationActive = true;

        // Offset red and blue channels
        this.chromaticRed.setAlpha(intensity * 0.3);
        this.chromaticRed.setPosition(this.width / 2 - intensity * 5, this.height / 2);

        this.chromaticBlue.setAlpha(intensity * 0.3);
        this.chromaticBlue.setPosition(this.width / 2 + intensity * 5, this.height / 2);

        // Animate back to normal
        this.scene.tweens.add({
            targets: [this.chromaticRed, this.chromaticBlue],
            alpha: 0,
            duration: duration,
            onComplete: () => {
                this.chromaticAberrationActive = false;
                this.chromaticRed.setPosition(this.width / 2, this.height / 2);
                this.chromaticBlue.setPosition(this.width / 2, this.height / 2);
            }
        });
    }

    /**
     * Screen shake with various intensities
     */
    shake(intensity = 0.01, duration = 100) {
        this.camera.shake(duration, intensity);
    }

    /**
     * Directional shake (for impacts)
     */
    directionalShake(direction, intensity = 10, duration = 100) {
        const startX = this.camera.scrollX;
        const startY = this.camera.scrollY;

        // Push camera in direction
        this.scene.tweens.add({
            targets: this.camera,
            scrollX: startX + direction.x * intensity,
            scrollY: startY + direction.y * intensity,
            duration: duration / 3,
            yoyo: true,
            repeat: 1,
            ease: 'Power2.out',
            onComplete: () => {
                this.camera.scrollX = startX;
                this.camera.scrollY = startY;
            }
        });
    }

    /**
     * Impact shake for hits
     */
    impactShake(attackType, damage) {
        const intensities = {
            punch: 0.003 + damage * 0.0002,
            kick: 0.005 + damage * 0.0003,
            uppercut: 0.008 + damage * 0.0004,
            sweep: 0.006 + damage * 0.0003,
            special: 0.015 + damage * 0.0005
        };

        const durations = {
            punch: 50,
            kick: 80,
            uppercut: 120,
            sweep: 100,
            special: 200
        };

        const intensity = intensities[attackType] || 0.005;
        const duration = durations[attackType] || 100;

        this.shake(intensity, duration);

        // Add chromatic aberration for heavy hits
        if (damage >= 15 || attackType === 'special') {
            this.chromaticAberration(damage / 50, duration);
        }
    }

    /**
     * Slow motion zoom effect
     */
    dramaticZoom(targetX, targetY, zoomLevel = 1.3, duration = 300, holdTime = 200) {
        const originalZoom = this.camera.zoom;

        // Calculate scroll to center on target
        const scrollX = targetX - this.width / (2 * zoomLevel);
        const scrollY = targetY - this.height / (2 * zoomLevel);

        // Zoom in
        this.scene.tweens.add({
            targets: this.camera,
            zoom: zoomLevel,
            scrollX: scrollX,
            scrollY: scrollY,
            duration: duration,
            ease: 'Power2.out',
            onComplete: () => {
                // Hold
                this.scene.time.delayedCall(holdTime, () => {
                    // Zoom back
                    this.scene.tweens.add({
                        targets: this.camera,
                        zoom: originalZoom,
                        scrollX: 0,
                        scrollY: 0,
                        duration: duration * 1.5,
                        ease: 'Power2.inOut'
                    });
                });
            }
        });
    }

    /**
     * Speed lines effect for fast attacks
     */
    speedLines(direction, duration = 150) {
        const lines = [];
        const count = 15;

        for (let i = 0; i < count; i++) {
            const startX = direction > 0 ? -20 : this.width + 20;
            const y = Phaser.Math.Between(50, this.height - 50);

            const line = this.scene.add.rectangle(
                startX,
                y,
                Phaser.Math.Between(60, 150),
                Phaser.Math.Between(2, 5),
                0xffffff,
                0.7
            );
            line.setDepth(DEPTH.EFFECTS_FRONT + 5);
            lines.push(line);

            this.scene.tweens.add({
                targets: line,
                x: direction > 0 ? this.width + 100 : -100,
                alpha: 0,
                duration: duration,
                delay: i * 10,
                ease: 'Power2.in',
                onComplete: () => line.destroy()
            });
        }
    }

    /**
     * Border flash for KO or special moments
     */
    borderFlash(color = 0xff0000, thickness = 20, duration = 500) {
        const borders = [
            this.scene.add.rectangle(this.width / 2, thickness / 2, this.width, thickness, color, 0.9),
            this.scene.add.rectangle(this.width / 2, this.height - thickness / 2, this.width, thickness, color, 0.9),
            this.scene.add.rectangle(thickness / 2, this.height / 2, thickness, this.height, color, 0.9),
            this.scene.add.rectangle(this.width - thickness / 2, this.height / 2, thickness, this.height, color, 0.9)
        ];

        borders.forEach(border => {
            border.setDepth(DEPTH.OVERLAY + 30);

            this.scene.tweens.add({
                targets: border,
                alpha: 0,
                duration: duration,
                ease: 'Power2.out',
                onComplete: () => border.destroy()
            });
        });
    }

    /**
     * Radial blur effect (for special moves)
     */
    radialBlur(centerX, centerY, intensity = 0.5, duration = 300) {
        const blurLines = [];
        const count = 24;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const length = 200 * intensity;

            const line = this.scene.add.graphics();
            line.setDepth(DEPTH.EFFECTS_FRONT + 3);

            line.lineStyle(3, 0xffffff, 0.4);
            line.beginPath();
            line.moveTo(centerX, centerY);
            line.lineTo(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
            line.stroke();

            blurLines.push(line);
        }

        this.scene.tweens.add({
            targets: blurLines,
            alpha: 0,
            duration: duration,
            onComplete: () => {
                blurLines.forEach(line => line.destroy());
            }
        });
    }

    /**
     * Hit freeze effect - brief pause on impact
     */
    hitFreeze(duration = 80) {
        const originalTimeScale = this.scene.time.timeScale;

        // Near-freeze
        this.scene.time.timeScale = 0.05;
        this.scene.tweens.timeScale = 0.05;

        this.scene.time.delayedCall(duration * 0.05, () => {
            this.scene.time.timeScale = originalTimeScale;
            this.scene.tweens.timeScale = 1;
        });
    }

    /**
     * Dramatic slow-mo effect
     */
    slowMotion(scale = 0.3, duration = 300) {
        const originalTimeScale = this.scene.time.timeScale;

        this.scene.time.timeScale = scale;
        this.scene.tweens.timeScale = scale;

        this.scene.time.delayedCall(duration * scale, () => {
            // Smooth return to normal
            this.scene.tweens.add({
                targets: { value: scale },
                value: originalTimeScale,
                duration: 100,
                onUpdate: (tween) => {
                    const current = tween.getValue();
                    this.scene.time.timeScale = current;
                    this.scene.tweens.timeScale = current;
                }
            });
        });
    }

    /**
     * Danger zone effect (low health warning)
     */
    dangerPulse(isActive) {
        if (isActive && !this.dangerTween) {
            // Create red vignette pulse
            this.dangerOverlay = this.scene.add.graphics();
            this.dangerOverlay.setDepth(DEPTH.OVERLAY + 18);

            // Red corner gradients
            this.dangerOverlay.fillStyle(0xff0000, 0.2);
            this.dangerOverlay.fillTriangle(0, 0, 200, 0, 0, 200);
            this.dangerOverlay.fillTriangle(this.width, 0, this.width - 200, 0, this.width, 200);
            this.dangerOverlay.fillTriangle(0, this.height, 200, this.height, 0, this.height - 200);
            this.dangerOverlay.fillTriangle(this.width, this.height, this.width - 200, this.height, this.width, this.height - 200);

            this.dangerOverlay.setAlpha(0);

            this.dangerTween = this.scene.tweens.add({
                targets: this.dangerOverlay,
                alpha: { from: 0, to: 1 },
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        } else if (!isActive && this.dangerTween) {
            this.dangerTween.stop();
            this.dangerTween = null;
            if (this.dangerOverlay) {
                this.dangerOverlay.destroy();
                this.dangerOverlay = null;
            }
        }
    }

    /**
     * Victory effect
     */
    victoryEffect(winnerX, winnerY, color) {
        // Spotlight zoom
        this.dramaticZoom(winnerX, winnerY, 1.2, 400, 600);

        // Golden/victory colored flash
        this.scene.time.delayedCall(300, () => {
            this.flash(color, 0.4, 400);
        });

        // Remove danger pulse if active
        this.dangerPulse(false);
    }

    /**
     * Rage mode effect
     */
    rageEffect(isActive) {
        if (isActive) {
            // Red tint overlay
            if (!this.rageOverlay) {
                this.rageOverlay = this.scene.add.rectangle(
                    this.width / 2,
                    this.height / 2,
                    this.width,
                    this.height,
                    0xff0000,
                    0
                );
                this.rageOverlay.setDepth(DEPTH.OVERLAY + 5);
                this.rageOverlay.setBlendMode(Phaser.BlendModes.OVERLAY);

                this.rageTween = this.scene.tweens.add({
                    targets: this.rageOverlay,
                    alpha: { from: 0, to: 0.15 },
                    duration: 400,
                    yoyo: true,
                    repeat: -1
                });
            }

            // Initial flash
            this.flash(0xff0000, 0.5, 200);
            this.shake(0.015, 300);
        } else {
            if (this.rageTween) {
                this.rageTween.stop();
                this.rageTween = null;
            }
            if (this.rageOverlay) {
                this.scene.tweens.add({
                    targets: this.rageOverlay,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        this.rageOverlay.destroy();
                        this.rageOverlay = null;
                    }
                });
            }
        }
    }

    /**
     * Update function for continuous effects
     */
    update(delta) {
        // Update any continuous effects here
    }

    /**
     * Clean up
     */
    destroy() {
        this.dangerPulse(false);
        this.rageEffect(false);

        if (this.vignette) this.vignette.destroy();
        if (this.flashOverlay) this.flashOverlay.destroy();
        if (this.chromaticRed) this.chromaticRed.destroy();
        if (this.chromaticBlue) this.chromaticBlue.destroy();
        if (this.bloomOverlay) this.bloomOverlay.destroy();
    }
}
