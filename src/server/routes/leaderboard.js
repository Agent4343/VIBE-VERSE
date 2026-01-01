/**
 * Leaderboard Routes
 *
 * Handles score submission and retrieval.
 * Integrates with Socket.IO for real-time updates.
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Score, User } from '../models/index.js';
import { Op } from 'sequelize';

const router = Router();

/**
 * Validation middleware
 */
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
}

/**
 * Optional auth middleware - extracts user if token present
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const jwt = await import('jsonwebtoken');
            const token = authHeader.split(' ')[1];
            const decoded = jwt.default.verify(
                token,
                process.env.JWT_SECRET || 'development-secret'
            );
            req.user = decoded;
        }
    } catch (error) {
        // Token invalid, continue without user
    }
    next();
}

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
        const decoded = jwt.default.verify(
            token,
            process.env.JWT_SECRET || 'development-secret'
        );
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ========================================
// GET /api/leaderboard
// Fetch top scores (global or per-level)
// ========================================
router.get('/',
    optionalAuth,
    query('level').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('timeframe').optional().isIn(['daily', 'weekly', 'monthly', 'all']),
    validate,
    async (req, res, next) => {
        try {
            const {
                level,
                limit = 50,
                offset = 0,
                timeframe = 'all'
            } = req.query;

            // Build where clause
            const where = {};

            if (level) {
                where.levelId = level;
            }

            // Time-based filtering
            if (timeframe !== 'all') {
                const now = new Date();
                let startDate;

                switch (timeframe) {
                    case 'daily':
                        startDate = new Date(now.setHours(0, 0, 0, 0));
                        break;
                    case 'weekly':
                        startDate = new Date(now.setDate(now.getDate() - 7));
                        break;
                    case 'monthly':
                        startDate = new Date(now.setMonth(now.getMonth() - 1));
                        break;
                }

                if (startDate) {
                    where.createdAt = { [Op.gte]: startDate };
                }
            }

            // Fetch scores with user info
            const scores = await Score.findAll({
                where,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatarId']
                }],
                order: [['score', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            // Get total count for pagination
            const total = await Score.count({ where });

            // Format response
            const leaderboard = scores.map((score, index) => ({
                rank: parseInt(offset) + index + 1,
                userId: score.userId,
                username: score.user?.username || 'Unknown',
                avatarId: score.user?.avatarId || 1,
                score: score.score,
                stars: {
                    bronze: score.bronzeStars,
                    silver: score.silverStars,
                    gold: score.goldStars
                },
                time: score.completionTime,
                date: score.createdAt,
                isCurrentUser: req.user?.id === score.userId
            }));

            res.json({
                level: level || 'global',
                timeframe,
                scores: leaderboard,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + scores.length < total
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

// ========================================
// POST /api/leaderboard
// Submit a new score
// ========================================
router.post('/',
    requireAuth,
    body('level').isString().trim().notEmpty(),
    body('score').isInt({ min: 0, max: 999999 }),
    body('stars').isObject(),
    body('stars.bronze').isInt({ min: 0 }),
    body('stars.silver').isInt({ min: 0 }),
    body('stars.gold').isInt({ min: 0 }),
    body('time').isInt({ min: 0, max: 36000 }), // Max 10 hours
    validate,
    async (req, res, next) => {
        try {
            const { level, score, stars, time } = req.body;
            const userId = req.user.id;

            // Check for existing score on this level
            const existingScore = await Score.findOne({
                where: { userId, levelId: level }
            });

            let result;
            let isNewHighScore = false;

            if (existingScore) {
                // Only update if new score is higher
                if (score > existingScore.score) {
                    await existingScore.update({
                        score,
                        bronzeStars: stars.bronze,
                        silverStars: stars.silver,
                        goldStars: stars.gold,
                        completionTime: time
                    });
                    result = existingScore;
                    isNewHighScore = true;
                } else {
                    result = existingScore;
                }
            } else {
                // Create new score entry
                result = await Score.create({
                    userId,
                    levelId: level,
                    score,
                    bronzeStars: stars.bronze,
                    silverStars: stars.silver,
                    goldStars: stars.gold,
                    completionTime: time
                });
                isNewHighScore = true;
            }

            // Get user's rank
            const rank = await Score.count({
                where: {
                    levelId: level,
                    score: { [Op.gt]: score }
                }
            }) + 1;

            // Emit real-time update via Socket.IO
            if (isNewHighScore) {
                const io = req.app.get('io');
                if (io) {
                    io.to(`leaderboard:${level}`).emit('leaderboard:update', {
                        level,
                        newEntry: {
                            userId,
                            username: req.user.username,
                            score,
                            rank
                        }
                    });
                }
            }

            res.status(201).json({
                message: isNewHighScore ? 'New high score!' : 'Score recorded',
                isNewHighScore,
                score: result.score,
                rank,
                personalBest: existingScore?.score || score
            });

        } catch (error) {
            next(error);
        }
    }
);

// ========================================
// GET /api/leaderboard/rank/:levelId
// Get current user's rank for a level
// ========================================
router.get('/rank/:levelId',
    requireAuth,
    async (req, res, next) => {
        try {
            const { levelId } = req.params;
            const userId = req.user.id;

            // Get user's score for this level
            const userScore = await Score.findOne({
                where: { userId, levelId }
            });

            if (!userScore) {
                return res.json({
                    level: levelId,
                    rank: null,
                    score: null,
                    message: 'No score recorded for this level'
                });
            }

            // Count players with higher scores
            const rank = await Score.count({
                where: {
                    levelId,
                    score: { [Op.gt]: userScore.score }
                }
            }) + 1;

            // Total players on this level
            const totalPlayers = await Score.count({
                where: { levelId }
            });

            res.json({
                level: levelId,
                rank,
                totalPlayers,
                score: userScore.score,
                percentile: Math.round((1 - (rank / totalPlayers)) * 100)
            });

        } catch (error) {
            next(error);
        }
    }
);

// ========================================
// GET /api/leaderboard/user/:userId
// Get all scores for a specific user
// ========================================
router.get('/user/:userId',
    async (req, res, next) => {
        try {
            const { userId } = req.params;

            const scores = await Score.findAll({
                where: { userId },
                order: [['levelId', 'ASC']],
                attributes: ['levelId', 'score', 'bronzeStars', 'silverStars', 'goldStars', 'completionTime', 'createdAt']
            });

            // Calculate total stars
            const totalStars = scores.reduce((sum, s) => {
                return sum + s.bronzeStars + (s.silverStars * 5) + (s.goldStars * 10);
            }, 0);

            res.json({
                userId,
                totalLevelsCompleted: scores.length,
                totalStars,
                scores: scores.map(s => ({
                    level: s.levelId,
                    score: s.score,
                    stars: {
                        bronze: s.bronzeStars,
                        silver: s.silverStars,
                        gold: s.goldStars
                    },
                    time: s.completionTime,
                    date: s.createdAt
                }))
            });

        } catch (error) {
            next(error);
        }
    }
);

export default router;
