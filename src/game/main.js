/**
 * Cosmic Cadet Academy - Main Entry Point
 *
 * This file initializes the Phaser 3 game instance and registers all scenes.
 * It serves as the bootstrap for the entire game application.
 */

import Phaser from 'phaser';

// Scene imports
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import LevelScene from './scenes/LevelScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import PauseScene from './scenes/PauseScene.js';

// Configuration
import { gameConfig } from './config/gameConfig.js';

/**
 * Initialize the Phaser game with all scenes
 */
function initGame() {
    // Add scenes to configuration
    const config = {
        ...gameConfig,
        scene: [
            BootScene,        // First scene - minimal loading
            PreloadScene,     // Asset loading with progress bar
            MenuScene,        // Main menu
            LevelScene,       // Level selection
            GameScene,        // Core gameplay
            LeaderboardScene, // Online leaderboards
            SettingsScene,    // Options
            PauseScene        // Pause overlay
        ]
    };

    // Create Phaser game instance
    const game = new Phaser.Game(config);

    // Expose game instance for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
        window.__COSMIC_GAME__ = game;
    }

    // Handle visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.scene.pause('GameScene');
        } else {
            // Don't auto-resume - let player do it
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });

    return game;
}

// Initialize when DOM is ready
if (document.readyState === 'complete') {
    initGame();
} else {
    window.addEventListener('load', initGame);
}

export default initGame;
