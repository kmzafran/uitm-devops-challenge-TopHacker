const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../config/database');

// Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const MAX_LOGIN_ATTEMPTS = 5;

class OtpService {
    /**
     * Generate a secure random OTP code
     * @returns {string} 6-digit OTP code
     */
    generateOtpCode() {
        // Generate cryptographically secure random number
        const randomBytes = crypto.randomBytes(4);
        const randomNumber = randomBytes.readUInt32BE(0);
        // Ensure 6 digits by using modulo and padding
        const otp = (randomNumber % 1000000).toString().padStart(OTP_LENGTH, '0');
        return otp;
    }

    /**
     * Hash OTP code for secure storage
     * @param {string} code - Plain OTP code
     * @returns {Promise<string>} Hashed OTP code
     */
    async hashOtp(code) {
        return await bcrypt.hash(code, 10);
    }

    /**
     * Verify OTP code using constant-time comparison
     * @param {string} code - Plain OTP code
     * @param {string} hashedCode - Hashed OTP code from database
     * @returns {Promise<boolean>} Whether the code matches
     */
    async verifyOtpHash(code, hashedCode) {
        return await bcrypt.compare(code, hashedCode);
    }

    /**
     * Create and store a new OTP for a user
     * @param {string} userId - User ID
     * @param {string} type - OTP type (LOGIN, PASSWORD_RESET, EMAIL_VERIFY)
     * @returns {Promise<{otp: string, expiresAt: Date}>} Plain OTP and expiry
     */
    async createOtp(userId, type = 'LOGIN') {
        // Invalidate any existing OTPs of the same type for this user
        await prisma.otpCode.updateMany({
            where: {
                userId,
                type,
                usedAt: null,
            },
            data: {
                usedAt: new Date(), // Mark as used to invalidate
            },
        });

        // Generate new OTP
        const plainOtp = this.generateOtpCode();
        const hashedOtp = await this.hashOtp(plainOtp);

        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

        // Store hashed OTP
        await prisma.otpCode.create({
            data: {
                userId,
                code: hashedOtp,
                type,
                expiresAt,
                attempts: 0,
            },
        });

        console.log(`[OTP] Created OTP for user ${userId}, type: ${type}, expires: ${expiresAt}`);

        return {
            otp: plainOtp,
            expiresAt,
        };
    }

    /**
     * Verify an OTP code for a user
     * @param {string} userId - User ID
     * @param {string} code - Plain OTP code to verify
     * @param {string} type - OTP type
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async verifyOtp(userId, code, type = 'LOGIN') {
        // Find the most recent unused OTP of this type
        const otpRecord = await prisma.otpCode.findFirst({
            where: {
                userId,
                type,
                usedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!otpRecord) {
            return {
                success: false,
                message: 'No valid OTP found. Please request a new one.',
            };
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            return {
                success: false,
                message: 'OTP has expired. Please request a new one.',
            };
        }

        // Check if max attempts exceeded
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            // Mark as used to invalidate
            await prisma.otpCode.update({
                where: { id: otpRecord.id },
                data: { usedAt: new Date() },
            });

            return {
                success: false,
                message: 'Maximum OTP attempts exceeded. Please request a new one.',
            };
        }

        // Increment attempt count
        await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { attempts: otpRecord.attempts + 1 },
        });

        // Verify the OTP code
        const isValid = await this.verifyOtpHash(code, otpRecord.code);

        if (!isValid) {
            const remainingAttempts = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
            return {
                success: false,
                message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
            };
        }

        // Mark OTP as used
        await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { usedAt: new Date() },
        });

        console.log(`[OTP] Successfully verified OTP for user ${userId}, type: ${type}`);

        return {
            success: true,
            message: 'OTP verified successfully.',
        };
    }

    /**
     * Check if a user account is locked
     * @param {string} userId - User ID
     * @returns {Promise<{locked: boolean, lockedUntil: Date|null}>}
     */
    async checkAccountLock(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                lockedUntil: true,
                loginAttempts: true,
            },
        });

        if (!user) {
            return { locked: false, lockedUntil: null };
        }

        if (user.lockedUntil && new Date() < user.lockedUntil) {
            return {
                locked: true,
                lockedUntil: user.lockedUntil,
            };
        }

        return { locked: false, lockedUntil: null };
    }

    /**
     * Record a failed login attempt
     * @param {string} userId - User ID
     * @returns {Promise<{locked: boolean, attemptsRemaining: number}>}
     */
    async recordFailedAttempt(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { loginAttempts: true },
        });

        if (!user) {
            return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS };
        }

        const newAttempts = user.loginAttempts + 1;
        const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

        const updateData = {
            loginAttempts: newAttempts,
        };

        if (shouldLock) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
            updateData.lockedUntil = lockUntil;
            console.log(`[OTP] Account locked for user ${userId} until ${lockUntil}`);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return {
            locked: shouldLock,
            attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - newAttempts),
        };
    }

    /**
     * Reset login attempts after successful login
     * @param {string} userId - User ID
     */
    async resetLoginAttempts(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                loginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });
    }

    /**
     * Enable MFA for a user
     * @param {string} userId - User ID
     */
    async enableMfa(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true },
        });
        console.log(`[OTP] MFA enabled for user ${userId}`);
    }

    /**
     * Disable MFA for a user
     * @param {string} userId - User ID
     */
    async disableMfa(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: false },
        });
        console.log(`[OTP] MFA disabled for user ${userId}`);
    }

    /**
     * Check if MFA is enabled for a user
     * @param {string} userId - User ID
     * @returns {Promise<boolean>}
     */
    async isMfaEnabled(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { mfaEnabled: true },
        });
        return user?.mfaEnabled || false;
    }

    /**
     * Cleanup expired OTP codes (for cron job)
     */
    async cleanupExpiredOtps() {
        const deleted = await prisma.otpCode.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { usedAt: { not: null } },
                ],
                createdAt: {
                    lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
                },
            },
        });
        console.log(`[OTP] Cleaned up ${deleted.count} expired OTP codes`);
        return deleted.count;
    }
}

module.exports = new OtpService();
