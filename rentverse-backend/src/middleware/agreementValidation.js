/**
 * Agreement Validation Middleware
 * 
 * Provides access control and validation for digital agreements.
 * Security Focus: Data Integrity & Workflow Validation
 */

const crypto = require('crypto');
const { prisma } = require('../config/database');

/**
 * Generate SHA256 hash for agreement content
 * @param {Object} agreementData - Agreement data to hash
 * @returns {string} SHA256 hash
 */
const generateAgreementHash = (agreementData) => {
    const content = JSON.stringify({
        leaseId: agreementData.leaseId,
        tenantId: agreementData.tenantId,
        landlordId: agreementData.landlordId,
        propertyId: agreementData.propertyId,
        startDate: agreementData.startDate,
        endDate: agreementData.endDate,
        rentAmount: agreementData.rentAmount,
        generatedAt: agreementData.generatedAt,
    });

    return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Verify agreement integrity by comparing hash
 * @param {Object} agreement - Agreement record
 * @param {Object} lease - Lease data
 * @returns {boolean} True if hash matches
 */
const verifyAgreementIntegrity = (agreement, lease) => {
    if (!agreement.contentHash) {
        return true; // No hash to verify (legacy agreements)
    }

    const currentHash = generateAgreementHash({
        leaseId: lease.id,
        tenantId: lease.tenantId,
        landlordId: lease.landlordId,
        propertyId: lease.propertyId,
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount,
        generatedAt: agreement.generatedAt,
    });

    return agreement.contentHash === currentHash;
};

/**
 * Middleware to validate user has access to agreement
 * User must be either tenant or landlord of the lease
 */
const validateAgreementAccess = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Authentication required to access agreement.',
            });
        }

        // Get the lease/booking
        const lease = await prisma.lease.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                tenantId: true,
                landlordId: true,
                status: true,
                agreement: true,
            },
        });

        if (!lease) {
            return res.status(404).json({
                success: false,
                error: 'NOT_FOUND',
                message: 'Booking not found.',
            });
        }

        // Check if user is tenant or landlord
        const isTenant = lease.tenantId === userId;
        const isLandlord = lease.landlordId === userId;
        const isAdmin = req.user?.role === 'ADMIN';

        if (!isTenant && !isLandlord && !isAdmin) {
            console.warn('[AGREEMENT] Unauthorized access attempt:', {
                userId,
                bookingId,
                timestamp: new Date().toISOString(),
            });

            return res.status(403).json({
                success: false,
                error: 'ACCESS_DENIED',
                message: 'You do not have permission to access this agreement.',
            });
        }

        // Attach lease and role info to request
        req.lease = lease;
        req.isTenant = isTenant;
        req.isLandlord = isLandlord;

        next();
    } catch (error) {
        console.error('[AGREEMENT] Validation error:', error);
        res.status(500).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Failed to validate agreement access.',
        });
    }
};

/**
 * Middleware to check agreement can be signed
 * Booking must be APPROVED or ACTIVE
 */
const validateSigningEligibility = async (req, res, next) => {
    try {
        const lease = req.lease;

        if (!lease) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_STATE',
                message: 'Lease data not available.',
            });
        }

        // Check if booking is in signable status
        if (!['APPROVED', 'ACTIVE'].includes(lease.status)) {
            return res.status(400).json({
                success: false,
                error: 'NOT_SIGNABLE',
                message: `Agreement cannot be signed. Booking status is ${lease.status}.`,
            });
        }

        // Check if agreement exists
        if (!lease.agreement) {
            return res.status(400).json({
                success: false,
                error: 'NO_AGREEMENT',
                message: 'No rental agreement found for this booking.',
            });
        }

        // Check if user already signed
        if (req.isTenant && lease.agreement.signedByTenant) {
            return res.status(400).json({
                success: false,
                error: 'ALREADY_SIGNED',
                message: 'You have already signed this agreement.',
            });
        }

        if (req.isLandlord && lease.agreement.signedByLandlord) {
            return res.status(400).json({
                success: false,
                error: 'ALREADY_SIGNED',
                message: 'You have already signed this agreement.',
            });
        }

        next();
    } catch (error) {
        console.error('[AGREEMENT] Signing eligibility error:', error);
        res.status(500).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Failed to validate signing eligibility.',
        });
    }
};

module.exports = {
    generateAgreementHash,
    verifyAgreementIntegrity,
    validateAgreementAccess,
    validateSigningEligibility,
};
