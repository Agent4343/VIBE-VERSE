/**
 * Cosmic Cadet Academy - Server Entry Point
 *
 * Initializes Express server with Socket.IO for real-time features.
 * Handles graceful shutdown and error recovery.
 */

import http from 'http';
import app from './app.js';
import { initializeSocket } from './socket/index.js';
import { sequelize } from './models/index.js';

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Store io instance for use in routes
app.set('io', io);

/**
 * Start server after database connection
 */
async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync models (in development only)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('Database models synchronized.');
        }

        // Start listening
        server.listen(PORT, HOST, () => {
            console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Cosmic Cadet Academy Server                      ║
║                                                       ║
║   Server:    http://${HOST}:${PORT}                     ║
║   Env:       ${process.env.NODE_ENV || 'development'}                          ║
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

        // Close database connection
        try {
            await sequelize.close();
            console.log('Database connection closed.');
        } catch (error) {
            console.error('Error closing database:', error);
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
