/**
 * Cosmic Cadet Academy - Phaser Game Configuration
 *
 * Central configuration for the Phaser 3 game engine.
 * Defines rendering options, physics settings, and scale management.
 */

import Phaser from 'phaser';

/**
 * Base game configuration object
 * @type {Phaser.Types.Core.GameConfig}
 */
export const gameConfig = {
    // Rendering
    type: Phaser.AUTO,  // WebGL with Canvas fallback
    parent: 'game-container',
    backgroundColor: '#0a0a2e',  // Deep space blue

    // Base dimensions (16:9 aspect ratio) - smaller for mobile
    width: 800,
    height: 450,

    // Responsive scaling - RESIZE mode works better on mobile
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },

    // Physics configuration
    physics: {
        default: 'arcade',
        arcade: {
            // No gravity by default (space environment)
            gravity: { y: 0 },
            // Collision tile bias for better edge handling
            tileBias: 16
        }
    },

    // Rendering options
    render: {
        pixelArt: false,           // Smooth scaling for cartoon art
        antialias: true,           // Enable antialiasing
        roundPixels: true,         // Prevent subpixel rendering artifacts
        transparent: false,
        powerPreference: 'high-performance'
    },

    // Audio configuration
    audio: {
        disableWebAudio: false,    // Use Web Audio API for better control
        noAudio: false
    },

    // Input configuration
    input: {
        activePointers: 3,         // Support multi-touch
        touch: {
            capture: true
        }
    },

    // Performance
    fps: {
        target: 60,
        forceSetTimeOut: false
    },

    // Scenes will be added in main.js
    scene: []
};

/**
 * Game constants used throughout the application
 */
export const GAME_CONSTANTS = {
    // Dimensions
    WORLD_WIDTH: 2560,
    WORLD_HEIGHT: 1440,
    TILE_SIZE: 64,

    // Gameplay
    PLAYER_SPEED: 300,
    PLAYER_BOOST_SPEED: 500,
    PLAYER_INITIAL_HEALTH: 3,
    STAR_COLLECTION_RADIUS: 50,

    // Scoring
    BRONZE_STAR_VALUE: 1,
    SILVER_STAR_VALUE: 5,
    GOLD_STAR_VALUE: 10,
    STELLAR_CORE_VALUE: 50,

    // Timing
    HINT_COOLDOWN: 30000,      // 30 seconds between hints
    LEVEL_TRANSITION_DELAY: 1500,

    // API
    API_BASE_URL: process.env.API_URL || 'http://localhost:3001/api',
    SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3001'
};

/**
 * Depth layers for consistent z-ordering
 */
export const DEPTH = {
    BACKGROUND: 0,
    TILES: 10,
    DECORATIONS: 20,
    COLLECTIBLES: 30,
    ENEMIES: 40,
    PLAYER: 50,
    EFFECTS: 60,
    UI: 100,
    OVERLAY: 200
};

export default gameConfig;
