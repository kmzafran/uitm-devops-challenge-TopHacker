/**
 * Rate Limiting Middleware
 * Implements tiered rate limiting for API security (OWASP M6)
 */

const rateLimit = require('express-rate-limit');

// Shared options for all rate limiters
const sharedOptions = {
    validate: {
        trustProxy: process.env.NODE_ENV === 'production'
    },
};

/**
 * Global rate limiter - applies to all routes
 * 2000 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
    ...sharedOptions,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000,
    message: {
        success: false,
        error: 'Too many requests',
        message: 'You have exceeded the request limit. Please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    handler: (req, res, next, options) => {
        console.log(`[RATE_LIMIT] Global limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
});

/**
 * Auth rate limiter - for login/register endpoints
 * 5 attempts per 15 minutes per IP
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
    ...sharedOptions,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        error: 'Too many authentication attempts',
        message: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
    handler: (req, res, next, options) => {
        console.log(`[RATE_LIMIT] Auth limit exceeded for IP: ${req.ip}, email: ${req.body?.email || 'unknown'}`);
        res.status(429).json(options.message);
    },
});

/**
 * Strict rate limiter - for sensitive operations
 * 3 requests per minute per IP
 * For password reset, MFA operations, etc.
 */
const strictLimiter = rateLimit({
    ...sharedOptions,
    windowMs: 60 * 1000, // 1 minute
    max: 3,
    message: {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests for this operation. Please wait a moment.',
        retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.log(`[RATE_LIMIT] Strict limit exceeded for IP: ${req.ip}, path: ${req.path}`);
        res.status(429).json(options.message);
    },
});

/**
 * API rate limiter - for authenticated API calls
 * 2000 requests per 15 minutes per user
 * Uses user ID if authenticated, otherwise falls back to IP
 */
const apiLimiter = rateLimit({
    ...sharedOptions,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000,
    message: {
        success: false,
        error: 'API rate limit exceeded',
        message: 'You have exceeded the API request limit. Please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise use IP
        return req.user?.id || req.ip;
    },
    handler: (req, res, next, options) => {
        console.log(`[RATE_LIMIT] API limit exceeded for user: ${req.user?.id || 'anonymous'}, IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
});

/**
 * OTP rate limiter - for OTP verification attempts
 * 5 attempts per 5 minutes per IP
 */
const otpLimiter = rateLimit({
    ...sharedOptions,
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5,
    message: {
        success: false,
        error: 'Too many OTP attempts',
        message: 'Too many verification attempts. Please request a new code.',
        retryAfter: '5 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.log(`[RATE_LIMIT] OTP limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
});

/**
 * Create account rate limiter - for registration
 * 5 registrations per 15 minutes per IP
 */
const createAccountLimiter = rateLimit({
    ...sharedOptions,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        error: 'Too many registrations',
        message: 'Too many accounts created from this IP. Please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.log(`[RATE_LIMIT] Registration limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
});

module.exports = {
    globalLimiter,
    authLimiter,
    strictLimiter,
    apiLimiter,
    otpLimiter,
    createAccountLimiter,
};
