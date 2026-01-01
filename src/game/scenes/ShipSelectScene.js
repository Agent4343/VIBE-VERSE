/**
 * ShipSelectScene - Ship customization and unlock screen
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';
import { PlayerData, SHIPS } from '../utils/PlayerData.js';

export default class ShipSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipSelectScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;

        this.cameras.main.fadeIn(500);

        // Background
        this.createBackground(width, height);

        // Title
        this.add.text(centerX, 40, '🚀 SHIP HANGAR', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Coins display
        this.coinsText = this.add.text(width - 20, 20, `💰 ${PlayerData.data.coins}`, {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0).setDepth(DEPTH.UI);

        // Ship grid
        this.createShipGrid(centerX, height);

        // Back button
        this.add.text(20, 20, '← Back', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#888888'
        }).setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', function() { this.setColor('#ffffff'); })
            .on('pointerout', function() { this.setColor('#888888'); })
            .on('pointerdown', () => {
                this.cameras.main.fadeOut(300);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('MenuScene');
                });
            });

        // Current ship indicator
        this.updateCurrentShipDisplay(centerX, height);
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
        bg.fillRect(0, 0, width, height);

        // Stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 0.5;
            const star = this.add.circle(x, y, size, 0xffffff, Math.random() * 0.8 + 0.2);

            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: 0.1 },
                duration: Math.random() * 2000 + 1000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    createShipGrid(centerX, height) {
        const ships = Object.values(SHIPS);
        const cols = 3;
        const cellWidth = 200;
        const cellHeight = 180;
        const startX = centerX - ((cols - 1) * cellWidth) / 2;
        const startY = 120;

        ships.forEach((ship, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * cellWidth;
            const y = startY + row * cellHeight;

            this.createShipCard(x, y, ship);
        });
    }

    createShipCard(x, y, ship) {
        const isUnlocked = PlayerData.isShipUnlocked(ship.id);
        const isSelected = PlayerData.data.currentShip === ship.id;

        // Card background
        const card = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 180, 160, isUnlocked ? 0x1a1a3e : 0x0a0a1e, 0.9);
        bg.setStrokeStyle(3, isSelected ? 0x00ff00 : (isUnlocked ? 0x00ffff : 0x444444));
        card.add(bg);

        // Ship preview
        const shipPreview = this.createShipPreview(ship, isUnlocked);
        card.add(shipPreview);

        // Ship name
        const nameText = this.add.text(0, -55, ship.name, {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: isUnlocked ? '#ffffff' : '#666666'
        }).setOrigin(0.5);
        card.add(nameText);

        // Description
        const descText = this.add.text(0, 45, ship.description, {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#888888',
            align: 'center',
            wordWrap: { width: 160 }
        }).setOrigin(0.5);
        card.add(descText);

        if (!isUnlocked) {
            // Lock icon and cost
            const lockText = this.add.text(0, -10, '🔒', {
                fontSize: '32px'
            }).setOrigin(0.5).setAlpha(0.7);
            card.add(lockText);

            const costText = this.add.text(0, 65, `💰 ${ship.cost}`, {
                fontFamily: 'Arial Black',
                fontSize: '16px',
                color: PlayerData.data.coins >= ship.cost ? '#ffd700' : '#ff4444'
            }).setOrigin(0.5);
            card.add(costText);

            // Buy button
            if (PlayerData.data.coins >= ship.cost) {
                bg.setInteractive({ useHandCursor: true })
                    .on('pointerover', () => bg.setStrokeStyle(3, 0xffd700))
                    .on('pointerout', () => bg.setStrokeStyle(3, 0x444444))
                    .on('pointerdown', () => this.buyShip(ship, card));
            }
        } else if (!isSelected) {
            // Select button
            bg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => bg.setStrokeStyle(3, 0x00ff00))
                .on('pointerout', () => bg.setStrokeStyle(3, 0x00ffff))
                .on('pointerdown', () => this.selectShip(ship));
        } else {
            // Equipped indicator
            const equippedText = this.add.text(0, 65, '✓ EQUIPPED', {
                fontFamily: 'Arial Black',
                fontSize: '14px',
                color: '#00ff00'
            }).setOrigin(0.5);
            card.add(equippedText);
        }

        card.setDepth(DEPTH.UI);
    }

    createShipPreview(ship, isUnlocked) {
        const graphics = this.add.graphics();
        const color = isUnlocked ? ship.color : 0x444444;

        // Ship body
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(0, -20);
        graphics.lineTo(-15, 15);
        graphics.lineTo(15, 15);
        graphics.closePath();
        graphics.fill();

        // Cockpit
        graphics.fillStyle(isUnlocked ? 0x0088ff : 0x222222, 1);
        graphics.fillCircle(0, 0, 6);

        // Wings
        graphics.fillStyle(color, 0.8);
        graphics.fillTriangle(-12, 10, -20, 20, -5, 10);
        graphics.fillTriangle(12, 10, 20, 20, 5, 10);

        return graphics;
    }

    buyShip(ship, card) {
        if (PlayerData.unlockShip(ship.id)) {
            // Success animation
            this.cameras.main.flash(200, 255, 215, 0);

            // Play sound
            this.playPurchaseSound();

            // Refresh scene
            this.scene.restart();
        }
    }

    selectShip(ship) {
        PlayerData.selectShip(ship.id);

        // Refresh scene
        this.scene.restart();
    }

    updateCurrentShipDisplay(centerX, height) {
        const currentShip = PlayerData.getCurrentShip();

        this.add.text(centerX, height - 40, `Current: ${currentShip.name}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#00ffff'
        }).setOrigin(0.5).setDepth(DEPTH.UI);
    }

    playPurchaseSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1047, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}
