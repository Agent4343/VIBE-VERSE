/**
 * API Routes Aggregator
 *
 * Combines all route modules into a single router.
 * Routes are lazy-loaded to avoid database connection on import.
 */

import { Router } from 'express';

const router = Router();

// Cache for loaded routers
const routerCache = {};

/**
 * Middleware to check database availability
 */
function requireDatabase(req, res, next) {
    if (!req.app.get('dbAvailable')) {
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'Database not configured. Add a PostgreSQL database in Railway and set DATABASE_URL.'
        });
    }
    next();
}

/**
 * Create lazy router loader
 */
function lazyRouter(name, importFn) {
    return async (req, res, next) => {
        try {
            if (!routerCache[name]) {
                const module = await importFn();
                routerCache[name] = module.default;
            }
            routerCache[name](req, res, next);
        } catch (error) {
            next(error);
        }
    };
}

// API info endpoint (always available)
router.get('/', (req, res) => {
    const dbAvailable = req.app.get('dbAvailable');
    res.json({
        name: 'Cosmic Cadet Academy API',
        version: '1.0.0',
        status: 'running',
        database: dbAvailable ? 'connected' : 'not configured',
        endpoints: {
            auth: '/api/auth',
            leaderboard: '/api/leaderboard',
            progress: '/api/progress',
            achievements: '/api/achievements'
        },
        note: dbAvailable ? undefined : 'Add PostgreSQL database for full functionality'
    });
});

// Protected API routes (require database)
router.use('/auth', requireDatabase, lazyRouter('auth', () => import('./auth.js')));
router.use('/leaderboard', requireDatabase, lazyRouter('leaderboard', () => import('./leaderboard.js')));
router.use('/progress', requireDatabase, lazyRouter('progress', () => import('./progress.js')));
router.use('/achievements', requireDatabase, lazyRouter('achievements', () => import('./achievements.js')));

export default router;
