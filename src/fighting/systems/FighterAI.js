/**
 * FighterAI - Smart CPU opponent with patterns and difficulty scaling
 * Uses behavior trees and reaction-based decision making
 */

import { FRAME_DATA, getFrameData, isInRecovery } from './FrameData.js';

export default class FighterAI {
    constructor(fighter, difficulty = 'normal') {
        this.fighter = fighter;
        this.opponent = null;
        this.difficulty = difficulty;

        // AI parameters based on difficulty
        this.params = this.getDifficultyParams(difficulty);

        // Decision timing
        this.lastDecisionTime = 0;
        this.decisionCooldown = this.params.reactionTime;

        // Pattern recognition
        this.opponentHistory = [];
        this.maxHistorySize = 20;

        // State
        this.currentBehavior = 'neutral';
        this.behaviorTimer = 0;
        this.aggressionLevel = 0.5;

        // Combo tracking
        this.comboAttemptTimer = 0;
        this.inCombo = false;

        // Personality traits (randomized)
        this.personality = this.generatePersonality();
    }

    getDifficultyParams(difficulty) {
        const params = {
            easy: {
                reactionTime: 400,      // Slow reactions (ms)
                blockChance: 0.3,       // 30% block on reaction
                punishChance: 0.2,      // 20% punish on recovery
                comboChance: 0.1,       // 10% attempt combos
                specialChance: 0.05,    // 5% use special
                whiffPunishChance: 0.1, // 10% punish whiffs
                optimalRange: 0.3,      // Less optimal spacing
                inputDelay: 200         // Slower inputs
            },
            normal: {
                reactionTime: 250,
                blockChance: 0.5,
                punishChance: 0.4,
                comboChance: 0.3,
                specialChance: 0.15,
                whiffPunishChance: 0.3,
                optimalRange: 0.5,
                inputDelay: 100
            },
            hard: {
                reactionTime: 150,
                blockChance: 0.7,
                punishChance: 0.6,
                comboChance: 0.5,
                specialChance: 0.25,
                whiffPunishChance: 0.5,
                optimalRange: 0.7,
                inputDelay: 50
            },
            nightmare: {
                reactionTime: 80,
                blockChance: 0.9,
                punishChance: 0.85,
                comboChance: 0.8,
                specialChance: 0.4,
                whiffPunishChance: 0.8,
                optimalRange: 0.95,
                inputDelay: 16
            }
        };

        return params[difficulty] || params.normal;
    }

    generatePersonality() {
        return {
            aggressive: Math.random(),      // 0-1, higher = more offensive
            defensive: Math.random(),       // 0-1, higher = more blocking
            tricky: Math.random(),          // 0-1, higher = more mixups
            patient: Math.random(),         // 0-1, higher = more waiting
            specialHappy: Math.random()     // 0-1, higher = more specials
        };
    }

    setOpponent(opponent) {
        this.opponent = opponent;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.params = this.getDifficultyParams(difficulty);
    }

    update(delta) {
        if (!this.opponent || !this.fighter.canAct) return;

        const now = Date.now();

        // Update behavior timer
        this.behaviorTimer -= delta;
        if (this.behaviorTimer <= 0) {
            this.chooseBehavior();
        }

        // Decision cooldown
        if (now - this.lastDecisionTime < this.decisionCooldown) return;

        // Get situation analysis
        const situation = this.analyzeSituation();

        // Make decision based on current behavior and situation
        const action = this.decide(situation);

        if (action) {
            this.executeAction(action);
            this.lastDecisionTime = now;
        }
    }

    analyzeSituation() {
        const fighter = this.fighter;
        const opponent = this.opponent;

        const dx = opponent.container.x - fighter.container.x;
        const distance = Math.abs(dx);

        return {
            distance: distance,
            direction: Math.sign(dx),
            inPunchRange: distance < 80,
            inKickRange: distance < 120,
            inSweepRange: distance < 100,
            inSpecialRange: distance < 150,
            opponentAttacking: opponent.state === 'attacking',
            opponentRecovering: opponent.state === 'attacking' && this.isOpponentRecovering(),
            opponentJumping: !opponent.isGrounded,
            opponentBlocking: opponent.isBlocking,
            healthAdvantage: fighter.health > opponent.health,
            healthLow: fighter.health < fighter.maxHealth * 0.3,
            specialReady: fighter.specialMeter >= fighter.maxSpecialMeter,
            opponentHealthLow: opponent.health < opponent.maxHealth * 0.3
        };
    }

