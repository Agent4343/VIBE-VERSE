/**
 * Fighter - The main fighter entity with all combat mechanics
 * Enhanced with realistic graphics
 */

import Phaser from 'phaser';
import { FIGHT_CONFIG, FIGHTERS, DEPTH } from '../config/fightConfig.js';

export default class Fighter {
    constructor(scene, x, y, fighterId, isPlayer1 = true) {
        this.scene = scene;
        this.fighterId = fighterId;
        this.config = FIGHTERS[fighterId];
        this.isPlayer1 = isPlayer1;
        this.facing = isPlayer1 ? 1 : -1;

        // Stats
        this.maxHealth = FIGHT_CONFIG.fighter.health;
        this.health = this.maxHealth;
        this.specialMeter = 0;
        this.maxSpecialMeter = 100;

        // State
        this.state = 'idle';
        this.isGrounded = true;
        this.canAct = true;
        this.isBlocking = false;
        this.comboCount = 0;
        this.lastHitTime = 0;

        // Create fighter container
        this.container = scene.add.container(x, y);
        this.container.setDepth(DEPTH.FIGHTERS);

        // Create fighter body
        this.createRealisticBody();

        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.groundY = y;

        // Hitbox
        this.attackHitbox = null;
        this.hurtbox = { x: x, y: y, width: 60, height: 120 };

        // Stats modifiers
        this.speedMod = this.config.stats.speed / 100;
        this.powerMod = this.config.stats.power / 100;
        this.defenseMod = this.config.stats.defense / 100;
    }

