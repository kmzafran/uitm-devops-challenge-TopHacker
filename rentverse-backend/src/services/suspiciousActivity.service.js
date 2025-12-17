/**
 * Suspicious Activity Detection Service
 * Monitors login patterns and detects potential security threats
 */

const { prisma } = require('../config/database');
const crypto = require('crypto');

/**
 * Generate a device hash from user agent and IP
 * @param {string} userAgent - User agent string
 * @param {string} ipAddress - IP address
 * @returns {string} - Device hash
 */
function generateDeviceHash(userAgent, ipAddress) {
    const data = `${userAgent || 'unknown'}-${ipAddress || 'unknown'}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Parse user agent to extract device info
 * @param {string} userAgent - User agent string
 * @returns {Object} - Parsed device info
 */
function parseUserAgent(userAgent) {
    if (!userAgent) return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };

    // Simple detection - in production use a library like ua-parser-js
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';

    let browser = 'unknown';
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';
    else if (/msie|trident/i.test(userAgent)) browser = 'IE';

    let os = 'unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/macintosh|mac os/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';

    return { deviceType, browser, os };
}

/**
 * Record a login attempt
 * @param {Object} params - Login attempt parameters
 * @returns {Object} - Created login history record
 */
async function recordLoginAttempt({
    userId,
    ipAddress,
    userAgent,
    success,
    failReason = null,
    loginMethod = 'email', // 'email', 'google', 'facebook', 'github', 'twitter', 'apple'
}) {
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // Calculate risk score
    const riskScore = await calculateRiskScore(userId, ipAddress, userAgent);

    const loginHistory = await prisma.loginHistory.create({
        data: {
            userId,
            ipAddress: ipAddress || '::1',
            userAgent,
            deviceType,
            browser,
            os,
            success,
            failReason,
            riskScore,
            loginMethod, // Track OAuth provider
        },
    });

    console.log(`[LOGIN_HISTORY] Recorded ${success ? 'successful' : 'failed'} ${loginMethod} login for user ${userId}, risk: ${riskScore}`);

    return loginHistory;
}

/**
 * Calculate risk score for a login attempt
 * @param {string} userId - User ID
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 * @returns {number} - Risk score 0-100
 */
async function calculateRiskScore(userId, ipAddress, userAgent) {
    let riskScore = 0;

    try {
        // Check if this is a new device
        const deviceHash = generateDeviceHash(userAgent, ipAddress);
        const knownDevice = await prisma.userDevice.findFirst({
            where: { userId, deviceHash },
        });

        if (!knownDevice) {
            riskScore += 30; // New device adds risk
        }

        // Check for recent failed attempts
        const recentFailures = await prisma.loginHistory.count({
            where: {
                userId,
                success: false,
                createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 minutes
            },
        });

        riskScore += Math.min(recentFailures * 10, 30); // Up to 30 points for failures

        // Check for unusual login time (between 2 AM and 5 AM local time)
        const hour = new Date().getHours();
        if (hour >= 2 && hour <= 5) {
            riskScore += 15; // Unusual timing
        }

        // Check if IP was used for failed attempts on other accounts
        const ipFailures = await prisma.loginHistory.count({
            where: {
                ipAddress,
                success: false,
                createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
            },
        });

        if (ipFailures > 5) {
            riskScore += 25; // Suspicious IP
        }

    } catch (error) {
        console.error('[RISK_SCORE] Error calculating risk:', error);
    }

    return Math.min(riskScore, 100);
}

/**
 * Check if device is known for user
 * @param {string} userId - User ID
 * @param {string} userAgent - User agent
 * @param {string} ipAddress - IP address
 * @returns {Object} - Device check result
 */
async function checkDevice(userId, userAgent, ipAddress) {
    const deviceHash = generateDeviceHash(userAgent, ipAddress);
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    const existingDevice = await prisma.userDevice.findFirst({
        where: { userId, deviceHash },
    });

    if (existingDevice) {
        // Update last used time
        await prisma.userDevice.update({
            where: { id: existingDevice.id },
            data: { lastUsedAt: new Date(), ipAddress },
        });

        return { isNew: false, device: existingDevice };
    }

    // Register new device
    const newDevice = await prisma.userDevice.create({
        data: {
            userId,
            deviceHash,
            deviceName: `${browser} on ${os}`,
            deviceType,
            browser,
            os,
            ipAddress,
        },
    });

    console.log(`[DEVICE] New device registered for user ${userId}: ${browser} on ${os}`);

    return { isNew: true, device: newDevice };
}

/**
 * Check for suspicious patterns
 * @param {string} userId - User ID
 * @param {string} ipAddress - IP address
 * @returns {Object} - Suspicious activity check result
 */
async function checkSuspiciousPatterns(userId, ipAddress) {
    const alerts = [];

    try {
        // Check for multiple failed attempts in short time
        const recentFailures = await prisma.loginHistory.count({
            where: {
                userId,
                success: false,
                createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
            },
        });

        if (recentFailures >= 3) {
            alerts.push({
                type: 'MULTIPLE_FAILURES',
                severity: 'high',
                message: `${recentFailures} failed login attempts in the last 5 minutes`,
            });
        }

        // Check for logins from multiple IPs in short time
        const recentLogins = await prisma.loginHistory.findMany({
            where: {
                userId,
                success: true,
                createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
            },
            select: { ipAddress: true },
            distinct: ['ipAddress'],
        });

        if (recentLogins.length > 3) {
            alerts.push({
                type: 'MULTIPLE_LOCATIONS',
                severity: 'medium',
                message: `Logins from ${recentLogins.length} different IPs in the last hour`,
            });
        }

        // Check unusual timing
        const hour = new Date().getHours();
        if (hour >= 2 && hour <= 5) {
            alerts.push({
                type: 'SUSPICIOUS_TIMING',
                severity: 'low',
                message: 'Login at unusual hour (between 2 AM and 5 AM)',
            });
        }

    } catch (error) {
        console.error('[SUSPICIOUS] Error checking patterns:', error);
    }

    return { hasSuspiciousActivity: alerts.length > 0, alerts };
}

/**
 * Get recent login history for user
 * @param {string} userId - User ID
 * @param {number} limit - Number of records to fetch
 * @returns {Array} - Login history records
 */
async function getLoginHistory(userId, limit = 10) {
    return prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get user's registered devices
 * @param {string} userId - User ID
 * @returns {Array} - User devices
 */
async function getUserDevices(userId) {
    return prisma.userDevice.findMany({
        where: { userId },
        orderBy: { lastUsedAt: 'desc' },
    });
}

/**
 * Remove a device from user's trusted devices
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID
 */
async function removeDevice(userId, deviceId) {
    await prisma.userDevice.deleteMany({
        where: { id: deviceId, userId },
    });
}

module.exports = {
    generateDeviceHash,
    parseUserAgent,
    recordLoginAttempt,
    calculateRiskScore,
    checkDevice,
    checkSuspiciousPatterns,
    getLoginHistory,
    getUserDevices,
    removeDevice,
};
