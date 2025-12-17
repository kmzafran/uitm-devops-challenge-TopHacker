/**
 * Security Alert Service
 * Sends security notifications via email and creates alert records
 */

const { prisma } = require('../config/database');
const emailService = require('./email.service');

/**
 * Create and send a security alert
 * @param {Object} params - Alert parameters
 * @returns {Object} - Created alert record
 */
async function createAlert({
    userId,
    type,
    title,
    message,
    metadata = {},
    sendEmail = true,
}) {
    try {
        // Create alert record in database
        const alert = await prisma.securityAlert.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata,
                emailSent: false,
            },
        });

        console.log(`[SECURITY_ALERT] Created ${type} alert for user ${userId}`);

        // Send email notification if requested
        if (sendEmail) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, firstName: true, name: true },
            });

            if (user?.email) {
                const emailSent = await sendAlertEmail(user, type, title, message, metadata);

                // Update alert record with email status
                await prisma.securityAlert.update({
                    where: { id: alert.id },
                    data: { emailSent },
                });
            }
        }

        return alert;
    } catch (error) {
        console.error('[SECURITY_ALERT] Error creating alert:', error);
        throw error;
    }
}

/**
 * Send security alert email
 * @param {Object} user - User object with email
 * @param {string} type - Alert type
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Object} metadata - Additional data
 * @returns {boolean} - Success status
 */
async function sendAlertEmail(user, type, title, message, metadata) {
    try {
        const html = generateAlertEmailHtml(user, type, title, message, metadata);

        await emailService.sendEmail({
            to: user.email,
            subject: `🔒 Security Alert: ${title}`,
            html,
        });

        console.log(`[SECURITY_ALERT] Email sent to ${user.email} for ${type}`);
        return true;
    } catch (error) {
        console.error('[SECURITY_ALERT] Failed to send email:', error);
        return false;
    }
}

/**
 * Generate HTML email content for security alert
 */
function generateAlertEmailHtml(user, type, title, message, metadata) {
    const userName = user.firstName || user.name || 'User';
    const timestamp = new Date().toLocaleString();

    const alertColors = {
        NEW_DEVICE: '#f59e0b',
        MULTIPLE_FAILURES: '#ef4444',
        ACCOUNT_LOCKED: '#dc2626',
        PASSWORD_CHANGED: '#10b981',
        SUSPICIOUS_TIMING: '#f97316',
        NEW_LOCATION: '#8b5cf6',
    };

    const color = alertColors[type] || '#3b82f6';

    let detailsHtml = '';
    if (metadata.ipAddress) {
        detailsHtml += `<p><strong>IP Address:</strong> ${metadata.ipAddress}</p>`;
    }
    if (metadata.device) {
        detailsHtml += `<p><strong>Device:</strong> ${metadata.device}</p>`;
    }
    if (metadata.browser) {
        detailsHtml += `<p><strong>Browser:</strong> ${metadata.browser}</p>`;
    }
    if (metadata.location) {
        detailsHtml += `<p><strong>Location:</strong> ${metadata.location}</p>`;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">🔒</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Security Alert</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>
      
      <div style="background-color: #fef3c7; border-left: 4px solid ${color}; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
        <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">${title}</h2>
        <p style="color: #78350f; margin: 0; font-size: 14px;">${message}</p>
      </div>
      
      ${detailsHtml ? `
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Details</h3>
        ${detailsHtml}
      </div>
      ` : ''}
      
      <p style="color: #6b7280; font-size: 14px;">
        <strong>Time:</strong> ${timestamp}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      
      <p style="color: #6b7280; font-size: 14px;">
        If this was you, no action is needed. If you didn't perform this action, please 
        <a href="#" style="color: ${color};">secure your account</a> immediately by changing your password.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This is an automated security notification from RentVerse.<br>
        Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Create new device alert
 */
async function alertNewDevice(userId, deviceInfo) {
    return createAlert({
        userId,
        type: 'NEW_DEVICE',
        title: 'New Device Login Detected',
        message: `A new device was used to access your account: ${deviceInfo.browser} on ${deviceInfo.os}`,
        metadata: {
            ipAddress: deviceInfo.ipAddress,
            device: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
        },
        sendEmail: true,
    });
}

/**
 * Create multiple failures alert
 */
async function alertMultipleFailures(userId, failCount, ipAddress) {
    return createAlert({
        userId,
        type: 'MULTIPLE_FAILURES',
        title: 'Multiple Failed Login Attempts',
        message: `There were ${failCount} failed login attempts on your account in the last 5 minutes.`,
        metadata: { ipAddress, failCount },
        sendEmail: true,
    });
}

/**
 * Create account locked alert
 */
async function alertAccountLocked(userId, ipAddress) {
    return createAlert({
        userId,
        type: 'ACCOUNT_LOCKED',
        title: 'Account Temporarily Locked',
        message: 'Your account has been temporarily locked due to multiple failed login attempts. It will automatically unlock after 15 minutes.',
        metadata: { ipAddress },
        sendEmail: true,
    });
}

/**
 * Create password changed alert
 */
async function alertPasswordChanged(userId, ipAddress) {
    return createAlert({
        userId,
        type: 'PASSWORD_CHANGED',
        title: 'Password Changed Successfully',
        message: 'Your account password was recently changed. If you did not make this change, please contact support immediately.',
        metadata: { ipAddress },
        sendEmail: true,
    });
}

/**
 * Create suspicious timing alert
 */
async function alertSuspiciousTiming(userId, ipAddress, hour) {
    return createAlert({
        userId,
        type: 'SUSPICIOUS_TIMING',
        title: 'Unusual Login Time Detected',
        message: `A login to your account was detected at an unusual hour (${hour}:00). This may be normal if you're in a different timezone.`,
        metadata: { ipAddress, loginHour: hour },
        sendEmail: false, // Don't email for timing alerts by default
    });
}

/**
 * Get user's security alerts
 */
async function getUserAlerts(userId, limit = 20) {
    return prisma.securityAlert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Mark alert as read
 */
async function markAlertAsRead(alertId, userId) {
    return prisma.securityAlert.updateMany({
        where: { id: alertId, userId },
        data: { isRead: true },
    });
}

/**
 * Get unread alerts count
 */
async function getUnreadAlertsCount(userId) {
    return prisma.securityAlert.count({
        where: { userId, isRead: false },
    });
}

module.exports = {
    createAlert,
    alertNewDevice,
    alertMultipleFailures,
    alertAccountLocked,
    alertPasswordChanged,
    alertSuspiciousTiming,
    getUserAlerts,
    markAlertAsRead,
    getUnreadAlertsCount,
};
