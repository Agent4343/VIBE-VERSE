/**
 * Cosmic Cadet Academy - Server Entry Point
 *
 * Initializes Express server with Socket.IO for real-time features.
 * Handles graceful shutdown and error recovery.
 */

import http from 'http';
import app from './app.js';
import { initializeSocket } from './socket/index.js';

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Database availability flag
let dbAvailable = false;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Store io instance for use in routes
app.set('io', io);

/**
 * Try to connect to database (optional)
 */
async function connectDatabase() {
    // Only try if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.log('DATABASE_URL not set - running without database');
        return false;
    }

    try {
        const { sequelize } = await import('./models/index.js');
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync models in development
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('Database models synchronized.');
        }

        app.set('sequelize', sequelize);
        return true;
    } catch (error) {
        console.warn('Database connection failed:', error.message);
        console.log('Running in degraded mode without database');
        return false;
    }
}

/**
 * Start server (database optional)
 */
async function startServer() {
    try {
        // Try database connection (non-blocking)
        dbAvailable = await connectDatabase();
        app.set('dbAvailable', dbAvailable);

        // Start listening regardless of database
        server.listen(PORT, HOST, () => {
            console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Cosmic Cadet Academy Server                      ║
║                                                       ║
║   Server:    http://${HOST}:${PORT}                     ║
║   Env:       ${process.env.NODE_ENV || 'production'}                          ║
║   Database:  ${dbAvailable ? 'Connected' : 'Not available'}                        ║
║   Socket.IO: Enabled                                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
            `);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(async () => {
        console.log('HTTP server closed.');

        // Close database connection if available
        const sequelize = app.get('sequelize');
        if (sequelize) {
            try {
                await sequelize.close();
                console.log('Database connection closed.');
            } catch (error) {
                console.error('Error closing database:', error);
            }
        }

        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
