/**
 * Fighter - The main fighter entity with all combat mechanics
 */

import Phaser from 'phaser';
import { FIGHT_CONFIG, FIGHTERS, DEPTH } from '../config/fightConfig.js';

export default class Fighter {
    constructor(scene, x, y, fighterId, isPlayer1 = true) {
        this.scene = scene;
        this.fighterId = fighterId;
        this.config = FIGHTERS[fighterId];
        this.isPlayer1 = isPlayer1;
        this.facing = isPlayer1 ? 1 : -1; // 1 = right, -1 = left

        // Stats
        this.maxHealth = FIGHT_CONFIG.fighter.health;
        this.health = this.maxHealth;
        this.specialMeter = 0;
        this.maxSpecialMeter = 100;

        // State
        this.state = 'idle'; // idle, walking, jumping, attacking, hit, blocking, ko
        this.isGrounded = true;
        this.canAct = true;
        this.isBlocking = false;
        this.comboCount = 0;
        this.lastHitTime = 0;

        // Create fighter container
        this.container = scene.add.container(x, y);
        this.container.setDepth(DEPTH.FIGHTERS);

        // Create fighter body (graphics-based for now)
        this.createBody();

        // Physics body (manual, not Phaser physics)
        this.velocityX = 0;
        this.velocityY = 0;
        this.groundY = y;

        // Hitbox for attacks
        this.attackHitbox = null;
        this.hurtbox = { x: x, y: y, width: 50, height: 100 };

        // Speed modifier based on fighter stats
        this.speedMod = this.config.stats.speed / 100;
        this.powerMod = this.config.stats.power / 100;
        this.defenseMod = this.config.stats.defense / 100;
    }

