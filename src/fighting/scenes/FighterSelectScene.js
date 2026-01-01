/**
 * FighterSelectScene - Character selection screen
 */

import Phaser from 'phaser';
import { FIGHTERS, DEPTH } from '../config/fightConfig.js';

export default class FighterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FighterSelectScene' });
    }

    init(data) {
        this.gameMode = data.mode || 'vs_cpu'; // vs_cpu, vs_player
        this.player1Selection = null;
        this.player2Selection = null;
        this.selectionPhase = 1; // 1 = P1 selecting, 2 = P2 selecting (or auto for CPU)
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.createBackground(width, height);

        // Title
        this.add.text(width / 2, 40, 'SELECT YOUR FIGHTER', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Mode indicator
        const modeText = this.gameMode === 'vs_cpu' ? 'VS CPU' : 'VS PLAYER';
        this.add.text(width / 2, 80, modeText, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffff00'
        }).setOrigin(0.5);

        // Create fighter cards
        this.createFighterCards(width, height);

        // Selection indicators
        this.createSelectionIndicators(width, height);

        // Player prompts
        this.playerPrompt = this.add.text(width / 2, height - 60, 'PLAYER 1 - Choose your fighter!', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Instructions
        this.add.text(width / 2, height - 25, 'Click a fighter to select', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        // Back button
        this.createBackButton();
    }

    createBackground(width, height) {
        // Gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x0a0a1e, 0x0a0a1e, 1);
        bg.fillRect(0, 0, width, height);

        // Decorative elements
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.6));

            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1
            });
        }

        // VS logo in center (faded)
        this.add.text(width / 2, height / 2, 'VS', {
            fontFamily: 'Arial Black',
            fontSize: '120px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.05);
    }

    createFighterCards(width, height) {
        const fighters = Object.values(FIGHTERS);
        const cardWidth = 130;
        const cardHeight = 180;
        const spacing = 15;
        const startX = (width - (fighters.length * (cardWidth + spacing) - spacing)) / 2;
        const cardY = height / 2 - 20;

        this.fighterCards = [];

        fighters.forEach((fighter, index) => {
            const x = startX + index * (cardWidth + spacing) + cardWidth / 2;
            const card = this.createFighterCard(x, cardY, cardWidth, cardHeight, fighter);
            this.fighterCards.push(card);
        });
    }

    createFighterCard(x, y, width, height, fighter) {
        const container = this.add.container(x, y);

        // Card background
        const bg = this.add.graphics();
        bg.fillStyle(0x222244, 0.9);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.lineStyle(3, fighter.color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        container.add(bg);

        // Fighter preview (simplified body)
        const preview = this.add.graphics();
        preview.fillStyle(fighter.color, 1);
        // Body
        preview.fillRoundedRect(-15, -30, 30, 40, 4);
        // Head
        preview.fillCircle(0, -42, 14);
        // Legs
        preview.fillStyle(fighter.accentColor, 1);
        preview.fillRoundedRect(-12, 10, 10, 30, 3);
        preview.fillRoundedRect(2, 10, 10, 30, 3);
        preview.y = -20;
        container.add(preview);

        // Fighter name
        const nameText = this.add.text(0, 55, fighter.name, {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(nameText);

        // Stats bars
        const statsY = 72;
        const barWidth = 60;

        // Speed
        this.createStatBar(container, -25, statsY, 'SPD', fighter.stats.speed, 0x00ff00, barWidth);
        // Power
        this.createStatBar(container, -25, statsY + 12, 'PWR', fighter.stats.power, 0xff0000, barWidth);
        // Defense
        this.createStatBar(container, -25, statsY + 24, 'DEF', fighter.stats.defense, 0x0088ff, barWidth);

        // Make interactive
        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);

        // Hover effects
        hitArea.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
            bg.clear();
            bg.fillStyle(0x333366, 0.95);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
            bg.lineStyle(4, fighter.color, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        });

        hitArea.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
            bg.clear();
            bg.fillStyle(0x222244, 0.9);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
            bg.lineStyle(3, fighter.color, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        });

        hitArea.on('pointerdown', () => {
            this.selectFighter(fighter);
        });

        container.fighterData = fighter;
        return container;
    }

    createStatBar(container, x, y, label, value, color, maxWidth) {
        const labelText = this.add.text(x, y, label, {
            fontFamily: 'Arial',
            fontSize: '9px',
            color: '#888888'
        }).setOrigin(0, 0.5);
        container.add(labelText);

        const barBg = this.add.rectangle(x + 25, y, maxWidth, 6, 0x333333);
        barBg.setOrigin(0, 0.5);
        container.add(barBg);

        const barFill = this.add.rectangle(x + 25, y, (value / 150) * maxWidth, 6, color);
        barFill.setOrigin(0, 0.5);
        container.add(barFill);
    }

    createSelectionIndicators(width, height) {
        // P1 selection display (left side)
        this.p1Display = this.add.container(100, height / 2);
        const p1Bg = this.add.graphics();
        p1Bg.fillStyle(0x004444, 0.5);
        p1Bg.fillRoundedRect(-60, -80, 120, 160, 10);
        p1Bg.lineStyle(3, 0x00ffff, 1);
        p1Bg.strokeRoundedRect(-60, -80, 120, 160, 10);
        this.p1Display.add(p1Bg);

        this.add.text(100, height / 2 - 100, 'P1', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#00ffff'
        }).setOrigin(0.5);

        this.p1NameText = this.add.text(100, height / 2 + 60, '???', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // P2 selection display (right side)
        this.p2Display = this.add.container(width - 100, height / 2);
        const p2Bg = this.add.graphics();
        p2Bg.fillStyle(0x440044, 0.5);
        p2Bg.fillRoundedRect(-60, -80, 120, 160, 10);
        p2Bg.lineStyle(3, 0xff00ff, 1);
        p2Bg.strokeRoundedRect(-60, -80, 120, 160, 10);
        this.p2Display.add(p2Bg);

        this.add.text(width - 100, height / 2 - 100, this.gameMode === 'vs_cpu' ? 'CPU' : 'P2', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ff00ff'
        }).setOrigin(0.5);

        this.p2NameText = this.add.text(width - 100, height / 2 + 60, '???', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    selectFighter(fighter) {
        if (this.selectionPhase === 1) {
            // Player 1 selection
            this.player1Selection = fighter.id;
            this.p1NameText.setText(fighter.name);
            this.showSelectedPreview(this.p1Display, fighter);

            this.tweens.add({
                targets: this.p1Display,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                yoyo: true
            });

            if (this.gameMode === 'vs_cpu') {
                // CPU auto-selects
                this.selectionPhase = 2;
                this.time.delayedCall(500, () => {
                    this.cpuSelectFighter();
                });
            } else {
                // Player 2 selects
                this.selectionPhase = 2;
                this.playerPrompt.setText('PLAYER 2 - Choose your fighter!');
                this.playerPrompt.setColor('#ff00ff');
            }
        } else if (this.selectionPhase === 2 && this.gameMode !== 'vs_cpu') {
            // Player 2 selection
            this.player2Selection = fighter.id;
            this.p2NameText.setText(fighter.name);
            this.showSelectedPreview(this.p2Display, fighter);

            this.tweens.add({
                targets: this.p2Display,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                yoyo: true
            });

            this.startFight();
        }
    }

    cpuSelectFighter() {
        // CPU picks a random fighter (different from player 1)
        const fighters = Object.values(FIGHTERS).filter(f => f.id !== this.player1Selection);
        const cpuFighter = Phaser.Math.RND.pick(fighters);

        this.player2Selection = cpuFighter.id;
        this.p2NameText.setText(cpuFighter.name);
        this.showSelectedPreview(this.p2Display, cpuFighter);

        this.tweens.add({
            targets: this.p2Display,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            yoyo: true
        });

        this.playerPrompt.setText('GET READY TO FIGHT!');
        this.playerPrompt.setColor('#ffff00');

        this.time.delayedCall(1000, () => {
            this.startFight();
        });
    }

    showSelectedPreview(container, fighter) {
        // Remove old preview if exists
        if (container.preview) {
            container.preview.destroy();
        }

        const preview = this.add.graphics();
        preview.fillStyle(fighter.color, 1);
        preview.fillRoundedRect(-15, -35, 30, 45, 5);
        preview.fillCircle(0, -50, 16);
        preview.fillStyle(fighter.accentColor, 1);
        preview.fillRoundedRect(-12, 12, 10, 35, 3);
        preview.fillRoundedRect(2, 12, 10, 35, 3);

        container.add(preview);
        container.preview = preview;
    }

    startFight() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('FightScene', {
                player1: this.player1Selection,
                player2: this.player2Selection,
                mode: this.gameMode
            });
        });
    }

    createBackButton() {
        const backBtn = this.add.text(30, 30, '< BACK', {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: '#888888'
        }).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#888888'));
        backBtn.on('pointerdown', () => {
            this.scene.start('FightMenuScene');
        });
    }
}
