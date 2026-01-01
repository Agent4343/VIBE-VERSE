/**
 * Fighting Game Configuration
 */

export const FIGHT_CONFIG = {
    // Game dimensions
    width: 960,
    height: 540,

    // Match settings
    roundsToWin: 2,
    roundTime: 99,

    // Physics
    gravity: 1800,
    groundY: 480,

    // Fighter defaults
    fighter: {
        speed: 300,
        jumpForce: 600,
        health: 100
    },

    // Damage values
    damage: {
        punch: 8,
        kick: 12,
        uppercut: 15,
        sweep: 10,
        special: 25
    },

    // Hitbox durations (ms)
    attackDuration: {
        punch: 150,
        kick: 200,
        uppercut: 250,
        sweep: 300,
        special: 400
    },

    // Recovery frames (ms)
    recovery: {
        light: 200,
        medium: 350,
        heavy: 500,
        hit: 300,
        block: 150
    }
};

export const FIGHTERS = {
    blaze: {
        id: 'blaze',
        name: 'Blaze',
        description: 'Balanced fighter with fire attacks',
        color: 0xff4400,
        accentColor: 0xffaa00,
        stats: {
            speed: 100,
            power: 100,
            defense: 100
        },
        special: {
            name: 'Inferno Punch',
            damage: 25,
            color: 0xff6600
        }
    },
    frost: {
        id: 'frost',
        name: 'Frost',
        description: 'Fast fighter with ice attacks',
        color: 0x00aaff,
        accentColor: 0x88ffff,
        stats: {
            speed: 130,
            power: 80,
            defense: 90
        },
        special: {
            name: 'Glacier Strike',
            damage: 20,
            color: 0x00ffff
        }
    },
    shadow: {
        id: 'shadow',
        name: 'Shadow',
        description: 'Tricky fighter with dark moves',
        color: 0x6600ff,
        accentColor: 0xaa00ff,
        stats: {
            speed: 120,
            power: 90,
            defense: 90
        },
        special: {
            name: 'Void Blast',
            damage: 22,
            color: 0x9900ff
        }
    },
    titan: {
        id: 'titan',
        name: 'Titan',
        description: 'Slow but powerful brawler',
        color: 0x888888,
        accentColor: 0xffcc00,
        stats: {
            speed: 70,
            power: 140,
            defense: 130
        },
        special: {
            name: 'Meteor Slam',
            damage: 35,
            color: 0xff8800
        }
    },
    viper: {
        id: 'viper',
        name: 'Viper',
        description: 'Quick striker with poison',
        color: 0x00ff44,
        accentColor: 0x88ff00,
        stats: {
            speed: 140,
            power: 85,
            defense: 75
        },
        special: {
            name: 'Toxic Fang',
            damage: 18,
            color: 0x00ff00
        }
    },
    phoenix: {
        id: 'phoenix',
        name: 'Phoenix',
        description: 'Aerial specialist with rebirth',
        color: 0xff0066,
        accentColor: 0xff88aa,
        stats: {
            speed: 110,
            power: 95,
            defense: 95
        },
        special: {
            name: 'Rising Flame',
            damage: 28,
            color: 0xff4488
        }
    }
};

export const DEPTH = {
    BACKGROUND: 0,
    ARENA: 10,
    EFFECTS_BACK: 20,
    FIGHTERS: 50,
    EFFECTS_FRONT: 80,
    UI: 100,
    OVERLAY: 200
};
