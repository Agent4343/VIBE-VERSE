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

        // Rage mode
        this.rageMode = false;
        this.rageDamageBonus = 1.3; // 30% damage boost
        this.rageAura = null;

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

        // Store colors for limb drawing
        this.colors = {
            skin: cfg.skinTone || 0xd4a574,
            skinDark: cfg.skinShadow || Phaser.Display.Color.ValueToColor(cfg.skinTone || 0xd4a574).darken(25).color,
            skinLight: cfg.skinHighlight || Phaser.Display.Color.ValueToColor(cfg.skinTone || 0xd4a574).lighten(15).color,
            hair: cfg.hairColor || 0x222222,
            top: cfg.outfitTop || cfg.color || 0xcc0000,
            topDark: Phaser.Display.Color.ValueToColor(cfg.outfitTop || cfg.color || 0xcc0000).darken(30).color,
            bottom: cfg.outfitBottom || 0x222222,
            glove: cfg.gloveColor || cfg.accentColor || 0xff0000,
            boot: cfg.bootColor || 0x111111
        };

        // Ground shadow
        this.shadow = this.scene.add.ellipse(0, 75, 70, 18, 0x000000, 0.35);
        this.container.add(this.shadow);

        // Subtle energy aura
        this.glow = this.scene.add.circle(0, -30, 65, cfg.color, 0.12);
        this.container.add(this.glow);

        // === CREATE ANIMATABLE LIMBS AS SEPARATE CONTAINERS ===

        // Back leg (right leg visually)
        this.backLegContainer = this.scene.add.container(12, 8);
        this.container.add(this.backLegContainer);
        this.drawLeg(this.backLegContainer, this.colors, true);

        // Front leg (left leg visually) - ANIMATABLE for kicks
        this.frontLegContainer = this.scene.add.container(-12, 8);
        this.container.add(this.frontLegContainer);
        this.drawLeg(this.frontLegContainer, this.colors, false);

        // Main torso graphics
        this.bodyGfx = this.scene.add.graphics();
        this.container.add(this.bodyGfx);
        this.drawTorso(this.bodyGfx, this.colors, cfg);

        // Back arm (left arm visually)
        this.backArmContainer = this.scene.add.container(-38, -44);
        this.container.add(this.backArmContainer);
        this.drawArm(this.backArmContainer, this.colors, true);

        // Front arm (right arm visually) - ANIMATABLE for punches
        this.frontArmContainer = this.scene.add.container(38, -44);
        this.container.add(this.frontArmContainer);
        this.drawArm(this.frontArmContainer, this.colors, false);

        // Head container (for hit reactions)
        this.headContainer = this.scene.add.container(0, -78);
        this.container.add(this.headContainer);
        this.drawHead(this.headContainer, this.colors, cfg);

        // Attack glow effects (hidden by default)
        this.fistGlow = this.scene.add.circle(55, -20, 18, cfg.accentColor, 0);
        this.footGlow = this.scene.add.circle(25, 50, 20, cfg.accentColor, 0);
        this.container.add(this.fistGlow);
        this.container.add(this.footGlow);

        // Name label
        this.nameLabel = this.scene.add.text(0, -120, cfg.name, {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.container.add(this.nameLabel);

        // Breathing animation
        this.scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.12, to: 0.2 },
            scale: { from: 1, to: 1.08 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Idle arm sway
        this.scene.tweens.add({
            targets: [this.frontArmContainer, this.backArmContainer],
            rotation: { from: -0.05, to: 0.05 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    drawLeg(container, colors, isBack) {
        const g = this.scene.add.graphics();
        container.add(g);

        // Thigh
        g.fillStyle(colors.bottom, 1);
        g.fillRoundedRect(-8, 0, 16, 32, 8);

        // Knee highlight
        g.fillStyle(0xffffff, 0.1);
        g.fillEllipse(0, 28, 6, 4);

        // Calf
        g.fillStyle(colors.skin, 1);
        g.fillRoundedRect(-7, 30, 14, 24, 6);

        // Calf shadow
        if (!isBack) {
            g.fillStyle(colors.skinDark, 0.3);
            g.fillRoundedRect(-2, 34, 5, 16, 2);
        }

        // Boot
        g.fillStyle(colors.boot, 1);
        g.fillRoundedRect(-10, 52, 20, 14, 4);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(-8, 54, 6, 8, 2);
    }

    drawArm(container, colors, isBack) {
        const g = this.scene.add.graphics();
        container.add(g);

        // Upper arm
        g.fillStyle(colors.skin, 1);
        g.fillRoundedRect(-7, 0, 14, 28, 7);

        // Bicep highlight/shadow
        if (!isBack) {
            g.fillStyle(colors.skinLight, 0.3);
            g.fillEllipse(0, 12, 5, 8);
        }
        g.fillStyle(colors.skinDark, 0.25);
        g.fillEllipse(isBack ? -3 : 3, 14, 4, 10);

        // Forearm
        g.fillStyle(colors.skin, 1);
        g.fillRoundedRect(-6, 26, 12, 24, 6);

        // Forearm definition
        g.fillStyle(colors.skinDark, 0.2);
        g.fillEllipse(3, 36, 3, 8);

        // Glove/fist
        g.fillStyle(colors.glove, 1);
        g.fillCircle(0, 54, 12);
        g.fillRoundedRect(-8, 48, 16, 16, 6);

        // Glove shine
        g.fillStyle(0xffffff, 0.25);
        g.fillCircle(-3, 50, 5);
    }

    drawTorso(g, colors, cfg) {
        // Neck
        g.fillStyle(colors.skin, 1);
        g.fillRoundedRect(-8, -58, 16, 14, 4);
        g.fillStyle(colors.skinDark, 0.2);
        g.fillRoundedRect(2, -56, 5, 10, 2);

        // Core body shape - trapezoid torso
        g.fillStyle(colors.top, 1);
        g.beginPath();
        g.moveTo(-24, -48);
        g.lineTo(24, -48);
        g.lineTo(20, 12);
        g.lineTo(-20, 12);
        g.closePath();
        g.fill();

        // Chest definition
        g.fillStyle(colors.topDark, 0.4);
        g.fillEllipse(12, -32, 14, 18);
        g.fillStyle(0xffffff, 0.1);
        g.fillEllipse(-10, -36, 12, 14);

        // Abs suggestion
        g.fillStyle(colors.topDark, 0.15);
        g.fillRoundedRect(-8, -20, 16, 28, 4);
        g.lineStyle(1, colors.topDark, 0.2);
        g.lineBetween(-6, -12, 6, -12);
        g.lineBetween(-6, -2, 6, -2);

        // Collar/neckline
        g.fillStyle(colors.skin, 1);
        g.fillEllipse(0, -48, 16, 8);

        // Belt/waistband
        g.fillStyle(0x1a1a1a, 1);
        g.fillRoundedRect(-20, 6, 40, 8, 2);
        g.fillStyle(cfg.accentColor || 0xccaa00, 1);
        g.fillRoundedRect(-6, 7, 12, 6, 2);
    }

    drawHead(container, colors, cfg) {
        const g = this.scene.add.graphics();
        container.add(g);

        // Head shape
        g.fillStyle(colors.skin, 1);
        g.fillEllipse(0, 0, 24, 28);

        // Jaw shadow
        g.fillStyle(colors.skinDark, 0.15);
        g.fillEllipse(8, 10, 12, 10);

        // Cheek highlight
        g.fillStyle(colors.skinLight, 0.2);
        g.fillCircle(-10, 2, 8);

        // Eyes
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(-9, -2, 8, 5);
        g.fillEllipse(9, -2, 8, 5);

        // Iris
        const lookDir = this.isPlayer1 ? 1 : -1;
        g.fillStyle(cfg.eyeColor || 0x553322, 1);
        g.fillCircle(-9 + lookDir, -2, 3.5);
        g.fillCircle(9 + lookDir, -2, 3.5);

        // Pupils
        g.fillStyle(0x000000, 1);
        g.fillCircle(-9 + lookDir, -2, 1.8);
        g.fillCircle(9 + lookDir, -2, 1.8);

        // Eye shine
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(-10 + lookDir, -3, 1.2);
        g.fillCircle(8 + lookDir, -3, 1.2);

        // Eyebrows
        g.fillStyle(colors.hair, 1);
        g.beginPath();
        g.moveTo(-16, -10);
        g.lineTo(-14, -12);
        g.lineTo(-4, -10);
        g.lineTo(-5, -8);
        g.closePath();
        g.fill();
        g.beginPath();
        g.moveTo(16, -10);
        g.lineTo(14, -12);
        g.lineTo(4, -10);
        g.lineTo(5, -8);
        g.closePath();
        g.fill();

        // Nose
        g.fillStyle(colors.skinDark, 0.35);
        g.beginPath();
        g.moveTo(0, 2);
        g.lineTo(-3, 10);
        g.lineTo(0, 12);
        g.lineTo(3, 10);
        g.closePath();
        g.fill();

        // Mouth
        g.fillStyle(0x994455, 0.8);
        g.fillEllipse(0, 18, 8, 3);
        g.lineStyle(1, 0x773344, 0.6);
        g.lineBetween(-6, 17, 6, 17);

        // Ears
        g.fillStyle(colors.skin, 1);
        g.fillEllipse(-22, 0, 4, 8);
        g.fillEllipse(22, 0, 4, 8);

        // Hair
        this.drawHumanHairStyle(g, colors.hair, cfg);

        // Head outline
        g.lineStyle(1, 0x000000, 0.3);
        g.strokeEllipse(0, 0, 24, 28);
    }

    // Legacy compatibility
    drawLimb(g, x, y, width, height, radius) {
        g.fillRoundedRect(x, y, width, height, radius);
    }

    drawHumanHairStyle(g, hairCol, cfg) {
        const style = cfg.hairStyle || 'short_spiky';

        // Calculate highlight color
        const hc = Phaser.Display.Color.ValueToColor(hairCol);
        const highlight = Phaser.Display.Color.GetColor(
            Math.min(255, hc.r + 50),
            Math.min(255, hc.g + 50),
            Math.min(255, hc.b + 50)
        );
        const shadow = Phaser.Display.Color.GetColor(
            Math.max(0, hc.r - 40),
            Math.max(0, hc.g - 40),
            Math.max(0, hc.b - 40)
        );

        // Hair Y offset (relative to head container at 0,0)
        const hy = -17;

        switch (style) {
            case 'short_spiky':
                // Base hair volume
                g.fillStyle(hairCol, 1);
                g.fillEllipse(0, hy, 22, 16);
                // Side hair
                g.fillEllipse(-18, hy + 10, 8, 12);
                g.fillEllipse(18, hy + 10, 8, 12);
                // Spiky top - using triangles
                g.fillTriangle(-12, hy - 10, -8, hy + 3, -4, hy + 3);
                g.fillTriangle(-4, hy - 13, -2, hy + 3, 2, hy + 3);
                g.fillTriangle(4, hy - 11, 2, hy + 3, 8, hy + 3);
                g.fillTriangle(12, hy - 9, 6, hy + 3, 14, hy + 3);
                // Highlight
                g.fillStyle(highlight, 0.3);
                g.fillEllipse(-6, hy - 3, 8, 6);
                // Shadow
                g.fillStyle(shadow, 0.3);
                g.fillEllipse(8, hy + 3, 10, 8);
                break;

            case 'long_flowing':
                // Main hair mass
                g.fillStyle(hairCol, 1);
                g.fillEllipse(0, hy, 26, 18);
                // Flowing sides
                g.fillRoundedRect(-28, hy + 5, 14, 55, 6);
                g.fillRoundedRect(14, hy + 5, 14, 55, 6);
                // Back hair
                g.fillRoundedRect(-18, hy + 3, 36, 45, 10);
                // Wave shapes
                g.fillEllipse(-24, hy + 25, 8, 12);
                g.fillEllipse(-22, hy + 45, 7, 10);
                g.fillEllipse(24, hy + 25, 8, 12);
                g.fillEllipse(22, hy + 45, 7, 10);
                // Highlights
                g.fillStyle(highlight, 0.25);
                g.fillEllipse(-10, hy - 5, 10, 8);
                g.fillStyle(shadow, 0.2);
                g.fillEllipse(10, hy + 7, 12, 10);
                break;

            case 'hooded':
                const hoodCol = cfg.outfitTop || 0x1a0030;
                const hoodDark = Phaser.Display.Color.ValueToColor(hoodCol).darken(30).color;
                // Hood shape - using simple shapes
                g.fillStyle(hoodCol, 1);
                // Main hood body
                g.fillEllipse(0, -90, 32, 30);
                g.fillRoundedRect(-30, -95, 60, 45, 12);
                // Hood peak
                g.fillTriangle(0, -118, -20, -92, 20, -92);
                // Hood inner shadow
                g.fillStyle(0x000000, 0.5);
                g.fillEllipse(0, -75, 18, 16);
                // Hood folds
                g.fillStyle(hoodDark, 0.4);
                g.fillTriangle(-22, -70, -18, -95, -14, -70);
                g.fillTriangle(22, -70, 18, -95, 14, -70);
                break;

            case 'bald':
                // Shiny head highlights
                g.fillStyle(0xffffff, 0.2);
                g.fillEllipse(-8, -92, 10, 8);
                g.fillStyle(0xffffff, 0.1);
                g.fillEllipse(6, -88, 6, 5);
                break;

            case 'ponytail':
                // Top hair
                g.fillStyle(hairCol, 1);
                g.fillEllipse(0, -95, 22, 14);
                // Ponytail - using ellipses instead of bezier
                g.fillEllipse(0, -80, 8, 12);
                g.fillEllipse(0, -65, 7, 10);
                g.fillEllipse(0, -50, 6, 10);
                g.fillEllipse(0, -38, 5, 8);
                // Hair tie
                g.fillStyle(cfg.accentColor || 0xff0066, 1);
                g.fillEllipse(0, -88, 10, 4);
                // Highlight
                g.fillStyle(highlight, 0.3);
                g.fillEllipse(-6, -98, 8, 5);
                break;

            case 'long_wavy':
                g.fillStyle(hairCol, 1);
                // Top volume
                g.fillEllipse(0, -95, 24, 16);
                // Wavy sides - using overlapping ellipses for wave effect
                for (let side = -1; side <= 1; side += 2) {
                    const baseX = side * 22;
                    g.fillEllipse(baseX, -82, 8, 10);
                    g.fillEllipse(baseX + side * 2, -68, 9, 12);
                    g.fillEllipse(baseX, -52, 8, 12);
                    g.fillEllipse(baseX + side * 2, -38, 7, 10);
                }
                // Back hair
                g.fillRoundedRect(-16, -92, 32, 50, 8);
                // Highlights
                g.fillStyle(highlight, 0.25);
                g.fillEllipse(-8, -98, 10, 7);
                break;

            default:
                // Default short hair
                g.fillStyle(hairCol, 1);
                g.fillEllipse(0, -95, 22, 14);
                g.fillStyle(highlight, 0.2);
                g.fillEllipse(-6, -98, 8, 5);
        }
    }

    drawHairStyle(g, hairCol, cfg, outlineCol, outlineW) {
        // Legacy method - now uses the new human hair system
        // This method kept for backwards compatibility
        return;
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
        const dir = this.facing; // 1 = right, -1 = left

        switch (type) {
            case 'punch':
                // === ARM ANIMATION: Punch forward ===
                this.scene.tweens.add({
                    targets: this.frontArmContainer,
                    rotation: -0.8 * dir, // Extend arm forward
                    x: 38 + (20 * dir), // Move arm forward
                    duration: duration / 3,
                    yoyo: true,
                    ease: 'Power2.out',
                    onComplete: () => {
                        this.frontArmContainer.rotation = 0;
                        this.frontArmContainer.x = 38;
                    }
                });
                // Secondary arm pulls back
                this.scene.tweens.add({
                    targets: this.backArmContainer,
                    rotation: 0.3 * dir,
                    duration: duration / 3,
                    yoyo: true
                });
                // Fist glow
                this.scene.tweens.add({
                    targets: this.fistGlow,
                    alpha: 0.8,
                    scale: 1.5,
                    duration: duration / 4,
                    yoyo: true,
                    repeat: 1
                });
                // Upper body lean into punch
                this.scene.tweens.add({
                    targets: this.bodyGfx,
                    rotation: -0.08 * dir,
                    duration: duration / 3,
                    yoyo: true
                });
                this.createAttackTrail('punch', duration);
                break;

            case 'kick':
                // === LEG ANIMATION: Kick forward ===
                this.scene.tweens.add({
                    targets: this.frontLegContainer,
                    rotation: -1.2 * dir, // Swing leg forward
                    x: -12 + (25 * dir), // Extend outward
                    y: -10, // Raise leg
                    duration: duration / 3,
                    yoyo: true,
                    ease: 'Power3.out',
                    onComplete: () => {
                        this.frontLegContainer.rotation = 0;
                        this.frontLegContainer.x = -12;
                        this.frontLegContainer.y = 8;
                    }
                });
                // Back leg plants firmly
                this.scene.tweens.add({
                    targets: this.backLegContainer,
                    rotation: 0.15 * dir,
                    duration: duration / 3,
                    yoyo: true
                });
                // Foot glow
                this.scene.tweens.add({
                    targets: this.footGlow,
                    alpha: 0.8,
                    scale: 1.5,
                    duration: duration / 4,
                    yoyo: true,
                    repeat: 1
                });
                // Slight body rotation into kick
                this.scene.tweens.add({
                    targets: this.bodyGfx,
                    rotation: -0.1 * dir,
                    duration: duration / 3,
                    yoyo: true
                });
                this.createAttackTrail('kick', duration);
                break;

            case 'uppercut':
                // === ARM ANIMATION: Rising uppercut ===
                this.scene.tweens.add({
                    targets: this.frontArmContainer,
                    rotation: -1.4 * dir, // Arm swings up
                    y: -70, // Raise arm high
                    x: 38 + (15 * dir),
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power2.out',
                    onComplete: () => {
                        this.frontArmContainer.rotation = 0;
                        this.frontArmContainer.y = -44;
                        this.frontArmContainer.x = 38;
                    }
                });
                // Body rises with uppercut
                this.scene.tweens.add({
                    targets: this.container,
                    y: this.container.y - 25,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Sine.out'
                });
                // Legs crouch then extend
                this.scene.tweens.add({
                    targets: [this.frontLegContainer, this.backLegContainer],
                    y: { from: 15, to: 8 },
                    duration: duration / 3,
                    yoyo: true
                });
                // Fist glow
                this.scene.tweens.add({
                    targets: this.fistGlow,
                    alpha: 1,
                    scale: 2,
                    y: -60,
                    duration: duration / 3,
                    yoyo: true
                });
                this.createAttackTrail('uppercut', duration);
                break;

            case 'sweep':
                // === LEG ANIMATION: Low sweeping kick ===
                this.scene.tweens.add({
                    targets: this.frontLegContainer,
                    rotation: -1.5 * dir, // Wide sweep
                    x: -12 + (40 * dir), // Extend far
                    y: 25, // Drop low
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power2.out',
                    onComplete: () => {
                        this.frontLegContainer.rotation = 0;
                        this.frontLegContainer.x = -12;
                        this.frontLegContainer.y = 8;
                    }
                });
                // Crouch body
                this.scene.tweens.add({
                    targets: this.container,
                    y: this.container.y + 30,
                    duration: duration / 3,
                    yoyo: true,
                    ease: 'Power2'
                });
                // Arms balance
                this.scene.tweens.add({
                    targets: this.frontArmContainer,
                    rotation: 0.5 * dir,
                    duration: duration / 3,
                    yoyo: true
                });
                this.scene.tweens.add({
                    targets: this.backArmContainer,
                    rotation: -0.3 * dir,
                    duration: duration / 3,
                    yoyo: true
                });
                // Foot glow
                this.scene.tweens.add({
                    targets: this.footGlow,
                    alpha: 0.9,
                    scale: 2,
                    x: 40 * dir,
                    duration: duration / 3,
                    yoyo: true
                });
                this.createAttackTrail('sweep', duration);
                break;

            case 'special':
                // === FULL BODY ANIMATION: Special attack ===
                // Both arms thrust forward
                this.scene.tweens.add({
                    targets: this.frontArmContainer,
                    rotation: -1.0 * dir,
                    x: 38 + (30 * dir),
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power3.out',
                    onComplete: () => {
                        this.frontArmContainer.rotation = 0;
                        this.frontArmContainer.x = 38;
                    }
                });
                this.scene.tweens.add({
                    targets: this.backArmContainer,
                    rotation: -0.6 * dir,
                    x: -38 + (20 * dir),
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power3.out',
                    onComplete: () => {
                        this.backArmContainer.rotation = 0;
                        this.backArmContainer.x = -38;
                    }
                });
                // Kick motion
                this.scene.tweens.add({
                    targets: this.frontLegContainer,
                    rotation: -0.8 * dir,
                    x: -12 + (15 * dir),
                    duration: duration / 2,
                    yoyo: true,
                    onComplete: () => {
                        this.frontLegContainer.rotation = 0;
                        this.frontLegContainer.x = -12;
                    }
                });
                // Body energy burst
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
                // Head recoil
                this.scene.tweens.add({
                    targets: this.headContainer,
                    y: -82,
                    duration: duration / 4,
                    yoyo: true
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
        const recoilDir = this.facing; // Recoil opposite to facing

        // Body flash
        this.scene.tweens.add({
            targets: this.bodyGfx,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 2
        });

        // Glow flash
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.9,
            scale: 1.8,
            duration: 80,
            yoyo: true
        });

        // === HEAD SNAP BACK on hit ===
        const headRecoil = Math.min(damage * 0.3, 8);
        this.scene.tweens.add({
            targets: this.headContainer,
            x: -headRecoil * recoilDir,
            rotation: 0.15 * recoilDir,
            duration: 60,
            yoyo: true,
            ease: 'Power2.out',
            onComplete: () => {
                this.headContainer.x = 0;
                this.headContainer.rotation = 0;
            }
        });

        // === ARMS FLAIL on hit ===
        this.scene.tweens.add({
            targets: this.frontArmContainer,
            rotation: 0.4 * recoilDir,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                this.frontArmContainer.rotation = 0;
            }
        });
        this.scene.tweens.add({
            targets: this.backArmContainer,
            rotation: 0.3 * recoilDir,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                this.backArmContainer.rotation = 0;
            }
        });

        // === LEGS BUCKLE on heavy hits ===
        if (damage >= 10) {
            this.scene.tweens.add({
                targets: [this.frontLegContainer, this.backLegContainer],
                y: 12,
                duration: 60,
                yoyo: true,
                onComplete: () => {
                    this.frontLegContainer.y = 8;
                    this.backLegContainer.y = 8;
                }
            });
        }

        // === TORSO TWIST on hit ===
        this.scene.tweens.add({
            targets: this.bodyGfx,
            rotation: 0.1 * recoilDir,
            duration: 60,
            yoyo: true,
            onComplete: () => {
                this.bodyGfx.rotation = 0;
            }
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

        // Deactivate rage mode on KO
        if (this.rageMode) {
            this.deactivateRageMode();
        }

        this.scene.tweens.add({
            targets: this.container,
            rotation: (Math.PI / 2) * -this.facing,
            y: this.groundY + 35,
            duration: 500,
            ease: 'Bounce.out'
        });
    }

    // === RAGE MODE ===
    activateRageMode() {
        if (this.rageMode) return;

        this.rageMode = true;

        // Create rage aura effect
        this.rageAura = this.scene.add.graphics();
        this.container.add(this.rageAura);
        this.container.sendToBack(this.rageAura);

        // Pulsing red aura
        this.updateRageAura();

        // Flash the fighter red
        this.scene.tweens.add({
            targets: this.bodyGfx,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 5
        });

        // Screen effect
        this.scene.cameras.main.flash(200, 255, 0, 0, false, null, this, 0.3);

        // Enhance the glow
        if (this.glow) {
            this.scene.tweens.killTweensOf(this.glow);
            this.glow.setFillStyle(0xff0000, 0.4);
            this.scene.tweens.add({
                targets: this.glow,
                alpha: { from: 0.3, to: 0.6 },
                scale: { from: 1, to: 1.4 },
                duration: 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }

        // Increase power
        this.powerMod = this.config.stats.power / 100 * this.rageDamageBonus;

        // Create rage particles continuously
        this.rageParticleEvent = this.scene.time.addEvent({
            delay: 100,
            callback: this.createRageParticle,
            callbackScope: this,
            loop: true
        });

        // Dramatic camera shake
        this.scene.cameras.main.shake(300, 0.01);
    }

    updateRageAura() {
        if (!this.rageAura || !this.rageMode) return;

        this.rageAura.clear();
        this.rageAura.fillStyle(0xff0000, 0.15);
        this.rageAura.fillCircle(0, -40, 80);
        this.rageAura.fillStyle(0xff6600, 0.1);
        this.rageAura.fillCircle(0, -40, 100);
    }

    createRageParticle() {
        if (!this.rageMode) return;

        const particle = this.scene.add.circle(
            this.container.x + Phaser.Math.Between(-30, 30),
            this.container.y + Phaser.Math.Between(-20, 60),
            Phaser.Math.Between(3, 8),
            Phaser.Math.RND.pick([0xff0000, 0xff3300, 0xff6600]),
            0.8
        );
        particle.setDepth(DEPTH.EFFECTS_FRONT);

        this.scene.tweens.add({
            targets: particle,
            y: particle.y - Phaser.Math.Between(50, 100),
            alpha: 0,
            scale: 0,
            duration: Phaser.Math.Between(300, 600),
            ease: 'Power2.out',
            onComplete: () => particle.destroy()
        });
    }

    deactivateRageMode() {
        if (!this.rageMode) return;

        this.rageMode = false;

        // Remove rage aura
        if (this.rageAura) {
            this.rageAura.destroy();
            this.rageAura = null;
        }

        // Stop rage particles
        if (this.rageParticleEvent) {
            this.rageParticleEvent.destroy();
            this.rageParticleEvent = null;
        }

        // Reset glow
        if (this.glow) {
            this.scene.tweens.killTweensOf(this.glow);
            this.glow.setFillStyle(this.config.color, 0.15);
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

        // Reset power
        this.powerMod = this.config.stats.power / 100;
    }

    // === VICTORY POSE ===
    doVictoryPose() {
        this.state = 'victory';
        this.canAct = false;
        this.velocityX = 0;

        // Deactivate rage mode for victory
        if (this.rageMode) {
            this.deactivateRageMode();
        }

        // Reset rotation if any
        this.container.rotation = 0;

        const poseType = Phaser.Math.RND.pick(['fistPump', 'crossArms', 'celebrate']);

        switch (poseType) {
            case 'fistPump':
                this.doFistPumpPose();
                break;
            case 'crossArms':
                this.doCrossArmsPose();
                break;
            case 'celebrate':
                this.doCelebratePose();
                break;
        }

        // Victory glow
        this.scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.3, to: 0.6 },
            scale: { from: 1, to: 1.5 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    doFistPumpPose() {
        // Jump up and pump fist
        this.scene.tweens.add({
            targets: this.container,
            y: this.container.y - 50,
            duration: 300,
            yoyo: true,
            ease: 'Power2.out',
            repeat: 2,
            repeatDelay: 200
        });

        // Fist glow effect
        this.scene.tweens.add({
            targets: this.fistGlow,
            alpha: { from: 0, to: 1 },
            scale: { from: 1, to: 2 },
            duration: 300,
            yoyo: true,
            repeat: 2,
            repeatDelay: 200
        });

        // Create energy bursts
        this.scene.time.addEvent({
            delay: 500,
            callback: () => {
                for (let i = 0; i < 8; i++) {
                    const burst = this.scene.add.circle(
                        this.container.x,
                        this.container.y - 60,
                        5,
                        this.config.accentColor,
                        1
                    );
                    burst.setDepth(DEPTH.EFFECTS_FRONT);

                    const angle = (i / 8) * Math.PI * 2;
                    this.scene.tweens.add({
                        targets: burst,
                        x: burst.x + Math.cos(angle) * 60,
                        y: burst.y + Math.sin(angle) * 60,
                        alpha: 0,
                        scale: 2,
                        duration: 400,
                        onComplete: () => burst.destroy()
                    });
                }
            },
            repeat: 2
        });
    }

    doCrossArmsPose() {
        // Stand tall pose
        this.scene.tweens.add({
            targets: this.container,
            scaleY: 1.05,
            duration: 400,
            ease: 'Power2.out'
        });

        // Dramatic aura pulse
        const auraRing = this.scene.add.circle(
            this.container.x,
            this.container.y - 40,
            10,
            this.config.color,
            0.8
        );
        auraRing.setDepth(DEPTH.EFFECTS_FRONT - 1);

        this.scene.tweens.add({
            targets: auraRing,
            radius: 100,
            alpha: 0,
            duration: 800,
            repeat: -1,
            repeatDelay: 400
        });
    }

    doCelebratePose() {
        // Spin celebration
        this.scene.tweens.add({
            targets: this.container,
            angle: { from: 0, to: 360 },
            duration: 600,
            ease: 'Power2.out',
            onComplete: () => {
                // End pose
                this.scene.tweens.add({
                    targets: this.container,
                    y: this.container.y - 30,
                    scaleY: 1.1,
                    duration: 300,
                    yoyo: true
                });
            }
        });

        // Celebration sparkles
        this.scene.time.addEvent({
            delay: 200,
            callback: () => {
                for (let i = 0; i < 5; i++) {
                    const sparkle = this.scene.add.star(
                        this.container.x + Phaser.Math.Between(-40, 40),
                        this.container.y + Phaser.Math.Between(-80, 20),
                        5, 3, 8,
                        Phaser.Math.RND.pick([0xffffff, 0xffff00, this.config.accentColor]),
                        1
                    );
                    sparkle.setDepth(DEPTH.EFFECTS_FRONT);

                    this.scene.tweens.add({
                        targets: sparkle,
                        y: sparkle.y - 40,
                        alpha: 0,
                        rotation: Math.PI,
                        scale: 0,
                        duration: 600,
                        onComplete: () => sparkle.destroy()
                    });
                }
            },
            repeat: 5
        });
    }

    reset(x) {
        this.container.x = x;
        this.container.y = this.groundY;
        this.container.rotation = 0;
        this.container.scaleY = 1;
        this.container.scaleX = this.isPlayer1 ? 1 : -1;
        this.health = this.maxHealth;
        this.specialMeter = 0;
        this.state = 'idle';
        this.canAct = true;
        this.isBlocking = false;
        this.isGrounded = true;
        this.velocityX = 0;
        this.velocityY = 0;
        this.attackHitbox = null;

        // Reset rage mode
        if (this.rageMode) {
            this.deactivateRageMode();
        }

        // Reset facing
        this.facing = this.isPlayer1 ? 1 : -1;
        this.updateFacing();
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