    createBody() {
        const cfg = this.config;
        const skin = cfg.skinTone;
        const skinShadow = cfg.skinShadow;
        const skinHighlight = cfg.skinHighlight;
        const isFemale = cfg.gender === 'female';
        const isMuscular = cfg.bodyType === 'muscular';
        const isSlim = cfg.bodyType === 'slim';

        // Subtle power glow behind fighter
        this.glow = this.scene.add.circle(0, -35, 55, cfg.color, 0.1);
        this.container.add(this.glow);

        // Ground shadow
        this.shadow = this.scene.add.ellipse(0, 45, 50, 15, 0x000000, 0.3);
        this.container.add(this.shadow);

        // === LEGS ===
        this.leftLeg = this.scene.add.graphics();
        this.rightLeg = this.scene.add.graphics();
        this.drawLeg(this.leftLeg, -12, isFemale, isSlim, isMuscular);
        this.drawLeg(this.rightLeg, 2, isFemale, isSlim, isMuscular);

        // === TORSO ===
        this.body = this.scene.add.graphics();
        this.drawTorso(isFemale, isSlim, isMuscular);

        // === ARMS ===
        this.leftArm = this.scene.add.graphics();
        this.rightArm = this.scene.add.graphics();
        this.drawArm(this.leftArm, -28, isFemale, isSlim, isMuscular);
        this.drawArm(this.rightArm, 18, isFemale, isSlim, isMuscular);

        // Fist/foot glow for attacks
        this.fistGlow = this.scene.add.circle(28, -10, 12, cfg.accentColor, 0);
        this.footGlow = this.scene.add.circle(10, 42, 14, cfg.accentColor, 0);
        this.container.add(this.fistGlow);
        this.container.add(this.footGlow);

        // === HEAD ===
        this.head = this.scene.add.graphics();
        this.drawHead(isFemale);

        // === HAIR ===
        this.hair = this.scene.add.graphics();
        this.drawHair();

        // Add all parts to container in correct order
        this.container.add([this.leftLeg, this.rightLeg, this.body, this.leftArm, this.rightArm, this.head, this.hair]);

        // Fighter name label
        this.nameLabel = this.scene.add.text(0, -105, cfg.name, {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.container.add(this.nameLabel);

        // Subtle idle breathing animation
        this.scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.1, to: 0.2 },
            scale: { from: 1, to: 1.05 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    drawLeg(graphics, xOffset, isFemale, isSlim, isMuscular) {
        const cfg = this.config;
        const legWidth = isMuscular ? 14 : (isSlim ? 10 : 12);
        const thighWidth = isMuscular ? 16 : (isFemale ? 13 : 14);

        // Shorts/pants
        graphics.fillStyle(cfg.outfitBottom, 1);
        graphics.fillRoundedRect(xOffset - 2, -2, thighWidth + 2, 22, 3);

        // Pants shading
        graphics.fillStyle(0x000000, 0.15);
        graphics.fillRoundedRect(xOffset + thighWidth - 4, 0, 4, 18, 2);

        // Pants highlight
        graphics.fillStyle(0xffffff, 0.1);
        graphics.fillRoundedRect(xOffset, 0, 4, 15, 2);

        // Knee/shin - skin showing or pants
        graphics.fillStyle(cfg.skinTone, 1);
        graphics.fillRoundedRect(xOffset, 18, legWidth, 18, 3);

        // Skin shading on leg
        graphics.fillStyle(cfg.skinShadow, 1);
        graphics.fillRoundedRect(xOffset + legWidth - 4, 19, 4, 15, 2);

        // Skin highlight
        graphics.fillStyle(cfg.skinHighlight, 0.4);
        graphics.fillRoundedRect(xOffset + 1, 20, 3, 10, 1);

        // Calf muscle definition
        if (isMuscular) {
            graphics.fillStyle(cfg.skinShadow, 0.3);
            graphics.fillEllipse(xOffset + legWidth / 2, 25, legWidth - 2, 8);
        }

        // Boot
        graphics.fillStyle(cfg.bootColor, 1);
        graphics.fillRoundedRect(xOffset - 1, 34, legWidth + 2, 12, 3);

        // Boot sole
        graphics.fillStyle(0x111111, 1);
        graphics.fillRect(xOffset - 1, 43, legWidth + 2, 3);

        // Boot highlight
        graphics.fillStyle(0xffffff, 0.15);
        graphics.fillRoundedRect(xOffset, 35, 4, 8, 2);

        // Boot strap/detail
        graphics.lineStyle(1, 0x000000, 0.3);
        graphics.lineBetween(xOffset, 38, xOffset + legWidth, 38);
    }

    drawTorso(isFemale, isSlim, isMuscular) {
        const cfg = this.config;
        const torsoWidth = isMuscular ? 44 : (isSlim ? 34 : 38);
        const torsoHeight = isFemale ? 42 : 48;
        const waistNarrow = isFemale ? 6 : (isMuscular ? 2 : 4);

        // Tank top / shirt
        this.body.fillStyle(cfg.outfitTop, 1);

        // Draw torso shape (narrower at waist)
        this.body.beginPath();
        this.body.moveTo(-torsoWidth / 2 + waistNarrow, 0);
        this.body.lineTo(-torsoWidth / 2, -torsoHeight + 10);
        this.body.quadraticCurveTo(-torsoWidth / 2 - 2, -torsoHeight, -torsoWidth / 2 + 8, -torsoHeight);
        this.body.lineTo(torsoWidth / 2 - 8, -torsoHeight);
        this.body.quadraticCurveTo(torsoWidth / 2 + 2, -torsoHeight, torsoWidth / 2, -torsoHeight + 10);
        this.body.lineTo(torsoWidth / 2 - waistNarrow, 0);
        this.body.closePath();
        this.body.fill();

        // Shirt shading (right side darker)
        this.body.fillStyle(0x000000, 0.15);
        this.body.beginPath();
        this.body.moveTo(torsoWidth / 4, -torsoHeight + 10);
        this.body.lineTo(torsoWidth / 2 - 8, -torsoHeight);
        this.body.quadraticCurveTo(torsoWidth / 2 + 2, -torsoHeight, torsoWidth / 2, -torsoHeight + 10);
        this.body.lineTo(torsoWidth / 2 - waistNarrow, 0);
        this.body.lineTo(torsoWidth / 4, 0);
        this.body.closePath();
        this.body.fill();

        // Shirt highlight (left side)
        this.body.fillStyle(0xffffff, 0.12);
        this.body.fillRoundedRect(-torsoWidth / 2 + 3, -torsoHeight + 5, 8, 20, 3);

        // Collar / neckline
        this.body.fillStyle(cfg.skinTone, 1);
        this.body.fillEllipse(0, -torsoHeight + 2, 18, 8);

        // Neck shadow
        this.body.fillStyle(cfg.skinShadow, 0.5);
        this.body.fillEllipse(0, -torsoHeight + 4, 14, 5);

        // Belt
        this.body.fillStyle(0x222222, 1);
        this.body.fillRect(-torsoWidth / 2 + waistNarrow + 2, -3, torsoWidth - waistNarrow * 2 - 4, 5);

        // Belt buckle
        this.body.fillStyle(cfg.accentColor, 0.8);
        this.body.fillRect(-4, -3, 8, 5);

        // Muscle definition for muscular type
        if (isMuscular) {
            this.body.lineStyle(1, 0x000000, 0.15);
            // Pec line
            this.body.lineBetween(0, -torsoHeight + 15, 0, -torsoHeight + 30);
            // Abs
            this.body.lineBetween(-8, -20, 8, -20);
            this.body.lineBetween(-6, -12, 6, -12);
        }
    }

    drawArm(graphics, xOffset, isFemale, isSlim, isMuscular) {
        const cfg = this.config;
        const armWidth = isMuscular ? 14 : (isSlim ? 9 : 11);
        const isLeft = xOffset < 0;

        // Shoulder - visible skin
        graphics.fillStyle(cfg.skinTone, 1);
        graphics.fillCircle(xOffset + armWidth / 2, -42, armWidth / 2 + 2);

        // Upper arm (bicep) - skin
        graphics.fillStyle(cfg.skinTone, 1);
        graphics.fillRoundedRect(xOffset, -44, armWidth, 22, 4);

        // Bicep shading
        graphics.fillStyle(cfg.skinShadow, 0.4);
        if (isLeft) {
            graphics.fillRoundedRect(xOffset, -44, 4, 20, 2);
        } else {
            graphics.fillRoundedRect(xOffset + armWidth - 4, -44, 4, 20, 2);
        }

        // Bicep highlight
        graphics.fillStyle(cfg.skinHighlight, 0.3);
        if (isLeft) {
            graphics.fillRoundedRect(xOffset + armWidth - 4, -42, 3, 15, 2);
        } else {
            graphics.fillRoundedRect(xOffset + 1, -42, 3, 15, 2);
        }

        // Muscle bulge for muscular type
        if (isMuscular) {
            graphics.fillStyle(cfg.skinHighlight, 0.2);
            graphics.fillEllipse(xOffset + armWidth / 2, -35, armWidth - 2, 10);
        }

        // Forearm - skin
        graphics.fillStyle(cfg.skinTone, 1);
        graphics.fillRoundedRect(xOffset + 1, -24, armWidth - 2, 18, 3);

        // Forearm shading
        graphics.fillStyle(cfg.skinShadow, 0.3);
        graphics.fillRoundedRect(xOffset + armWidth - 4, -22, 3, 14, 2);

        // Glove / hand
        graphics.fillStyle(cfg.gloveColor, 1);
        graphics.fillRoundedRect(xOffset, -8, armWidth, 14, 4);

        // Glove highlight
        graphics.fillStyle(0xffffff, 0.15);
        graphics.fillRoundedRect(xOffset + 1, -6, 4, 8, 2);

        // Glove detail - knuckle line
        graphics.lineStyle(1, 0x000000, 0.2);
        graphics.lineBetween(xOffset + 2, 0, xOffset + armWidth - 2, 0);

        // Fist definition
        graphics.fillStyle(cfg.gloveColor, 1);
        graphics.fillCircle(xOffset + armWidth / 2, 4, armWidth / 2 - 1);
    }

    drawHead(isFemale) {
        const cfg = this.config;
        const headWidth = isFemale ? 17 : 18;
        const headHeight = isFemale ? 19 : 20;
        const jawWidth = isFemale ? 14 : 16;

        // Head base - skin tone
        this.head.fillStyle(cfg.skinTone, 1);
        this.head.fillEllipse(0, -65, headWidth, headHeight);

        // Jaw / chin area
        this.head.fillStyle(cfg.skinTone, 1);
        this.head.beginPath();
        this.head.moveTo(-jawWidth / 2, -58);
        this.head.lineTo(-jawWidth / 2 + 2, -50);
        this.head.quadraticCurveTo(0, -46, jawWidth / 2 - 2, -50);
        this.head.lineTo(jawWidth / 2, -58);
        this.head.closePath();
        this.head.fill();

        // Face shadow (right side)
        this.head.fillStyle(cfg.skinShadow, 0.3);
        this.head.fillEllipse(6, -63, 8, 14);

        // Face highlight (left side)
        this.head.fillStyle(cfg.skinHighlight, 0.25);
        this.head.fillEllipse(-6, -70, 7, 8);

        // Cheek blush for female
        if (isFemale) {
            this.head.fillStyle(0xff8888, 0.15);
            this.head.fillCircle(-9, -60, 4);
            this.head.fillCircle(9, -60, 4);
        }

        // Eyes
        const eyeY = -65;
        const eyeSpacing = 6;

        // Eye whites
        this.head.fillStyle(0xffffff, 1);
        this.head.fillEllipse(-eyeSpacing, eyeY, 5, 4);
        this.head.fillEllipse(eyeSpacing, eyeY, 5, 4);

        // Iris
        this.head.fillStyle(cfg.eyeColor, 1);
        const lookDir = this.isPlayer1 ? 1 : -1;
        this.head.fillCircle(-eyeSpacing + lookDir, eyeY, 3);
        this.head.fillCircle(eyeSpacing + lookDir, eyeY, 3);

        // Pupils
        this.head.fillStyle(0x000000, 1);
        this.head.fillCircle(-eyeSpacing + lookDir, eyeY, 1.5);
        this.head.fillCircle(eyeSpacing + lookDir, eyeY, 1.5);

        // Eye shine
        this.head.fillStyle(0xffffff, 0.7);
        this.head.fillCircle(-eyeSpacing + lookDir - 1, eyeY - 1, 1);
        this.head.fillCircle(eyeSpacing + lookDir - 1, eyeY - 1, 1);

        // Eyebrows
        this.head.fillStyle(cfg.hairColor, 0.8);
        const browAngle = 0.1;
        this.head.fillRect(-eyeSpacing - 4, eyeY - 6, 8, 2);
        this.head.fillRect(eyeSpacing - 4, eyeY - 6, 8, 2);

        // Nose
        this.head.fillStyle(cfg.skinShadow, 0.4);
        this.head.fillTriangle(0, -62, -2, -56, 2, -56);
        // Nose highlight
        this.head.fillStyle(cfg.skinHighlight, 0.3);
        this.head.fillCircle(-1, -59, 1);

        // Mouth
        this.head.fillStyle(0x994444, 0.8);
        if (isFemale) {
            // Fuller lips for female
            this.head.fillEllipse(0, -52, 5, 2);
            this.head.fillStyle(0xcc6666, 0.5);
            this.head.fillEllipse(0, -51, 4, 1.5);
        } else {
            // Simple mouth line for male
            this.head.lineStyle(2, 0x663333, 0.6);
            this.head.lineBetween(-4, -52, 4, -52);
        }

        // Ear (visible side)
        this.head.fillStyle(cfg.skinTone, 1);
        const earX = this.isPlayer1 ? -headWidth + 2 : headWidth - 2;
        this.head.fillEllipse(earX, -62, 4, 6);
        this.head.fillStyle(cfg.skinShadow, 0.4);
        this.head.fillEllipse(earX, -62, 2, 4);
    }

    drawHair() {
        const cfg = this.config;
        const hairColor = cfg.hairColor;
        const hairHighlight = Phaser.Display.Color.ValueToColor(hairColor);
        const highlightColor = Phaser.Display.Color.GetColor(
            Math.min(255, hairHighlight.r + 60),
            Math.min(255, hairHighlight.g + 60),
            Math.min(255, hairHighlight.b + 60)
        );

        switch (cfg.hairStyle) {
            case 'short_spiky':
                // Base hair
                this.hair.fillStyle(hairColor, 1);
                this.hair.fillEllipse(0, -78, 18, 10);
                // Spikes
                for (let i = -12; i <= 12; i += 6) {
                    this.hair.fillTriangle(i, -82, i - 3, -75, i + 3, -75);
                }
                // Highlight
                this.hair.fillStyle(highlightColor, 0.3);
                this.hair.fillEllipse(-4, -80, 6, 4);
                break;

            case 'long_flowing':
                // Main hair volume
                this.hair.fillStyle(hairColor, 1);
                this.hair.fillEllipse(0, -78, 22, 12);
                // Side hair
                this.hair.fillRoundedRect(-20, -75, 10, 35, 5);
                this.hair.fillRoundedRect(10, -75, 10, 35, 5);
                // Back hair
                this.hair.fillRoundedRect(-15, -70, 30, 25, 8);
                // Hair highlight
                this.hair.fillStyle(highlightColor, 0.25);
                this.hair.fillEllipse(-6, -82, 8, 5);
                this.hair.fillRoundedRect(-18, -70, 5, 20, 3);
                break;

            case 'hooded':
                // Hood
                this.hair.fillStyle(cfg.outfitTop, 1);
                this.hair.beginPath();
                this.hair.moveTo(-22, -50);
                this.hair.quadraticCurveTo(-25, -80, 0, -88);
                this.hair.quadraticCurveTo(25, -80, 22, -50);
                this.hair.lineTo(18, -52);
                this.hair.quadraticCurveTo(0, -45, -18, -52);
                this.hair.closePath();
                this.hair.fill();
                // Hood shadow
                this.hair.fillStyle(0x000000, 0.3);
                this.hair.fillEllipse(0, -70, 15, 8);
                // Hood edge highlight
                this.hair.lineStyle(2, highlightColor, 0.2);
                this.hair.beginPath();
                this.hair.arc(0, -55, 20, -2.8, -0.34);
                this.hair.stroke();
                break;

            case 'bald':
                // Just show scalp with slight shine
                this.hair.fillStyle(cfg.skinHighlight, 0.3);
                this.hair.fillEllipse(-3, -80, 8, 5);
                break;

            case 'ponytail':
                // Base hair
                this.hair.fillStyle(hairColor, 1);
                this.hair.fillEllipse(0, -78, 18, 10);
                // Ponytail
                this.hair.fillRoundedRect(-5, -80, 10, 8, 4);
                this.hair.fillRoundedRect(-4, -72, 8, 35, 4);
                // Hair band
                this.hair.fillStyle(cfg.accentColor, 0.8);
                this.hair.fillRect(-5, -72, 10, 4);
                // Highlight
                this.hair.fillStyle(highlightColor, 0.25);
                this.hair.fillEllipse(-5, -80, 5, 4);
                break;

            case 'long_wavy':
                // Voluminous wavy hair
                this.hair.fillStyle(hairColor, 1);
                this.hair.fillEllipse(0, -78, 24, 14);
                // Waves on sides
                for (let y = -70; y < -35; y += 8) {
                    const wave = Math.sin((y + 70) * 0.2) * 3;
                    this.hair.fillEllipse(-18 + wave, y, 8, 6);
                    this.hair.fillEllipse(18 - wave, y, 8, 6);
                }
                // Back volume
                this.hair.fillRoundedRect(-18, -70, 36, 30, 10);
                // Highlights
                this.hair.fillStyle(highlightColor, 0.2);
                this.hair.fillEllipse(-8, -82, 10, 6);
                this.hair.fillRoundedRect(-16, -65, 6, 20, 3);
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
        this.performAttack('punch', FIGHT_CONFIG.damage.punch, { x: 45, y: -30, width: 40, height: 25 });
    }

    kick() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        this.performAttack('kick', FIGHT_CONFIG.damage.kick, { x: 50, y: -10, width: 50, height: 30 });
    }

    uppercut() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        this.performAttack('uppercut', FIGHT_CONFIG.damage.uppercut, { x: 35, y: -50, width: 35, height: 40 });
    }

    sweep() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit' || !this.isGrounded) return;
        this.performAttack('sweep', FIGHT_CONFIG.damage.sweep, { x: 40, y: 30, width: 60, height: 25 });
    }

    special() {
        if (!this.canAct || this.state === 'attacking' || this.state === 'hit') return;
        if (this.specialMeter < this.maxSpecialMeter) return;

        this.specialMeter = 0;
        this.performAttack('special', this.config.special.damage, { x: 60, y: -25, width: 80, height: 50 });

        // Special effect
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

        // Create hitbox
        this.attackHitbox = {
            x: this.container.x + (hitboxData.x * this.facing),
            y: this.container.y + hitboxData.y,
            width: hitboxData.width,
            height: hitboxData.height,
            damage: Math.floor(damage * this.powerMod),
            type: type,
            active: true
        };

        // Visual feedback
        this.animateAttack(type, duration);

        // Show hitbox (debug visual)
        this.showHitboxVisual(hitboxData, duration);

        // Deactivate hitbox after duration
        this.scene.time.delayedCall(duration, () => {
            this.attackHitbox = null;
        });

        // Recovery
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
                // Fist glow activation
                this.scene.tweens.add({
                    targets: this.fistGlow,
                    alpha: 0.8,
                    scale: 1.5,
                    duration: duration / 4,
                    yoyo: true,
                    repeat: 1
                });
                // Arm extension with trail
                this.scene.tweens.add({
                    targets: this.rightArm,
                    x: 30 * this.facing,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power2'
                });
                // Create punch trail
                this.createAttackTrail('punch', duration);
                break;

            case 'kick':
                // Foot glow activation
                this.scene.tweens.add({
                    targets: this.footGlow,
                    alpha: 0.8,
                    scale: 1.5,
                    duration: duration / 4,
                    yoyo: true,
                    repeat: 1
                });
                this.scene.tweens.add({
                    targets: this.rightLeg,
                    x: 25 * this.facing,
                    rotation: 0.5 * this.facing,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power2'
                });
                // Create kick trail
                this.createAttackTrail('kick', duration);
                break;

            case 'uppercut':
                // Fist glow for uppercut
                this.scene.tweens.add({
                    targets: this.fistGlow,
                    alpha: 1,
                    scale: 2,
                    y: -40,
                    duration: duration / 3,
                    yoyo: true
                });
                this.scene.tweens.add({
                    targets: this.rightArm,
                    y: -30,
                    x: 15 * this.facing,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Back.out'
                });
                this.scene.tweens.add({
                    targets: this.container,
                    y: this.container.y - 20,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Sine.out'
                });
                // Create uppercut trail
                this.createAttackTrail('uppercut', duration);
                break;

            case 'sweep':
                // Foot glow for sweep
                this.scene.tweens.add({
                    targets: this.footGlow,
                    alpha: 0.9,
                    scale: 2,
                    x: 35 * this.facing,
                    duration: duration / 3,
                    yoyo: true
                });
                this.scene.tweens.add({
                    targets: this.container,
                    y: this.container.y + 25,
                    duration: duration / 3,
                    yoyo: true,
                    ease: 'Power2'
                });
                this.scene.tweens.add({
                    targets: this.rightLeg,
                    x: 40 * this.facing,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power3'
                });
                // Create sweep trail
                this.createAttackTrail('sweep', duration);
                break;

            case 'special':
                // Intense glow for special
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
                // Create special trail
                this.createAttackTrail('special', duration);
                break;
        }
    }

