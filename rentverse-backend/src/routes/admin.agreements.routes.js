/**
 * Admin Agreements Routes
 * Provides admin-level access to all rental agreements
 */

const express = require('express');
const { prisma } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../services/email.service');

const router = express.Router();

// All routes require admin role
router.use(auth);
router.use(authorize('ADMIN'));

/**
 * @swagger
 * /api/admin/agreements/statistics:
 *   get:
 *     summary: Get agreement statistics for admin dashboard
 *     tags: [Admin Agreements]
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', async (req, res) => {
    try {
        const now = new Date();
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get counts by status
        const [
            totalAgreements,
            pendingLandlord,
            pendingTenant,
            completed,
            expired,
            cancelled,
            completedLast7d,
            completedLast30d,
        ] = await Promise.all([
            prisma.rentalAgreement.count(),
            prisma.rentalAgreement.count({ where: { status: 'PENDING_LANDLORD' } }),
            prisma.rentalAgreement.count({ where: { status: 'PENDING_TENANT' } }),
            prisma.rentalAgreement.count({ where: { status: 'COMPLETED' } }),
            prisma.rentalAgreement.count({ where: { status: 'EXPIRED' } }),
            prisma.rentalAgreement.count({ where: { status: 'CANCELLED' } }),
            prisma.rentalAgreement.count({
                where: { status: 'COMPLETED', completedAt: { gte: last7d } }
            }),
            prisma.rentalAgreement.count({
                where: { status: 'COMPLETED', completedAt: { gte: last30d } }
            }),
        ]);

        // Get 7-day completion trend
        const dailyStats = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setHours(0, 0, 0, 0);
            dayStart.setDate(dayStart.getDate() - i);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const [completedCount, createdCount] = await Promise.all([
                prisma.rentalAgreement.count({
                    where: { completedAt: { gte: dayStart, lte: dayEnd } }
                }),
                prisma.rentalAgreement.count({
                    where: { generatedAt: { gte: dayStart, lte: dayEnd } }
                }),
            ]);

            dailyStats.push({
                date: dayStart.toISOString().split('T')[0],
                completed: completedCount,
                created: createdCount,
            });
        }

        res.json({
            success: true,
            data: {
                summary: {
                    totalAgreements,
                    pendingSignatures: pendingLandlord + pendingTenant,
                    pendingLandlord,
                    pendingTenant,
                    completed,
                    expired,
                    cancelled,
                    completedLast7d,
                    completedLast30d,
                    completionRate: totalAgreements > 0
                        ? Math.round((completed / totalAgreements) * 100)
                        : 0,
                },
                trends: {
                    daily: dailyStats,
                },
            },
        });
    } catch (error) {
        console.error('Agreement statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch agreement statistics',
        });
    }
});

/**
 * @swagger
 * /api/admin/agreements:
 *   get:
 *     summary: Get all agreements with filters
 *     tags: [Admin Agreements]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const { status, search } = req.query;

        const where = {};

        // Filter by status
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        // Search by property title, landlord/tenant name or email
        if (search) {
            where.OR = [
                { lease: { property: { title: { contains: search, mode: 'insensitive' } } } },
                { lease: { landlord: { name: { contains: search, mode: 'insensitive' } } } },
                { lease: { landlord: { email: { contains: search, mode: 'insensitive' } } } },
                { lease: { tenant: { name: { contains: search, mode: 'insensitive' } } } },
                { lease: { tenant: { email: { contains: search, mode: 'insensitive' } } } },
            ];
        }

        const [agreements, total] = await Promise.all([
            prisma.rentalAgreement.findMany({
                where,
                include: {
                    lease: {
                        include: {
                            property: {
                                select: {
                                    id: true,
                                    title: true,
                                    address: true,
                                    city: true,
                                    images: true,
                                },
                            },
                            landlord: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                            tenant: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { generatedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.rentalAgreement.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                agreements,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Agreements list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch agreements',
        });
    }
});

/**
 * @swagger
 * /api/admin/agreements/{id}:
 *   get:
 *     summary: Get single agreement details
 *     tags: [Admin Agreements]
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const agreement = await prisma.rentalAgreement.findFirst({
            where: {
                OR: [{ id }, { leaseId: id }]
            },
            include: {
                lease: {
                    include: {
                        property: true,
                        landlord: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });

        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'Agreement not found',
            });
        }

        res.json({
            success: true,
            data: agreement,
        });
    } catch (error) {
        console.error('Agreement details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch agreement details',
        });
    }
});

/**
 * @swagger
 * /api/admin/agreements/{id}/remind:
 *   post:
 *     summary: Send reminder email to pending signer
 *     tags: [Admin Agreements]
 */
