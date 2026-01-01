/**
 * FightScene - Main fighting arena with combat system
 */

import Phaser from 'phaser';
import { FIGHT_CONFIG, FIGHTERS, DEPTH } from '../config/fightConfig.js';
import Fighter from '../entities/Fighter.js';

export default class FightScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FightScene' });
    }

    init(data) {
        this.player1Id = data.player1 || 'blaze';
        this.player2Id = data.player2 || 'frost';
        this.gameMode = data.mode || 'vs_cpu';

        this.roundsToWin = FIGHT_CONFIG.roundsToWin;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.currentRound = 1;
        this.roundTime = FIGHT_CONFIG.roundTime;
        this.matchState = 'intro'; // intro, fighting, round_end, match_end
    }

    create() {
        const { width, height } = this.cameras.main;

        this.cameras.main.fadeIn(300);

        // Create arena
        this.createArena(width, height);

        // Create fighters
        this.createFighters();

        // Create UI
        this.createUI(width, height);

        // Setup controls
        this.setupControls();

        // Start round intro
        this.showRoundIntro();
    }

    createArena(width, height) {
        // Sky gradient
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x1a0a3e, 0x1a0a3e, 0x0a0a2e, 0x0a0a2e, 1);
        sky.fillRect(0, 0, width, height);
        sky.setDepth(DEPTH.BACKGROUND);

        // Stars
        for (let i = 0; i < 60; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height * 0.6);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
            star.setDepth(DEPTH.BACKGROUND + 1);

            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Phaser.Math.Between(1500, 3000),
                yoyo: true,
                repeat: -1
            });
        }

        // Arena floor
        const floorY = FIGHT_CONFIG.groundY + 45;
        const floor = this.add.graphics();
        floor.fillStyle(0x333355, 1);
        floor.fillRect(0, floorY, width, height - floorY);
        floor.setDepth(DEPTH.ARENA);

        // Floor details
        floor.fillStyle(0x444466, 1);
        for (let i = 0; i < width; i += 80) {
            floor.fillRect(i, floorY, 2, height - floorY);
        }

        // Floor edge glow
        const edgeGlow = this.add.graphics();
        edgeGlow.fillStyle(0x6644aa, 0.5);
        edgeGlow.fillRect(0, floorY, width, 3);
        edgeGlow.setDepth(DEPTH.ARENA + 1);

        // Arena boundaries (pillars)
        this.createPillar(30, floorY, 0x8866cc);
        this.createPillar(width - 30, floorY, 0x8866cc);

        // Background arena decoration
        const arenaName = this.add.text(width / 2, 50, 'NEON COLOSSEUM', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.15).setDepth(DEPTH.BACKGROUND + 2);
    }

    createPillar(x, floorY, color) {
        const pillar = this.add.graphics();
        pillar.fillStyle(color, 0.8);
        pillar.fillRect(x - 15, floorY - 200, 30, 200);
        pillar.fillStyle(0xffffff, 0.3);
        pillar.fillRect(x - 5, floorY - 200, 10, 200);
        pillar.setDepth(DEPTH.ARENA);

        // Pillar glow
        const glow = this.add.circle(x, floorY - 100, 20, color, 0.3);
        glow.setDepth(DEPTH.ARENA);

        this.tweens.add({
            targets: glow,
            alpha: 0.1,
            scale: 1.5,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
    }

    createFighters() {
        const p1X = 250;
        const p2X = FIGHT_CONFIG.width - 250;
        const fighterY = FIGHT_CONFIG.groundY;

        this.player1 = new Fighter(this, p1X, fighterY, this.player1Id, true);
        this.player2 = new Fighter(this, p2X, fighterY, this.player2Id, false);

        // Store starting positions
        this.p1StartX = p1X;
        this.p2StartX = p2X;
    }

    createUI(width, height) {
        // Health bars container
        this.uiContainer = this.add.container(0, 0).setDepth(DEPTH.UI);

        // P1 Health bar (left side)
        this.p1HealthBg = this.add.rectangle(30, 30, 350, 30, 0x333333);
        this.p1HealthBg.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1HealthBg);

        this.p1HealthBar = this.add.rectangle(32, 30, 346, 26, FIGHTERS[this.player1Id].color);
        this.p1HealthBar.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1HealthBar);

        // P1 name
        this.add.text(30, 50, FIGHTERS[this.player1Id].name.toUpperCase(), {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#00ffff'
        }).setDepth(DEPTH.UI);

        // P1 Special meter
        this.p1SpecialBg = this.add.rectangle(30, 65, 150, 8, 0x333333);
        this.p1SpecialBg.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1SpecialBg);

        this.p1SpecialBar = this.add.rectangle(30, 65, 0, 8, 0xffff00);
        this.p1SpecialBar.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1SpecialBar);

        // P2 Health bar (right side)
        this.p2HealthBg = this.add.rectangle(width - 30, 30, 350, 30, 0x333333);
        this.p2HealthBg.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2HealthBg);

        this.p2HealthBar = this.add.rectangle(width - 32, 30, 346, 26, FIGHTERS[this.player2Id].color);
        this.p2HealthBar.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2HealthBar);

        // P2 name
        this.add.text(width - 30, 50, (this.gameMode === 'vs_cpu' ? 'CPU ' : '') + FIGHTERS[this.player2Id].name.toUpperCase(), {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#ff00ff'
        }).setOrigin(1, 0).setDepth(DEPTH.UI);

        // P2 Special meter
        this.p2SpecialBg = this.add.rectangle(width - 30, 65, 150, 8, 0x333333);
        this.p2SpecialBg.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2SpecialBg);

        this.p2SpecialBar = this.add.rectangle(width - 30, 65, 0, 8, 0xffff00);
        this.p2SpecialBar.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2SpecialBar);

        // Timer
        this.timerText = this.add.text(width / 2, 35, this.roundTime.toString(), {
            fontFamily: 'Arial Black',
            fontSize: '40px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Round indicator
        this.roundText = this.add.text(width / 2, 70, `ROUND ${this.currentRound}`, {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#ffff00'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Win indicators
        this.createWinIndicators(width);

        // Controls hint
        this.controlsHint = this.add.text(width / 2, height - 20,
            'P1: WASD + JKL | P2: Arrows + 123 (or CPU)', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#666666'
        }).setOrigin(0.5).setDepth(DEPTH.UI);
    }

    createWinIndicators(width) {
        // P1 round wins (left)
        this.p1WinIndicators = [];
        for (let i = 0; i < this.roundsToWin; i++) {
            const indicator = this.add.circle(40 + i * 25, 85, 8, 0x333333);
            indicator.setStrokeStyle(2, 0x00ffff);
            indicator.setDepth(DEPTH.UI);
            this.p1WinIndicators.push(indicator);
        }

        // P2 round wins (right)
        this.p2WinIndicators = [];
        for (let i = 0; i < this.roundsToWin; i++) {
            const indicator = this.add.circle(width - 40 - i * 25, 85, 8, 0x333333);
            indicator.setStrokeStyle(2, 0xff00ff);
            indicator.setDepth(DEPTH.UI);
            this.p2WinIndicators.push(indicator);
        }
    }

    setupControls() {
        // Player 1 controls (WASD + JKL)
        this.p1Keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            punch: Phaser.Input.Keyboard.KeyCodes.J,
            kick: Phaser.Input.Keyboard.KeyCodes.K,
            special: Phaser.Input.Keyboard.KeyCodes.L
        });

        // Player 2 controls (Arrows + 123) - only if vs player
        if (this.gameMode !== 'vs_cpu') {
            this.p2Keys = this.input.keyboard.addKeys({
                left: Phaser.Input.Keyboard.KeyCodes.LEFT,
                right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
                up: Phaser.Input.Keyboard.KeyCodes.UP,
                down: Phaser.Input.Keyboard.KeyCodes.DOWN,
                punch: Phaser.Input.Keyboard.KeyCodes.ONE,
                kick: Phaser.Input.Keyboard.KeyCodes.TWO,
                special: Phaser.Input.Keyboard.KeyCodes.THREE
            });
        }
    }

    showRoundIntro() {
        this.matchState = 'intro';
        const { width, height } = this.cameras.main;

        // Round announcement
        const roundAnnounce = this.add.text(width / 2, height / 2 - 50, `ROUND ${this.currentRound}`, {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY).setAlpha(0);

        this.tweens.add({
            targets: roundAnnounce,
            alpha: 1,
            scale: { from: 2, to: 1 },
            duration: 500,
            ease: 'Back.out'
        });

        this.time.delayedCall(1000, () => {
            roundAnnounce.setText('FIGHT!');
            roundAnnounce.setColor('#ff0000');

            this.tweens.add({
                targets: roundAnnounce,
                scale: { from: 1, to: 1.5 },
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    roundAnnounce.destroy();
                    this.startRound();
                }
            });
        });
    }

    startRound() {
        this.matchState = 'fighting';
        this.roundTime = FIGHT_CONFIG.roundTime;

        // Start timer
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        if (this.matchState !== 'fighting') return;

        this.roundTime--;
        this.timerText.setText(this.roundTime.toString());

        if (this.roundTime <= 10) {
            this.timerText.setColor('#ff0000');
            this.tweens.add({
                targets: this.timerText,
                scale: { from: 1.2, to: 1 },
                duration: 200
            });
        }

        if (this.roundTime <= 0) {
            this.timeUp();
        }
    }

    timeUp() {
        // Whoever has more health wins
        if (this.player1.health > this.player2.health) {
            this.endRound(1);
        } else if (this.player2.health > this.player1.health) {
            this.endRound(2);
        } else {
            // Draw - both lose a round? Or continue?
            this.endRound(0);
        }
    }

    endRound(winner) {
        this.matchState = 'round_end';
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }

        const { width, height } = this.cameras.main;

        // Determine winner
        let winnerText = '';
        if (winner === 1) {
            this.p1Wins++;
            this.p1WinIndicators[this.p1Wins - 1].setFillStyle(0x00ffff, 1);
            winnerText = `${FIGHTERS[this.player1Id].name.toUpperCase()} WINS!`;
        } else if (winner === 2) {
            this.p2Wins++;
            this.p2WinIndicators[this.p2Wins - 1].setFillStyle(0xff00ff, 1);
            winnerText = `${FIGHTERS[this.player2Id].name.toUpperCase()} WINS!`;
        } else {
            winnerText = 'DRAW!';
        }

        // Round end announcement
        const endText = this.add.text(width / 2, height / 2, winnerText, {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: winner === 1 ? '#00ffff' : (winner === 2 ? '#ff00ff' : '#ffff00'),
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY);

        this.tweens.add({
            targets: endText,
            scale: { from: 0.5, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });

        // Check for match end
        this.time.delayedCall(2000, () => {
            endText.destroy();

            if (this.p1Wins >= this.roundsToWin) {
                this.endMatch(1);
            } else if (this.p2Wins >= this.roundsToWin) {
                this.endMatch(2);
            } else {
                this.nextRound();
            }
        });
    }

    nextRound() {
        this.currentRound++;
        this.roundText.setText(`ROUND ${this.currentRound}`);

        // Reset fighters
        this.player1.reset(this.p1StartX);
        this.player2.reset(this.p2StartX);

        // Reset timer color
        this.timerText.setColor('#ffffff');

        // Start new round
        this.showRoundIntro();
    }

    endMatch(winner) {
        this.matchState = 'match_end';
        const { width, height } = this.cameras.main;

        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        overlay.setDepth(DEPTH.OVERLAY);

        // Winner announcement
        const winnerConfig = winner === 1 ? FIGHTERS[this.player1Id] : FIGHTERS[this.player2Id];
        const winnerName = winnerConfig.name.toUpperCase();
        const prefix = winner === 2 && this.gameMode === 'vs_cpu' ? 'CPU ' : '';

        const victoryText = this.add.text(width / 2, height / 2 - 80, `${prefix}${winnerName}`, {
            fontFamily: 'Arial Black',
            fontSize: '56px',
            color: winner === 1 ? '#00ffff' : '#ff00ff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

        const winsText = this.add.text(width / 2, height / 2 - 20, 'WINS THE MATCH!', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1);

        // Victory animation
        this.tweens.add({
            targets: [victoryText, winsText],
            scale: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.out'
        });

        // Menu options
        const rematchBtn = this.add.text(width / 2, height / 2 + 80, 'REMATCH', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#00ff00'
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => rematchBtn.setScale(1.1))
        .on('pointerout', () => rematchBtn.setScale(1))
        .on('pointerdown', () => {
            this.scene.restart({
                player1: this.player1Id,
                player2: this.player2Id,
                mode: this.gameMode
            });
        });

        const selectBtn = this.add.text(width / 2, height / 2 + 130, 'CHARACTER SELECT', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffff00'
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => selectBtn.setScale(1.1))
        .on('pointerout', () => selectBtn.setScale(1))
        .on('pointerdown', () => {
            this.scene.start('FighterSelectScene', { mode: this.gameMode });
        });

        const menuBtn = this.add.text(width / 2, height / 2 + 175, 'MAIN MENU', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => menuBtn.setColor('#ffffff'))
        .on('pointerout', () => menuBtn.setColor('#888888'))
        .on('pointerdown', () => {
            this.scene.start('FightMenuScene');
        });
    }

    handleP1Input() {
        if (this.matchState !== 'fighting') return;

        const keys = this.p1Keys;

        // Movement
        if (keys.left.isDown) {
            this.player1.moveLeft();
        } else if (keys.right.isDown) {
            this.player1.moveRight();
        } else {
            this.player1.stopMoving();
        }

        // Jump
        if (keys.up.isDown) {
            this.player1.jump();
        }

        // Block (down)
        this.player1.block(keys.down.isDown);

        // Attacks
        if (Phaser.Input.Keyboard.JustDown(keys.punch)) {
            if (keys.down.isDown) {
                this.player1.sweep();
            } else if (keys.up.isDown) {
                this.player1.uppercut();
            } else {
                this.player1.punch();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(keys.kick)) {
            this.player1.kick();
        }

        if (Phaser.Input.Keyboard.JustDown(keys.special)) {
            this.player1.special();
        }
    }

    handleP2Input() {
        if (this.matchState !== 'fighting') return;

        if (this.gameMode === 'vs_cpu') {
            this.handleCPU();
            return;
        }

        const keys = this.p2Keys;

        // Movement
        if (keys.left.isDown) {
            this.player2.moveLeft();
        } else if (keys.right.isDown) {
            this.player2.moveRight();
        } else {
            this.player2.stopMoving();
        }

        // Jump
        if (keys.up.isDown) {
            this.player2.jump();
        }

        // Block
        this.player2.block(keys.down.isDown);

        // Attacks
        if (Phaser.Input.Keyboard.JustDown(keys.punch)) {
            if (keys.down.isDown) {
                this.player2.sweep();
            } else if (keys.up.isDown) {
                this.player2.uppercut();
            } else {
                this.player2.punch();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(keys.kick)) {
            this.player2.kick();
        }

        if (Phaser.Input.Keyboard.JustDown(keys.special)) {
            this.player2.special();
        }
    }

    handleCPU() {
        const cpu = this.player2;
        const player = this.player1;

        // Don't act if not able
        if (!cpu.canAct || cpu.state === 'hit' || cpu.state === 'ko') return;

        const distance = Math.abs(cpu.container.x - player.container.x);
        const random = Math.random();

        // Face player
        cpu.faceOpponent(player.container.x);

        // Decision making based on distance
        if (distance > 200) {
            // Approach
            if (player.container.x < cpu.container.x) {
                cpu.moveLeft();
            } else {
                cpu.moveRight();
            }

            // Occasional jump approach
            if (random < 0.01) {
                cpu.jump();
            }
        } else if (distance > 80) {
            // Mid range - mix approach and attacks
            if (random < 0.6) {
                // Approach
                if (player.container.x < cpu.container.x) {
                    cpu.moveLeft();
                } else {
                    cpu.moveRight();
                }
            } else if (random < 0.8) {
                // Attack
                if (random < 0.7) {
                    cpu.kick();
                } else {
                    cpu.punch();
                }
            }
        } else {
            // Close range - attack or block
            if (player.state === 'attacking') {
                // Try to block
                if (random < 0.7) {
                    cpu.block(true);
                    this.time.delayedCall(300, () => cpu.block(false));
                }
            } else {
                // Attack
                if (random < 0.3) {
                    cpu.punch();
                } else if (random < 0.5) {
                    cpu.kick();
                } else if (random < 0.6) {
                    cpu.uppercut();
                } else if (random < 0.65) {
                    cpu.sweep();
                } else if (random < 0.7 && cpu.specialMeter >= cpu.maxSpecialMeter) {
                    cpu.special();
                } else {
                    // Back off sometimes
                    if (player.container.x < cpu.container.x) {
                        cpu.moveRight();
                    } else {
                        cpu.moveLeft();
                    }
                }
            }
        }
    }

    checkHitCollision(attacker, defender) {
        if (!attacker.attackHitbox || !attacker.attackHitbox.active) return;

        const hitbox = attacker.attackHitbox;
        const hurtbox = defender.getHurtbox();

        // Simple AABB collision
        const hit = hitbox.x < hurtbox.x + hurtbox.width &&
                   hitbox.x + hitbox.width > hurtbox.x &&
                   hitbox.y < hurtbox.y + hurtbox.height &&
                   hitbox.y + hitbox.height > hurtbox.y;

        if (hit) {
            const result = defender.takeHit(hitbox.damage, hitbox.type, attacker.container.x);

            // Build attacker's special meter
            if (!result.blocked) {
                attacker.specialMeter = Math.min(attacker.maxSpecialMeter, attacker.specialMeter + hitbox.damage * 0.5);
            }

            // Deactivate hitbox
            attacker.attackHitbox.active = false;

            // Check for KO
            if (defender.health <= 0) {
                const winner = defender === this.player2 ? 1 : 2;
                this.endRound(winner);
            }
        }
    }

    updateUI() {
        // Update health bars
        const p1HealthPercent = this.player1.health / this.player1.maxHealth;
        const p2HealthPercent = this.player2.health / this.player2.maxHealth;

        this.p1HealthBar.scaleX = Math.max(0, p1HealthPercent);
        this.p2HealthBar.scaleX = Math.max(0, p2HealthPercent);

        // Health bar color based on health
        if (p1HealthPercent < 0.25) {
            this.p1HealthBar.setFillStyle(0xff0000);
        } else if (p1HealthPercent < 0.5) {
            this.p1HealthBar.setFillStyle(0xffff00);
        }

        if (p2HealthPercent < 0.25) {
            this.p2HealthBar.setFillStyle(0xff0000);
        } else if (p2HealthPercent < 0.5) {
            this.p2HealthBar.setFillStyle(0xffff00);
        }

        // Update special meters
        const p1SpecialPercent = this.player1.specialMeter / this.player1.maxSpecialMeter;
        const p2SpecialPercent = this.player2.specialMeter / this.player2.maxSpecialMeter;

        this.p1SpecialBar.width = 150 * p1SpecialPercent;
        this.p2SpecialBar.width = 150 * p2SpecialPercent;

        // Flash when special is ready
        if (p1SpecialPercent >= 1) {
            this.p1SpecialBar.setFillStyle(0xff00ff);
        } else {
            this.p1SpecialBar.setFillStyle(0xffff00);
        }

        if (p2SpecialPercent >= 1) {
            this.p2SpecialBar.setFillStyle(0xff00ff);
        } else {
            this.p2SpecialBar.setFillStyle(0xffff00);
        }
    }

    update(time, delta) {
        // Handle input
        this.handleP1Input();
        this.handleP2Input();

        // Update fighters
        this.player1.update(delta);
        this.player2.update(delta);

        // Auto-face opponent
        if (this.matchState === 'fighting') {
            this.player1.faceOpponent(this.player2.container.x);
            this.player2.faceOpponent(this.player1.container.x);
        }

        // Check collisions
        this.checkHitCollision(this.player1, this.player2);
        this.checkHitCollision(this.player2, this.player1);

        // Update UI
        this.updateUI();
    }
}
