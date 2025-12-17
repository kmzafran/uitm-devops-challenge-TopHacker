/**
 * Activity Logger Service
 * 
 * Logs user activities and detects suspicious login patterns.
 * Security Focus: DevSecOps Monitoring & Incident Detection
 */

// In-memory store for tracking login attempts (simple approach)
const loginAttempts = new Map();

// Configuration
const CONFIG = {
    FAILED_ATTEMPT_THRESHOLD: 5,    // Max failed attempts before alert
    ATTEMPT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // Clean old entries every hour
};

/**
 * Log activity types
 */
const ActivityType = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    PASSWORD_RESET: 'PASSWORD_RESET',
    MFA_ENABLED: 'MFA_ENABLED',
    MFA_VERIFIED: 'MFA_VERIFIED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    PROPERTY_CREATED: 'PROPERTY_CREATED',
    BOOKING_CREATED: 'BOOKING_CREATED',
    AGREEMENT_SIGNED: 'AGREEMENT_SIGNED',
};

/**
 * Format log entry with timestamp
 */
const formatLog = (level, type, data) => {
    return {
        timestamp: new Date().toISOString(),
        level,
        type,
        ...data,
    };
};

/**
 * Log user activity
 * @param {string} type - Activity type from ActivityType enum
 * @param {Object} details - Activity details
 */
const logActivity = (type, details) => {
    const log = formatLog('INFO', type, details);

    // Console log with color coding
    const prefix = `[ACTIVITY][${type}]`;

    switch (type) {
        case ActivityType.LOGIN_FAILED:
        case ActivityType.SUSPICIOUS_ACTIVITY:
            console.warn(prefix, JSON.stringify(log));
            break;
        default:
            console.log(prefix, JSON.stringify(log));
    }

    return log;
};

/**
 * Get tracking key for login attempts
 */
const getTrackingKey = (ip, email) => {
    return `${ip}:${email || 'unknown'}`;
};

/**
 * Track failed login attempt
 * @param {string} ip - Client IP address
 * @param {string} email - Email attempted
 * @returns {Object} Tracking result with alert status
 */
const trackFailedLogin = (ip, email) => {
    const key = getTrackingKey(ip, email);
    const now = Date.now();

    // Get or create tracking entry
    let entry = loginAttempts.get(key);
    if (!entry) {
        entry = { attempts: [], alertSent: false };
        loginAttempts.set(key, entry);
    }

    // Clean old attempts outside the window
    entry.attempts = entry.attempts.filter(
        timestamp => (now - timestamp) < CONFIG.ATTEMPT_WINDOW_MS
    );

    // Add new attempt
    entry.attempts.push(now);

    // Check if threshold exceeded
    const isOverThreshold = entry.attempts.length >= CONFIG.FAILED_ATTEMPT_THRESHOLD;
    let shouldAlert = false;

    if (isOverThreshold && !entry.alertSent) {
        shouldAlert = true;
        entry.alertSent = true;

        // Log suspicious activity alert
        logActivity(ActivityType.SUSPICIOUS_ACTIVITY, {
            alert: 'MULTIPLE_FAILED_LOGINS',
            ip,
            email,
            attemptCount: entry.attempts.length,
            windowMinutes: CONFIG.ATTEMPT_WINDOW_MS / 60000,
            message: `Multiple failed login attempts detected: ${entry.attempts.length} attempts in ${CONFIG.ATTEMPT_WINDOW_MS / 60000} minutes`,
        });
    }

    return {
        attemptCount: entry.attempts.length,
        isOverThreshold,
        shouldAlert,
    };
};

/**
 * Reset tracking for successful login
 */
const resetLoginTracking = (ip, email) => {
    const key = getTrackingKey(ip, email);
    loginAttempts.delete(key);
};

/**
 * Get login attempt stats for an IP/email
 */
const getLoginAttemptStats = (ip, email) => {
    const key = getTrackingKey(ip, email);
    const entry = loginAttempts.get(key);

    if (!entry) {
        return { attempts: 0, isBlocked: false };
    }

    const now = Date.now();
    const recentAttempts = entry.attempts.filter(
        timestamp => (now - timestamp) < CONFIG.ATTEMPT_WINDOW_MS
    );

    return {
        attempts: recentAttempts.length,
        isBlocked: recentAttempts.length >= CONFIG.FAILED_ATTEMPT_THRESHOLD,
    };
};

/**
 * Log login success
 */
const logLoginSuccess = (userId, email, ip, userAgent) => {
    resetLoginTracking(ip, email);

    return logActivity(ActivityType.LOGIN_SUCCESS, {
        userId,
        email,
        ip,
        userAgent,
    });
};

