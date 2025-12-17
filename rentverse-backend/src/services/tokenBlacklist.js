/**
 * Token Blacklist Service
 * Manages invalidated JWT tokens for secure logout (OWASP M6)
 */

// In-memory token blacklist (use Redis in production for distributed systems)
const blacklistedTokens = new Map();

// Cleanup interval - remove expired tokens every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Add a token to the blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number} expiresAt - Token expiration timestamp (ms)
 */
function blacklistToken(token, expiresAt) {
    if (!token) return;

    blacklistedTokens.set(token, {
        blacklistedAt: Date.now(),
        expiresAt: expiresAt || Date.now() + (7 * 24 * 60 * 60 * 1000), // Default 7 days
    });

    console.log(`[TOKEN_BLACKLIST] Token blacklisted. Total blacklisted: ${blacklistedTokens.size}`);
}

/**
 * Check if a token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is blacklisted
 */
function isBlacklisted(token) {
    if (!token) return false;
    return blacklistedTokens.has(token);
}

/**
 * Remove a token from the blacklist
 * @param {string} token - JWT token to remove
 */
function removeFromBlacklist(token) {
    blacklistedTokens.delete(token);
}

/**
 * Blacklist all tokens for a specific user
 * Used when user changes password or for security reasons
 * @param {string} userId - User ID whose tokens should be invalidated
 * @param {Array} tokens - Array of tokens to blacklist
 */
function blacklistUserTokens(userId, tokens) {
    tokens.forEach(token => {
        blacklistToken(token);
    });
    console.log(`[TOKEN_BLACKLIST] Blacklisted ${tokens.length} tokens for user: ${userId}`);
}

/**
 * Cleanup expired tokens from the blacklist
 */
function cleanupExpiredTokens() {
    const now = Date.now();
    let removedCount = 0;

    for (const [token, data] of blacklistedTokens.entries()) {
        if (data.expiresAt < now) {
            blacklistedTokens.delete(token);
            removedCount++;
        }
    }

    if (removedCount > 0) {
        console.log(`[TOKEN_BLACKLIST] Cleaned up ${removedCount} expired tokens. Remaining: ${blacklistedTokens.size}`);
    }
}

/**
 * Get blacklist statistics
 * @returns {Object} - Blacklist statistics
 */
function getStats() {
    return {
        totalBlacklisted: blacklistedTokens.size,
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    };
}

// Start cleanup interval
setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL);

// Cleanup on startup
cleanupExpiredTokens();

module.exports = {
    blacklistToken,
    isBlacklisted,
    removeFromBlacklist,
    blacklistUserTokens,
    cleanupExpiredTokens,
    getStats,
};