    isOpponentRecovering() {
        const opponent = this.opponent;
        if (!opponent.currentAttack) return false;

        const attackType = opponent.currentAttack.type;
        const elapsed = Date.now() - opponent.currentAttack.startTime;
        const frames = Math.floor((elapsed / 1000) * 60);
        const data = getFrameData(attackType);

        return isInRecovery(attackType, frames);
    }

    chooseBehavior() {
        const situation = this.analyzeSituation();
        const personality = this.personality;

        // Adjust aggression based on situation
        if (situation.healthLow) {
            this.aggressionLevel = Math.max(0.2, this.aggressionLevel - 0.1);
        }
        if (situation.opponentHealthLow) {
            this.aggressionLevel = Math.min(0.9, this.aggressionLevel + 0.2);
        }
        if (situation.specialReady) {
            this.aggressionLevel = Math.min(1, this.aggressionLevel + 0.1);
        }

        // Choose behavior
        const roll = Math.random();
        const aggressiveThreshold = personality.aggressive * this.aggressionLevel;
        const defensiveThreshold = aggressiveThreshold + personality.defensive * 0.5;

        if (roll < aggressiveThreshold) {
            this.currentBehavior = 'aggressive';
            this.behaviorTimer = 2000 + Math.random() * 1000;
        } else if (roll < defensiveThreshold) {
            this.currentBehavior = 'defensive';
            this.behaviorTimer = 1500 + Math.random() * 500;
        } else {
            this.currentBehavior = 'neutral';
            this.behaviorTimer = 1000 + Math.random() * 1000;
        }
    }

    decide(situation) {
        const params = this.params;
        const behavior = this.currentBehavior;

        // Priority 1: React to opponent attacking
        if (situation.opponentAttacking) {
            return this.reactToAttack(situation);
        }

        // Priority 2: Punish recovery
        if (situation.opponentRecovering && Math.random() < params.punishChance) {
            return this.punish(situation);
        }

        // Priority 3: Behavior-specific decisions
        switch (behavior) {
            case 'aggressive':
                return this.aggressiveBehavior(situation);
            case 'defensive':
                return this.defensiveBehavior(situation);
            default:
                return this.neutralBehavior(situation);
        }
    }

    reactToAttack(situation) {
        const params = this.params;

        // Try to block
        if (Math.random() < params.blockChance) {
            return { type: 'block' };
        }

        // Try to jump over
        if (situation.distance < 100 && Math.random() < 0.2) {
            return { type: 'jump' };
        }

        // Back away
        if (Math.random() < 0.3) {
            return { type: 'moveAway' };
        }

        return null;
    }

    punish(situation) {
        // Choose best punish based on distance
        if (situation.inPunchRange) {
            if (Math.random() < this.params.comboChance) {
                return { type: 'combo', starter: 'punch' };
            }
            return { type: 'punch' };
        }

        if (situation.inKickRange) {
            return { type: 'kick' };
        }

        // Close distance then punish
        return { type: 'approach' };
    }

    aggressiveBehavior(situation) {
        const params = this.params;
        const personality = this.personality;

        // Use special if ready and in range
        if (situation.specialReady && situation.inSpecialRange) {
            if (Math.random() < params.specialChance * personality.specialHappy * 2) {
                return { type: 'special' };
            }
        }

        // In attack range
        if (situation.inPunchRange) {
            const roll = Math.random();

            if (roll < 0.3) {
                return { type: 'punch' };
            } else if (roll < 0.5) {
                return { type: 'kick' };
            } else if (roll < 0.65) {
                return { type: 'uppercut' };
            } else if (roll < 0.75 && this.fighter.isGrounded) {
                return { type: 'sweep' };
            } else if (roll < 0.85 && Math.random() < params.comboChance) {
                return { type: 'combo', starter: 'punch' };
            }

            return { type: 'punch' };
        }

        // Close distance
        return { type: 'approach' };
    }

