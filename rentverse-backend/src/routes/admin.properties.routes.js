/**
 * Admin Properties Routes
 * Provides admin-level access to all properties
 */

const express = require('express');
const { prisma } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(auth);
router.use(authorize('ADMIN'));

/**
 * @swagger
 * /api/admin/properties/statistics:
 *   get:
 *     summary: Get property statistics for admin dashboard
 *     tags: [Admin Properties]
 */
router.get('/statistics', async (req, res) => {
    try {
        const now = new Date();
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Calculate start of today (midnight)
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        // Get counts - using correct model and enum values
        const [
            totalProperties,
            activeProperties,
            pendingApproval,
            approvedProperties,
            rejectedProperties,
            createdLast7d,
            createdLast30d,
            submittedToday,
            propertiesByType,
            propertiesByCity,
        ] = await Promise.all([
            prisma.property.count(),
            prisma.property.count({ where: { isAvailable: true, status: 'APPROVED' } }),
            // Count properties with PENDING_REVIEW status (not PropertyApproval model)
            prisma.property.count({ where: { status: 'PENDING_REVIEW' } }),
            prisma.property.count({ where: { status: 'APPROVED' } }),
            prisma.property.count({ where: { status: 'REJECTED' } }),
            prisma.property.count({ where: { createdAt: { gte: last7d } } }),
            prisma.property.count({ where: { createdAt: { gte: last30d } } }),
            // Count properties submitted today (all statuses)
            prisma.property.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma.property.groupBy({
                by: ['propertyTypeId'],
                _count: true,
            }),
            prisma.property.groupBy({
                by: ['city'],
                _count: true,
                orderBy: { _count: { city: 'desc' } },
                take: 5,
            }),
        ]);

        // Get property type names
        const propertyTypes = await prisma.propertyType.findMany();
        const typeMap = Object.fromEntries(propertyTypes.map(t => [t.id, t.name]));

        res.json({
            success: true,
            data: {
                summary: {
                    totalProperties,
                    activeProperties,
                    pendingApproval,
                    approvedProperties,
                    rejectedProperties,
                    createdLast7d,
                    createdLast30d,
                    submittedToday,
                    approvalRate: totalProperties > 0
                        ? Math.round((approvedProperties / totalProperties) * 100)
                        : 0,
                },
                byType: propertiesByType.map(t => ({
                    type: typeMap[t.propertyTypeId] || 'Unknown',
                    count: t._count,
                })),
                byCity: propertiesByCity.map(c => ({
                    city: c.city,
                    count: c._count,
                })),
            },
        });
    } catch (error) {
        console.error('Property statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch property statistics',
        });
    }
});

/**
 * @swagger
 * /api/admin/properties:
 *   get:
 *     summary: Get all properties with filters
 *     tags: [Admin Properties]
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const { status, search, city, propertyTypeId, isAvailable } = req.query;

        const where = {};

        // Filter by status
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        // Filter by availability
        if (isAvailable !== undefined) {
            where.isAvailable = isAvailable === 'true';
        }

        // Filter by city
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }

        // Filter by property type
        if (propertyTypeId) {
            where.propertyTypeId = propertyTypeId;
        }

        // Search
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { owner: { name: { contains: search, mode: 'insensitive' } } },
                { owner: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where,
                include: {
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    propertyType: {
                        select: {
                            id: true,
                            name: true,
                            icon: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.property.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                properties,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Properties list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch properties',
        });
    }
});

/**
 * @swagger
 * /api/admin/properties/{id}:
 *   get:
 *     summary: Get single property details
 *     tags: [Admin Properties]
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        createdAt: true,
                    },
                },
                propertyType: true,
                approvals: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found',
            });
        }

        res.json({
            success: true,
            data: property,
        });
    } catch (error) {
        console.error('Property details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch property details',
        });
    }
});

/**
 * @swagger
 * /api/admin/properties/{id}/toggle-availability:
 *   patch:
 *     summary: Toggle property availability
 *     tags: [Admin Properties]
 */
router.patch('/:id/toggle-availability', async (req, res) => {
    try {
        const { id } = req.params;

        const property = await prisma.property.findUnique({ where: { id } });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found',
            });
        }

        const updated = await prisma.property.update({
            where: { id },
            data: { isAvailable: !property.isAvailable },
        });

        res.json({
            success: true,
            message: `Property ${updated.isAvailable ? 'activated' : 'deactivated'}`,
            data: {
                id: updated.id,
                isAvailable: updated.isAvailable,
            },
        });
    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle property availability',
        });
    }
});

/**
 * @swagger
 * /api/admin/properties/{id}/feature:
 *   patch:
 *     summary: Feature/unfeature a property
 *     tags: [Admin Properties]
 */
router.patch('/:id/feature', async (req, res) => {
    try {
        const { id } = req.params;
        const { featured } = req.body;

        const property = await prisma.property.findUnique({ where: { id } });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found',
            });
        }

        const updated = await prisma.property.update({
            where: { id },
            data: { isFeatured: featured !== undefined ? featured : !property.isFeatured },
        });

        res.json({
            success: true,
            message: `Property ${updated.isFeatured ? 'featured' : 'unfeatured'}`,
            data: {
                id: updated.id,
                isFeatured: updated.isFeatured,
            },
        });
    } catch (error) {
        console.error('Feature property error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update property feature status',
        });
    }
});

/**
 * @swagger
 * /api/admin/properties/{id}/delete:
 *   delete:
 *     summary: Delete a property (soft delete by setting status)
 *     tags: [Admin Properties]
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const property = await prisma.property.findUnique({ where: { id } });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found',
            });
        }

        // Soft delete by setting status
        const updated = await prisma.property.update({
            where: { id },
            data: {
                status: 'DELETED',
                isAvailable: false,
            },
        });

        res.json({
            success: true,
            message: 'Property deleted',
            data: {
                id: updated.id,
                status: updated.status,
                reason,
            },
        });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete property',
        });
    }
});

module.exports = router;
