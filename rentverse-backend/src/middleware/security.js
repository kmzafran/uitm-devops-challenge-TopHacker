/**
 * Security Middleware
 * 
 * Provides additional security measures for the API.
 * OWASP M5-M6 - Insecure Communication & Insecure Authorization
 */

/**
 * HTTPS Enforcement Middleware
 * Redirects HTTP to HTTPS in production
 */
const httpsEnforcement = (req, res, next) => {
    // Only enforce in production
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    // Check if request is already HTTPS
    const isHttps = req.secure ||
        req.headers['x-forwarded-proto'] === 'https' ||
        req.protocol === 'https';

    if (!isHttps) {
        // Redirect to HTTPS
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        console.log(`[SECURITY] Redirecting HTTP to HTTPS: ${req.url}`);
        return res.redirect(301, httpsUrl);
    }

    next();
};

/**
 * Security Headers Middleware
 * Adds additional security headers not covered by Helmet
 */
const additionalSecurityHeaders = (req, res, next) => {
    // Prevent browsers from caching sensitive responses
    if (req.path.startsWith('/api/auth')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }

    // Add Permissions-Policy header
    res.setHeader('Permissions-Policy',
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');

    // Add additional X-headers for older browsers
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    next();
};

/**
 * Request Sanitization Logger
 * Logs suspicious requests for security monitoring
 */
const securityLogger = (req, res, next) => {
    // Only log in development or if explicitly enabled
    if (process.env.NODE_ENV !== 'development' && !process.env.SECURITY_LOGGING) {
        return next();
    }

    const suspiciousPatterns = [
        /(\%00|\\x00|\\0)/i,           // Null byte injection
        /<script[\s\S]*?>/i,          // XSS attempt
        /(union[\s\S]*?select)/i,     // SQL injection
        /(\/\.\.\/|\.\.\\)/i,         // Path traversal
        /(\$\{|#{)/i,                 // Template injection
    ];

    const requestData = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params,
    });

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(requestData) || pattern.test(req.url)) {
            console.warn(`[SECURITY WARNING] Suspicious request detected:`, {
                ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
                method: req.method,
                url: req.url,
                userAgent: req.headers['user-agent'],
                pattern: pattern.toString(),
                timestamp: new Date().toISOString(),
            });
            break;
        }
    }

    next();
};

/**
 * API Key Validation Middleware (for future use)
 * Validates API keys for third-party integrations
 */
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    // Skip if no API key requirement
    if (!process.env.REQUIRE_API_KEY) {
        return next();
    }

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key required',
            message: 'Please provide a valid API key in the X-API-Key header.',
        });
    }

    // Validate API key (simple implementation)
    const validApiKeys = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);

    if (!validApiKeys.includes(apiKey)) {
        console.warn(`[SECURITY] Invalid API key attempt:`, {
            ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
            apiKey: apiKey.substring(0, 8) + '...',
            timestamp: new Date().toISOString(),
        });

        return res.status(403).json({
            success: false,
            error: 'Invalid API key',
            message: 'The provided API key is invalid.',
        });
    }

    next();
};

module.exports = {
    httpsEnforcement,
    additionalSecurityHeaders,
    securityLogger,
    validateApiKey,
};
