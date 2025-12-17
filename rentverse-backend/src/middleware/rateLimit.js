/**
 * Rate Limiting Middleware
 * 
 * Protects the API against brute-force attacks and DDoS.
 * OWASP M5 - Insecure Communication
 */

const rateLimit = require('express-rate-limit');

/**
 * Get client IP address handling both IPv4 and IPv6
 */
const getClientIp = (req) => {
    let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '127.0.0.1';

    // Normalize IPv6 localhost to IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
    }

    // Strip IPv6 prefix if present
    if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }

    return ip;
};

/**
 * Global rate limiter
 * Applies to all requests
 * 100 requests per 15 minutes
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (req.path === '/health') return true;
        return false;
    },
    keyGenerator: (req) => getClientIp(req),
    validate: { xForwardedForHeader: false },
});

/**
 * Authentication rate limiter (stricter)
 * Applies to login, register, and password reset
 * 5 attempts per 15 minutes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: {
        success: false,
        error: 'Too many authentication attempts',
        message: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const email = req.body?.email || '';
        return `${getClientIp(req)}-${email}`;
    },
    validate: { xForwardedForHeader: false },
});

/**
 * API rate limiter
 * Applies to all API endpoints
 * 1000 requests per hour
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // Limit each IP to 1000 requests per window
    message: {
        success: false,
        error: 'API rate limit exceeded',
        message: 'You have exceeded the API rate limit. Please try again later.',
        retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        if (req.user?.id) {
            return `user-${req.user.id}`;
        }
        return getClientIp(req);
    },
    validate: { xForwardedForHeader: false },
});

/**
 * Sensitive operations rate limiter
 * For password changes, email changes, MFA operations
 * 3 attempts per hour
 */
const sensitiveOperationsLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Very strict limit
    message: {
        success: false,
        error: 'Too many sensitive operation attempts',
        message: 'Too many sensitive operation attempts. Please try again in 1 hour.',
        retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        if (req.user?.id) {
            return `sensitive-${req.user.id}`;
        }
        return getClientIp(req);
    },
    validate: { xForwardedForHeader: false },
});

module.exports = {
    globalLimiter,
    authLimiter,
    apiLimiter,
    sensitiveOperationsLimiter,
};
