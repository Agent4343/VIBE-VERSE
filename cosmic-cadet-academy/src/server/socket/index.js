/**
 * Socket.IO Server Configuration
 *
 * Handles real-time communication for:
 * - Leaderboard updates
 * - Achievement notifications
 * - Online presence
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Score, User } from '../models/index.js';
import { Op } from 'sequelize';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                socket.user = decoded;
            } else {
                socket.user = null; // Anonymous connection allowed
            }
            next();

        } catch (error) {
            // Allow connection but mark as unauthenticated
            socket.user = null;
            next();
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id} (user: ${socket.user?.username || 'anonymous'})`);

        // Join user-specific room if authenticated
        if (socket.user) {
            socket.join(`user:${socket.user.id}`);
        }

        // ========================================
        // Leaderboard Events
        // ========================================

        socket.on('leaderboard:subscribe', async (levelId) => {
            const room = `leaderboard:${levelId || 'global'}`;
            socket.join(room);
            console.log(`${socket.id} subscribed to ${room}`);

            // Send current top scores
            try {
                const where = levelId ? { levelId } : {};
                const scores = await Score.findAll({
                    where,
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['username', 'avatarId']
                    }],
                    order: [['score', 'DESC']],
                    limit: 20
                });

                socket.emit('leaderboard:data', {
                    level: levelId || 'global',
                    scores: scores.map((s, i) => ({
                        rank: i + 1,
                        username: s.user?.username || 'Unknown',
                        score: s.score,
                        avatarId: s.user?.avatarId || 1
                    }))
                });
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            }
        });

        socket.on('leaderboard:unsubscribe', (levelId) => {
            socket.leave(`leaderboard:${levelId || 'global'}`);
        });

        socket.on('score:submit', async (data, callback) => {
            if (!socket.user) {
                return callback?.({ error: 'Authentication required' });
            }

            try {
                const { level, score, stars, time } = data;
                const userId = socket.user.id;

                // Find or update score
                const [existingScore, created] = await Score.findOrCreate({
                    where: { userId, levelId: level },
                    defaults: {
                        userId,
                        levelId: level,
                        score,
                        bronzeStars: stars?.bronze || 0,
                        silverStars: stars?.silver || 0,
                        goldStars: stars?.gold || 0,
                        completionTime: time
                    }
                });

                let isNewHighScore = created;

                if (!created && score > existingScore.score) {
                    await existingScore.update({
                        score,
                        bronzeStars: stars?.bronze || 0,
                        silverStars: stars?.silver || 0,
                        goldStars: stars?.gold || 0,
                        completionTime: time
                    });
                    isNewHighScore = true;
                }

                // Calculate rank
                const rank = await Score.count({
                    where: {
                        levelId: level,
                        score: { [Op.gt]: score }
                    }
                }) + 1;

                // Broadcast update
                if (isNewHighScore) {
                    io.to(`leaderboard:${level}`).emit('leaderboard:update', {
                        level,
                        newEntry: {
                            userId,
                            username: socket.user.username,
                            score,
                            rank
                        }
                    });
                }

                callback?.({
                    success: true,
                    isNewHighScore,
                    rank
                });

            } catch (error) {
                console.error('Score submission error:', error);
                callback?.({ error: 'Failed to submit score' });
            }
        });

        socket.on('rank:get', async (levelId, callback) => {
            if (!socket.user) {
                return callback?.({ rank: null });
            }

            try {
                const userScore = await Score.findOne({
                    where: {
                        userId: socket.user.id,
                        levelId: levelId || null
                    }
                });

                if (!userScore) {
                    return callback?.({ rank: null });
                }

                const rank = await Score.count({
                    where: {
                        levelId: levelId || null,
                        score: { [Op.gt]: userScore.score }
                    }
                }) + 1;

                callback?.({ rank, score: userScore.score });

            } catch (error) {
                console.error('Rank fetch error:', error);
                callback?.({ error: 'Failed to get rank' });
            }
        });

        // ========================================
        // Presence Events
        // ========================================

        socket.on('presence:active', () => {
            if (socket.user) {
                socket.broadcast.emit('presence:online', {
                    userId: socket.user.id,
                    username: socket.user.username
                });
            }
        });

        // ========================================
        // Disconnect Handler
        // ========================================

        socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${socket.id} (${reason})`);

            if (socket.user) {
                socket.broadcast.emit('presence:offline', {
                    userId: socket.user.id
                });
            }
        });

        // ========================================
        // Error Handler
        // ========================================

        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    return io;
}
