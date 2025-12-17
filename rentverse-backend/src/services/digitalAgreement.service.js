const crypto = require('crypto');
const { prisma } = require('../config/database');

/**
 * Digital Agreement Service
 * Handles secure signature validation, workflow management, and access control
 */
class DigitalAgreementService {

    /**
     * Create SHA-256 hash for signature validation
     * @param {string} signature - Base64 signature data
     * @param {string} timestamp - ISO timestamp
     * @param {string} leaseId - Lease ID
     * @param {string} userId - User ID
     * @returns {string} SHA-256 hash
     */
    createSignatureHash(signature, timestamp, leaseId, userId) {
        const data = `${signature}|${timestamp}|${leaseId}|${userId}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Create hash of PDF document for integrity verification
     * @param {Buffer} pdfBuffer - PDF file buffer
     * @returns {string} SHA-256 hash
     */
    createDocumentHash(pdfBuffer) {
        return crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    }

    /**
     * Verify signature hash integrity
     * @param {string} storedHash - Hash stored in database
     * @param {string} signature - Signature to verify
     * @param {string} timestamp - Original timestamp
     * @param {string} leaseId - Lease ID
     * @param {string} userId - User ID
     * @returns {boolean} True if valid
     */
    verifySignatureHash(storedHash, signature, timestamp, leaseId, userId) {
        const computedHash = this.createSignatureHash(signature, timestamp, leaseId, userId);
        return storedHash === computedHash;
    }

    /**
     * Initiate agreement signing workflow
     * @param {string} agreementId - Agreement ID
     * @param {string} requestedBy - User ID initiating
     * @param {Object} options - { expiresInDays: number }
     */
    async initiateSigningWorkflow(agreementId, requestedBy, options = {}) {
        const { expiresInDays = 7 } = options;

        const agreement = await prisma.rentalAgreement.findUnique({
            where: { id: agreementId },
            include: { lease: true }
        });

        if (!agreement) {
            throw new Error('Agreement not found');
        }

        if (agreement.status !== 'DRAFT') {
            throw new Error(`Cannot initiate signing. Current status: ${agreement.status}`);
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const updated = await prisma.rentalAgreement.update({
            where: { id: agreementId },
            data: {
                status: 'PENDING_LANDLORD',
                expiresAt
            }
        });

        // Log audit action
        await this.logAuditAction(agreementId, 'SIGNATURE_REQUESTED', requestedBy);

        return updated;
    }

    /**
     * Sign agreement as landlord
     * @param {string} agreementId - Agreement ID
     * @param {string} userId - Landlord user ID
     * @param {Object} signatureData - { signature: base64, confirmed: boolean, ipAddress: string }
     */
    async signAsLandlord(agreementId, userId, signatureData) {
        const { signature, confirmed, ipAddress } = signatureData;

        if (!signature || !confirmed) {
            throw new Error('Signature and confirmation are required');
        }

        const agreement = await prisma.rentalAgreement.findUnique({
            where: { id: agreementId },
            include: {
                lease: {
                    include: { landlord: true, tenant: true }
                }
            }
        });

        if (!agreement) {
            throw new Error('Agreement not found');
        }

        // Verify user is the landlord
        if (agreement.lease.landlordId !== userId) {
            throw new Error('Access denied. Only the landlord can sign as landlord.');
        }

        // Check workflow status
        if (agreement.status !== 'PENDING_LANDLORD' && agreement.status !== 'DRAFT') {
            throw new Error(`Cannot sign. Current status: ${agreement.status}`);
        }

        // Check expiry
        if (agreement.expiresAt && new Date() > agreement.expiresAt) {
            await this.expireAgreement(agreementId);
            throw new Error('Agreement has expired');
        }

        const timestamp = new Date().toISOString();
        const signHash = this.createSignatureHash(signature, timestamp, agreement.leaseId, userId);

        const updated = await prisma.rentalAgreement.update({
            where: { id: agreementId },
            data: {
                landlordSigned: true,
                landlordSignature: signature,
                landlordSignedAt: new Date(),
                landlordSignHash: signHash,
                landlordIpAddress: ipAddress,
                landlordConfirmed: confirmed,
                status: 'PENDING_TENANT'
            }
        });

        // Log audit action
        await this.logAuditAction(agreementId, 'LANDLORD_SIGNED', userId, ipAddress, {
            signedAt: timestamp
        });

        return updated;
    }

    /**
     * Sign agreement as tenant
     * @param {string} agreementId - Agreement ID
     * @param {string} userId - Tenant user ID
     * @param {Object} signatureData - { signature: base64, confirmed: boolean, ipAddress: string }
     */
    async signAsTenant(agreementId, userId, signatureData) {
        const { signature, confirmed, ipAddress } = signatureData;

        if (!signature || !confirmed) {
            throw new Error('Signature and confirmation are required');
        }

        const agreement = await prisma.rentalAgreement.findUnique({
            where: { id: agreementId },
            include: {
                lease: {
                    include: { landlord: true, tenant: true }
                }
            }
        });

        if (!agreement) {
            throw new Error('Agreement not found');
        }

        // Verify user is the tenant
        if (agreement.lease.tenantId !== userId) {
            throw new Error('Access denied. Only the tenant can sign as tenant.');
        }

        // Check workflow - landlord must sign first
        if (agreement.status !== 'PENDING_TENANT') {
            if (!agreement.landlordSigned) {
                throw new Error('Landlord must sign first before tenant can sign.');
            }
            throw new Error(`Cannot sign. Current status: ${agreement.status}`);
        }

        // Check expiry
        if (agreement.expiresAt && new Date() > agreement.expiresAt) {
            await this.expireAgreement(agreementId);
            throw new Error('Agreement has expired');
        }

        const timestamp = new Date().toISOString();
        const signHash = this.createSignatureHash(signature, timestamp, agreement.leaseId, userId);

        const updated = await prisma.rentalAgreement.update({
            where: { id: agreementId },
            data: {
                tenantSigned: true,
                tenantSignature: signature,
                tenantSignedAt: new Date(),
                tenantSignHash: signHash,
                tenantIpAddress: ipAddress,
                tenantConfirmed: confirmed,
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });

        // Log audit actions
        await this.logAuditAction(agreementId, 'TENANT_SIGNED', userId, ipAddress, {
            signedAt: timestamp
        });
        await this.logAuditAction(agreementId, 'COMPLETED', userId, ipAddress);

        // 📧 Send agreement completed emails to both parties
        try {
            const emailService = require('./email.service');
            const frontendUrl = process.env.FRONTEND_URL || 'https://rentverse-frontend-nine.vercel.app';
            const dashboardUrl = `${frontendUrl}/my-agreements`;

            const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // Get full lease details for email
            const leaseDetails = await prisma.lease.findUnique({
                where: { id: agreement.leaseId },
                include: {
                    property: { select: { title: true } },
                    landlord: { select: { email: true, name: true, firstName: true } },
                    tenant: { select: { email: true, name: true, firstName: true } }
                }
            });

            if (leaseDetails) {
                const propertyTitle = leaseDetails.property.title;
                const landlordName = leaseDetails.landlord.name || leaseDetails.landlord.firstName || 'Landlord';
                const tenantName = leaseDetails.tenant.name || leaseDetails.tenant.firstName || 'Tenant';
                const startDate = formatDate(leaseDetails.startDate);
                const endDate = formatDate(leaseDetails.endDate);

                // Email to landlord
                await emailService.sendAgreementCompletedEmail({
                    to: leaseDetails.landlord.email,
                    recipientName: landlordName,
                    role: 'landlord',
                    propertyTitle: propertyTitle,
                    otherPartyName: tenantName,
                    startDate: startDate,
                    endDate: endDate,
                    dashboardUrl: dashboardUrl,
                });

                // Email to tenant
                await emailService.sendAgreementCompletedEmail({
                    to: leaseDetails.tenant.email,
                    recipientName: tenantName,
                    role: 'tenant',
                    propertyTitle: propertyTitle,
                    otherPartyName: landlordName,
                    startDate: startDate,
                    endDate: endDate,
                    dashboardUrl: dashboardUrl,
                });

                console.log('📧 Agreement completed emails sent to both parties');
            }
        } catch (emailError) {
            console.error('❌ Error sending agreement completed emails:', emailError.message);
            // Don't fail the signing if email fails
        }

        return updated;
    }

    /**
     * Verify document integrity
     * @param {string} agreementId - Agreement ID
     * @param {Buffer} pdfBuffer - PDF buffer to verify
     * @param {string} verifiedBy - User ID performing verification
     */
    async verifyDocumentIntegrity(agreementId, pdfBuffer, verifiedBy = null, ipAddress = null) {
        const agreement = await prisma.rentalAgreement.findUnique({
            where: { id: agreementId }
        });

        if (!agreement) {
            throw new Error('Agreement not found');
        }

        if (!agreement.documentHash) {
            return { valid: false, reason: 'No document hash stored' };
        }

        const computedHash = this.createDocumentHash(pdfBuffer);
        const isValid = computedHash === agreement.documentHash;

        // Log verification attempt
        await this.logAuditAction(
            agreementId,
            isValid ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILED',
            verifiedBy,
            ipAddress,
            { computedHash, storedHash: agreement.documentHash }
        );

        return {
            valid: isValid,
            storedHash: agreement.documentHash,
            computedHash,
            reason: isValid ? 'Document integrity verified' : 'Document may have been tampered with'
        };
    }

    /**
     * Get agreement with access control
     * @param {string} agreementId - Agreement ID
     * @param {string} userId - User requesting access
     */
    async getAgreementWithAccess(agreementId, userId) {
        // Try to find by agreement ID first, then by leaseId
        let agreement = await prisma.rentalAgreement.findUnique({
            where: { id: agreementId },
            include: {
                lease: {
                    include: {
                        property: { select: { id: true, title: true, address: true, images: true } },
                        landlord: { select: { id: true, name: true, email: true } },
                        tenant: { select: { id: true, name: true, email: true } }
                    }
                },
                auditLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        // If not found by ID, try finding by leaseId (since frontend passes booking/lease ID)
        if (!agreement) {
            agreement = await prisma.rentalAgreement.findUnique({
                where: { leaseId: agreementId },
                include: {
                    lease: {
                        include: {
                            property: { select: { id: true, title: true, address: true, images: true } },
                            landlord: { select: { id: true, name: true, email: true } },
                            tenant: { select: { id: true, name: true, email: true } }
                        }
                    },
                    auditLogs: {
                        orderBy: { createdAt: 'desc' },
                        take: 20
                    }
                }
            });
        }

        if (!agreement) {
            throw new Error('Agreement not found');
        }

        // Check access - only landlord or tenant can view
        const isLandlord = agreement.lease.landlordId === userId;
        const isTenant = agreement.lease.tenantId === userId;

        if (!isLandlord && !isTenant) {
            throw new Error('Access denied. You are not a party to this agreement.');
        }

        // Log view action - use agreement.id not the param (which could be leaseId)
        await this.logAuditAction(agreement.id, 'VIEWED', userId);

        return {
            agreement,
            userRole: isLandlord ? 'landlord' : 'tenant',
            canSign: this.canUserSign(agreement, userId, isLandlord ? 'landlord' : 'tenant')
        };
    }

    /**
     * Check if user can sign at current workflow state
     */
    canUserSign(agreement, userId, role) {
        if (agreement.status === 'COMPLETED' || agreement.status === 'CANCELLED' || agreement.status === 'EXPIRED') {
            return false;
        }

        if (agreement.expiresAt && new Date() > agreement.expiresAt) {
            return false;
        }

        if (role === 'landlord') {
            return !agreement.landlordSigned &&
                (agreement.status === 'DRAFT' || agreement.status === 'PENDING_LANDLORD');
        }

        if (role === 'tenant') {
            return agreement.landlordSigned &&
                !agreement.tenantSigned &&
                agreement.status === 'PENDING_TENANT';
        }

        return false;
    }

    /**
     * Cancel agreement
     * @param {string} agreementId - Agreement ID
     * @param {string} userId - User cancelling (must be landlord)
     * @param {string} reason - Cancellation reason
     */
    async cancelAgreement(agreementId, userId, reason) {
        const agreement = await prisma.rentalAgreement.findUnique({
            where: { id: agreementId },
            include: { lease: true }
        });

        if (!agreement) {
            throw new Error('Agreement not found');
        }

        // Only landlord can cancel
        if (agreement.lease.landlordId !== userId) {
            throw new Error('Only the landlord can cancel the agreement');
        }

        if (agreement.status === 'COMPLETED') {
            throw new Error('Cannot cancel a completed agreement');
        }

        const updated = await prisma.rentalAgreement.update({
            where: { id: agreementId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: reason
            }
        });

        await this.logAuditAction(agreementId, 'CANCELLED', userId, null, { reason });

        return updated;
    }

    /**
     * Mark agreement as expired
     */
    async expireAgreement(agreementId) {
        await prisma.rentalAgreement.update({
            where: { id: agreementId },
            data: { status: 'EXPIRED' }
        });

        await this.logAuditAction(agreementId, 'EXPIRED', null);
    }

    /**
     * Create new version of agreement document
     */
    async createVersion(agreementId, pdfUrl, documentHash, changedBy, changeReason) {
        const agreement = await prisma.rentalAgreement.findUnique({
            where: { id: agreementId }
        });

        if (!agreement) {
            throw new Error('Agreement not found');
        }

        const newVersion = agreement.currentVersion + 1;

        // Create version record
        await prisma.agreementVersion.create({
            data: {
                agreementId,
                version: newVersion,
                pdfUrl,
                documentHash,
                changedBy,
                changeReason
            }
        });

        // Update agreement
        await prisma.rentalAgreement.update({
            where: { id: agreementId },
            data: {
                currentVersion: newVersion,
                pdfUrl,
                documentHash
            }
        });

        await this.logAuditAction(agreementId, 'VERSION_CREATED', changedBy, null, {
            version: newVersion,
            reason: changeReason
        });

        return newVersion;
    }

    /**
     * Log audit action
     */
    async logAuditAction(agreementId, action, performedBy, ipAddress = null, metadata = null) {
        await prisma.agreementAuditLog.create({
            data: {
                agreementId,
                action,
                performedBy,
                ipAddress,
                metadata
            }
        });
    }

    /**
     * Get audit trail for agreement
     */
    async getAuditTrail(agreementId, userId) {
        // First verify access
        const agreement = await prisma.rentalAgreement.findUnique({
            where: { id: agreementId },
            include: { lease: true }
        });

        if (!agreement) {
            throw new Error('Agreement not found');
        }

        const hasAccess = agreement.lease.landlordId === userId ||
            agreement.lease.tenantId === userId;

        if (!hasAccess) {
            throw new Error('Access denied');
        }

        return prisma.agreementAuditLog.findMany({
            where: { agreementId },
            orderBy: { createdAt: 'desc' }
        });
    }
}

module.exports = new DigitalAgreementService();
