/**
 * Authentication Routes
 *
 * Handles user registration, login, and guest access.
 * COPPA-compliant with parental consent options.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/index.js';

const router = Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            isGuest: user.isGuest || false
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

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

// ========================================
// POST /api/auth/register
// Register a new user account
// ========================================
router.post('/register',
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-20 alphanumeric characters'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('parentalEmail')
        .optional()
        .isEmail()
        .normalizeEmail(),
    body('age')
        .optional()
        .isInt({ min: 1, max: 120 }),
    validate,
    async (req, res, next) => {
        try {
            const { username, email, password, parentalEmail, age } = req.body;

            // Check if username exists
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                return res.status(409).json({
                    error: 'Username already taken'
                });
            }

            // Check if email exists (if provided)
            if (email) {
                const existingEmail = await User.findOne({ where: { email } });
                if (existingEmail) {
                    return res.status(409).json({
                        error: 'Email already registered'
                    });
                }
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Create user
            const user = await User.create({
                username,
                email,
                passwordHash,
                parentalEmail,
                age,
                // COPPA: require parental consent for under 13
                parentalConsent: age >= 13
            });

            // Generate token
            const token = generateToken(user);

            res.status(201).json({
                message: 'Registration successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    requiresParentalConsent: age < 13 && !user.parentalConsent
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

// ========================================
// POST /api/auth/login
// Login with username and password
// ========================================
router.post('/login',
    body('username').trim().notEmpty(),
    body('password').notEmpty(),
    validate,
    async (req, res, next) => {
        try {
            const { username, password } = req.body;

            // Find user
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return res.status(401).json({
                    error: 'Invalid username or password'
                });
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.passwordHash);
            if (!validPassword) {
                return res.status(401).json({
                    error: 'Invalid username or password'
                });
            }

            // Update last login
            await user.update({ lastLogin: new Date() });

            // Generate token
            const token = generateToken(user);

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    avatarId: user.avatarId
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

// ========================================
// POST /api/auth/guest
// Create a guest session (no password required)
// ========================================
router.post('/guest',
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-20 alphanumeric characters'),
    validate,
    async (req, res, next) => {
        try {
            const { username } = req.body;

            // Generate unique guest username if taken
            let guestUsername = `Guest_${username}`;
            let counter = 1;

            while (await User.findOne({ where: { username: guestUsername } })) {
                guestUsername = `Guest_${username}_${counter}`;
                counter++;
            }

            // Create guest user
            const user = await User.create({
                username: guestUsername,
                isGuest: true,
                parentalConsent: true // Guests can't access restricted features anyway
            });

            // Generate token (shorter expiry for guests)
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    isGuest: true
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Guest session created',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    isGuest: true
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

// ========================================
// POST /api/auth/refresh
// Refresh an existing token
// ========================================
router.post('/refresh',
    async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const token = authHeader.split(' ')[1];

            // Verify token (allow expired tokens for refresh)
            const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });

            // Check if user still exists
            const user = await User.findByPk(decoded.id);
            if (!user || !user.isActive) {
                return res.status(401).json({ error: 'User not found or inactive' });
            }

            // Generate new token
            const newToken = generateToken(user);

            res.json({
                message: 'Token refreshed',
                token: newToken
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            next(error);
        }
    }
);

// ========================================
// GET /api/auth/me
// Get current user info
// ========================================
router.get('/me',
    async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            const user = await User.findByPk(decoded.id, {
                attributes: ['id', 'username', 'email', 'avatarId', 'createdAt', 'isGuest']
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user });

        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            next(error);
        }
    }
);

export default router;