    createAttackTrail(type, duration) {
        const accent = this.config.accentColor;
        const color = this.config.color;

        let startX, startY, endX, endY, trailCount;

        switch (type) {
            case 'punch':
                startX = this.container.x + (20 * this.facing);
                startY = this.container.y - 35;
                endX = this.container.x + (55 * this.facing);
                endY = this.container.y - 35;
                trailCount = 5;
                break;
            case 'kick':
                startX = this.container.x + (15 * this.facing);
                startY = this.container.y + 10;
                endX = this.container.x + (60 * this.facing);
                endY = this.container.y;
                trailCount = 6;
                break;
            case 'uppercut':
                startX = this.container.x + (10 * this.facing);
                startY = this.container.y - 20;
                endX = this.container.x + (30 * this.facing);
                endY = this.container.y - 70;
                trailCount = 7;
                break;
            case 'sweep':
                startX = this.container.x;
                startY = this.container.y + 35;
                endX = this.container.x + (70 * this.facing);
                endY = this.container.y + 40;
                trailCount = 8;
                break;
            case 'special':
                startX = this.container.x;
                startY = this.container.y - 30;
                endX = this.container.x + (100 * this.facing);
                endY = this.container.y - 30;
                trailCount = 12;
                break;
            default:
                return;
        }

        // Create trail segments
        for (let i = 0; i < trailCount; i++) {
            const progress = i / trailCount;
            const x = Phaser.Math.Linear(startX, endX, progress);
            const y = Phaser.Math.Linear(startY, endY, progress);
            const size = type === 'special' ? 15 - (i * 0.8) : 10 - (i * 0.6);
            const alpha = 0.8 - (progress * 0.5);

            const trail = this.scene.add.circle(x, y, size, accent, 0);
            trail.setDepth(DEPTH.EFFECTS_FRONT - 1);

            // Animate trail appearing and fading
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

        // Add motion blur line for dramatic effect
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
        const x = this.container.x + (60 * this.facing);
        const y = this.container.y - 25;

        // Burst effect
        for (let i = 0; i < 15; i++) {
            const particle = this.scene.add.circle(
                x + Phaser.Math.Between(-20, 20),
                y + Phaser.Math.Between(-20, 20),
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

        // Screen flash
        this.scene.cameras.main.flash(100,
            (color >> 16) & 0xff,
            (color >> 8) & 0xff,
            color & 0xff,
            false, null, this, 0.3
        );
    }

    // Taking damage
    takeHit(damage, attackType, attackerX) {
        // Check blocking
        const attackFromFront = (attackerX > this.container.x && this.facing === 1) ||
                               (attackerX < this.container.x && this.facing === -1);

        if (this.isBlocking && attackFromFront && this.isGrounded) {
            // Blocked - reduced damage
            const blockedDamage = Math.floor(damage * 0.2 / this.defenseMod);
            this.health -= blockedDamage;
            this.showBlockEffect();
            this.knockback(50, attackerX);
            return { blocked: true, damage: blockedDamage };
        }

        // Take full damage
        const actualDamage = Math.floor(damage / this.defenseMod);
        this.health -= actualDamage;
        this.state = 'hit';
        this.canAct = false;
        this.isBlocking = false;

        // Build opponent's special meter
        this.specialMeter = Math.min(this.maxSpecialMeter, this.specialMeter + actualDamage * 0.3);

        // Hitstun
        this.showHitEffect(actualDamage);
        this.knockback(attackType === 'special' ? 150 : (attackType === 'uppercut' ? 100 : 80), attackerX);

        // Launch on uppercut
        if (attackType === 'uppercut' && this.isGrounded) {
            this.velocityY = -300;
            this.isGrounded = false;
        }

        // Recovery from hit
        const hitRecovery = attackType === 'special' ? 500 : FIGHT_CONFIG.recovery.hit;
        this.scene.time.delayedCall(hitRecovery, () => {
            if (this.health > 0) {
                this.state = 'idle';
                this.canAct = true;
            }
        });

        // Check KO
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
        const hitY = this.container.y - 30;

        // Flash white with glow pulse
        this.scene.tweens.add({
            targets: [this.body, this.head, this.leftArm, this.rightArm],
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 2
        });

        // Glow flash on hit
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.9,
            scale: 1.8,
            duration: 80,
            yoyo: true
        });

        // Impact burst - central explosion
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

        // Star burst effect
        const starPoints = 8;
        for (let i = 0; i < starPoints; i++) {
            const angle = (i / starPoints) * Math.PI * 2;
            const starLine = this.scene.add.graphics();
            starLine.setDepth(DEPTH.EFFECTS_FRONT);
            starLine.lineStyle(3, 0xffff00, 0.9);

            const length = 25 + Math.random() * 15;
            starLine.lineBetween(
                hitX,
                hitY,
                hitX + Math.cos(angle) * length,
                hitY + Math.sin(angle) * length
            );

            this.scene.tweens.add({
                targets: starLine,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 200,
                onComplete: () => starLine.destroy()
            });
        }

        // Damage number with scale pop
        const dmgText = this.scene.add.text(
            hitX,
            this.container.y - 90,
            `-${damage}`,
            {
                fontFamily: 'Arial Black',
                fontSize: '32px',
                color: damage >= 15 ? '#ff0000' : (damage >= 10 ? '#ff6600' : '#ffff00'),
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5).setDepth(DEPTH.EFFECTS_FRONT).setScale(0);

        // Pop in effect
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

        // Enhanced hit particles with varied colors and sizes
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

        // Speed lines for heavy hits
        if (damage >= 12) {
            for (let i = 0; i < 4; i++) {
                const lineY = hitY - 20 + i * 15;
                const speedLine = this.scene.add.graphics();
                speedLine.setDepth(DEPTH.EFFECTS_FRONT - 1);
                speedLine.lineStyle(2, 0xffffff, 0.6);
                speedLine.lineBetween(hitX - 50, lineY, hitX + 50, lineY);

                this.scene.tweens.add({
                    targets: speedLine,
                    alpha: 0,
                    scaleX: 2,
                    duration: 150,
                    delay: i * 20,
                    onComplete: () => speedLine.destroy()
                });
            }
        }
    }

    showBlockEffect() {
        // Block spark
        const blockSpark = this.scene.add.circle(
            this.container.x + (30 * this.facing),
            this.container.y - 30,
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

        // Block text
        const blockText = this.scene.add.text(
            this.container.x,
            this.container.y - 90,
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

        // Fall down animation
        this.scene.tweens.add({
            targets: this.container,
            rotation: (Math.PI / 2) * -this.facing,
            y: this.groundY + 30,
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

        // Reset body parts
        this.rightArm.x = 0;
        this.rightArm.y = 0;
        this.rightLeg.x = 0;
        this.rightLeg.rotation = 0;
    }

    update(delta) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocityY += FIGHT_CONFIG.gravity * (delta / 1000);
        }

        // Apply velocity
        this.container.x += this.velocityX * (delta / 1000);
        this.container.y += this.velocityY * (delta / 1000);

        // Ground collision
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

        // Arena bounds
        const minX = 60;
        const maxX = FIGHT_CONFIG.width - 60;
        this.container.x = Phaser.Math.Clamp(this.container.x, minX, maxX);

        // Friction
        this.velocityX *= 0.9;

        // Update hurtbox
        this.hurtbox.x = this.container.x;
        this.hurtbox.y = this.container.y - 50;

        // Idle animation (breathing)
        if (this.state === 'idle' || this.state === 'blocking') {
            const breathe = Math.sin(this.scene.time.now / 500) * 2;
            this.body.y = breathe;
            this.head.y = breathe * 0.5;
        }
    }

    getHurtbox() {
        return {
            x: this.container.x - 25,
            y: this.container.y - 100,
            width: 50,
            height: 100
        };
    }

    destroy() {
        this.container.destroy();
    }
}
