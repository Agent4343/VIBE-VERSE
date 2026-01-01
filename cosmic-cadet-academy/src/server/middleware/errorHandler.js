/**
 * Global Error Handler Middleware
 *
 * Catches all errors and returns consistent error responses.
 * Logs errors in development, sanitizes in production.
 */

/**
 * Error handler middleware
 */
export function errorHandler(err, req, res, next) {
    // Log error details
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Determine status code
    let statusCode = err.status || err.statusCode || 500;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        statusCode = 401;
    } else if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
    } else if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
    }

    // Build error response
    const errorResponse = {
        error: getErrorMessage(statusCode),
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : getSafeMessage(statusCode, err.message),
        statusCode
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
}

/**
 * Get standard error title
 */
function getErrorMessage(statusCode) {
    const messages = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        409: 'Conflict',
        422: 'Unprocessable Entity',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable'
    };
    return messages[statusCode] || 'Error';
}

/**
 * Sanitize error message for production
 */
function getSafeMessage(statusCode, originalMessage) {
    // Safe messages to pass through
    const safePatterns = [
        /username.*taken/i,
        /email.*registered/i,
        /invalid.*password/i,
        /not found/i,
        /validation/i,
        /required/i
    ];

    if (safePatterns.some(pattern => pattern.test(originalMessage))) {
        return originalMessage;
    }

    // Generic messages for security
    const genericMessages = {
        400: 'Invalid request data',
        401: 'Authentication required',
        403: 'Access denied',
        404: 'Resource not found',
        409: 'Resource already exists',
        429: 'Too many requests, please try again later',
        500: 'An unexpected error occurred'
    };

    return genericMessages[statusCode] || 'An error occurred';
}

export default errorHandler;
