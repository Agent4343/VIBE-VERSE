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

        // Body (torso)
        this.body = this.scene.add.graphics();
        this.body.fillStyle(color, 1);
        this.body.fillRoundedRect(-20, -50, 40, 50, 5);

        // Head
        this.head = this.scene.add.graphics();
        this.head.fillStyle(color, 1);
        this.head.fillCircle(0, -65, 18);
        // Eyes
        const eyeX = this.isPlayer1 ? 5 : -5;
        this.head.fillStyle(0xffffff, 1);
        this.head.fillCircle(eyeX - 3, -68, 4);
        this.head.fillCircle(eyeX + 5, -68, 4);
        this.head.fillStyle(0x000000, 1);
        this.head.fillCircle(eyeX - 1, -68, 2);
        this.head.fillCircle(eyeX + 7, -68, 2);

        // Arms
        this.leftArm = this.scene.add.graphics();
        this.leftArm.fillStyle(color, 0.9);
        this.leftArm.fillRoundedRect(-35, -45, 15, 40, 4);

        this.rightArm = this.scene.add.graphics();
        this.rightArm.fillStyle(color, 0.9);
        this.rightArm.fillRoundedRect(20, -45, 15, 40, 4);

        // Legs
        this.leftLeg = this.scene.add.graphics();
        this.leftLeg.fillStyle(accent, 1);
        this.leftLeg.fillRoundedRect(-18, 0, 14, 45, 4);

        this.rightLeg = this.scene.add.graphics();
        this.rightLeg.fillStyle(accent, 1);
        this.rightLeg.fillRoundedRect(4, 0, 14, 45, 4);

        // Add all parts to container
        this.container.add([this.leftLeg, this.rightLeg, this.body, this.leftArm, this.rightArm, this.head]);

        // Fighter name label
        this.nameLabel = this.scene.add.text(0, -95, this.config.name, {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.container.add(this.nameLabel);
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
        switch (type) {
            case 'punch':
                this.scene.tweens.add({
                    targets: this.rightArm,
                    x: 30 * this.facing,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power2'
                });
                break;
            case 'kick':
                this.scene.tweens.add({
                    targets: this.rightLeg,
                    x: 25 * this.facing,
                    rotation: 0.5 * this.facing,
                    duration: duration / 2,
                    yoyo: true,
                    ease: 'Power2'
                });
                break;
            case 'uppercut':
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
                break;
            case 'sweep':
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
                break;
            case 'special':
                this.scene.tweens.add({
                    targets: this.container,
                    scaleY: 1.1,
                    duration: duration / 3,
                    yoyo: true,
                    ease: 'Power2'
                });
                break;
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
        // Flash white
        this.scene.tweens.add({
            targets: [this.body, this.head, this.leftArm, this.rightArm],
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 2
        });

        // Damage number
        const dmgText = this.scene.add.text(
            this.container.x,
            this.container.y - 80,
            `-${damage}`,
            {
                fontFamily: 'Arial Black',
                fontSize: '28px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(DEPTH.EFFECTS_FRONT);

        this.scene.tweens.add({
            targets: dmgText,
            y: dmgText.y - 50,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => dmgText.destroy()
        });

        // Hit particles
        for (let i = 0; i < 8; i++) {
            const spark = this.scene.add.circle(
                this.container.x + Phaser.Math.Between(-20, 20),
                this.container.y - 30 + Phaser.Math.Between(-20, 20),
                Phaser.Math.Between(3, 8),
                0xffff00,
                1
            );
            spark.setDepth(DEPTH.EFFECTS_FRONT);

            this.scene.tweens.add({
                targets: spark,
                x: spark.x + Phaser.Math.Between(-60, 60),
                y: spark.y + Phaser.Math.Between(-60, 30),
                alpha: 0,
                scale: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => spark.destroy()
            });
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
