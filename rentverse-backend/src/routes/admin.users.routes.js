/**
 * Admin Users Routes
 * Provides admin-level access to user management
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
 * /api/admin/users/statistics:
 *   get:
 *     summary: Get user statistics for admin dashboard
 *     tags: [Admin Users]
 */
router.get('/statistics', async (req, res) => {
    try {
        const now = new Date();
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get counts
        const [
            totalUsers,
            activeUsers,
            inactiveUsers,
            adminUsers,
            landlordCount,
            tenantCount,
            newUsersLast7d,
            newUsersLast30d,
            lockedAccounts,
            mfaEnabled,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.user.count({ where: { isActive: false } }),
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.property.groupBy({
                by: ['ownerId'],
                _count: true,
            }).then(r => r.length), // Unique landlords
            prisma.lease.groupBy({
                by: ['tenantId'],
                _count: true,
            }).then(r => r.length), // Unique tenants
            prisma.user.count({ where: { createdAt: { gte: last7d } } }),
            prisma.user.count({ where: { createdAt: { gte: last30d } } }),
            prisma.user.count({ where: { lockedUntil: { gte: now } } }),
            prisma.user.count({ where: { mfaEnabled: true } }),
        ]);

        // Get 7-day registration trend
        const dailyStats = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setHours(0, 0, 0, 0);
            dayStart.setDate(dayStart.getDate() - i);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const count = await prisma.user.count({
                where: { createdAt: { gte: dayStart, lte: dayEnd } }
            });

            dailyStats.push({
                date: dayStart.toISOString().split('T')[0],
                registrations: count,
            });
        }

        res.json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    activeUsers,
                    inactiveUsers,
                    adminUsers,
                    landlordCount,
                    tenantCount,
                    newUsersLast7d,
                    newUsersLast30d,
                    lockedAccounts,
                    mfaEnabled,
                    mfaRate: totalUsers > 0 ? Math.round((mfaEnabled / totalUsers) * 100) : 0,
                },
                trends: {
                    daily: dailyStats,
                },
            },
        });
    } catch (error) {
        console.error('User statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
        });
    }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin Users]
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const { role, isActive, search, mfaEnabled } = req.query;

        const where = {};

        // Filter by role
        if (role && role !== 'all') {
            where.role = role.toUpperCase();
        }

        // Filter by active status
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        // Filter by MFA status
        if (mfaEnabled !== undefined) {
            where.mfaEnabled = mfaEnabled === 'true';
        }

        // Search
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    name: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    mfaEnabled: true,
                    lastLoginAt: true,
                    loginAttempts: true,
                    lockedUntil: true,
                    createdAt: true,
                    _count: {
                        select: {
                            properties: true,
                            leasesAsTenant: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                users: users.map(u => ({
                    ...u,
                    propertyCount: u._count.properties,
                    leaseCount: u._count.leasesAsTenant,
                    isLocked: u.lockedUntil && u.lockedUntil > new Date(),
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Users list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get single user details
 *     tags: [Admin Users]
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
                phone: true,
                dateOfBirth: true,
                role: true,
                isActive: true,
                mfaEnabled: true,
                lastLoginAt: true,
                loginAttempts: true,
                lockedUntil: true,
                createdAt: true,
                updatedAt: true,
                properties: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        isAvailable: true,
                    },
                    take: 10,
                },
                leasesAsTenant: {
                    select: {
                        id: true,
                        status: true,
                        property: {
                            select: { title: true },
                        },
                    },
                    take: 10,
                },
                loginHistory: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            data: {
                ...user,
                isLocked: user.lockedUntil && user.lockedUntil > new Date(),
            },
        });
    } catch (error) {
        console.error('User details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details',
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/toggle-status:
 *   patch:
 *     summary: Activate/deactivate a user
 *     tags: [Admin Users]
 */
router.patch('/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Prevent deactivating yourself
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate your own account',
            });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
        });

        res.json({
            success: true,
            message: `User ${updated.isActive ? 'activated' : 'deactivated'}`,
            data: {
                id: updated.id,
                isActive: updated.isActive,
            },
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/unlock:
 *   patch:
 *     summary: Unlock a locked user account
 *     tags: [Admin Users]
 */
router.patch('/:id/unlock', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                lockedUntil: null,
                loginAttempts: 0,
            },
        });

        res.json({
            success: true,
            message: 'User account unlocked',
            data: {
                id: updated.id,
                lockedUntil: updated.lockedUntil,
            },
        });
    } catch (error) {
        console.error('Unlock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlock user',
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/change-role:
 *   patch:
 *     summary: Change user role
 *     tags: [Admin Users]
 */
router.patch('/:id/change-role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['USER', 'ADMIN'].includes(role.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be USER or ADMIN',
            });
        }

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Prevent changing your own role
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change your own role',
            });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { role: role.toUpperCase() },
        });

        res.json({
            success: true,
            message: `User role changed to ${updated.role}`,
            data: {
                id: updated.id,
                role: updated.role,
            },
        });
    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change user role',
        });
    }
});

module.exports = router;
