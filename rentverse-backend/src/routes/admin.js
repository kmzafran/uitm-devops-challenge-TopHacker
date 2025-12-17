/**
 * Admin Routes
 * 
 * Admin-only endpoints for activity log dashboard and system monitoring.
 * Security Focus: Threat Visualization & Accountability
 */

const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const activityLogger = require('../services/activityLogger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints for system monitoring
 */

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get activity logs (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by activity type
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [INFO, WARN]
 *         description: Filter by log level
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Activity logs retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/logs', auth, authorize('ADMIN'), (req, res) => {
    try {
        const { type, level, limit, offset } = req.query;

        const result = activityLogger.getLogs({
            type,
            level,
            limit: limit ? parseInt(limit) : 100,
            offset: offset ? parseInt(offset) : 0,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve logs',
        });
    }
});

/**
 * @swagger
 * /api/admin/logs/stats:
 *   get:
 *     summary: Get log statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log statistics retrieved
 */
router.get('/logs/stats', auth, authorize('ADMIN'), (req, res) => {
    try {
        const stats = activityLogger.getLogStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Get log stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve log statistics',
        });
    }
});

/**
 * @swagger
 * /api/admin/logs/failed-logins:
 *   get:
 *     summary: Get failed login attempts (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Failed login logs retrieved
 */
router.get('/logs/failed-logins', auth, authorize('ADMIN'), (req, res) => {
    try {
        const { limit, offset } = req.query;

        const result = activityLogger.getLogs({
            type: 'LOGIN_FAILED',
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Get failed logins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve failed login logs',
        });
    }
});

/**
 * @swagger
 * /api/admin/logs/suspicious:
 *   get:
 *     summary: Get suspicious activity alerts (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suspicious activity logs retrieved
 */
router.get('/logs/suspicious', auth, authorize('ADMIN'), (req, res) => {
    try {
        const { limit, offset } = req.query;

        const result = activityLogger.getLogs({
            type: 'SUSPICIOUS_ACTIVITY',
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Get suspicious activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve suspicious activity logs',
        });
    }
});

/**
 * @swagger
 * /api/admin/logs/clear:
 *   post:
 *     summary: Clear all logs (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs cleared successfully
 */
router.post('/logs/clear', auth, authorize('ADMIN'), (req, res) => {
    try {
        const result = activityLogger.clearLogs();

        // Log this action
        activityLogger.logActivity('ADMIN_ACTION', {
            action: 'CLEAR_LOGS',
            adminId: req.user.id,
            adminEmail: req.user.email,
        });

        res.json({
            success: true,
            message: 'Logs cleared successfully',
            data: result,
        });
    } catch (error) {
        console.error('Clear logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear logs',
        });
    }
});

module.exports = router;
