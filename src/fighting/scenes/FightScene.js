/**
 * FightScene - Main fighting arena with combat system
 */

import Phaser from 'phaser';
import { FIGHT_CONFIG, FIGHTERS, DEPTH } from '../config/fightConfig.js';
import Fighter from '../entities/Fighter.js';
import SoundManager from '../systems/SoundManager.js';
import FighterAI from '../systems/FighterAI.js';
import ComboSystem from '../systems/ComboSystem.js';

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

        // AI difficulty from data or default
        this.aiDifficulty = data.difficulty || 'normal';
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
        // Sky gradient with deeper colors
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x1a0a3e, 0x1a0a3e, 0x050520, 0x050520, 1);
        sky.fillRect(0, 0, width, height);
        sky.setDepth(DEPTH.BACKGROUND);

        // Animated nebula clouds in background
        for (let i = 0; i < 5; i++) {
            const nebulaX = Phaser.Math.Between(100, width - 100);
            const nebulaY = Phaser.Math.Between(50, height * 0.4);
            const nebulaColor = Phaser.Math.RND.pick([0xff0066, 0x00ffff, 0x9900ff, 0xff6600]);
            const nebula = this.add.circle(nebulaX, nebulaY, Phaser.Math.Between(60, 120), nebulaColor, 0.08);
            nebula.setDepth(DEPTH.BACKGROUND);

            this.tweens.add({
                targets: nebula,
                x: nebula.x + Phaser.Math.Between(-30, 30),
                y: nebula.y + Phaser.Math.Between(-20, 20),
                scale: { from: 1, to: 1.3 },
                alpha: { from: 0.08, to: 0.15 },
                duration: Phaser.Math.Between(4000, 8000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }

        // Stars with twinkling effect
        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height * 0.6);
            const size = Phaser.Math.FloatBetween(0.5, 2.5);
            const starColor = Phaser.Math.RND.pick([0xffffff, 0x88ccff, 0xffcc88]);
            const star = this.add.circle(x, y, size, starColor, Phaser.Math.FloatBetween(0.3, 0.8));
            star.setDepth(DEPTH.BACKGROUND + 1);

            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.1, 0.3),
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }

        // Distant city silhouette
        this.createCitySilhouette(width, height);

        // Arena floor with neon grid
        const floorY = FIGHT_CONFIG.groundY + 45;
        this.createNeonFloor(width, height, floorY);

        // Arena boundaries (pillars)
        this.createPillar(30, floorY, 0x8866cc);
        this.createPillar(width - 30, floorY, 0x8866cc);

        // Animated electric arcs between pillars
        this.createElectricArcs(width, floorY);

        // Scanlines overlay for retro effect
        this.createScanlines(width, height);

        // Floating particles in arena
        this.createFloatingParticles(width, height, floorY);

        // Background arena decoration with glow
        const arenaName = this.add.text(width / 2, 50, 'NEON COLOSSEUM', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.2).setDepth(DEPTH.BACKGROUND + 2);

        // Arena name glow pulse
        this.tweens.add({
            targets: arenaName,
            alpha: { from: 0.15, to: 0.3 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Ambient light rays from top
        this.createLightRays(width, height);
    }

    createCitySilhouette(width, height) {
        const buildings = this.add.graphics();
        buildings.setDepth(DEPTH.BACKGROUND + 1);

        // Draw distant buildings
        const buildingColors = [0x1a1a2e, 0x16162e, 0x12122a];
        for (let i = 0; i < width; i += Phaser.Math.Between(30, 60)) {
            const bHeight = Phaser.Math.Between(40, 120);
            const bWidth = Phaser.Math.Between(25, 50);
            const color = Phaser.Math.RND.pick(buildingColors);

            buildings.fillStyle(color, 0.6);
            buildings.fillRect(i, height * 0.5 - bHeight, bWidth, bHeight + 50);

            // Window lights
            if (Math.random() > 0.3) {
                const windowColor = Phaser.Math.RND.pick([0xffff00, 0x00ffff, 0xff00ff, 0xff6600]);
                for (let w = 0; w < 3; w++) {
                    if (Math.random() > 0.5) {
                        buildings.fillStyle(windowColor, 0.4);
                        buildings.fillRect(
                            i + 5 + w * 8,
                            height * 0.5 - bHeight + 10 + Math.floor(Math.random() * (bHeight - 20)),
                            4, 4
                        );
                    }
                }
            }
        }
    }

    createNeonFloor(width, height, floorY) {
        // Main floor
        const floor = this.add.graphics();
        floor.fillGradientStyle(0x222244, 0x222244, 0x1a1a33, 0x1a1a33, 1);
        floor.fillRect(0, floorY, width, height - floorY);
        floor.setDepth(DEPTH.ARENA);

        // Neon grid lines
        const gridColor = 0x6644aa;
        for (let i = 0; i < width; i += 60) {
            const line = this.add.graphics();
            line.lineStyle(1, gridColor, 0.3);
            line.lineBetween(i, floorY, i, height);
            line.setDepth(DEPTH.ARENA);
        }

        // Horizontal grid lines
        for (let j = floorY; j < height; j += 30) {
            const hLine = this.add.graphics();
            hLine.lineStyle(1, gridColor, 0.2);
            hLine.lineBetween(0, j, width, j);
            hLine.setDepth(DEPTH.ARENA);
        }

        // Floor edge glow with animation
        const edgeGlow = this.add.rectangle(width / 2, floorY + 2, width, 4, 0x00ffff, 0.6);
        edgeGlow.setDepth(DEPTH.ARENA + 1);

        this.tweens.add({
            targets: edgeGlow,
            alpha: { from: 0.6, to: 0.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Side edge glows
        const leftEdge = this.add.rectangle(2, floorY + (height - floorY) / 2, 4, height - floorY, 0x00ffff, 0.4);
        const rightEdge = this.add.rectangle(width - 2, floorY + (height - floorY) / 2, 4, height - floorY, 0xff00ff, 0.4);
        leftEdge.setDepth(DEPTH.ARENA + 1);
        rightEdge.setDepth(DEPTH.ARENA + 1);

        this.tweens.add({
            targets: [leftEdge, rightEdge],
            alpha: { from: 0.4, to: 0.15 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
    }

    createElectricArcs(width, floorY) {
        // Create periodic electric arc effect
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                if (this.matchState === 'match_end') return;

                // Random side
                const leftSide = Math.random() > 0.5;
                const startX = leftSide ? 30 : width - 30;
                const startY = floorY - 150;

                // Draw electric arc
                const arc = this.add.graphics();
                arc.setDepth(DEPTH.ARENA + 2);
                arc.lineStyle(2, 0x00ffff, 0.8);

                let x = startX;
                let y = startY;
                arc.moveTo(x, y);

                for (let i = 0; i < 5; i++) {
                    x += (leftSide ? 1 : -1) * Phaser.Math.Between(10, 30);
                    y += Phaser.Math.Between(15, 30);
                    arc.lineTo(x, y);
                }
                arc.stroke();

                // Flash effect
                this.tweens.add({
                    targets: arc,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => arc.destroy()
                });
            },
            loop: true
        });
    }

    createScanlines(width, height) {
        const scanlines = this.add.graphics();
        scanlines.setDepth(DEPTH.EFFECTS_FRONT + 10);
        scanlines.setAlpha(0.03);

        for (let y = 0; y < height; y += 3) {
            scanlines.lineStyle(1, 0x000000, 1);
            scanlines.lineBetween(0, y, width, y);
        }
    }

    createFloatingParticles(width, height, floorY) {
        // Floating dust/energy particles
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const y = Phaser.Math.Between(100, floorY - 50);
            const size = Phaser.Math.FloatBetween(1, 3);
            const color = Phaser.Math.RND.pick([0xffffff, 0x00ffff, 0xff00ff, 0xffff00]);
            const particle = this.add.circle(x, y, size, color, Phaser.Math.FloatBetween(0.2, 0.5));
            particle.setDepth(DEPTH.ARENA + 3);

            // Float upward
            this.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(100, 200),
                x: particle.x + Phaser.Math.Between(-50, 50),
                alpha: 0,
                duration: Phaser.Math.Between(4000, 8000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000),
                onRepeat: () => {
                    particle.x = Phaser.Math.Between(50, width - 50);
                    particle.y = Phaser.Math.Between(floorY - 100, floorY);
                    particle.alpha = Phaser.Math.FloatBetween(0.2, 0.5);
                }
            });
        }
    }

    createLightRays(width, height) {
        // Ambient light rays from above
        for (let i = 0; i < 3; i++) {
            const ray = this.add.graphics();
            ray.setDepth(DEPTH.BACKGROUND + 3);

            const rayX = width * 0.25 + i * (width * 0.25);
            const rayWidth = 80;

            ray.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 1, 1, 0, 0);
            ray.fillTriangle(
                rayX - rayWidth / 2, 0,
                rayX + rayWidth / 2, 0,
                rayX, height * 0.6
            );
            ray.setAlpha(0.02);

            this.tweens.add({
                targets: ray,
                alpha: { from: 0.02, to: 0.05 },
                duration: Phaser.Math.Between(3000, 5000),
                yoyo: true,
                repeat: -1,
                delay: i * 800
            });
        }
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

        // Initialize sound manager
        this.soundManager = new SoundManager(this);

        // Initialize combo systems
        this.p1Combo = new ComboSystem(this.player1);
        this.p2Combo = new ComboSystem(this.player2);

        // Initialize AI for CPU mode
        if (this.gameMode === 'vs_cpu') {
            this.cpuAI = new FighterAI(this.player2, this.aiDifficulty);
            this.cpuAI.setOpponent(this.player1);
        }

        // Create combo counter display
        this.createComboDisplay();
    }

    createComboDisplay() {
        const { width, height } = this.cameras.main;

        // P1 combo counter (left side)
        this.p1ComboText = this.add.text(100, height / 2, '', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI).setAlpha(0);

        // P2 combo counter (right side)
        this.p2ComboText = this.add.text(width - 100, height / 2, '', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ff00ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI).setAlpha(0);
    }

    createUI(width, height) {
        // Health bars container
        this.uiContainer = this.add.container(0, 0).setDepth(DEPTH.UI);

        const p1Color = FIGHTERS[this.player1Id].color;
        const p2Color = FIGHTERS[this.player2Id].color;

        // P1 Health bar frame with glow
        this.p1HealthGlow = this.add.rectangle(30, 30, 360, 38, p1Color, 0.3);
        this.p1HealthGlow.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1HealthGlow);

        // P1 Health bar outer frame
        const p1Frame = this.add.graphics();
        p1Frame.lineStyle(3, 0x00ffff, 0.8);
        p1Frame.strokeRoundedRect(28, 13, 354, 34, 4);
        this.uiContainer.add(p1Frame);

        this.p1HealthBg = this.add.rectangle(30, 30, 350, 30, 0x111122);
        this.p1HealthBg.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1HealthBg);

        // P1 Health bar with gradient effect (layered bars)
        this.p1HealthBarBg = this.add.rectangle(32, 30, 346, 26, 0x004444);
        this.p1HealthBarBg.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1HealthBarBg);

        this.p1HealthBar = this.add.rectangle(32, 30, 346, 26, p1Color);
        this.p1HealthBar.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1HealthBar);

        // P1 Health bar shine
        this.p1HealthShine = this.add.rectangle(32, 22, 346, 6, 0xffffff, 0.2);
        this.p1HealthShine.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1HealthShine);

        // P1 name with shadow
        this.add.text(32, 52, FIGHTERS[this.player1Id].name.toUpperCase(), {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#000000'
        }).setDepth(DEPTH.UI);
        this.add.text(30, 50, FIGHTERS[this.player1Id].name.toUpperCase(), {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#00ffff'
        }).setDepth(DEPTH.UI);

        // P1 Special meter with glow frame
        const p1SpecialFrame = this.add.graphics();
        p1SpecialFrame.lineStyle(2, 0xffff00, 0.5);
        p1SpecialFrame.strokeRoundedRect(28, 68, 154, 12, 3);
        this.uiContainer.add(p1SpecialFrame);

        this.p1SpecialBg = this.add.rectangle(30, 74, 150, 8, 0x222200);
        this.p1SpecialBg.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1SpecialBg);

        this.p1SpecialBar = this.add.rectangle(30, 74, 0, 8, 0xffff00);
        this.p1SpecialBar.setOrigin(0, 0.5);
        this.uiContainer.add(this.p1SpecialBar);

        // P1 Special ready glow (hidden initially)
        this.p1SpecialGlow = this.add.rectangle(105, 74, 160, 16, 0xffff00, 0);
        this.uiContainer.add(this.p1SpecialGlow);

        // P2 Health bar frame with glow
        this.p2HealthGlow = this.add.rectangle(width - 30, 30, 360, 38, p2Color, 0.3);
        this.p2HealthGlow.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2HealthGlow);

        // P2 Health bar outer frame
        const p2Frame = this.add.graphics();
        p2Frame.lineStyle(3, 0xff00ff, 0.8);
        p2Frame.strokeRoundedRect(width - 382, 13, 354, 34, 4);
        this.uiContainer.add(p2Frame);

        this.p2HealthBg = this.add.rectangle(width - 30, 30, 350, 30, 0x111122);
        this.p2HealthBg.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2HealthBg);

        // P2 Health bar with gradient
        this.p2HealthBarBg = this.add.rectangle(width - 32, 30, 346, 26, 0x440044);
        this.p2HealthBarBg.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2HealthBarBg);

        this.p2HealthBar = this.add.rectangle(width - 32, 30, 346, 26, p2Color);
        this.p2HealthBar.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2HealthBar);

        // P2 Health bar shine
        this.p2HealthShine = this.add.rectangle(width - 32, 22, 346, 6, 0xffffff, 0.2);
        this.p2HealthShine.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2HealthShine);

        // P2 name with shadow
        this.add.text(width - 28, 52, (this.gameMode === 'vs_cpu' ? 'CPU ' : '') + FIGHTERS[this.player2Id].name.toUpperCase(), {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#000000'
        }).setOrigin(1, 0).setDepth(DEPTH.UI);
        this.add.text(width - 30, 50, (this.gameMode === 'vs_cpu' ? 'CPU ' : '') + FIGHTERS[this.player2Id].name.toUpperCase(), {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#ff00ff'
        }).setOrigin(1, 0).setDepth(DEPTH.UI);

        // P2 Special meter with glow frame
        const p2SpecialFrame = this.add.graphics();
        p2SpecialFrame.lineStyle(2, 0xffff00, 0.5);
        p2SpecialFrame.strokeRoundedRect(width - 182, 68, 154, 12, 3);
        this.uiContainer.add(p2SpecialFrame);

        this.p2SpecialBg = this.add.rectangle(width - 30, 74, 150, 8, 0x222200);
        this.p2SpecialBg.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2SpecialBg);

        this.p2SpecialBar = this.add.rectangle(width - 30, 74, 0, 8, 0xffff00);
        this.p2SpecialBar.setOrigin(1, 0.5);
        this.uiContainer.add(this.p2SpecialBar);

        // P2 Special ready glow
        this.p2SpecialGlow = this.add.rectangle(width - 105, 74, 160, 16, 0xffff00, 0);
        this.uiContainer.add(this.p2SpecialGlow);

        // Timer with glow effect
        const timerGlow = this.add.circle(width / 2, 35, 35, 0xffffff, 0.1);
        timerGlow.setDepth(DEPTH.UI - 1);

        this.timerText = this.add.text(width / 2, 35, this.roundTime.toString(), {
            fontFamily: 'Arial Black',
            fontSize: '44px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Round indicator with styling
        const roundBg = this.add.graphics();
        roundBg.fillStyle(0x000000, 0.5);
        roundBg.fillRoundedRect(width / 2 - 60, 60, 120, 24, 6);
        roundBg.setDepth(DEPTH.UI - 1);

        this.roundText = this.add.text(width / 2, 72, `ROUND ${this.currentRound}`, {
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
            color: '#555555'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Start health bar glow pulse animation
        this.tweens.add({
            targets: [this.p1HealthGlow, this.p2HealthGlow],
            alpha: { from: 0.3, to: 0.15 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
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

        // Play round sound
        if (this.soundManager) {
            this.soundManager.playRound(this.currentRound);
        }

        this.time.delayedCall(1000, () => {
            roundAnnounce.setText('FIGHT!');
            roundAnnounce.setColor('#ff0000');

            // Play fight sound
            if (this.soundManager) {
                this.soundManager.playFight();
            }

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

        // Play win sound
        if (this.soundManager) {
            this.soundManager.playWin();
        }

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
            this.handleCPU(this.game.loop.delta);
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

    handleCPU(delta) {
        // Use the advanced AI system
        if (this.cpuAI) {
            this.cpuAI.update(delta);
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

            // Get combo system for attacker
            const comboSystem = attacker === this.player1 ? this.p1Combo : this.p2Combo;
            const comboText = attacker === this.player1 ? this.p1ComboText : this.p2ComboText;

            // Build attacker's special meter
            if (!result.blocked) {
                attacker.specialMeter = Math.min(attacker.maxSpecialMeter, attacker.specialMeter + hitbox.damage * 0.5);

                // Register hit in combo system
                const comboResult = comboSystem.registerHit(hitbox.damage, hitbox.type);

                // Update combo display
                if (comboResult.count >= 2) {
                    this.showComboCounter(comboText, comboResult.count);
                    if (this.soundManager) {
                        this.soundManager.playCombo(comboResult.count);
                    }
                }

                // Play attack sound
                if (this.soundManager) {
                    switch (hitbox.type) {
                        case 'punch': this.soundManager.playPunch(); break;
                        case 'kick': this.soundManager.playKick(); break;
                        case 'uppercut': this.soundManager.playUppercut(); break;
                        case 'sweep': this.soundManager.playSweep(); break;
                        case 'special': this.soundManager.playSpecial(); break;
                    }
                    this.soundManager.playHit();
                }

                // Screen effects based on attack type
                this.triggerHitScreenEffects(hitbox.type, hitbox.damage);
            } else {
                // Block screen effect (lighter shake)
                this.cameras.main.shake(50, 0.003);

                // Play block sound
                if (this.soundManager) {
                    this.soundManager.playBlock();
                }

                // Reset combo on block
                comboSystem.resetCombo();
            }

            // Deactivate hitbox
            attacker.attackHitbox.active = false;

            // Check for KO
            if (defender.health <= 0) {
                const winner = defender === this.player2 ? 1 : 2;

                // Play KO sound
                if (this.soundManager) {
                    this.soundManager.playKO();
                }

                this.triggerKOEffects();
                this.endRound(winner);
            }
        }
    }

    showComboCounter(comboText, count) {
        comboText.setText(`${count} HIT${count > 1 ? 'S' : ''}!`);
        comboText.setAlpha(1);
        comboText.setScale(1.5);

        // Animate
        this.tweens.add({
            targets: comboText,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });

        // Fade out after delay
        this.tweens.add({
            targets: comboText,
            alpha: 0,
            delay: 800,
            duration: 300
        });
    }

    triggerHitScreenEffects(attackType, damage) {
        const camera = this.cameras.main;

        // Camera shake based on attack type
        switch (attackType) {
            case 'special':
                camera.shake(200, 0.015);
                this.slowMotionEffect(150);
                this.screenFlash(0xff00ff, 0.3);
                break;
            case 'uppercut':
                camera.shake(150, 0.012);
                this.slowMotionEffect(100);
                break;
            case 'sweep':
                camera.shake(120, 0.01);
                break;
            case 'kick':
                camera.shake(80, 0.008);
                break;
            case 'punch':
                camera.shake(50, 0.005);
                break;
        }

        // Extra effects for heavy damage
        if (damage >= 15) {
            this.screenFlash(0xff0000, 0.15);
        }
    }

    triggerKOEffects() {
        const camera = this.cameras.main;
        const { width, height } = camera;

        // Dramatic slow motion
        this.slowMotionEffect(500);

        // Heavy screen shake
        camera.shake(400, 0.02);

        // Screen flash
        this.screenFlash(0xffffff, 0.5);

        // Zoom in slightly
        this.tweens.add({
            targets: camera,
            zoom: 1.1,
            duration: 300,
            yoyo: true,
            ease: 'Power2'
        });

        // KO text flash
        const koText = this.add.text(width / 2, height / 2, 'K.O.!', {
            fontFamily: 'Arial Black',
            fontSize: '80px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 10
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY).setAlpha(0).setScale(3);

        this.tweens.add({
            targets: koText,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.out',
            onComplete: () => {
                this.tweens.add({
                    targets: koText,
                    alpha: 0,
                    y: koText.y - 50,
                    duration: 800,
                    delay: 500,
                    onComplete: () => koText.destroy()
                });
            }
        });
    }

    slowMotionEffect(duration) {
        // Slow down time scale temporarily
        this.tweens.timeScale = 0.3;
        this.time.timeScale = 0.3;

        this.time.delayedCall(duration * 0.3, () => {
            this.tweens.timeScale = 1;
            this.time.timeScale = 1;
        });
    }

    screenFlash(color, intensity) {
        const { width, height } = this.cameras.main;

        const flash = this.add.rectangle(width / 2, height / 2, width, height, color, intensity);
        flash.setDepth(DEPTH.EFFECTS_FRONT + 5);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 150,
            onComplete: () => flash.destroy()
        });
    }

    updateUI() {
        // Update health bars
        const p1HealthPercent = this.player1.health / this.player1.maxHealth;
        const p2HealthPercent = this.player2.health / this.player2.maxHealth;

        this.p1HealthBar.scaleX = Math.max(0, p1HealthPercent);
        this.p2HealthBar.scaleX = Math.max(0, p2HealthPercent);

        // Update health bar shine width
        this.p1HealthShine.scaleX = Math.max(0, p1HealthPercent);
        this.p2HealthShine.scaleX = Math.max(0, p2HealthPercent);

        // Health bar color based on health with smooth transitions
        if (p1HealthPercent < 0.25) {
            this.p1HealthBar.setFillStyle(0xff0000);
            this.p1HealthGlow.setFillStyle(0xff0000, 0.4);
        } else if (p1HealthPercent < 0.5) {
            this.p1HealthBar.setFillStyle(0xffaa00);
            this.p1HealthGlow.setFillStyle(0xffaa00, 0.3);
        }

        if (p2HealthPercent < 0.25) {
            this.p2HealthBar.setFillStyle(0xff0000);
            this.p2HealthGlow.setFillStyle(0xff0000, 0.4);
        } else if (p2HealthPercent < 0.5) {
            this.p2HealthBar.setFillStyle(0xffaa00);
            this.p2HealthGlow.setFillStyle(0xffaa00, 0.3);
        }

        // Update special meters
        const p1SpecialPercent = this.player1.specialMeter / this.player1.maxSpecialMeter;
        const p2SpecialPercent = this.player2.specialMeter / this.player2.maxSpecialMeter;

        this.p1SpecialBar.width = 150 * p1SpecialPercent;
        this.p2SpecialBar.width = 150 * p2SpecialPercent;

        // Special meter ready effects
        if (p1SpecialPercent >= 1) {
            this.p1SpecialBar.setFillStyle(0xff00ff);
            if (this.p1SpecialGlow.alpha === 0) {
                // Start glow animation when special becomes ready
                this.tweens.add({
                    targets: this.p1SpecialGlow,
                    alpha: { from: 0, to: 0.4 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
            }
        } else {
            this.p1SpecialBar.setFillStyle(0xffff00);
            this.p1SpecialGlow.alpha = 0;
        }

        if (p2SpecialPercent >= 1) {
            this.p2SpecialBar.setFillStyle(0xff00ff);
            if (this.p2SpecialGlow.alpha === 0) {
                this.tweens.add({
                    targets: this.p2SpecialGlow,
                    alpha: { from: 0, to: 0.4 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
            }
        } else {
            this.p2SpecialBar.setFillStyle(0xffff00);
            this.p2SpecialGlow.alpha = 0;
        }
    }

    update(time, delta) {
        // Handle input
        this.handleP1Input();
        this.handleP2Input();

        // Update fighters
        this.player1.update(delta);
        this.player2.update(delta);

        // Update combo systems
        if (this.p1Combo) this.p1Combo.update(delta);
        if (this.p2Combo) this.p2Combo.update(delta);

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
