# Cosmic Cadet Academy - Technical Architecture

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Frontend Stack (Phaser 3)](#frontend-stack-phaser-3)
3. [Backend Stack (Node.js/Express)](#backend-stack-nodejs-express)
4. [Database Layer](#database-layer)
5. [Real-Time Communication](#real-time-communication)
6. [Environment Configuration](#environment-configuration)
7. [Deployment Strategy](#deployment-strategy)
8. [Security Considerations](#security-considerations)

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│   │   iOS App   │    │ Android App │    │  Web Build  │                 │
│   │  (Capacitor)│    │ (Capacitor) │    │  (Browser)  │                 │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│          │                  │                   │                        │
│          └──────────────────┼───────────────────┘                        │
│                             │                                            │
│                    ┌────────▼────────┐                                   │
│                    │   Phaser 3      │                                   │
│                    │  Game Engine    │                                   │
│                    │  (WebGL/Canvas) │                                   │
│                    └────────┬────────┘                                   │
│                             │                                            │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │
                              │ HTTPS / WSS
                              │
┌─────────────────────────────┼────────────────────────────────────────────┐
│                             │           SERVER LAYER                      │
├─────────────────────────────┼────────────────────────────────────────────┤
│                             │                                            │
│                    ┌────────▼────────┐                                   │
│                    │   API Gateway   │                                   │
│                    │  (Nginx/CDN)    │                                   │
│                    └────────┬────────┘                                   │
│                             │                                            │
│          ┌──────────────────┼──────────────────┐                        │
│          │                  │                  │                        │
│   ┌──────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐                  │
│   │   Express   │   │  Socket.IO   │   │   Static    │                  │
│   │   REST API  │   │   Server     │   │   Assets    │                  │
│   └──────┬──────┘   └───────┬──────┘   └─────────────┘                  │
│          │                  │                                            │
│          └─────────┬────────┘                                            │
│                    │                                                     │
│           ┌────────▼────────┐                                            │
│           │    Node.js      │                                            │
│           │    Runtime      │                                            │
│           └────────┬────────┘                                            │
│                    │                                                     │
└────────────────────┼─────────────────────────────────────────────────────┘
                     │
┌────────────────────┼─────────────────────────────────────────────────────┐
│                    │              DATA LAYER                              │
├────────────────────┼─────────────────────────────────────────────────────┤
│                    │                                                     │
│         ┌──────────┴──────────┐                                          │
│         │                     │                                          │
│  ┌──────▼──────┐      ┌───────▼───────┐                                  │
│  │  PostgreSQL │      │     Redis     │                                  │
│  │  (Primary)  │      │   (Cache/RT)  │                                  │
│  └─────────────┘      └───────────────┘                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Technology Choices Rationale

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Game Engine | Phaser 3 | Mature, well-documented, excellent mobile support |
| Mobile Wrapper | Capacitor | Modern, maintained, better than Cordova |
| Server Runtime | Node.js 20 LTS | JavaScript consistency, async I/O |
| API Framework | Express 4 | Simple, flexible, massive ecosystem |
| Real-Time | Socket.IO | Fallback support, room-based logic |
| Primary DB | PostgreSQL | Reliable, JSON support, free tiers available |
| Cache | Redis | Leaderboard caching, session storage |
| Hosting | Railway/Vercel | Easy deployment, good free tiers |

---

## Frontend Stack (Phaser 3)

### Project Structure

```
src/game/
├── index.html              # Entry point
├── main.js                 # Phaser game configuration
├── scenes/
│   ├── BootScene.js        # Initial loading
│   ├── PreloadScene.js     # Asset loading with progress
│   ├── MenuScene.js        # Main menu
│   ├── GameScene.js        # Core gameplay
│   ├── LevelScene.js       # Level selection
│   ├── PuzzleScene.js      # Mini-game base class
│   ├── LeaderboardScene.js # Online leaderboards
│   └── SettingsScene.js    # Options & controls
├── entities/
│   ├── Player.js           # Player spaceship/character
│   ├── Star.js             # Collectible star
│   ├── Obstacle.js         # Hazards
│   ├── NPC.js              # Non-player characters
│   └── ORBIT.js            # AI companion
├── utils/
│   ├── ApiClient.js        # HTTP requests
│   ├── SocketClient.js     # WebSocket wrapper
│   ├── SaveManager.js      # Local storage
│   ├── SoundManager.js     # Audio control
│   └── Analytics.js        # Event tracking
├── config/
│   ├── gameConfig.js       # Phaser configuration
│   ├── levelData.js        # Level definitions
│   └── constants.js        # Game constants
└── plugins/
    ├── VirtualJoystick.js  # Touch controls
    └── DialogSystem.js     # NPC conversations
```

### Phaser Configuration

```javascript
// src/game/config/gameConfig.js

export const gameConfig = {
    type: Phaser.AUTO, // WebGL with Canvas fallback
    parent: 'game-container',
    width: 1280,
    height: 720,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 180
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Space = no gravity by default
            debug: process.env.NODE_ENV === 'development'
        }
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true
    },
    audio: {
        disableWebAudio: false
    },
    scene: [] // Scenes added dynamically
};
```

### Build Pipeline

```javascript
// vite.config.js (recommended bundler for Phaser 3)

import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    },
    server: {
        port: 3000,
        open: true
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
});
```

### Mobile Integration (Capacitor)

```javascript
// capacitor.config.ts

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.cosmicacademy.game',
    appName: 'Cosmic Cadet Academy',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#0a0a2e',
            showSpinner: false
        },
        StatusBar: {
            style: 'dark',
            backgroundColor: '#0a0a2e'
        }
    }
};

export default config;
```

---

## Backend Stack (Node.js/Express)

### Server Structure

```
src/server/
├── index.js                # Server entry point
├── app.js                  # Express app configuration
├── routes/
│   ├── index.js            # Route aggregator
│   ├── auth.js             # Authentication routes
│   ├── leaderboard.js      # Score submission/retrieval
│   ├── progress.js         # Player progress sync
│   └── achievements.js     # Badge/achievement routes
├── models/
│   ├── index.js            # Sequelize initialization
│   ├── User.js             # Player model
│   ├── Score.js            # Leaderboard entry
│   ├── Progress.js         # Game save data
│   └── Achievement.js      # Unlocked badges
├── middleware/
│   ├── auth.js             # JWT verification
│   ├── rateLimit.js        # API rate limiting
│   ├── validation.js       # Input validation
│   └── errorHandler.js     # Global error handling
├── services/
│   ├── LeaderboardService.js
│   ├── ProgressService.js
│   └── AchievementService.js
├── socket/
│   ├── index.js            # Socket.IO setup
│   ├── handlers/
│   │   ├── leaderboard.js  # Real-time updates
│   │   └── presence.js     # Online status
│   └── middleware/
│       └── socketAuth.js   # Socket authentication
└── utils/
    ├── logger.js           # Winston logging
    ├── cache.js            # Redis wrapper
    └── validators.js       # Joi schemas
```

### Express App Configuration

```javascript
// src/server/app.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", process.env.API_URL, "wss:"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(compression());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

export default app;
```

### API Routes

```javascript
// src/server/routes/leaderboard.js

import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import LeaderboardService from '../services/LeaderboardService.js';

const router = Router();

// GET /api/leaderboard - Fetch top scores
router.get('/',
    optionalAuth,
    query('level').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    validate,
    async (req, res, next) => {
        try {
            const { level, limit = 50, offset = 0 } = req.query;
            const scores = await LeaderboardService.getTopScores({
                level,
                limit: parseInt(limit),
                offset: parseInt(offset),
                userId: req.user?.id // Highlight user's position
            });
            res.json(scores);
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/leaderboard - Submit score
router.post('/',
    requireAuth,
    body('level').isString().notEmpty(),
    body('score').isInt({ min: 0, max: 999999 }),
    body('stars').isObject(),
    body('stars.bronze').isInt({ min: 0 }),
    body('stars.silver').isInt({ min: 0 }),
    body('stars.gold').isInt({ min: 0 }),
    body('time').isInt({ min: 0 }),
    validate,
    async (req, res, next) => {
        try {
            const { level, score, stars, time } = req.body;
            const result = await LeaderboardService.submitScore({
                userId: req.user.id,
                username: req.user.username,
                level,
                score,
                stars,
                time
            });
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/leaderboard/rank/:userId - Get user's rank
router.get('/rank/:userId',
    async (req, res, next) => {
        try {
            const rank = await LeaderboardService.getUserRank(req.params.userId);
            res.json(rank);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
```

---

## Database Layer

### Schema Design (PostgreSQL)

```sql
-- Database schema for Cosmic Cadet Academy

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    avatar_id INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    parental_email VARCHAR(255),
    parental_consent BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_username ON users(username);

-- Scores/Leaderboard table
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level_id VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    bronze_stars INTEGER DEFAULT 0,
    silver_stars INTEGER DEFAULT 0,
    gold_stars INTEGER DEFAULT 0,
    completion_time INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate entries per user/level (keep best)
    CONSTRAINT unique_user_level UNIQUE (user_id, level_id)
);

CREATE INDEX idx_scores_level ON scores(level_id);
CREATE INDEX idx_scores_score ON scores(score DESC);
CREATE INDEX idx_scores_user ON scores(user_id);

-- Player progress table
CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_chapter INTEGER DEFAULT 1,
    current_level INTEGER DEFAULT 1,
    total_stars INTEGER DEFAULT 0,
    unlocked_upgrades JSONB DEFAULT '[]',
    game_state JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_achievements_user ON achievements(user_id);

-- Achievement definitions (reference table)
CREATE TABLE achievement_definitions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_id VARCHAR(50),
    points INTEGER DEFAULT 0,
    is_secret BOOLEAN DEFAULT false
);

-- Insert some achievement definitions
INSERT INTO achievement_definitions (id, name, description, points) VALUES
('first_star', 'Star Seeker', 'Collect your first star', 10),
('hundred_stars', 'Star Collector', 'Collect 100 stars', 50),
('thousand_stars', 'Star Hoarder', 'Collect 1000 stars', 200),
('chapter_1', 'Training Complete', 'Complete Chapter 1', 25),
('no_hints', 'Self Reliant', 'Complete a level without hints', 30),
('speed_demon', 'Speed Demon', 'Complete a level in under 2 minutes', 40);
```

### Sequelize Models

```javascript
// src/server/models/Score.js

import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Score = sequelize.define('Score', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id'
        },
        levelId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'level_id'
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 999999
            }
        },
        bronzeStars: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'bronze_stars'
        },
        silverStars: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'silver_stars'
        },
        goldStars: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'gold_stars'
        },
        completionTime: {
            type: DataTypes.INTEGER,
            field: 'completion_time'
        }
    }, {
        tableName: 'scores',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['level_id'] },
            { fields: ['score'], order: 'DESC' },
            { fields: ['user_id', 'level_id'], unique: true }
        ]
    });

    Score.associate = (models) => {
        Score.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return Score;
};
```

### Redis Cache Layer

```javascript
// src/server/utils/cache.js

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache keys
const KEYS = {
    LEADERBOARD: (level) => `leaderboard:${level || 'global'}`,
    USER_RANK: (userId, level) => `rank:${userId}:${level || 'global'}`,
    ONLINE_USERS: 'online:users'
};

// Cache durations (seconds)
const TTL = {
    LEADERBOARD: 60,      // 1 minute
    USER_RANK: 300,       // 5 minutes
    ONLINE_USERS: 30      // 30 seconds
};

export const cache = {
    // Get cached leaderboard
    async getLeaderboard(level, limit = 50) {
        const key = KEYS.LEADERBOARD(level);
        const cached = await redis.get(key);
        if (cached) {
            const data = JSON.parse(cached);
            return data.slice(0, limit);
        }
        return null;
    },

    // Set leaderboard cache
    async setLeaderboard(level, data) {
        const key = KEYS.LEADERBOARD(level);
        await redis.setex(key, TTL.LEADERBOARD, JSON.stringify(data));
    },

    // Invalidate leaderboard on new score
    async invalidateLeaderboard(level) {
        await redis.del(KEYS.LEADERBOARD(level));
        await redis.del(KEYS.LEADERBOARD(null)); // Global too
    },

    // Real-time leaderboard using sorted sets
    async updateRealTimeLeaderboard(level, userId, score) {
        const key = `rt:${KEYS.LEADERBOARD(level)}`;
        await redis.zadd(key, score, userId);
        await redis.expire(key, TTL.LEADERBOARD * 10);
    },

    // Get user's rank from sorted set
    async getUserRankRealTime(level, userId) {
        const key = `rt:${KEYS.LEADERBOARD(level)}`;
        const rank = await redis.zrevrank(key, userId);
        return rank !== null ? rank + 1 : null;
    },

    // Track online users
    async setUserOnline(userId) {
        await redis.sadd(KEYS.ONLINE_USERS, userId);
        await redis.expire(KEYS.ONLINE_USERS, TTL.ONLINE_USERS);
    },

    async getOnlineCount() {
        return await redis.scard(KEYS.ONLINE_USERS);
    }
};

export default redis;
```

---

## Real-Time Communication

### Socket.IO Server Setup

```javascript
// src/server/socket/index.js

import { Server } from 'socket.io';
import { socketAuth } from './middleware/socketAuth.js';
import { handleLeaderboard } from './handlers/leaderboard.js';
import { handlePresence } from './handlers/presence.js';

export function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(socketAuth);

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user?.id || 'anonymous'}`);

        // Join user-specific room
        if (socket.user) {
            socket.join(`user:${socket.user.id}`);
        }

        // Register handlers
        handleLeaderboard(io, socket);
        handlePresence(io, socket);

        // Disconnect handler
        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${socket.user?.id}, reason: ${reason}`);
        });
    });

    return io;
}
```

### Leaderboard Socket Handlers

```javascript
// src/server/socket/handlers/leaderboard.js

import LeaderboardService from '../../services/LeaderboardService.js';
import { cache } from '../../utils/cache.js';

export function handleLeaderboard(io, socket) {
    // Subscribe to leaderboard updates for a level
    socket.on('leaderboard:subscribe', async (levelId) => {
        const room = `leaderboard:${levelId || 'global'}`;
        socket.join(room);

        // Send current top scores immediately
        const scores = await LeaderboardService.getTopScores({
            level: levelId,
            limit: 20
        });
        socket.emit('leaderboard:data', { level: levelId, scores });
    });

    // Unsubscribe from leaderboard
    socket.on('leaderboard:unsubscribe', (levelId) => {
        socket.leave(`leaderboard:${levelId || 'global'}`);
    });

    // Real-time score submission
    socket.on('score:submit', async (data, callback) => {
        if (!socket.user) {
            return callback({ error: 'Authentication required' });
        }

        try {
            const result = await LeaderboardService.submitScore({
                userId: socket.user.id,
                username: socket.user.username,
                ...data
            });

            // Acknowledge submission
            callback({ success: true, result });

            // Broadcast to all subscribed clients
            const room = `leaderboard:${data.level || 'global'}`;
            io.to(room).emit('leaderboard:update', {
                level: data.level,
                newEntry: {
                    userId: socket.user.id,
                    username: socket.user.username,
                    score: data.score,
                    rank: result.rank
                }
            });

            // Update real-time cache
            await cache.updateRealTimeLeaderboard(
                data.level,
                socket.user.id,
                data.score
            );

        } catch (error) {
            callback({ error: error.message });
        }
    });

    // Get user's current rank
    socket.on('rank:get', async (levelId, callback) => {
        if (!socket.user) {
            return callback({ error: 'Authentication required' });
        }

        try {
            const rank = await cache.getUserRankRealTime(levelId, socket.user.id);
            callback({ rank });
        } catch (error) {
            callback({ error: error.message });
        }
    });
}
```

---

## Environment Configuration

### Environment Variables

```bash
# .env.example

# ============================================
# Server Configuration
# ============================================
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# ============================================
# Database Configuration (PostgreSQL)
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/cosmic_academy
DB_POOL_MIN=2
DB_POOL_MAX=10

# ============================================
# Redis Configuration
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# Authentication
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# ============================================
# CORS & Security
# ============================================
ALLOWED_ORIGINS=http://localhost:3000,https://cosmicacademy.game
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ============================================
# Game Configuration
# ============================================
MAX_SCORE_PER_LEVEL=999999
LEADERBOARD_PAGE_SIZE=50

# ============================================
# External Services (Optional)
# ============================================
SENTRY_DSN=
ANALYTICS_ID=

# ============================================
# Deployment
# ============================================
# Railway provides these automatically:
# RAILWAY_STATIC_URL
# RAILWAY_PUBLIC_DOMAIN

# Vercel provides:
# VERCEL_URL
```

### Configuration Module

```javascript
// src/server/config/index.js

import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3001),
    HOST: Joi.string().default('0.0.0.0'),

    DATABASE_URL: Joi.string().required(),
    REDIS_URL: Joi.string().default('redis://localhost:6379'),

    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),

    ALLOWED_ORIGINS: Joi.string().default('*'),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
    RATE_LIMIT_MAX: Joi.number().default(100)
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
    env: envVars.NODE_ENV,
    isProduction: envVars.NODE_ENV === 'production',
    isDevelopment: envVars.NODE_ENV === 'development',

    server: {
        port: envVars.PORT,
        host: envVars.HOST
    },

    database: {
        url: envVars.DATABASE_URL,
        pool: {
            min: parseInt(envVars.DB_POOL_MIN) || 2,
            max: parseInt(envVars.DB_POOL_MAX) || 10
        }
    },

    redis: {
        url: envVars.REDIS_URL
    },

    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: envVars.JWT_EXPIRES_IN
    },

    cors: {
        origins: envVars.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    },

    rateLimit: {
        windowMs: envVars.RATE_LIMIT_WINDOW_MS,
        max: envVars.RATE_LIMIT_MAX
    }
};

export default config;
```

---

## Deployment Strategy

### Vercel Deployment (Frontend)

```json
// vercel.json

{
    "version": 2,
    "name": "cosmic-cadet-academy",
    "builds": [
        {
            "src": "dist/**",
            "use": "@vercel/static"
        }
    ],
    "routes": [
        {
            "src": "/assets/(.*)",
            "dest": "/dist/assets/$1",
            "headers": {
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        },
        {
            "src": "/(.*)",
            "dest": "/dist/$1"
        }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "X-Content-Type-Options",
                    "value": "nosniff"
                },
                {
                    "key": "X-Frame-Options",
                    "value": "DENY"
                }
            ]
        }
    ]
}
```

### Railway Deployment (Backend)

```toml
# railway.toml

[build]
builder = "nixpacks"
buildCommand = "npm ci && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[service]
internalPort = 3001
```

```json
// package.json scripts for deployment

{
    "scripts": {
        "start": "node dist/server/index.js",
        "build": "npm run build:client && npm run build:server",
        "build:client": "vite build",
        "build:server": "tsc -p tsconfig.server.json",
        "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
        "dev:client": "vite",
        "dev:server": "nodemon src/server/index.js",
        "db:migrate": "sequelize-cli db:migrate",
        "db:seed": "sequelize-cli db:seed:all"
    }
}
```

### Docker Configuration (Optional)

```dockerfile
# Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml (for local development)

version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/cosmic_academy
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cosmic_academy
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## Security Considerations

### COPPA Compliance

```javascript
// src/server/middleware/coppaCompliance.js

export const coppaCompliance = {
    // Require parental consent for users under 13
    async checkConsent(req, res, next) {
        if (req.user && req.user.age < 13 && !req.user.parentalConsent) {
            return res.status(403).json({
                error: 'Parental consent required',
                requiresConsent: true
            });
        }
        next();
    },

    // Sanitize data collection for children
    sanitizeChildData(userData) {
        // Remove PII for users under 13
        return {
            id: userData.id,
            username: userData.username,
            avatar: userData.avatar
            // No email, no location, no personal details
        };
    }
};
```

### Input Validation

```javascript
// src/server/utils/validators.js

import Joi from 'joi';

export const schemas = {
    score: Joi.object({
        level: Joi.string().alphanum().max(50).required(),
        score: Joi.number().integer().min(0).max(999999).required(),
        stars: Joi.object({
            bronze: Joi.number().integer().min(0).max(100),
            silver: Joi.number().integer().min(0).max(20),
            gold: Joi.number().integer().min(0).max(5)
        }).required(),
        time: Joi.number().integer().min(0).max(3600) // Max 1 hour
    }),

    username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required(),

    // Profanity filter for usernames
    cleanUsername: (username) => {
        const profanityList = ['...'];  // Load from file
        const lower = username.toLowerCase();
        return !profanityList.some(word => lower.includes(word));
    }
};
```

### Rate Limiting per Endpoint

```javascript
// src/server/middleware/rateLimit.js

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../utils/cache.js';

// Standard API rate limit
export const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

// Strict limit for score submission (prevent spam)
export const scoreLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:score:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 scores per minute max
    message: { error: 'Score submission rate limit exceeded' }
});

// Auth endpoints (prevent brute force)
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 failed attempts per hour
    skipSuccessfulRequests: true
});
```

---

*Document Version: 1.0*
*Last Updated: 2024*
