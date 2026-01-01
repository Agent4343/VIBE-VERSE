/**
 * SettingsScene - Game Settings
 *
 * Allows players to adjust:
 * - Music and SFX volume
 * - Show hints toggle
 * - Vibration toggle
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;

        // Fade in
        this.cameras.main.fadeIn(500);

        // Background (procedural)
        this.createBackground(width, height);

        // Title
        this.add.text(centerX, 60, 'SETTINGS', {
            fontFamily: 'Arial Black',
            fontSize: '42px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Get current settings
        this.settings = this.registry.get('settings') || { musicVolume: 0.7, sfxVolume: 0.7, showHints: true, vibration: true };

        // Create settings panels
        this.createSoundSettings(centerX, 150);
        this.createGameplaySettings(centerX, 350);

        // Back button
        this.createBackButton();
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
        bg.fillRect(0, 0, width, height);
        bg.setDepth(DEPTH.BACKGROUND);

        for (let i = 0; i < 80; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const star = this.add.circle(x, y, Math.random() * 1.5 + 0.5, 0xffffff, Math.random() * 0.6 + 0.2);
            star.setDepth(DEPTH.BACKGROUND + 1);
        }
    }

    createSoundSettings(x, startY) {
        // Section title
        this.add.text(x, startY, 'SOUND', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#00ffff'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Music volume
        this.add.text(x - 150, startY + 50, 'Music Volume', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0, 0.5).setDepth(DEPTH.UI);

        this.createSlider(x + 100, startY + 50, this.settings.musicVolume, (value) => {
            this.settings.musicVolume = value;
            this.updateSettings();
        });

        // SFX volume
        this.add.text(x - 150, startY + 100, 'Sound Effects', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0, 0.5).setDepth(DEPTH.UI);

        this.createSlider(x + 100, startY + 100, this.settings.sfxVolume, (value) => {
            this.settings.sfxVolume = value;
            this.updateSettings();
        });
    }

    createGameplaySettings(x, startY) {
        // Section title
        this.add.text(x, startY, 'GAMEPLAY', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#00ffff'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Show hints toggle
        this.add.text(x - 150, startY + 50, 'Show Hints', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0, 0.5).setDepth(DEPTH.UI);

        this.createToggle(x + 100, startY + 50, this.settings.showHints, (value) => {
            this.settings.showHints = value;
            this.updateSettings();
        });

        // Vibration toggle
        this.add.text(x - 150, startY + 100, 'Vibration', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0, 0.5).setDepth(DEPTH.UI);

        this.createToggle(x + 100, startY + 100, this.settings.vibration, (value) => {
            this.settings.vibration = value;
            this.updateSettings();
        });
    }

    createSlider(x, y, initialValue, onChange) {
        const width = 150;
        const height = 10;

        // Background track
        const track = this.add.rectangle(x, y, width, height, 0x333333)
            .setDepth(DEPTH.UI);

        // Fill bar
        const fill = this.add.rectangle(
            x - width / 2 + (width * initialValue) / 2,
            y,
            width * initialValue,
            height,
            0x00ffff
        ).setOrigin(0.5).setDepth(DEPTH.UI + 1);

        // Handle
        const handle = this.add.circle(
            x - width / 2 + width * initialValue,
            y,
            12,
            0xffffff
        ).setDepth(DEPTH.UI + 2).setInteractive({ draggable: true });

        handle.on('drag', (pointer, dragX) => {
            const minX = x - width / 2;
            const maxX = x + width / 2;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
            handle.x = clampedX;

            const value = (clampedX - minX) / width;
            fill.width = width * value;
            fill.x = minX + fill.width / 2;

            onChange(value);
        });
    }

    createToggle(x, y, initialValue, onChange) {
        const width = 80;
        const height = 36;

        // Background
        const bg = this.add.rectangle(x, y, width, height, initialValue ? 0x00ff88 : 0x666666, 1)
            .setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true });

        // Handle
        const handle = this.add.circle(
            initialValue ? x + width / 4 : x - width / 4,
            y,
            14,
            0xffffff
        ).setDepth(DEPTH.UI + 1);

        // Text
        const text = this.add.text(x, y, initialValue ? 'ON' : 'OFF', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#000000'
        }).setOrigin(0.5).setDepth(DEPTH.UI + 1);

        bg.on('pointerdown', () => {
            const newValue = !bg.getData('value');
            bg.setData('value', newValue);
            bg.setFillStyle(newValue ? 0x00ff88 : 0x666666);
            handle.x = newValue ? x + width / 4 : x - width / 4;
            text.setText(newValue ? 'ON' : 'OFF');
            onChange(newValue);
        });

        bg.setData('value', initialValue);
    }

    createBackButton() {
        this.add.text(20, 20, '← Back', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#888888'
        }).setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', function() { this.setColor('#ffffff'); })
            .on('pointerout', function() { this.setColor('#888888'); })
            .on('pointerdown', () => {
                this.goBack();
            });
    }

    updateSettings() {
        this.registry.set('settings', this.settings);
        // Save to local storage
        import('../utils/SaveManager.js').then(module => {
            module.default.saveSettings(this.settings);
        });
    }

    goBack() {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }
}
