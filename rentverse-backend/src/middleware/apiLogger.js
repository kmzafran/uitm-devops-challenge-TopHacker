/**
 * API Logger Middleware
 * Provides comprehensive request/response logging for audit trails (OWASP M6)
 */

const fs = require('fs');
const path = require('path');

// Log directory
const LOG_DIR = path.join(__dirname, '../../logs');
const SECURITY_LOG_FILE = path.join(LOG_DIR, 'security.log');
const ACCESS_LOG_FILE = path.join(LOG_DIR, 'access.log');

// Ensure log directory exists
function ensureLogDir() {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
}

/**
 * Format log entry
 * @param {Object} data - Log data
 * @returns {string} - Formatted log line
 */
function formatLogEntry(data) {
    return JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
    }) + '\n';
}

/**
 * Write to log file (async)
 * @param {string} file - Log file path
 * @param {string} entry - Log entry
 */
function writeLog(file, entry) {
    ensureLogDir();
    fs.appendFile(file, entry, (err) => {
        if (err) {
            console.error('[API_LOGGER] Failed to write log:', err.message);
        }
    });
}

/**
 * API access logger middleware
 * Logs all API requests
 */
const accessLogger = (req, res, next) => {
    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Override end to capture response
    res.end = function (chunk, encoding) {
        const duration = Date.now() - startTime;

        const logEntry = {
            type: 'ACCESS',
            method: req.method,
            path: req.originalUrl || req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id || null,
            userEmail: req.user?.email || null,
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
            console.log(`[API] ${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} - ${duration}ms`);
        }

        // Write to access log file
        writeLog(ACCESS_LOG_FILE, formatLogEntry(logEntry));

        // Call original end
        return originalEnd.call(this, chunk, encoding);
    };

    next();
};

/**
 * Security event logger
 * Logs security-relevant events
 */
const securityLogger = {
    /**
     * Log authentication failure
     */
    logAuthFailure(req, reason) {
        const entry = {
            type: 'AUTH_FAILURE',
            ip: req.ip,
            path: req.originalUrl,
            email: req.body?.email || 'unknown',
            reason,
            userAgent: req.headers['user-agent'],
        };

        console.warn(`[SECURITY] Auth failure from ${req.ip}: ${reason}`);
        writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));
    },

    /**
     * Log authentication success
     */
    logAuthSuccess(req, userId) {
        const entry = {
            type: 'AUTH_SUCCESS',
            ip: req.ip,
            path: req.originalUrl,
            userId,
            userAgent: req.headers['user-agent'],
        };

        writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));
    },

    /**
     * Log rate limit violation
     */
    logRateLimitViolation(req, limiterType) {
        const entry = {
            type: 'RATE_LIMIT',
            ip: req.ip,
            path: req.originalUrl,
            limiterType,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id || null,
        };

        console.warn(`[SECURITY] Rate limit (${limiterType}) exceeded from ${req.ip}`);
        writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));
    },

    /**
     * Log suspicious activity
     */
    logSuspiciousActivity(req, reason, details = {}) {
        const entry = {
            type: 'SUSPICIOUS',
            ip: req.ip,
            path: req.originalUrl,
            reason,
            details,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id || null,
        };

        console.warn(`[SECURITY] Suspicious activity from ${req.ip}: ${reason}`);
        writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));
    },

    /**
     * Log token blacklist event
     */
    logTokenBlacklisted(req, reason) {
        const entry = {
            type: 'TOKEN_BLACKLISTED',
            ip: req.ip,
            reason,
            userId: req.user?.id || null,
        };

        writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));
    },

    /**
     * Log password change
     */
    logPasswordChange(req, userId) {
        const entry = {
            type: 'PASSWORD_CHANGE',
            ip: req.ip,
            userId,
        };

        console.log(`[SECURITY] Password changed for user ${userId} from ${req.ip}`);
        writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));
    },

    /**
     * Log MFA event
     */
    logMfaEvent(req, eventType, success, userId) {
        const entry = {
            type: 'MFA_EVENT',
            eventType,
            success,
            ip: req.ip,
            userId,
        };

        writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));
    },

    /**
     * Log generic security event
     */
    logSecurityEvent(req, eventType, details = {}) {
        const entry = {
            type: 'SECURITY_EVENT',
            eventType,
            ip: req.ip,
            path: req.originalUrl,
            details,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id || null,
        };

        console.log(`[SECURITY] ${eventType} from ${req.ip}`);
        writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));
    },
};

/**
 * Middleware to log failed requests
 */
const errorLogger = (err, req, res, next) => {
    const entry = {
        type: 'ERROR',
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        userId: req.user?.id || null,
    };

    console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
    writeLog(SECURITY_LOG_FILE, formatLogEntry(entry));

    next(err);
};

module.exports = {
    accessLogger,
    securityLogger,
    errorLogger,
};
