/**
 * Express Application Configuration
 *
 * Sets up middleware, routes, and error handling.
 * Security-focused with CORS, rate limiting, and input validation.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy (required for Railway/cloud deployments behind reverse proxy)
app.set('trust proxy', 1);

// ========================================
// Security Middleware
// ========================================

// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow all origins by default (safe for a game without sensitive data)
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// ========================================
// Rate Limiting
// ========================================

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(globalLimiter);

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts per hour
    message: { error: 'Too many login attempts, please try again later' },
    skipSuccessfulRequests: true
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Score submission limiter
const scoreLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 scores per minute
    message: { error: 'Score submission rate limit exceeded' }
});
app.use('/api/leaderboard', scoreLimiter);

// ========================================
// Body Parsing & Compression
// ========================================

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

// ========================================
// Logging
// ========================================

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ========================================
// Static Files
// ========================================

// Serve game client - use dist/ folder (Vite build output)
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filePath) => {
        // Set immutable cache for hashed assets
        if (filePath.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// ========================================
// API Routes
// ========================================

app.use('/api', routes);

// ========================================
// Health Check
// ========================================

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// ========================================
// SPA Fallback
// ========================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// ========================================
// Error Handling
// ========================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
    });
});

// Global error handler
app.use(errorHandler);

export default app;
