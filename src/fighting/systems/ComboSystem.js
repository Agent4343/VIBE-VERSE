/**
 * ComboSystem - Input buffering and combo chains
 * Handles attack queuing, combo detection, and cancel windows
 */

export default class ComboSystem {
    constructor(fighter) {
        this.fighter = fighter;

        // Input buffer - stores recent inputs
        this.inputBuffer = [];
        this.bufferWindow = 150; // ms to keep inputs
        this.maxBufferSize = 10;

        // Combo tracking
        this.currentCombo = [];
        this.comboCount = 0;
        this.lastHitTime = 0;
        this.comboTimeout = 1000; // ms before combo resets

        // Cancel windows - when attacks can chain into others
        this.cancelWindows = {
            punch: { start: 0.4, end: 0.8 },    // Can cancel 40-80% through punch
            kick: { start: 0.5, end: 0.85 },
            uppercut: { start: 0.6, end: 0.9 },
            sweep: { start: 0.7, end: 0.95 },
            special: { start: 0, end: 0 }        // Special can't be cancelled
        };

        // Combo routes - valid attack chains
        this.comboRoutes = {
            punch: ['punch', 'kick', 'uppercut', 'special'],
            kick: ['punch', 'sweep', 'special'],
            uppercut: ['special'],
            sweep: ['punch', 'kick'],
            special: []
        };

        // Damage scaling - reduces damage in long combos
        this.damageScaling = [
            1.0,   // Hit 1: 100%
            1.0,   // Hit 2: 100%
            0.9,   // Hit 3: 90%
            0.8,   // Hit 4: 80%
            0.7,   // Hit 5: 70%
            0.6,   // Hit 6: 60%
            0.5    // Hit 7+: 50%
        ];

        // Queued attack
        this.queuedAttack = null;
    }

    // Buffer an input
    bufferInput(attackType) {
        const now = Date.now();

        // Clean old inputs
        this.inputBuffer = this.inputBuffer.filter(
            input => now - input.time < this.bufferWindow
        );

        // Add new input
        this.inputBuffer.push({
            type: attackType,
            time: now
        });

        // Trim buffer
        if (this.inputBuffer.length > this.maxBufferSize) {
            this.inputBuffer.shift();
        }

        // Try to queue the attack
        this.tryQueueAttack(attackType);
    }

    // Try to queue an attack for execution
    tryQueueAttack(attackType) {
        const fighter = this.fighter;

        // If fighter is idle, execute immediately
        if (fighter.canAct && fighter.state !== 'attacking') {
            return false; // Let normal attack happen
        }

        // If attacking, check if we can cancel
        if (fighter.state === 'attacking' && fighter.currentAttack) {
            const currentAttack = fighter.currentAttack;
            const window = this.cancelWindows[currentAttack.type];

            if (window && this.canCancelInto(currentAttack.type, attackType)) {
                this.queuedAttack = attackType;
                return true;
            }
        }

        return false;
    }

    // Check if current attack can cancel into next
    canCancelInto(currentType, nextType) {
        const routes = this.comboRoutes[currentType];
        return routes && routes.includes(nextType);
    }

    // Check and execute queued attack
    checkQueuedAttack(attackProgress) {
        if (!this.queuedAttack) return null;

        const fighter = this.fighter;
        const currentType = fighter.currentAttack?.type;

        if (!currentType) return null;

        const window = this.cancelWindows[currentType];

        // Check if we're in the cancel window
        if (attackProgress >= window.start && attackProgress <= window.end) {
            const attack = this.queuedAttack;
            this.queuedAttack = null;
            return attack;
        }

        return null;
    }

    // Register a successful hit
    registerHit(damage, attackType) {
        const now = Date.now();

        // Check if combo continues or resets
        if (now - this.lastHitTime > this.comboTimeout) {
            this.resetCombo();
        }

        this.comboCount++;
        this.lastHitTime = now;

        this.currentCombo.push({
            type: attackType,
            damage: damage,
            time: now
        });

        return {
            count: this.comboCount,
            scaledDamage: this.getScaledDamage(damage),
            isNewRecord: false // Could track per-match records
        };
    }

    // Get damage with combo scaling applied
    getScaledDamage(baseDamage) {
        const scaleIndex = Math.min(this.comboCount - 1, this.damageScaling.length - 1);
        const scale = this.damageScaling[Math.max(0, scaleIndex)];
        return Math.floor(baseDamage * scale);
    }

    // Get current combo scaling multiplier
    getCurrentScaling() {
        const scaleIndex = Math.min(this.comboCount, this.damageScaling.length - 1);
        return this.damageScaling[Math.max(0, scaleIndex)];
    }

    // Reset combo state
    resetCombo() {
        this.comboCount = 0;
        this.currentCombo = [];
        this.queuedAttack = null;
    }

    // Clear input buffer
    clearBuffer() {
        this.inputBuffer = [];
        this.queuedAttack = null;
    }

    // Get buffered input if any
    getBufferedInput() {
        const now = Date.now();

        // Find most recent valid input
        for (let i = this.inputBuffer.length - 1; i >= 0; i--) {
            const input = this.inputBuffer[i];
            if (now - input.time < this.bufferWindow) {
                return input.type;
            }
        }

        return null;
    }

    // Update - call each frame
    update(delta) {
        const now = Date.now();

        // Reset combo if timed out
        if (this.comboCount > 0 && now - this.lastHitTime > this.comboTimeout) {
            this.resetCombo();
        }

        // Clean old buffer entries
        this.inputBuffer = this.inputBuffer.filter(
            input => now - input.time < this.bufferWindow
        );
    }

    // Get combo display info
    getComboInfo() {
        if (this.comboCount < 2) return null;

        return {
            count: this.comboCount,
            totalDamage: this.currentCombo.reduce((sum, hit) => sum + hit.damage, 0),
            scaling: this.getCurrentScaling(),
            moves: this.currentCombo.map(hit => hit.type)
        };
    }
}
