/**
 * FrameData - Attack timing and properties
 * Defines startup, active, and recovery frames for all moves
 *
 * Frame = 1/60th of a second (standard fighting game timing)
 * Startup: Frames before attack becomes active (vulnerable)
 * Active: Frames where hitbox is out (can hit)
 * Recovery: Frames after active before can act again
 *
 * On Block: Frame advantage when blocked
 * On Hit: Frame advantage when hits
 * Positive = attacker recovers first, Negative = defender recovers first
 */

export const FRAME_DATA = {
    // Light attacks - fast startup, safe on block
    punch: {
        startup: 4,
        active: 3,
        recovery: 8,
        totalFrames: 15,
        onBlock: -2,
        onHit: 4,
        damage: 8,
        hitstun: 12,
        blockstun: 8,
        pushback: 20,
        type: 'high',
        cancelable: true,
        specialCancelable: true
    },

    // Medium attacks - balanced
    kick: {
        startup: 7,
        active: 4,
        recovery: 12,
        totalFrames: 23,
        onBlock: -4,
        onHit: 6,
        damage: 12,
        hitstun: 16,
        blockstun: 10,
        pushback: 35,
        type: 'mid',
        cancelable: true,
        specialCancelable: true
    },

    // Heavy attacks - slow but powerful
    uppercut: {
        startup: 10,
        active: 5,
        recovery: 18,
        totalFrames: 33,
        onBlock: -8,
        onHit: 0,  // Launches, so different
        damage: 15,
        hitstun: 0,  // Launches instead
        blockstun: 14,
        pushback: 25,
        type: 'mid',
        launcher: true,
        launchForce: 300,
        cancelable: false,
        specialCancelable: true
    },

    // Low attack - must block low
    sweep: {
        startup: 9,
        active: 6,
        recovery: 20,
        totalFrames: 35,
        onBlock: -12,
        onHit: 0,  // Knockdown
        damage: 10,
        hitstun: 0,  // Knockdown instead
        blockstun: 12,
        pushback: 40,
        type: 'low',
        knockdown: true,
        cancelable: false,
        specialCancelable: false
    },

    // Special moves - character specific
    special: {
        startup: 15,
        active: 8,
        recovery: 25,
        totalFrames: 48,
        onBlock: -15,
        onHit: 0,  // Usually knockdown
        damage: 25,
        hitstun: 0,
        blockstun: 20,
        pushback: 80,
        type: 'mid',
        knockdown: true,
        invincible: { start: 0, end: 8 },  // Invincible frames during startup
        cancelable: false,
        specialCancelable: false
    },

    // Movement data
    jump: {
        startup: 3,
        airborne: 30,
        recovery: 4,
        totalFrames: 37
    },

    // Blocking data
    block: {
        startup: 1,  // Near instant
        recovery: 4, // Recovery after releasing block
        standingProtects: ['high', 'mid'],
        crouchingProtects: ['low', 'mid']
    }
};

/**
 * Get frame data for an attack type
 */
export function getFrameData(attackType) {
    return FRAME_DATA[attackType] || FRAME_DATA.punch;
}

/**
 * Calculate total duration in milliseconds
 */
export function getAttackDuration(attackType) {
    const data = getFrameData(attackType);
    return (data.totalFrames / 60) * 1000;
}

/**
 * Check if attack is in startup phase
 */
export function isInStartup(attackType, currentFrame) {
    const data = getFrameData(attackType);
    return currentFrame < data.startup;
}

/**
 * Check if attack is in active phase (hitbox out)
 */
export function isActive(attackType, currentFrame) {
    const data = getFrameData(attackType);
    return currentFrame >= data.startup &&
           currentFrame < (data.startup + data.active);
}

/**
 * Check if attack is in recovery phase
 */
export function isInRecovery(attackType, currentFrame) {
    const data = getFrameData(attackType);
    return currentFrame >= (data.startup + data.active);
}

/**
 * Get attack progress as 0-1
 */
export function getAttackProgress(attackType, currentFrame) {
    const data = getFrameData(attackType);
    return Math.min(1, currentFrame / data.totalFrames);
}

/**
 * Check if attack can be cancelled at current frame
 */
export function canCancel(attackType, currentFrame) {
    const data = getFrameData(attackType);
    if (!data.cancelable) return false;

    // Can cancel during active and early recovery
    const cancelStart = data.startup;
    const cancelEnd = data.startup + data.active + Math.floor(data.recovery * 0.5);

    return currentFrame >= cancelStart && currentFrame <= cancelEnd;
}

/**
 * Check if special cancel is available
 */
export function canSpecialCancel(attackType, currentFrame) {
    const data = getFrameData(attackType);
    if (!data.specialCancelable) return false;

    // Special cancel window is during hit confirm
    const cancelStart = data.startup + Math.floor(data.active * 0.5);
    const cancelEnd = data.startup + data.active + Math.floor(data.recovery * 0.3);

    return currentFrame >= cancelStart && currentFrame <= cancelEnd;
}

/**
 * Calculate hitstun duration in frames
 */
export function getHitstun(attackType) {
    const data = getFrameData(attackType);
    return data.hitstun;
}

/**
 * Calculate blockstun duration in frames
 */
export function getBlockstun(attackType) {
    const data = getFrameData(attackType);
    return data.blockstun;
}

/**
 * Check if attack has invincibility at current frame
 */
export function hasInvincibility(attackType, currentFrame) {
    const data = getFrameData(attackType);
    if (!data.invincible) return false;

    return currentFrame >= data.invincible.start &&
           currentFrame <= data.invincible.end;
}

/**
 * Convert frames to milliseconds
 */
export function framesToMs(frames) {
    return (frames / 60) * 1000;
}

/**
 * Convert milliseconds to frames
 */
export function msToFrames(ms) {
    return Math.floor((ms / 1000) * 60);
}