    createRealisticBody() {
        const cfg = this.config;

        // Get appearance settings with fallbacks
        const skin = cfg.skinTone || 0xd4a574;
        const skinDark = cfg.skinShadow || 0xb08060;
        const hairCol = cfg.hairColor || 0x222222;
        const topCol = cfg.outfitTop || cfg.color || 0xcc0000;
        const bottomCol = cfg.outfitBottom || 0x222222;
        const gloveCol = cfg.gloveColor || cfg.accentColor || 0xff0000;
        const bootCol = cfg.bootColor || 0x111111;
        const outlineCol = 0x000000;
        const outlineW = 3;

        // Ground shadow
        this.shadow = this.scene.add.ellipse(0, 75, 80, 20, 0x000000, 0.4);
        this.container.add(this.shadow);

        // Subtle energy aura
        this.glow = this.scene.add.circle(0, -20, 70, cfg.color, 0.15);
        this.container.add(this.glow);

        // Main graphics object
        this.bodyGfx = this.scene.add.graphics();
        this.container.add(this.bodyGfx);
        const g = this.bodyGfx;

        // ========== LEGS ==========
        // Left leg outline
        g.lineStyle(outlineW, outlineCol, 1);
        g.fillStyle(bottomCol, 1);
        g.fillRoundedRect(-22, 5, 20, 30, 6);
        g.strokeRoundedRect(-22, 5, 20, 30, 6);

        // Left leg skin (lower)
        g.fillStyle(skin, 1);
        g.fillRoundedRect(-20, 30, 16, 25, 5);
        g.strokeRoundedRect(-20, 30, 16, 25, 5);

        // Left boot
        g.fillStyle(bootCol, 1);
        g.fillRoundedRect(-22, 52, 20, 20, 6);
        g.strokeRoundedRect(-22, 52, 20, 20, 6);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(-18, 55, 6, 12, 3);

        // Right leg outline
        g.fillStyle(bottomCol, 1);
        g.fillRoundedRect(2, 5, 20, 30, 6);
        g.strokeRoundedRect(2, 5, 20, 30, 6);

        // Right leg skin (lower)
        g.fillStyle(skin, 1);
        g.fillRoundedRect(4, 30, 16, 25, 5);
        g.strokeRoundedRect(4, 30, 16, 25, 5);

        // Right boot
        g.fillStyle(bootCol, 1);
        g.fillRoundedRect(2, 52, 20, 20, 6);
        g.strokeRoundedRect(2, 52, 20, 20, 6);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(6, 55, 6, 12, 3);

        // ========== TORSO ==========
        // Main body
        g.fillStyle(topCol, 1);
        g.fillRoundedRect(-28, -50, 56, 60, 10);
        g.strokeRoundedRect(-28, -50, 56, 60, 10);

        // Shirt shading (right side darker)
        g.fillStyle(0x000000, 0.2);
        g.fillRoundedRect(5, -48, 20, 55, 8);

        // Shirt highlight (left side)
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(-24, -45, 12, 40, 5);

        // Belt
        g.fillStyle(0x1a1a1a, 1);
        g.fillRect(-26, 2, 52, 8);
        g.strokeRect(-26, 2, 52, 8);
        // Belt buckle
        g.fillStyle(cfg.accentColor || 0xffcc00, 1);
        g.fillRoundedRect(-8, 3, 16, 6, 2);

        // ========== ARMS ==========
        // Left arm (behind torso)
        g.fillStyle(skin, 1);
        g.fillRoundedRect(-45, -45, 18, 45, 8);
        g.strokeRoundedRect(-45, -45, 18, 45, 8);
        g.fillStyle(skinDark, 0.3);
        g.fillRoundedRect(-43, -40, 5, 35, 3);

        // Left glove
        g.fillStyle(gloveCol, 1);
        g.fillRoundedRect(-47, -5, 22, 25, 10);
        g.strokeRoundedRect(-47, -5, 22, 25, 10);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(-43, -2, 6, 18, 4);

        // Right arm
        g.fillStyle(skin, 1);
        g.fillRoundedRect(27, -45, 18, 45, 8);
        g.strokeRoundedRect(27, -45, 18, 45, 8);
        g.fillStyle(skinDark, 0.3);
        g.fillRoundedRect(38, -40, 5, 35, 3);

        // Right glove
        g.fillStyle(gloveCol, 1);
        g.fillRoundedRect(25, -5, 22, 25, 10);
        g.strokeRoundedRect(25, -5, 22, 25, 10);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(29, -2, 6, 18, 4);

        // ========== HEAD ==========
        // Neck
        g.fillStyle(skin, 1);
        g.fillRoundedRect(-10, -60, 20, 15, 5);

        // Head base
        g.fillStyle(skin, 1);
        g.fillCircle(0, -80, 28);
        g.lineStyle(outlineW, outlineCol, 1);
        g.strokeCircle(0, -80, 28);

        // Face shading
        g.fillStyle(skinDark, 0.25);
        g.fillCircle(8, -78, 15);

        // ========== FACE ==========
        // Eyes
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(-10, -82, 10, 8);
        g.fillEllipse(10, -82, 10, 8);
        g.lineStyle(2, outlineCol, 1);
        g.strokeEllipse(-10, -82, 10, 8);
        g.strokeEllipse(10, -82, 10, 8);

        // Pupils
        const lookDir = this.isPlayer1 ? 2 : -2;
        g.fillStyle(cfg.eyeColor || 0x442200, 1);
        g.fillCircle(-10 + lookDir, -82, 5);
        g.fillCircle(10 + lookDir, -82, 5);
        g.fillStyle(0x000000, 1);
        g.fillCircle(-10 + lookDir, -82, 2.5);
        g.fillCircle(10 + lookDir, -82, 2.5);

        // Eye shine
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(-12 + lookDir, -84, 2);
        g.fillCircle(8 + lookDir, -84, 2);

        // Eyebrows (determined expression)
        g.fillStyle(hairCol, 1);
        g.fillRoundedRect(-18, -95, 16, 4, 2);
        g.fillRoundedRect(2, -95, 16, 4, 2);

        // Nose
        g.fillStyle(skinDark, 0.5);
        g.fillTriangle(0, -75, -4, -68, 4, -68);

        // Mouth (determined line)
        g.lineStyle(3, 0x884444, 0.8);
        g.lineBetween(-8, -62, 8, -62);

        // ========== HAIR ==========
        this.drawHairStyle(g, hairCol, cfg, outlineCol, outlineW);

        // Attack glow effects (hidden by default)
        this.fistGlow = this.scene.add.circle(40, 0, 20, cfg.accentColor, 0);
        this.footGlow = this.scene.add.circle(15, 60, 22, cfg.accentColor, 0);
        this.container.add(this.fistGlow);
        this.container.add(this.footGlow);

        // Name label
        this.nameLabel = this.scene.add.text(0, -125, cfg.name, {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.container.add(this.nameLabel);

        // Store references
        this.leftArm = { x: 0, y: 0 };
        this.rightArm = { x: 0, y: 0 };
        this.leftLeg = { x: 0, y: 0, rotation: 0 };
        this.rightLeg = { x: 0, y: 0, rotation: 0 };
        this.head = { x: 0, y: 0 };
        this.body = this.bodyGfx;
        this.hair = { x: 0, y: 0 };

        // Breathing animation
        this.scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.15, to: 0.25 },
            scale: { from: 1, to: 1.1 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    drawHairStyle(g, hairCol, cfg, outlineCol, outlineW) {
        const style = cfg.hairStyle || 'short_spiky';

        // Calculate highlight
        const hc = Phaser.Display.Color.ValueToColor(hairCol);
        const highlight = Phaser.Display.Color.GetColor(
            Math.min(255, hc.r + 60),
            Math.min(255, hc.g + 60),
            Math.min(255, hc.b + 60)
        );

        g.lineStyle(outlineW, outlineCol, 1);

        switch (style) {
            case 'short_spiky':
                // Base hair
                g.fillStyle(hairCol, 1);
                g.fillCircle(0, -95, 22);
                g.strokeCircle(0, -95, 22);

                // Spikes
                for (let i = -15; i <= 15; i += 10) {
                    g.fillStyle(hairCol, 1);
                    g.fillTriangle(i, -115, i - 8, -95, i + 8, -95);
                    g.lineStyle(outlineW, outlineCol, 1);
                    g.strokeTriangle(i, -115, i - 8, -95, i + 8, -95);
                }

                // Highlight
                g.fillStyle(highlight, 0.4);
                g.fillCircle(-8, -100, 8);
                break;

            case 'long_flowing':
                g.fillStyle(hairCol, 1);
                // Top
                g.fillCircle(0, -95, 25);
                g.strokeCircle(0, -95, 25);
                // Sides flowing down
                g.fillRoundedRect(-30, -100, 18, 60, 8);
                g.strokeRoundedRect(-30, -100, 18, 60, 8);
                g.fillRoundedRect(12, -100, 18, 60, 8);
                g.strokeRoundedRect(12, -100, 18, 60, 8);
                // Back
                g.fillRoundedRect(-22, -90, 44, 50, 10);
                // Highlight
                g.fillStyle(highlight, 0.3);
                g.fillCircle(-10, -105, 10);
                break;

            case 'hooded':
                const hoodCol = cfg.outfitTop || 0x1a0030;
                g.fillStyle(hoodCol, 1);
                // Hood shape
                g.fillCircle(0, -90, 35);
                g.strokeCircle(0, -90, 35);
                g.fillRoundedRect(-35, -95, 70, 45, 12);
                g.strokeRoundedRect(-35, -95, 70, 45, 12);
                // Hood peak
                g.fillTriangle(0, -130, -22, -95, 22, -95);
                g.strokeTriangle(0, -130, -22, -95, 22, -95);
                // Dark inside
                g.fillStyle(0x000000, 0.5);
                g.fillCircle(0, -80, 22);
                break;

            case 'bald':
                // Just a shiny head highlight
                g.fillStyle(0xffffff, 0.25);
                g.fillCircle(-8, -95, 10);
                break;

            case 'ponytail':
                g.fillStyle(hairCol, 1);
                // Top
                g.fillCircle(0, -95, 22);
                g.strokeCircle(0, -95, 22);
                // Ponytail going back
                g.fillRoundedRect(-8, -100, 16, 55, 8);
                g.strokeRoundedRect(-8, -100, 16, 55, 8);
                // Hair tie
                g.fillStyle(cfg.accentColor || 0x00aa00, 1);
                g.fillRect(-8, -90, 16, 6);
                // Highlight
                g.fillStyle(highlight, 0.3);
                g.fillCircle(-8, -100, 8);
                break;

            case 'long_wavy':
                g.fillStyle(hairCol, 1);
                // Top
                g.fillCircle(0, -95, 26);
                g.strokeCircle(0, -95, 26);
                // Wavy sides
                for (let y = -90; y < -40; y += 12) {
                    const wave = Math.sin((y + 90) * 0.15) * 5;
                    g.fillCircle(-25 + wave, y, 10);
                    g.fillCircle(25 - wave, y, 10);
                }
                g.fillRoundedRect(-28, -95, 56, 45, 15);
                // Highlight
                g.fillStyle(highlight, 0.3);
                g.fillCircle(-12, -105, 12);
                break;
        }
    }

    // Movement
    moveLeft() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        this.velocityX = -FIGHT_CONFIG.fighter.speed * this.speedMod;
        this.state = 'walking';
        this.facing = -1;
        this.updateFacing();
    }

    moveRight() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        this.velocityX = FIGHT_CONFIG.fighter.speed * this.speedMod;
        this.state = 'walking';
        this.facing = 1;
        this.updateFacing();
    }

    stopMoving() {
        if (this.state === 'walking') {
            this.velocityX = 0;
            this.state = 'idle';
        }
    }

    jump() {
        if (!this.canAct || !this.isGrounded || this.state === 'attacking') return;
        this.velocityY = -FIGHT_CONFIG.fighter.jumpForce;
        this.isGrounded = false;
        this.state = 'jumping';
    }

    block(isBlocking) {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') {
            this.isBlocking = false;
            return;
        }
        this.isBlocking = isBlocking;
        if (isBlocking && this.state !== 'jumping') {
            this.state = 'blocking';
            this.velocityX = 0;
        } else if (this.state === 'blocking') {
            this.state = 'idle';
        }
    }

