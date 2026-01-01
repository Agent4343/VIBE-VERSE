/**
 * PauseScene - Pause Menu Overlay
 *
 * Displayed over the game when paused.
 * Options: Resume, Settings, Quit to Menu
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    init(data) {
        this.parentScene = data.parentScene || 'GameScene';
        this.levelKey = data.levelKey;
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Semi-transparent overlay
        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.7)
            .setDepth(DEPTH.OVERLAY);

        // Pause panel
        const panel = this.add.image(centerX, centerY, 'panel-main')
            .setDepth(DEPTH.OVERLAY + 1)
            .setScale(0);

        this.tweens.add({
            targets: panel,
            scale: 0.8,
            duration: 300,
            ease: 'Back.out'
        });

        // Title
        this.add.text(centerX, centerY - 120, 'PAUSED', {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY + 2);

        // Menu buttons
        this.createButton(centerX, centerY - 30, 'RESUME', () => this.resume());
        this.createButton(centerX, centerY + 40, 'SETTINGS', () => this.openSettings());
        this.createButton(centerX, centerY + 110, 'QUIT', () => this.quitToMenu());

        // Keyboard shortcut
        this.input.keyboard.once('keydown-ESC', () => this.resume());
    }

    createButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        })
            .setOrigin(0.5)
            .setDepth(DEPTH.OVERLAY + 2)
            .setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            btn.setScale(1.1);
            btn.setColor('#ffffff');
        });

        btn.on('pointerout', () => {
            btn.setScale(1);
            btn.setColor('#00ffff');
        });

        btn.on('pointerdown', () => {
            this.sound.play('sfx-button', { volume: 0.5 });
            callback();
        });
    }

    resume() {
        this.scene.stop();
        this.scene.resume(this.parentScene);
    }

    openSettings() {
        // Could launch settings as overlay or transition
        this.scene.stop();
        this.scene.start('SettingsScene');
    }

    quitToMenu() {
        this.scene.stop(this.parentScene);
        this.scene.stop();
        this.scene.start('MenuScene');
    }
}
