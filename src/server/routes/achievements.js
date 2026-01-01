/**
 * Achievements Routes
 *
 * Handles achievement definitions and player unlocks.
 */

import { Router } from 'express';
import { Achievement, AchievementDefinition } from '../models/index.js';

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
// GET /api/achievements
// Get all achievements with user's unlock status
// ========================================
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get all achievement definitions
        const definitions = await AchievementDefinition.findAll({
            order: [['points', 'ASC']]
        });

        // Get user's unlocked achievements
        const unlocked = await Achievement.findAll({
            where: { userId },
            attributes: ['achievementId', 'unlockedAt']
        });

        const unlockedMap = new Map(
            unlocked.map(a => [a.achievementId, a.unlockedAt])
        );

        // Combine definitions with unlock status
        const achievements = definitions.map(def => ({
            id: def.id,
            name: def.name,
            description: def.isSecret && !unlockedMap.has(def.id)
                ? '???'
                : def.description,
            iconId: def.iconId,
            points: def.points,
            isSecret: def.isSecret,
            unlocked: unlockedMap.has(def.id),
            unlockedAt: unlockedMap.get(def.id) || null
        }));

        // Calculate totals
        const totalPoints = definitions.reduce((sum, d) => sum + d.points, 0);
        const earnedPoints = definitions
            .filter(d => unlockedMap.has(d.id))
            .reduce((sum, d) => sum + d.points, 0);

        res.json({
            achievements,
            stats: {
                total: definitions.length,
                unlocked: unlocked.length,
                totalPoints,
                earnedPoints,
                completionPercentage: Math.round((unlocked.length / definitions.length) * 100)
            }
        });

    } catch (error) {
        next(error);
    }
});

// ========================================
// POST /api/achievements/:achievementId
// Unlock an achievement
// ========================================
router.post('/:achievementId', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { achievementId } = req.params;

        // Verify achievement exists
        const definition = await AchievementDefinition.findByPk(achievementId);
        if (!definition) {
            return res.status(404).json({ error: 'Achievement not found' });
        }

        // Check if already unlocked
        const existing = await Achievement.findOne({
            where: { userId, achievementId }
        });

        if (existing) {
            return res.json({
                message: 'Achievement already unlocked',
                achievement: {
                    id: definition.id,
                    name: definition.name,
                    unlockedAt: existing.unlockedAt
                },
                alreadyUnlocked: true
            });
        }

        // Unlock achievement
        const unlock = await Achievement.create({
            userId,
            achievementId
        });

        // Emit via Socket.IO for real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${userId}`).emit('achievement:unlocked', {
                id: definition.id,
                name: definition.name,
                description: definition.description,
                points: definition.points,
                iconId: definition.iconId
            });
        }

        res.status(201).json({
            message: 'Achievement unlocked!',
            achievement: {
                id: definition.id,
                name: definition.name,
                description: definition.description,
                points: definition.points,
                unlockedAt: unlock.unlockedAt
            },
            alreadyUnlocked: false
        });

    } catch (error) {
        next(error);
    }
});

// ========================================
// GET /api/achievements/recent
// Get recently unlocked achievements (global)
// ========================================
router.get('/recent', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recent = await Achievement.findAll({
            include: [
                {
                    model: AchievementDefinition,
                    as: 'definition',
                    attributes: ['id', 'name', 'iconId', 'points']
                }
            ],
            order: [['unlockedAt', 'DESC']],
            limit
        });

        res.json({
            recentUnlocks: recent.map(a => ({
                achievementId: a.achievementId,
                name: a.definition?.name,
                points: a.definition?.points,
                unlockedAt: a.unlockedAt
            }))
        });

    } catch (error) {
        next(error);
    }
});

export default router;