    defensiveBehavior(situation) {
        // Stay at optimal range
        const optimalDistance = 100;

        if (situation.distance < optimalDistance - 30) {
            return { type: 'moveAway' };
        }

        if (situation.distance > optimalDistance + 30) {
            return { type: 'approach' };
        }

        // Poke from safe distance
        if (situation.inKickRange && Math.random() < 0.3) {
            return { type: 'kick' };
        }

        // Block preemptively sometimes
        if (Math.random() < 0.2) {
            return { type: 'block' };
        }

        return null;
    }

    neutralBehavior(situation) {
        const roll = Math.random();

        // Mix of offense and defense
        if (situation.distance > 150) {
            return roll < 0.7 ? { type: 'approach' } : null;
        }

        if (situation.inKickRange) {
            if (roll < 0.25) {
                return { type: 'kick' };
            } else if (roll < 0.4) {
                return { type: 'punch' };
            } else if (roll < 0.5) {
                return { type: 'moveAway' };
            }
        }

        if (situation.inPunchRange && roll < 0.4) {
            return { type: 'punch' };
        }

        return null;
    }

    executeAction(action) {
        const fighter = this.fighter;
        const situation = this.analyzeSituation();

        // Add input delay based on difficulty
        setTimeout(() => {
            switch (action.type) {
                case 'punch':
                    fighter.punch();
                    break;

                case 'kick':
                    fighter.kick();
                    break;

                case 'uppercut':
                    fighter.uppercut();
                    break;

                case 'sweep':
                    fighter.sweep();
                    break;

                case 'special':
                    fighter.special();
                    break;

                case 'jump':
                    fighter.jump();
                    break;

                case 'block':
                    fighter.block(true);
                    // Release block after a bit
                    setTimeout(() => fighter.block(false), 300 + Math.random() * 200);
                    break;

                case 'approach':
                    if (situation.direction > 0) {
                        fighter.moveRight();
                    } else {
                        fighter.moveLeft();
                    }
                    setTimeout(() => fighter.stopMoving(), 100 + Math.random() * 150);
                    break;

                case 'moveAway':
                    if (situation.direction > 0) {
                        fighter.moveLeft();
                    } else {
                        fighter.moveRight();
                    }
                    setTimeout(() => fighter.stopMoving(), 80 + Math.random() * 100);
                    break;

                case 'combo':
                    this.executeCombo(action.starter);
                    break;
            }
        }, this.params.inputDelay);
    }

    executeCombo(starter) {
        const fighter = this.fighter;
        const comboRoutes = {
            punch: ['punch', 'punch', 'kick'],
            kick: ['kick', 'punch', 'sweep']
        };

        const combo = comboRoutes[starter] || ['punch'];
        let delay = 0;

        combo.forEach((move, index) => {
            setTimeout(() => {
                if (fighter.canAct || index === 0) {
                    switch (move) {
                        case 'punch': fighter.punch(); break;
                        case 'kick': fighter.kick(); break;
                        case 'sweep': fighter.sweep(); break;
                        case 'uppercut': fighter.uppercut(); break;
                    }
                }
            }, delay);

            delay += 200 + Math.random() * 100;
        });
    }

    // Record opponent action for pattern recognition
    recordOpponentAction(action) {
        this.opponentHistory.push({
            action: action,
            time: Date.now(),
            distance: this.analyzeSituation().distance
        });

        if (this.opponentHistory.length > this.maxHistorySize) {
            this.opponentHistory.shift();
        }
    }

    // Predict opponent's next action based on history
    predictOpponentAction() {
        if (this.opponentHistory.length < 5) return null;

        // Simple pattern: what do they do most often at this distance?
        const situation = this.analyzeSituation();
        const distanceRange = situation.inPunchRange ? 'close' :
                             situation.inKickRange ? 'mid' : 'far';

        const recentActions = this.opponentHistory
            .slice(-10)
            .filter(h => this.getDistanceRange(h.distance) === distanceRange);

        if (recentActions.length < 3) return null;

        // Count actions
        const counts = {};
        recentActions.forEach(h => {
            counts[h.action] = (counts[h.action] || 0) + 1;
        });

        // Return most common
        let maxCount = 0;
        let prediction = null;

        for (const [action, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                prediction = action;
            }
        }

        return maxCount >= 3 ? prediction : null;
    }

    getDistanceRange(distance) {
        if (distance < 80) return 'close';
        if (distance < 120) return 'mid';
        return 'far';
    }
}
