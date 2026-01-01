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
        const color = this.config.color;
        const accent = this.config.accentColor;

        // Glow effect behind fighter
        this.glow = this.scene.add.circle(0, -25, 50, color, 0.15);
        this.container.add(this.glow);

        // Body (torso) with gradient effect
        this.body = this.scene.add.graphics();
        this.body.fillStyle(color, 1);
        this.body.fillRoundedRect(-20, -50, 40, 50, 5);
        // Body highlight
        this.body.fillStyle(0xffffff, 0.2);
        this.body.fillRoundedRect(-15, -48, 15, 20, 3);

        // Head with better shading
        this.head = this.scene.add.graphics();
        this.head.fillStyle(color, 1);
        this.head.fillCircle(0, -65, 18);
        // Head highlight
        this.head.fillStyle(0xffffff, 0.25);
        this.head.fillCircle(-5, -70, 8);
        // Eyes with glow
        const eyeX = this.isPlayer1 ? 5 : -5;
        this.head.fillStyle(0xffffff, 1);
        this.head.fillCircle(eyeX - 3, -68, 5);
        this.head.fillCircle(eyeX + 5, -68, 5);
        this.head.fillStyle(0x000000, 1);
        this.head.fillCircle(eyeX - 2, -68, 3);
        this.head.fillCircle(eyeX + 6, -68, 3);
        // Eye glow
        this.head.fillStyle(accent, 0.8);
        this.head.fillCircle(eyeX - 1, -69, 1);
        this.head.fillCircle(eyeX + 7, -69, 1);

        // Arms with muscle detail
        this.leftArm = this.scene.add.graphics();
        this.leftArm.fillStyle(color, 1);
        this.leftArm.fillRoundedRect(-35, -45, 15, 40, 4);
        this.leftArm.fillStyle(0xffffff, 0.15);
        this.leftArm.fillRoundedRect(-33, -43, 5, 15, 2);

        this.rightArm = this.scene.add.graphics();
        this.rightArm.fillStyle(color, 1);
        this.rightArm.fillRoundedRect(20, -45, 15, 40, 4);
        this.rightArm.fillStyle(0xffffff, 0.15);
        this.rightArm.fillRoundedRect(22, -43, 5, 15, 2);

        // Fist glow (for punches)
        this.fistGlow = this.scene.add.circle(27, -5, 10, accent, 0);
        this.container.add(this.fistGlow);

        // Legs with better styling
        this.leftLeg = this.scene.add.graphics();
        this.leftLeg.fillStyle(accent, 1);
        this.leftLeg.fillRoundedRect(-18, 0, 14, 45, 4);
        this.leftLeg.fillStyle(0x000000, 0.2);
        this.leftLeg.fillRoundedRect(-16, 35, 10, 10, 2);

        this.rightLeg = this.scene.add.graphics();
        this.rightLeg.fillStyle(accent, 1);
        this.rightLeg.fillRoundedRect(4, 0, 14, 45, 4);
        this.rightLeg.fillStyle(0x000000, 0.2);
        this.rightLeg.fillRoundedRect(6, 35, 10, 10, 2);

        // Foot glow (for kicks)
        this.footGlow = this.scene.add.circle(11, 45, 12, accent, 0);
        this.container.add(this.footGlow);

        // Add all parts to container
        this.container.add([this.leftLeg, this.rightLeg, this.body, this.leftArm, this.rightArm, this.head]);

        // Fighter name label with glow
        this.nameLabel = this.scene.add.text(0, -100, this.config.name, {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.container.add(this.nameLabel);

        // Idle glow pulse
        this.scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.15, to: 0.25 },
            scale: { from: 1, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
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
