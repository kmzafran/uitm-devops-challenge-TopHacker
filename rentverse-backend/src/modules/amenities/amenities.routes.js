const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../../middleware/auth');
const amenitiesController = require('./amenities.controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Amenity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated UUID of the amenity
 *         name:
 *           type: string
 *           description: The name of the amenity
 *         category:
 *           type: string
 *           description: The category of the amenity
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "Swimming Pool"
 *         category: "Recreation"
 */

/**
 * @swagger
 * tags:
 *   name: Amenities
 *   description: Amenities management API
 */

/**
 * @swagger
 * /api/amenities/categories:
 *   get:
 *     summary: Get all amenity categories
 *     tags: [Amenities]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/categories', amenitiesController.getCategories);

/**
 * @swagger
 * /api/amenities:
 *   get:
 *     summary: Get all amenities
 *     tags: [Amenities]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Amenity'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', amenitiesController.getAll);

/**
 * @swagger
 * /api/amenities/{id}:
 *   get:
 *     summary: Get amenity by ID
 *     tags: [Amenities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Amenity ID
 *     responses:
 *       200:
 *         description: Amenity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Amenity'
 *       404:
 *         description: Amenity not found
 */
router.get('/:id', amenitiesController.getById);

/**
 * @swagger
 * /api/amenities:
 *   post:
 *     summary: Create a new amenity
 *     tags: [Amenities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the amenity
 *               category:
 *                 type: string
 *                 description: Category of the amenity
 *     responses:
 *       201:
 *         description: Amenity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Amenity'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  auth,
  authorize('ADMIN'),
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('category')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Category must be at most 50 characters'),
  ],
  amenitiesController.create
);

/**
 * @swagger
 * /api/amenities/{id}:
 *   put:
 *     summary: Update amenity by ID
 *     tags: [Amenities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Amenity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the amenity
 *               category:
 *                 type: string
 *                 description: Category of the amenity
 *     responses:
 *       200:
 *         description: Amenity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Amenity'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Amenity not found
 */
router.put(
  '/:id',
  auth,
  authorize('ADMIN'),
  [
    body('name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('category')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Category must be at most 50 characters'),
  ],
  amenitiesController.update
);

/**
 * @swagger
 * /api/amenities/{id}:
 *   delete:
 *     summary: Delete amenity by ID
 *     tags: [Amenities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Amenity ID
 *     responses:
 *       200:
 *         description: Amenity deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Amenity not found
 */
router.delete('/:id', auth, authorize('ADMIN'), amenitiesController.delete);

module.exports = router;
