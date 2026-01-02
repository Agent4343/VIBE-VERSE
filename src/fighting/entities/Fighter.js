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
        const skinLight = cfg.skinHighlight || 0xeac8a0;
        const hairCol = cfg.hairColor || 0x222222;
        const eyeCol = cfg.eyeColor || 0x442200;
        const topCol = cfg.outfitTop || cfg.color || 0xcc0000;
        const bottomCol = cfg.outfitBottom || 0x222222;
        const gloveCol = cfg.gloveColor || cfg.accentColor || 0xff0000;
        const bootCol = cfg.bootColor || 0x111111;
        const isFemale = cfg.gender === 'female';
        const isMuscular = cfg.bodyType === 'muscular';
        const isSlim = cfg.bodyType === 'slim';

        // Scale for bigger, more detailed fighters
        const S = 1.5;

        // Ground shadow
        this.shadow = this.scene.add.ellipse(0, 50 * S, 70 * S, 20 * S, 0x000000, 0.35);
        this.container.add(this.shadow);

        // Subtle aura
        this.glow = this.scene.add.circle(0, -30 * S, 60 * S, cfg.color, 0.12);
        this.container.add(this.glow);

        // Main graphics object for body
        this.bodyGfx = this.scene.add.graphics();
        this.container.add(this.bodyGfx);

        const g = this.bodyGfx;

        // Body dimensions
        const shoulderW = isMuscular ? 28 : (isSlim ? 20 : 24);
        const waistW = isFemale ? 16 : (isMuscular ? 22 : 18);
        const torsoH = 35;
        const legW = isMuscular ? 12 : (isSlim ? 8 : 10);
        const armW = isMuscular ? 10 : (isSlim ? 6 : 8);

        // ============ LEFT LEG ============
        // Shorts
        g.fillStyle(bottomCol, 1);
        g.fillRoundedRect((-waistW/2 - 2) * S, 0, (legW + 4) * S, 18 * S, 3 * S);
        g.fillStyle(0x000000, 0.15);
        g.fillRoundedRect((-waistW/2 + legW - 2) * S, 2 * S, 3 * S, 14 * S, 2 * S);

        // Left thigh skin
        g.fillStyle(skin, 1);
        g.fillRoundedRect((-waistW/2) * S, 16 * S, legW * S, 14 * S, 4 * S);
        g.fillStyle(skinDark, 0.3);
        g.fillRoundedRect((-waistW/2 + legW - 3) * S, 17 * S, 3 * S, 12 * S, 2 * S);

        // Left knee
        g.fillStyle(skin, 1);
        g.fillCircle((-waistW/2 + legW/2) * S, 30 * S, (legW/2 + 1) * S);

        // Left calf
        g.fillStyle(skin, 1);
        g.fillRoundedRect((-waistW/2 + 1) * S, 30 * S, (legW - 2) * S, 16 * S, 3 * S);
        g.fillStyle(skinLight, 0.25);
        g.fillRoundedRect((-waistW/2 + 2) * S, 32 * S, 3 * S, 10 * S, 2 * S);

        // Left boot
        g.fillStyle(bootCol, 1);
        g.fillRoundedRect((-waistW/2 - 1) * S, 44 * S, (legW + 3) * S, 12 * S, 3 * S);
        g.fillStyle(0x000000, 1);
        g.fillRect((-waistW/2 - 1) * S, 53 * S, (legW + 4) * S, 3 * S);
        g.fillStyle(0xffffff, 0.12);
        g.fillRoundedRect((-waistW/2) * S, 45 * S, 3 * S, 7 * S, 2 * S);

        // ============ RIGHT LEG ============
        // Shorts
        g.fillStyle(bottomCol, 1);
        g.fillRoundedRect((waistW/2 - legW - 2) * S, 0, (legW + 4) * S, 18 * S, 3 * S);
        g.fillStyle(0x000000, 0.15);
        g.fillRoundedRect((waistW/2 - 2) * S, 2 * S, 3 * S, 14 * S, 2 * S);

        // Right thigh skin
        g.fillStyle(skin, 1);
        g.fillRoundedRect((waistW/2 - legW) * S, 16 * S, legW * S, 14 * S, 4 * S);
        g.fillStyle(skinDark, 0.3);
        g.fillRoundedRect((waistW/2 - 3) * S, 17 * S, 3 * S, 12 * S, 2 * S);

        // Right knee
        g.fillStyle(skin, 1);
        g.fillCircle((waistW/2 - legW/2) * S, 30 * S, (legW/2 + 1) * S);

        // Right calf
        g.fillStyle(skin, 1);
        g.fillRoundedRect((waistW/2 - legW + 1) * S, 30 * S, (legW - 2) * S, 16 * S, 3 * S);
        g.fillStyle(skinLight, 0.25);
        g.fillRoundedRect((waistW/2 - legW + 2) * S, 32 * S, 3 * S, 10 * S, 2 * S);

        // Right boot
        g.fillStyle(bootCol, 1);
        g.fillRoundedRect((waistW/2 - legW - 2) * S, 44 * S, (legW + 3) * S, 12 * S, 3 * S);
        g.fillStyle(0x000000, 1);
        g.fillRect((waistW/2 - legW - 3) * S, 53 * S, (legW + 4) * S, 3 * S);
        g.fillStyle(0xffffff, 0.12);
        g.fillRoundedRect((waistW/2 - legW - 1) * S, 45 * S, 3 * S, 7 * S, 2 * S);

        // ============ TORSO ============
        // Tank top / shirt
        g.fillStyle(topCol, 1);
        g.beginPath();
        g.moveTo((-waistW/2) * S, 2 * S);
        g.lineTo((-shoulderW/2) * S, -torsoH * S);
        g.lineTo((shoulderW/2) * S, -torsoH * S);
        g.lineTo((waistW/2) * S, 2 * S);
        g.closePath();
        g.fill();

        // Shirt shading
        g.fillStyle(0x000000, 0.18);
        g.beginPath();
        g.moveTo(5 * S, -torsoH * S);
        g.lineTo((shoulderW/2) * S, -torsoH * S);
        g.lineTo((waistW/2) * S, 2 * S);
        g.lineTo(3 * S, 2 * S);
        g.closePath();
        g.fill();

        // Shirt highlight
        g.fillStyle(0xffffff, 0.1);
        g.fillRoundedRect((-shoulderW/2 + 2) * S, (-torsoH + 4) * S, 7 * S, 18 * S, 3 * S);

        // Neck/collar area - skin
        g.fillStyle(skin, 1);
        g.fillEllipse(0, (-torsoH - 2) * S, 12 * S, 8 * S);
        g.fillStyle(skinDark, 0.35);
        g.fillEllipse(0, (-torsoH) * S, 10 * S, 5 * S);

        // Belt
        g.fillStyle(0x1a1a1a, 1);
        g.fillRect((-waistW/2 - 1) * S, -2 * S, (waistW + 2) * S, 5 * S);
        g.fillStyle(cfg.accentColor || 0xffcc00, 0.9);
        g.fillRoundedRect(-4 * S, -1 * S, 8 * S, 4 * S, 1 * S);

        // Muscle definition (if muscular)
        if (isMuscular) {
            g.lineStyle(1, 0x000000, 0.12);
            g.lineBetween(0, (-torsoH + 8) * S, 0, -8 * S);
            g.lineBetween(-6 * S, -18 * S, 6 * S, -18 * S);
            g.lineBetween(-5 * S, -10 * S, 5 * S, -10 * S);
        }

        // ============ LEFT ARM ============
        const armX = -shoulderW/2 - 2;
        // Shoulder
        g.fillStyle(skin, 1);
        g.fillCircle((armX + armW/2) * S, (-torsoH + 4) * S, (armW/2 + 3) * S);

        // Upper arm
        g.fillStyle(skin, 1);
        g.fillRoundedRect(armX * S, (-torsoH + 6) * S, armW * S, 18 * S, 3 * S);
        g.fillStyle(skinDark, 0.3);
        g.fillRoundedRect(armX * S, (-torsoH + 8) * S, 3 * S, 14 * S, 2 * S);
        g.fillStyle(skinLight, 0.2);
        g.fillRoundedRect((armX + armW - 3) * S, (-torsoH + 8) * S, 3 * S, 12 * S, 2 * S);

        // Elbow
        g.fillStyle(skin, 1);
        g.fillCircle((armX + armW/2) * S, (-torsoH + 24) * S, (armW/2) * S);

        // Forearm
        g.fillStyle(skin, 1);
        g.fillRoundedRect((armX + 1) * S, (-torsoH + 24) * S, (armW - 2) * S, 14 * S, 3 * S);

        // Glove
        g.fillStyle(gloveCol, 1);
        g.fillRoundedRect((armX - 1) * S, (-torsoH + 36) * S, (armW + 2) * S, 12 * S, 4 * S);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(armX * S, (-torsoH + 38) * S, 3 * S, 8 * S, 2 * S);
        // Fist
        g.fillStyle(gloveCol, 1);
        g.fillCircle((armX + armW/2) * S, (-torsoH + 46) * S, (armW/2 + 1) * S);

        // ============ RIGHT ARM ============
        const armX2 = shoulderW/2 - armW + 2;
        // Shoulder
        g.fillStyle(skin, 1);
        g.fillCircle((armX2 + armW/2) * S, (-torsoH + 4) * S, (armW/2 + 3) * S);

        // Upper arm
        g.fillStyle(skin, 1);
        g.fillRoundedRect(armX2 * S, (-torsoH + 6) * S, armW * S, 18 * S, 3 * S);
        g.fillStyle(skinDark, 0.3);
        g.fillRoundedRect((armX2 + armW - 3) * S, (-torsoH + 8) * S, 3 * S, 14 * S, 2 * S);
        g.fillStyle(skinLight, 0.2);
        g.fillRoundedRect((armX2 + 1) * S, (-torsoH + 8) * S, 3 * S, 12 * S, 2 * S);

        // Elbow
        g.fillStyle(skin, 1);
        g.fillCircle((armX2 + armW/2) * S, (-torsoH + 24) * S, (armW/2) * S);

        // Forearm
        g.fillStyle(skin, 1);
        g.fillRoundedRect((armX2 + 1) * S, (-torsoH + 24) * S, (armW - 2) * S, 14 * S, 3 * S);

        // Glove
        g.fillStyle(gloveCol, 1);
        g.fillRoundedRect((armX2 - 1) * S, (-torsoH + 36) * S, (armW + 2) * S, 12 * S, 4 * S);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(armX2 * S, (-torsoH + 38) * S, 3 * S, 8 * S, 2 * S);
        // Fist
        g.fillStyle(gloveCol, 1);
        g.fillCircle((armX2 + armW/2) * S, (-torsoH + 46) * S, (armW/2 + 1) * S);

        // ============ HEAD ============
        const headY = -torsoH - 20;
        const headW = isFemale ? 14 : 15;
        const headH = isFemale ? 16 : 17;

        // Head shape
        g.fillStyle(skin, 1);
        g.fillEllipse(0, headY * S, headW * S, headH * S);

        // Jaw
        g.fillStyle(skin, 1);
        if (isFemale) {
            g.beginPath();
            g.moveTo(-10 * S, (headY + 5) * S);
            g.quadraticCurveTo(0, (headY + 16) * S, 10 * S, (headY + 5) * S);
            g.fill();
        } else {
            g.beginPath();
            g.moveTo(-11 * S, (headY + 4) * S);
            g.lineTo(-8 * S, (headY + 14) * S);
            g.lineTo(0, (headY + 16) * S);
            g.lineTo(8 * S, (headY + 14) * S);
            g.lineTo(11 * S, (headY + 4) * S);
            g.fill();
        }

        // Face shading
        g.fillStyle(skinDark, 0.25);
        g.fillEllipse(5 * S, (headY + 1) * S, 8 * S, 12 * S);
        g.fillStyle(skinLight, 0.2);
        g.fillEllipse(-4 * S, (headY - 5) * S, 6 * S, 7 * S);

        // Eyes
        const eyeY = headY + 2;
        const eyeSpacing = 5;

        // Eye whites
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(-eyeSpacing * S, eyeY * S, 5 * S, 4 * S);
        g.fillEllipse(eyeSpacing * S, eyeY * S, 5 * S, 4 * S);

        // Iris
        const lookDir = this.isPlayer1 ? 1 : -1;
        g.fillStyle(eyeCol, 1);
        g.fillCircle((-eyeSpacing + lookDir) * S, eyeY * S, 3 * S);
        g.fillCircle((eyeSpacing + lookDir) * S, eyeY * S, 3 * S);

        // Pupil
        g.fillStyle(0x000000, 1);
        g.fillCircle((-eyeSpacing + lookDir) * S, eyeY * S, 1.5 * S);
        g.fillCircle((eyeSpacing + lookDir) * S, eyeY * S, 1.5 * S);

        // Eye shine
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle((-eyeSpacing + lookDir - 1) * S, (eyeY - 1) * S, 1 * S);
        g.fillCircle((eyeSpacing + lookDir - 1) * S, (eyeY - 1) * S, 1 * S);

        // Eyebrows
        g.fillStyle(hairCol, 0.8);
        g.fillRoundedRect((-eyeSpacing - 4) * S, (eyeY - 5) * S, 8 * S, 2 * S, 1 * S);
        g.fillRoundedRect((eyeSpacing - 4) * S, (eyeY - 5) * S, 8 * S, 2 * S, 1 * S);

        // Nose
        g.fillStyle(skinDark, 0.35);
        g.fillTriangle(0, (eyeY + 2) * S, -2 * S, (eyeY + 7) * S, 2 * S, (eyeY + 7) * S);
        g.fillStyle(skinLight, 0.25);
        g.fillCircle(-0.5 * S, (eyeY + 4) * S, 1 * S);

        // Mouth
        if (isFemale) {
            g.fillStyle(0xcc7777, 0.85);
            g.fillEllipse(0, (eyeY + 11) * S, 5 * S, 2.5 * S);
            g.fillStyle(0xdd9999, 0.5);
            g.fillEllipse(0, (eyeY + 12) * S, 4 * S, 2 * S);
        } else {
            g.lineStyle(2 * S, 0x774444, 0.6);
            g.lineBetween(-3 * S, (eyeY + 11) * S, 3 * S, (eyeY + 11) * S);
        }

        // Ears
        const earX = this.isPlayer1 ? -headW + 1 : headW - 1;
        g.fillStyle(skin, 1);
        g.fillEllipse(earX * S, (headY + 2) * S, 3 * S, 5 * S);
        g.fillStyle(skinDark, 0.4);
        g.fillEllipse(earX * S, (headY + 2) * S, 1.5 * S, 3 * S);

        // ============ HAIR ============
        this.drawHairStyle(g, headY, headW, hairCol, cfg, S, isFemale);

        // Attack glow effects (hidden by default)
        this.fistGlow = this.scene.add.circle(35 * S, 0, 14 * S, cfg.accentColor, 0);
        this.footGlow = this.scene.add.circle(12 * S, 50 * S, 16 * S, cfg.accentColor, 0);
        this.container.add(this.fistGlow);
        this.container.add(this.footGlow);

        // Name label
        this.nameLabel = this.scene.add.text(0, (-torsoH - 50) * S, cfg.name, {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.container.add(this.nameLabel);

        // Store references for animations
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
            alpha: { from: 0.12, to: 0.2 },
            scale: { from: 1, to: 1.08 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    drawHairStyle(g, headY, headW, hairCol, cfg, S, isFemale) {
        const style = cfg.hairStyle || 'short_spiky';

        // Calculate hair highlight
        const hc = Phaser.Display.Color.ValueToColor(hairCol);
        const highlight = Phaser.Display.Color.GetColor(
            Math.min(255, hc.r + 50),
            Math.min(255, hc.g + 50),
            Math.min(255, hc.b + 50)
        );

        switch (style) {
            case 'short_spiky':
                g.fillStyle(hairCol, 1);
                g.fillEllipse(0, (headY - 10) * S, 16 * S, 10 * S);
                // Spikes
                for (let i = -10; i <= 10; i += 5) {
                    g.fillTriangle(
                        i * S, (headY - 18) * S,
                        (i - 3) * S, (headY - 8) * S,
                        (i + 3) * S, (headY - 8) * S
                    );
                }
                g.fillStyle(highlight, 0.25);
                g.fillEllipse(-3 * S, (headY - 14) * S, 6 * S, 4 * S);
                break;

            case 'long_flowing':
                g.fillStyle(hairCol, 1);
                g.fillEllipse(0, (headY - 10) * S, 20 * S, 12 * S);
                g.fillRoundedRect(-18 * S, (headY - 6) * S, 10 * S, 35 * S, 5 * S);
                g.fillRoundedRect(8 * S, (headY - 6) * S, 10 * S, 35 * S, 5 * S);
                g.fillRoundedRect(-14 * S, (headY - 4) * S, 28 * S, 25 * S, 8 * S);
                g.fillStyle(highlight, 0.2);
                g.fillEllipse(-5 * S, (headY - 14) * S, 8 * S, 5 * S);
                break;

            case 'hooded':
                g.fillStyle(cfg.outfitTop || 0x1a0030, 1);
                g.beginPath();
                g.moveTo(-20 * S, (headY + 15) * S);
                g.quadraticCurveTo(-24 * S, (headY - 15) * S, 0, (headY - 28) * S);
                g.quadraticCurveTo(24 * S, (headY - 15) * S, 20 * S, (headY + 15) * S);
                g.lineTo(16 * S, (headY + 10) * S);
                g.quadraticCurveTo(0, (headY + 5) * S, -16 * S, (headY + 10) * S);
                g.closePath();
                g.fill();
                g.fillStyle(0x000000, 0.35);
                g.fillEllipse(0, (headY - 3) * S, 14 * S, 8 * S);
                break;

            case 'bald':
                g.fillStyle(cfg.skinHighlight || 0xe8c090, 0.3);
                g.fillEllipse(-2 * S, (headY - 12) * S, 8 * S, 5 * S);
                break;

            case 'ponytail':
                g.fillStyle(hairCol, 1);
                g.fillEllipse(0, (headY - 10) * S, 16 * S, 10 * S);
                g.fillRoundedRect(-4 * S, (headY - 8) * S, 8 * S, 40 * S, 4 * S);
                g.fillStyle(cfg.accentColor || 0x00aa00, 1);
                g.fillRect(-4 * S, (headY - 4) * S, 8 * S, 4 * S);
                g.fillStyle(highlight, 0.2);
                g.fillEllipse(-4 * S, (headY - 13) * S, 5 * S, 4 * S);
                break;

            case 'long_wavy':
                g.fillStyle(hairCol, 1);
                g.fillEllipse(0, (headY - 10) * S, 22 * S, 14 * S);
                for (let y = headY - 5; y < headY + 30; y += 6) {
                    const wave = Math.sin((y - headY) * 0.2) * 3;
                    g.fillEllipse((-16 + wave) * S, y * S, 8 * S, 5 * S);
                    g.fillEllipse((16 - wave) * S, y * S, 8 * S, 5 * S);
                }
                g.fillRoundedRect(-18 * S, (headY - 4) * S, 36 * S, 30 * S, 12 * S);
                g.fillStyle(highlight, 0.2);
                g.fillEllipse(-6 * S, (headY - 16) * S, 12 * S, 7 * S);
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
