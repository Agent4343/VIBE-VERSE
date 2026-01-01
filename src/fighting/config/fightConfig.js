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
        // Realistic appearance
        skinTone: 0xd4a574,
        skinShadow: 0xb8956a,
        skinHighlight: 0xe8c090,
        hairColor: 0x1a0a00,
        hairStyle: 'short_spiky',
        eyeColor: 0x442200,
        outfitTop: 0xcc0000,
        outfitBottom: 0x222222,
        gloveColor: 0xff2200,
        bootColor: 0x111111,
        bodyType: 'athletic',
        gender: 'male',
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
        skinTone: 0xf5deb3,
        skinShadow: 0xdcc9a0,
        skinHighlight: 0xfff0d0,
        hairColor: 0xeeeeee,
        hairStyle: 'long_flowing',
        eyeColor: 0x88ccff,
        outfitTop: 0x0066aa,
        outfitBottom: 0x003366,
        gloveColor: 0x00aaff,
        bootColor: 0x004488,
        bodyType: 'slim',
        gender: 'female',
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
        skinTone: 0x8b6f47,
        skinShadow: 0x725a3a,
        skinHighlight: 0xa08050,
        hairColor: 0x0a0010,
        hairStyle: 'hooded',
        eyeColor: 0x9900ff,
        outfitTop: 0x1a0030,
        outfitBottom: 0x110022,
        gloveColor: 0x330066,
        bootColor: 0x110022,
        bodyType: 'athletic',
        gender: 'male',
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
        skinTone: 0xc69c6d,
        skinShadow: 0xa68050,
        skinHighlight: 0xdab080,
        hairColor: 0x333333,
        hairStyle: 'bald',
        eyeColor: 0x444444,
        outfitTop: 0x555555,
        outfitBottom: 0x333333,
        gloveColor: 0x666666,
        bootColor: 0x222222,
        bodyType: 'muscular',
        gender: 'male',
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
        skinTone: 0xe0c8a8,
        skinShadow: 0xc8b090,
        skinHighlight: 0xf5e0c8,
        hairColor: 0x00aa00,
        hairStyle: 'ponytail',
        eyeColor: 0x00ff00,
        outfitTop: 0x004400,
        outfitBottom: 0x002200,
        gloveColor: 0x006600,
        bootColor: 0x003300,
        bodyType: 'slim',
        gender: 'female',
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
        skinTone: 0xf0d5c0,
        skinShadow: 0xd8baa8,
        skinHighlight: 0xffeedd,
        hairColor: 0xff3300,
        hairStyle: 'long_wavy',
        eyeColor: 0xff4400,
        outfitTop: 0xcc0044,
        outfitBottom: 0x880033,
        gloveColor: 0xff0055,
        bootColor: 0x660022,
        bodyType: 'athletic',
        gender: 'female',
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
