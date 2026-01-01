/**
 * API Routes Aggregator
 *
 * Combines all route modules into a single router.
 */

import { Router } from 'express';
import authRoutes from './auth.js';
import leaderboardRoutes from './leaderboard.js';
import progressRoutes from './progress.js';
import achievementsRoutes from './achievements.js';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/progress', progressRoutes);
router.use('/achievements', achievementsRoutes);

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'Cosmic Cadet Academy API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            leaderboard: '/api/leaderboard',
            progress: '/api/progress',
            achievements: '/api/achievements'
        }
    });
});

export default router;
