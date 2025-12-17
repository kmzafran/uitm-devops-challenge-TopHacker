/**
 * Request Validator Middleware
 * Provides input sanitization and validation (OWASP M5)
 */

const xss = require('xss');

/**
 * Sanitize a string value to prevent XSS attacks
 * @param {string} value - Value to sanitize
 * @returns {string} - Sanitized value
 */
function sanitizeString(value) {
    if (typeof value !== 'string') return value;

    // Use xss library for comprehensive sanitization
    return xss(value, {
        whiteList: {}, // Allow no HTML tags
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style'],
    });
}

/**
 * Recursively sanitize all string values in an object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Detect potential SQL injection patterns
 * @param {string} value - Value to check
 * @returns {boolean} - True if suspicious patterns found
 */
function detectSqlInjection(value) {
    if (typeof value !== 'string') return false;

    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
        /(--|\|\||\/\*|\*\/)/,
        /(\bOR\b.*=.*)/i,
        /(\bAND\b.*=.*)/i,
        /(';|";|`)/,
        /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(value));
}

/**
 * Check request body for suspicious patterns
 * @param {Object} body - Request body to check
 * @returns {Array} - Array of suspicious fields
 */
function checkForSuspiciousPatterns(body) {
    const suspicious = [];

    function check(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;

        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;

            if (typeof value === 'string') {
                if (detectSqlInjection(value)) {
                    suspicious.push({
                        field: currentPath,
                        reason: 'Potential SQL injection detected',
                    });
                }
            } else if (typeof value === 'object' && value !== null) {
                check(value, currentPath);
            }
        }
    }

    check(body);
    return suspicious;
}

/**
 * Request sanitizer middleware
 * Sanitizes req.body, req.query, and req.params
 */
const sanitizeRequest = (req, res, next) => {
    try {
        // Sanitize body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize query params
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }

        // Sanitize URL params
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        console.error('[REQUEST_VALIDATOR] Sanitization error:', error);
        next();
    }
};

/**
 * SQL injection detection middleware
 * Logs and optionally blocks suspicious requests
 */
const detectInjection = (blockOnDetection = false) => {
    return (req, res, next) => {
        try {
            const suspicious = checkForSuspiciousPatterns(req.body);

            if (suspicious.length > 0) {
                console.warn(`[SECURITY_WARNING] Suspicious patterns detected from IP: ${req.ip}`);
                console.warn('[SECURITY_WARNING] Fields:', JSON.stringify(suspicious));

                if (blockOnDetection) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid input',
                        message: 'Request contains invalid characters or patterns.',
                    });
                }
            }

            next();
        } catch (error) {
            console.error('[REQUEST_VALIDATOR] Injection detection error:', error);
            next();
        }
    };
};

/**
 * Request size limiter middleware
 * Prevents oversized payloads
 */
const limitRequestSize = (maxSizeKB = 100) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);
        const maxBytes = maxSizeKB * 1024;

        if (contentLength > maxBytes) {
            console.warn(`[REQUEST_VALIDATOR] Oversized request from IP: ${req.ip}, size: ${contentLength} bytes`);
            return res.status(413).json({
                success: false,
                error: 'Payload too large',
                message: `Request body exceeds maximum size of ${maxSizeKB}KB.`,
            });
        }

        next();
    };
};

/**
 * Validate required fields middleware factory
 * @param {Array} requiredFields - Array of required field names
 */
const requireFields = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = requiredFields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: `The following fields are required: ${missingFields.join(', ')}`,
                missingFields,
            });
        }

        next();
    };
};

module.exports = {
    sanitizeRequest,
    detectInjection,
    limitRequestSize,
    requireFields,
    sanitizeString,
    sanitizeObject,
    detectSqlInjection,
};
