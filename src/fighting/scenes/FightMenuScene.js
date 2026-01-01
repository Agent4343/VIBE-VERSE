/**
 * FightMenuScene - Main menu for the fighting game
 */

import Phaser from 'phaser';
import { FIGHTERS, DEPTH } from '../config/fightConfig.js';

export default class FightMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FightMenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        this.cameras.main.fadeIn(500);

        // Background
        this.createBackground(width, height);

        // Title
        this.createTitle(width);

        // Menu buttons
        this.createMenu(width, height);

        // Fighter silhouettes
        this.createFighterSilhouettes(width, height);

        // Controls info
        this.createControlsInfo(width, height);
    }

    createBackground(width, height) {
        // Dark gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a0a3e, 0x1a0a3e, 1);
        bg.fillRect(0, 0, width, height);

        // Animated particles
        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 2.5);
            const color = Phaser.Math.RND.pick([0xff0066, 0x00ffff, 0xffff00, 0xffffff]);

            const particle = this.add.circle(x, y, size, color, Phaser.Math.FloatBetween(0.2, 0.7));

            this.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(50, 200),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000)
            });
        }

        // Electric effects on sides
        const leftGlow = this.add.graphics();
        leftGlow.fillStyle(0x00ffff, 0.1);
        leftGlow.fillRect(0, 0, 100, height);

        const rightGlow = this.add.graphics();
        rightGlow.fillStyle(0xff00ff, 0.1);
        rightGlow.fillRect(width - 100, 0, 100, height);

        this.tweens.add({
            targets: [leftGlow, rightGlow],
            alpha: { from: 0.3, to: 0.1 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
    }

    createTitle(width) {
        // Main title with glow effect
        const titleShadow = this.add.text(width / 2 + 4, 74, 'NEON FIGHTERS', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.5);

        const title = this.add.text(width / 2, 70, 'NEON FIGHTERS', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#ff0066',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, 120, 'ULTIMATE BATTLE', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Title pulse effect
        this.tweens.add({
            targets: title,
            scale: { from: 1, to: 1.02 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    createMenu(width, height) {
        const menuItems = [
            { text: 'VS CPU', mode: 'vs_cpu', color: '#00ff00' },
            { text: 'VS PLAYER', mode: 'vs_player', color: '#ffff00' },
            { text: 'HOW TO PLAY', action: 'help', color: '#00ffff' },
            { text: 'BACK TO GAMES', action: 'back', color: '#888888' }
        ];

        const startY = height / 2 + 20;
        const spacing = 55;

        menuItems.forEach((item, index) => {
            const y = startY + index * spacing;

            // Button background
            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x222244, 0.8);
            btnBg.fillRoundedRect(width / 2 - 150, y - 20, 300, 45, 8);

            const btn = this.add.text(width / 2, y, item.text, {
                fontFamily: 'Arial Black',
                fontSize: '28px',
                color: item.color
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => {
                btn.setScale(1.1);
                btnBg.clear();
                btnBg.fillStyle(0x444466, 0.9);
                btnBg.fillRoundedRect(width / 2 - 150, y - 20, 300, 45, 8);
                btnBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(item.color).color, 1);
                btnBg.strokeRoundedRect(width / 2 - 150, y - 20, 300, 45, 8);
            });

            btn.on('pointerout', () => {
                btn.setScale(1);
                btnBg.clear();
                btnBg.fillStyle(0x222244, 0.8);
                btnBg.fillRoundedRect(width / 2 - 150, y - 20, 300, 45, 8);
            });

            btn.on('pointerdown', () => {
                if (item.action === 'help') {
                    this.showHelpPanel(width, height);
                } else if (item.action === 'back') {
                    this.scene.start('MenuScene');
                } else {
                    this.scene.start('FighterSelectScene', { mode: item.mode });
                }
            });
        });
    }

    createFighterSilhouettes(width, height) {
        // Left fighter silhouette
        const leftFighter = this.add.graphics();
        leftFighter.fillStyle(0x00ffff, 0.15);
        leftFighter.fillRoundedRect(-10, height - 280, 35, 55, 5);
        leftFighter.fillCircle(7, height - 295, 20);
        leftFighter.fillRoundedRect(-15, height - 225, 12, 40, 3);
        leftFighter.fillRoundedRect(18, height - 225, 12, 40, 3);
        leftFighter.x = 80;

        // Right fighter silhouette
        const rightFighter = this.add.graphics();
        rightFighter.fillStyle(0xff00ff, 0.15);
        rightFighter.fillRoundedRect(-10, height - 280, 35, 55, 5);
        rightFighter.fillCircle(7, height - 295, 20);
        rightFighter.fillRoundedRect(-15, height - 225, 12, 40, 3);
        rightFighter.fillRoundedRect(18, height - 225, 12, 40, 3);
        rightFighter.x = width - 100;
        rightFighter.scaleX = -1;

        // Animate fighters
        this.tweens.add({
            targets: leftFighter,
            y: -10,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        this.tweens.add({
            targets: rightFighter,
            y: -10,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 400
        });
    }

    createControlsInfo(width, height) {
        this.add.text(width / 2, height - 30, 'P1: WASD + J/K/L  |  P2: Arrows + 1/2/3', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);
    }

    showHelpPanel(width, height) {
        // Overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        overlay.setDepth(DEPTH.OVERLAY);
        overlay.setInteractive();

        // Help panel
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a3e, 0.95);
        panel.fillRoundedRect(width / 2 - 300, height / 2 - 200, 600, 400, 15);
        panel.lineStyle(3, 0x00ffff, 1);
        panel.strokeRoundedRect(width / 2 - 300, height / 2 - 200, 600, 400, 15);
        panel.setDepth(DEPTH.OVERLAY + 1);

        // Title
        const helpTitle = this.add.text(width / 2, height / 2 - 170, 'HOW TO PLAY', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#00ffff'
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 2);

        // Controls
        const controlsText = `
PLAYER 1 CONTROLS:
  Move: W/A/S/D
  Punch: J  |  Kick: K  |  Special: L
  Block: Hold S  |  Jump: W

PLAYER 2 CONTROLS:
  Move: Arrow Keys
  Punch: 1  |  Kick: 2  |  Special: 3
  Block: Hold Down  |  Jump: Up

SPECIAL MOVES:
  Uppercut: Up + Punch
  Sweep: Down + Punch
  Special Attack: L/3 (when meter is full)

Win ${2} rounds to win the match!
        `;

        const controls = this.add.text(width / 2, height / 2 + 20, controlsText, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            align: 'left',
            lineSpacing: 4
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 2);

        // Close button
        const closeBtn = this.add.text(width / 2, height / 2 + 170, 'CLOSE', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ff0066'
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 2)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => closeBtn.setScale(1.1))
        .on('pointerout', () => closeBtn.setScale(1))
        .on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            helpTitle.destroy();
            controls.destroy();
            closeBtn.destroy();
        });
    }
}