/**
 * Log login failure
 */
const logLoginFailed = (email, ip, userAgent, reason) => {
    const trackingResult = trackFailedLogin(ip, email);

    return logActivity(ActivityType.LOGIN_FAILED, {
        email,
        ip,
        userAgent,
        reason,
        attemptCount: trackingResult.attemptCount,
        alertTriggered: trackingResult.shouldAlert,
    });
};

/**
 * Log logout
 */
const logLogout = (userId, email, ip) => {
    return logActivity(ActivityType.LOGOUT, { userId, email, ip });
};

/**
 * Log registration
 */
const logRegister = (userId, email, ip) => {
    return logActivity(ActivityType.REGISTER, { userId, email, ip });
};

/**
 * Log MFA verification
 */
const logMfaVerified = (userId, email, ip) => {
    return logActivity(ActivityType.MFA_VERIFIED, { userId, email, ip });
};

/**
 * Cleanup old entries (call periodically)
 */
const cleanupOldEntries = () => {
    const now = Date.now();

    for (const [key, entry] of loginAttempts.entries()) {
        entry.attempts = entry.attempts.filter(
            timestamp => (now - timestamp) < CONFIG.ATTEMPT_WINDOW_MS
        );

        if (entry.attempts.length === 0) {
            loginAttempts.delete(key);
        }
    }
};

// Setup cleanup interval
setInterval(cleanupOldEntries, CONFIG.CLEANUP_INTERVAL_MS);

// ========== LOG STORAGE FOR DASHBOARD (Module 5) ==========

const MAX_STORED_LOGS = 1000;
const activityLogs = [];

/**
 * Store log entry in memory
 */
const storeLog = (log) => {
    activityLogs.unshift(log); // Add to beginning (newest first)

    // Trim to max size
    if (activityLogs.length > MAX_STORED_LOGS) {
        activityLogs.length = MAX_STORED_LOGS;
    }
};

// Override logActivity to also store logs
const originalLogActivity = logActivity;
const logActivityWithStorage = (type, details) => {
    const log = formatLog(
        type === ActivityType.LOGIN_FAILED || type === ActivityType.SUSPICIOUS_ACTIVITY ? 'WARN' : 'INFO',
        type,
        details
    );

    // Console log
    const prefix = `[ACTIVITY][${type}]`;
    switch (type) {
        case ActivityType.LOGIN_FAILED:
        case ActivityType.SUSPICIOUS_ACTIVITY:
            console.warn(prefix, JSON.stringify(log));
            break;
        default:
            console.log(prefix, JSON.stringify(log));
    }

    // Store log
    storeLog(log);

    return log;
};

/**
 * Get stored activity logs
 * @param {Object} options - Filter options
 * @returns {Array} Filtered logs
 */
const getLogs = (options = {}) => {
    const { type, level, limit = 100, offset = 0 } = options;

    let filtered = activityLogs;

    if (type) {
        filtered = filtered.filter(log => log.type === type);
    }

    if (level) {
        filtered = filtered.filter(log => log.level === level);
    }

    return {
        logs: filtered.slice(offset, offset + limit),
        total: filtered.length,
        limit,
        offset,
    };
};

/**
 * Get log statistics
 */
const getLogStats = () => {
    const stats = {
        total: activityLogs.length,
        byType: {},
        byLevel: {},
        last24Hours: 0,
        suspiciousCount: 0,
        failedLogins: 0,
    };

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    activityLogs.forEach(log => {
        // Count by type
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

        // Count by level
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

        // Count last 24 hours
        if (new Date(log.timestamp).getTime() > oneDayAgo) {
            stats.last24Hours++;
        }

        // Count suspicious
        if (log.type === ActivityType.SUSPICIOUS_ACTIVITY) {
            stats.suspiciousCount++;
        }

        // Count failed logins
        if (log.type === ActivityType.LOGIN_FAILED) {
            stats.failedLogins++;
        }
    });

    return stats;
};

/**
 * Clear all logs (admin function)
 */
const clearLogs = () => {
    activityLogs.length = 0;
    return { cleared: true, timestamp: new Date().toISOString() };
};

module.exports = {
    ActivityType,
    logActivity: logActivityWithStorage,
    logLoginSuccess,
    logLoginFailed,
    logLogout,
    logRegister,
    logMfaVerified,
    trackFailedLogin,
    resetLoginTracking,
    getLoginAttemptStats,
    // Dashboard functions
    getLogs,
    getLogStats,
    clearLogs,
};
