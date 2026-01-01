/**
 * Progress Routes
 *
 * Handles saving and loading player game progress.
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { Progress, User } from '../models/index.js';

const router = Router();

/**
 * Required auth middleware
 */
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const jwt = await import('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        req.user = jwt.default.verify(
            token,
            process.env.JWT_SECRET || 'development-secret'
        );
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ========================================
// GET /api/progress
// Get current user's game progress
// ========================================
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;

        let progress = await Progress.findOne({ where: { userId } });

        if (!progress) {
            // Return default progress for new users
            progress = {
                currentChapter: 1,
                currentLevel: 1,
                totalStars: 0,
                unlockedUpgrades: [],
                gameState: {}
            };
        }

        res.json({
            progress: {
                currentChapter: progress.currentChapter,
                currentLevel: progress.currentLevel,
                totalStars: progress.totalStars,
                unlockedUpgrades: progress.unlockedUpgrades,
                gameState: progress.gameState,
                lastUpdated: progress.updatedAt
            }
        });

    } catch (error) {
        next(error);
    }
});

// ========================================
// PUT /api/progress
// Save/update game progress
// ========================================
router.put('/',
    requireAuth,
    body('currentChapter').optional().isInt({ min: 1, max: 8 }),
    body('currentLevel').optional().isInt({ min: 1, max: 5 }),
    body('totalStars').optional().isInt({ min: 0 }),
    body('unlockedUpgrades').optional().isArray(),
    body('gameState').optional().isObject(),
    async (req, res, next) => {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            // Find or create progress
            let [progress, created] = await Progress.findOrCreate({
                where: { userId },
                defaults: {
                    userId,
                    currentChapter: updateData.currentChapter || 1,
                    currentLevel: updateData.currentLevel || 1,
                    totalStars: updateData.totalStars || 0,
                    unlockedUpgrades: updateData.unlockedUpgrades || [],
                    gameState: updateData.gameState || {}
                }
            });

            if (!created) {
                // Update existing progress
                await progress.update({
                    currentChapter: updateData.currentChapter ?? progress.currentChapter,
                    currentLevel: updateData.currentLevel ?? progress.currentLevel,
                    totalStars: updateData.totalStars ?? progress.totalStars,
                    unlockedUpgrades: updateData.unlockedUpgrades ?? progress.unlockedUpgrades,
                    gameState: updateData.gameState ?? progress.gameState
                });
            }

            res.json({
                message: created ? 'Progress created' : 'Progress updated',
                progress: {
                    currentChapter: progress.currentChapter,
                    currentLevel: progress.currentLevel,
                    totalStars: progress.totalStars,
                    unlockedUpgrades: progress.unlockedUpgrades,
                    lastUpdated: progress.updatedAt
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

// ========================================
// DELETE /api/progress
// Reset game progress
// ========================================
router.delete('/', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;

        await Progress.destroy({ where: { userId } });

        res.json({
            message: 'Progress reset successfully'
        });

    } catch (error) {
        next(error);
    }
});

export default router;