    updateFacing() {
        this.container.scaleX = this.facing;
        // Keep name label readable when flipped
        if (this.nameLabel) {
            this.nameLabel.scaleX = this.facing;
        }
    }

    faceOpponent(opponentX) {
        if (this.state === 'attacking' || this.state === 'hit') return;
        const shouldFaceRight = opponentX > this.container.x;
        this.facing = shouldFaceRight ? 1 : -1;
        this.updateFacing();
    }

    // Attacks
    punch() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        this.performAttack('punch', FIGHT_CONFIG.damage.punch, { x: 50, y: -35, width: 45, height: 30 });
    }

    kick() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        this.performAttack('kick', FIGHT_CONFIG.damage.kick, { x: 55, y: -15, width: 55, height: 35 });
    }

    uppercut() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        this.performAttack('uppercut', FIGHT_CONFIG.damage.uppercut, { x: 40, y: -55, width: 40, height: 45 });
    }

    sweep() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit' || !this.isGrounded) return;
        this.performAttack('sweep', FIGHT_CONFIG.damage.sweep, { x: 45, y: 35, width: 65, height: 30 });
    }

    special() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        if (this.specialMeter < this.maxSpecialMeter) return;

        this.specialMeter = 0;
        this.performAttack('special', this.config.special.damage, { x: 65, y: -30, width: 85, height: 55 });
        this.createSpecialEffect();
    }

    performAttack(type, damage, hitboxData) {
        this.state = 'attacking';
        this.canAct = false;
        this.velocityX = 0;

        const duration = FIGHT_CONFIG.attackDuration[type] || 200;
        const recovery = type === 'special' ? FIGHT_CONFIG.recovery.heavy :
                        (type === 'kick' || type === 'uppercut') ? FIGHT_CONFIG.recovery.medium :
                        FIGHT_CONFIG.recovery.light;

        this.attackHitbox = {
            x: this.container.x + (hitboxData.x * this.facing),
            y: this.container.y + hitboxData.y,
            width: hitboxData.width,
            height: hitboxData.height,
            damage: Math.floor(damage * this.powerMod),
            type: type,
            active: true
        };

        this.animateAttack(type, duration);
        this.showHitboxVisual(hitboxData, duration);

        this.scene.time.delayedCall(duration, () => {
            this.attackHitbox = null;
        });

        this.scene.time.delayedCall(duration + recovery, () => {
            if (this.state === 'attacking') {
                this.state = 'idle';
                this.canAct = true;
            }
        });
    }

    animateAttack(type, duration) {
        const accent = this.config.accentColor;

        switch (type) {
            case 'punch':
                this.scene.tweens.add({
                    targets: this.fistGlow,
                    alpha: 0.8,
                    scale: 1.5,
                    duration: duration / 4,
                    yoyo: true,
                    repeat: 1
                });
                this.createAttackTrail('punch', duration);
                break;

            case 'kick':
                this.scene.tweens.add({
                    targets: this.footGlow,
                    alpha: 0.8,
                    scale: 1.5,
                    duration: duration / 4,
                    yoyo: true,
                    repeat: 1
                });
                this.createAttackTrail('kick', duration);
                break;

            case 'uppercut':
                this.scene.tweens.add({
                    targets: this.fistGlow,
                    alpha: 1,
                    scale: 2,
                    y: -60,
                    duration: duration / 3,
                    yoyo: true
                });
                this.scene.tweens.add({
                    targets: this.container,
                    y: this.container.y - 25,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Sine.out'
                });
                this.createAttackTrail('uppercut', duration);
                break;

            case 'sweep':
                this.scene.tweens.add({
                    targets: this.footGlow,
                    alpha: 0.9,
                    scale: 2,
                    x: 40 * this.facing,
                    duration: duration / 3,
                    yoyo: true
                });
                this.scene.tweens.add({
                    targets: this.container,
                    y: this.container.y + 30,
                    duration: duration / 3,
                    yoyo: true,
                    ease: 'Power2'
                });
                this.createAttackTrail('sweep', duration);
                break;

            case 'special':
                this.scene.tweens.add({
                    targets: this.glow,
                    alpha: 0.8,
                    scale: 2,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power2'
                });
                this.scene.tweens.add({
                    targets: [this.fistGlow, this.footGlow],
                    alpha: 1,
                    scale: 2.5,
                    duration: duration / 3,
                    yoyo: true
                });
                this.scene.tweens.add({
                    targets: this.container,
                    scaleY: 1.1,
                    duration: duration / 3,
                    yoyo: true,
                    ease: 'Power2'
                });
                this.createAttackTrail('special', duration);
                break;
        }
    }

    createAttackTrail(type, duration) {
        const accent = this.config.accentColor;
        let startX, startY, endX, endY, trailCount;

        switch (type) {
            case 'punch':
                startX = this.container.x + (25 * this.facing);
                startY = this.container.y - 40;
                endX = this.container.x + (60 * this.facing);
                endY = this.container.y - 40;
                trailCount = 5;
                break;
            case 'kick':
                startX = this.container.x + (20 * this.facing);
                startY = this.container.y + 15;
                endX = this.container.x + (65 * this.facing);
                endY = this.container.y + 5;
                trailCount = 6;
                break;
            case 'uppercut':
                startX = this.container.x + (15 * this.facing);
                startY = this.container.y - 25;
                endX = this.container.x + (35 * this.facing);
                endY = this.container.y - 80;
                trailCount = 7;
                break;
            case 'sweep':
                startX = this.container.x;
                startY = this.container.y + 40;
                endX = this.container.x + (75 * this.facing);
                endY = this.container.y + 45;
                trailCount = 8;
                break;
            case 'special':
                startX = this.container.x;
                startY = this.container.y - 35;
                endX = this.container.x + (110 * this.facing);
                endY = this.container.y - 35;
                trailCount = 12;
                break;
            default:
                return;
        }

        for (let i = 0; i < trailCount; i++) {
            const progress = i / trailCount;
            const x = Phaser.Math.Linear(startX, endX, progress);
            const y = Phaser.Math.Linear(startY, endY, progress);
            const size = type === 'special' ? 15 - (i * 0.8) : 10 - (i * 0.6);
            const alpha = 0.8 - (progress * 0.5);

            const trail = this.scene.add.circle(x, y, size, accent, 0);
            trail.setDepth(DEPTH.EFFECTS_FRONT - 1);

            this.scene.tweens.add({
                targets: trail,
                alpha: alpha,
                scale: { from: 0.5, to: 1.2 },
                duration: duration / 3,
                delay: i * (duration / trailCount / 3),
                ease: 'Power2.out',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.3,
                        duration: duration / 3,
                        onComplete: () => trail.destroy()
                    });
                }
            });
        }

        if (type === 'special' || type === 'uppercut') {
            const line = this.scene.add.graphics();
            line.setDepth(DEPTH.EFFECTS_FRONT - 2);
            line.lineStyle(type === 'special' ? 6 : 4, accent, 0.6);
            line.lineBetween(startX, startY, endX, endY);

            this.scene.tweens.add({
                targets: line,
                alpha: 0,
                duration: duration / 2,
                onComplete: () => line.destroy()
            });
        }
    }

    showHitboxVisual(hitboxData, duration) {
        const hbVisual = this.scene.add.rectangle(
            this.container.x + (hitboxData.x * this.facing),
            this.container.y + hitboxData.y,
            hitboxData.width,
            hitboxData.height,
            0xff0000,
            0.3
        );
        hbVisual.setDepth(DEPTH.EFFECTS_FRONT);

        this.scene.time.delayedCall(duration, () => {
            hbVisual.destroy();
        });
    }

    createSpecialEffect() {
        const color = this.config.special.color;
        const x = this.container.x + (65 * this.facing);
        const y = this.container.y - 30;

        for (let i = 0; i < 15; i++) {
            const particle = this.scene.add.circle(
                x + Phaser.Math.Between(-25, 25),
                y + Phaser.Math.Between(-25, 25),
                Phaser.Math.Between(5, 15),
                color,
                0.8
            );
            particle.setDepth(DEPTH.EFFECTS_FRONT);

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Phaser.Math.Between(50, 150) * this.facing),
                y: particle.y + Phaser.Math.Between(-50, 50),
                alpha: 0,
                scale: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        this.scene.cameras.main.flash(100,
            (color >> 16) & 0xff,
            (color >> 8) & 0xff,
            color & 0xff,
            false, null, this, 0.3
        );
    }

    takeHit(damage, attackType, attackerX) {
        const attackFromFront = (attackerX > this.container.x && this.facing === 1) ||
                               (attackerX < this.container.x && this.facing === -1);

        if (this.isBlocking && attackFromFront && this.isGrounded) {
            const blockedDamage = Math.floor(damage * 0.2 / this.defenseMod);
            this.health -= blockedDamage;
            this.showBlockEffect();
            this.knockback(50, attackerX);
            return { blocked: true, damage: blockedDamage };
        }

        const actualDamage = Math.floor(damage / this.defenseMod);
        this.health -= actualDamage;
        this.state = 'hit';
        this.canAct = false;
        this.isBlocking = false;

        this.specialMeter = Math.min(this.maxSpecialMeter, this.specialMeter + actualDamage * 0.3);

        this.showHitEffect(actualDamage);
        this.knockback(attackType === 'special' ? 150 : (attackType === 'uppercut' ? 100 : 80), attackerX);

        if (attackType === 'uppercut' && this.isGrounded) {
            this.velocityY = -300;
            this.isGrounded = false;
        }

        const hitRecovery = attackType === 'special' ? 500 : FIGHT_CONFIG.recovery.hit;
        this.scene.time.delayedCall(hitRecovery, () => {
            if (this.health > 0) {
                this.state = 'idle';
                this.canAct = true;
            }
        });

        if (this.health <= 0) {
            this.health = 0;
            this.ko();
        }

        return { blocked: false, damage: actualDamage };
    }

    knockback(force, attackerX) {
        const direction = attackerX < this.container.x ? 1 : -1;
        this.velocityX = force * direction;

        this.scene.tweens.add({
            targets: this.container,
            x: this.container.x + (force * direction * 0.5),
            duration: 100,
            ease: 'Power2'
        });
    }

    showHitEffect(damage) {
        const hitX = this.container.x;
        const hitY = this.container.y - 35;

        this.scene.tweens.add({
            targets: this.bodyGfx,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 2
        });

        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.9,
            scale: 1.8,
            duration: 80,
            yoyo: true
        });

        const burstColors = [0xffffff, 0xffff00, 0xff6600, 0xff0000];
        for (let ring = 0; ring < 3; ring++) {
            const impactRing = this.scene.add.circle(hitX, hitY, 5 + ring * 8, burstColors[ring], 0.8 - ring * 0.2);
            impactRing.setDepth(DEPTH.EFFECTS_FRONT);

            this.scene.tweens.add({
                targets: impactRing,
                scale: 2 + ring * 0.5,
                alpha: 0,
                duration: 150 + ring * 50,
                ease: 'Power2.out',
                onComplete: () => impactRing.destroy()
            });
        }

        const dmgText = this.scene.add.text(
            hitX,
            this.container.y - 100,
            `-${damage}`,
            {
                fontFamily: 'Arial Black',
                fontSize: '32px',
                color: damage >= 15 ? '#ff0000' : (damage >= 10 ? '#ff6600' : '#ffff00'),
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5).setDepth(DEPTH.EFFECTS_FRONT).setScale(0);

        this.scene.tweens.add({
            targets: dmgText,
            scale: 1.2,
            duration: 100,
            ease: 'Back.out',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: dmgText,
                    scale: 1,
                    y: dmgText.y - 40,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => dmgText.destroy()
                });
            }
        });

        const particleColors = [0xffffff, 0xffff00, 0xff8800, 0xff0066];
        for (let i = 0; i < 12; i++) {
            const color = Phaser.Math.RND.pick(particleColors);
            const size = Phaser.Math.Between(3, 10);
            const spark = this.scene.add.circle(
                hitX + Phaser.Math.Between(-15, 15),
                hitY + Phaser.Math.Between(-15, 15),
                size,
                color,
                1
            );
            spark.setDepth(DEPTH.EFFECTS_FRONT);

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(80, 150);

            this.scene.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(angle) * speed,
                y: spark.y + Math.sin(angle) * speed + 30,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(250, 400),
                ease: 'Power2.out',
                onComplete: () => spark.destroy()
            });
        }
    }

    showBlockEffect() {
        const blockSpark = this.scene.add.circle(
            this.container.x + (35 * this.facing),
            this.container.y - 35,
            20,
            0x00ffff,
            0.8
        );
        blockSpark.setDepth(DEPTH.EFFECTS_FRONT);

        this.scene.tweens.add({
            targets: blockSpark,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => blockSpark.destroy()
        });

        const blockText = this.scene.add.text(
            this.container.x,
            this.container.y - 100,
            'BLOCK!',
            {
                fontFamily: 'Arial Black',
                fontSize: '20px',
                color: '#00ffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(DEPTH.EFFECTS_FRONT);

        this.scene.tweens.add({
            targets: blockText,
            y: blockText.y - 30,
            alpha: 0,
            duration: 500,
            onComplete: () => blockText.destroy()
        });
    }

    ko() {
        this.state = 'ko';
        this.canAct = false;
        this.isBlocking = false;

        this.scene.tweens.add({
            targets: this.container,
            rotation: (Math.PI / 2) * -this.facing,
            y: this.groundY + 35,
            duration: 500,
            ease: 'Bounce.out'
        });
    }

    reset(x) {
        this.container.x = x;
        this.container.y = this.groundY;
        this.container.rotation = 0;
        this.container.scaleY = 1;
        this.health = this.maxHealth;
        this.specialMeter = 0;
        this.state = 'idle';
        this.canAct = true;
        this.isBlocking = false;
        this.isGrounded = true;
        this.velocityX = 0;
        this.velocityY = 0;
        this.attackHitbox = null;
    }

    update(delta) {
        if (!this.isGrounded) {
            this.velocityY += FIGHT_CONFIG.gravity * (delta / 1000);
        }

        this.container.x += this.velocityX * (delta / 1000);
        this.container.y += this.velocityY * (delta / 1000);

        if (this.container.y >= this.groundY) {
            this.container.y = this.groundY;
            this.velocityY = 0;
            if (!this.isGrounded) {
                this.isGrounded = true;
                if (this.state === 'jumping') {
                    this.state = 'idle';
                }
            }
        }

        const minX = 60;
        const maxX = FIGHT_CONFIG.width - 60;
        this.container.x = Phaser.Math.Clamp(this.container.x, minX, maxX);

        this.velocityX *= 0.9;

        this.hurtbox.x = this.container.x;
        this.hurtbox.y = this.container.y - 55;

        if (this.state === 'idle' || this.state === 'blocking') {
            const breathe = Math.sin(this.scene.time.now / 500) * 2;
            if (this.bodyGfx) {
                this.bodyGfx.y = breathe;
            }
        }
    }

    getHurtbox() {
        return {
            x: this.container.x - 30,
            y: this.container.y - 110,
            width: 60,
            height: 110
        };
    }

    destroy() {
        this.container.destroy();
    }
}