router.post('/:id/remind', async (req, res) => {
    try {
        const { id } = req.params;

        const agreement = await prisma.rentalAgreement.findFirst({
            where: {
                OR: [{ id }, { leaseId: id }]
            },
            include: {
                lease: {
                    include: {
                        property: { select: { title: true } },
                        landlord: { select: { id: true, name: true, email: true } },
                        tenant: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'Agreement not found',
            });
        }

        // Determine who needs to sign
        let reminderTarget = null;
        if (agreement.status === 'PENDING_LANDLORD' || (agreement.status === 'DRAFT' && !agreement.landlordSigned)) {
            reminderTarget = {
                role: 'landlord',
                user: agreement.lease.landlord,
            };
        } else if (agreement.status === 'PENDING_TENANT' && !agreement.tenantSigned) {
            reminderTarget = {
                role: 'tenant',
                user: agreement.lease.tenant,
            };
        }

        if (!reminderTarget) {
            return res.status(400).json({
                success: false,
                message: 'No pending signatures for this agreement',
            });
        }

        // Log the reminder
        await prisma.agreementAuditLog.create({
            data: {
                agreementId: agreement.id,
                action: 'REMINDER_SENT',
                performedBy: req.user.id,
                metadata: {
                    sentTo: reminderTarget.user.email,
                    role: reminderTarget.role,
                    sentByAdmin: true,
                },
                ipAddress: req.ip,
            },
        });

        // Send actual reminder email
        const frontendUrl = process.env.FRONTEND_URL || 'https://rentverse-frontend-nine.vercel.app';
        const agreementUrl = `${frontendUrl}/my-agreements`;

        await emailService.sendSigningReminderEmail({
            to: reminderTarget.user.email,
            recipientName: reminderTarget.user.name || 'User',
            role: reminderTarget.role,
            propertyTitle: agreement.lease.property.title,
            agreementUrl: agreementUrl,
        });

        res.json({
            success: true,
            message: `Reminder sent to ${reminderTarget.role}: ${reminderTarget.user.email}`,
            data: {
                sentTo: reminderTarget.user.email,
                role: reminderTarget.role,
                propertyTitle: agreement.lease.property.title,
            },
        });
    } catch (error) {
        console.error('Send reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminder',
        });
    }
});

/**
 * @swagger
 * /api/admin/agreements/{id}/regenerate-pdf:
 *   post:
 *     summary: Regenerate PDF for an agreement (admin only)
 *     tags: [Admin Agreements]
 */
router.post('/:id/regenerate-pdf', async (req, res) => {
    try {
        const { id } = req.params;
        const pdfGenerationService = require('../services/pdfGeneration.service');

        // Find the agreement
        const agreement = await prisma.rentalAgreement.findFirst({
            where: {
                OR: [{ id }, { leaseId: id }]
            },
            include: {
                lease: {
                    include: {
                        property: { select: { title: true } },
                    },
                },
            },
        });

        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'Agreement not found',
            });
        }

        console.log(`🔄 Regenerating PDF for agreement: ${agreement.id}`);

        // Generate new PDF
        const pdfResult = await pdfGenerationService.generateAndUploadRentalAgreementPDF(
            agreement.leaseId
        );

        // Log the action
        await prisma.agreementAuditLog.create({
            data: {
                agreementId: agreement.id,
                action: 'VERSION_CREATED',
                performedBy: req.user.id,
                metadata: {
                    reason: 'PDF regenerated by admin',
                    newPdfUrl: pdfResult.data.rentalAgreement.pdfUrl,
                },
                ipAddress: req.ip,
            },
        });

        res.json({
            success: true,
            message: 'PDF regenerated successfully',
            data: {
                pdfUrl: pdfResult.data.rentalAgreement.pdfUrl || pdfResult.data.cloudinary?.url,
                propertyTitle: agreement.lease.property.title,
            },
        });
    } catch (error) {
        console.error('Regenerate PDF error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to regenerate PDF',
        });
    }
});

/**
 * @swagger
 * /api/admin/agreements/{id}/force-complete:
 *   post:
 *     summary: Force complete an agreement (admin override)
 *     tags: [Admin Agreements]
 */
router.post('/:id/force-complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required for force completion',
            });
        }

        const agreement = await prisma.rentalAgreement.findFirst({
            where: {
                OR: [{ id }, { leaseId: id }]
            },
        });

        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'Agreement not found',
            });
        }

        if (agreement.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Agreement is already completed',
            });
        }

        // Force complete the agreement
        const updated = await prisma.rentalAgreement.update({
            where: { id: agreement.id },
            data: {
                status: 'COMPLETED',
                landlordSigned: true,
                landlordSignedAt: agreement.landlordSignedAt || new Date(),
                tenantSigned: true,
                tenantSignedAt: agreement.tenantSignedAt || new Date(),
                completedAt: new Date(),
            },
        });

        // Log the admin action
        await prisma.agreementAuditLog.create({
            data: {
                agreementId: agreement.id,
                action: 'FORCE_COMPLETED',
                performedBy: req.user.id,
                details: JSON.stringify({
                    reason,
                    previousStatus: agreement.status,
                    adminAction: true,
                }),
                ipAddress: req.ip,
            },
        });

        res.json({
            success: true,
            message: 'Agreement force-completed by admin',
            data: {
                id: updated.id,
                status: updated.status,
                completedAt: updated.completedAt,
                reason,
            },
        });
    } catch (error) {
        console.error('Force complete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to force complete agreement',
        });
    }
});

/**
 * @swagger
 * /api/admin/agreements/{id}/cancel:
 *   post:
 *     summary: Cancel an agreement (admin override)
 *     tags: [Admin Agreements]
 */
router.post('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required for cancellation',
            });
        }

        const agreement = await prisma.rentalAgreement.findFirst({
            where: {
                OR: [{ id }, { leaseId: id }]
            },
        });

        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'Agreement not found',
            });
        }

        if (agreement.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'Agreement is already cancelled',
            });
        }

        const updated = await prisma.rentalAgreement.update({
            where: { id: agreement.id },
            data: {
                status: 'CANCELLED',
            },
        });

        // Log the admin action
        await prisma.agreementAuditLog.create({
            data: {
                agreementId: agreement.id,
                action: 'CANCELLED_BY_ADMIN',
                performedBy: req.user.id,
                details: JSON.stringify({
                    reason,
                    previousStatus: agreement.status,
                    adminAction: true,
                }),
                ipAddress: req.ip,
            },
        });

        res.json({
            success: true,
            message: 'Agreement cancelled by admin',
            data: {
                id: updated.id,
                status: updated.status,
                reason,
            },
        });
    } catch (error) {
        console.error('Cancel agreement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel agreement',
        });
    }
});

module.exports = router;
