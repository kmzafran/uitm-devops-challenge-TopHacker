const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../../middleware/auth');
const propertyTypesController = require('./propertyTypes.controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PropertyType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated UUID of the property type
 *         code:
 *           type: string
 *           description: The unique code of the property type
 *         name:
 *           type: string
 *           description: The display name of the property type
 *         description:
 *           type: string
 *           description: The description of the property type
 *         icon:
 *           type: string
 *           description: Icon emoji or class for the property type
 *         isActive:
 *           type: boolean
 *           description: Whether the property type is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the property type was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the property type was last updated
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         code: "APARTMENT"
 *         name: "Apartment"
 *         description: "High-rise residential unit in apartment building"
 *         icon: "🏢"
 *         isActive: true
 *         createdAt: "2025-10-01T16:09:59.265Z"
 *         updatedAt: "2025-10-01T17:15:08.168Z"
 */

/**
 * @swagger
 * tags:
 *   name: PropertyTypes
 *   description: Property types management API
 */

/**
 * @swagger
 * /api/property-types:
 *   get:
 *     summary: Get all property types
 *     tags: [PropertyTypes]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         description: Property types retrieved successfully
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
 *                     $ref: '#/components/schemas/PropertyType'
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
router.get('/', propertyTypesController.getAll);

/**
 * @swagger
 * /api/property-types/{id}:
 *   get:
 *     summary: Get property type by ID
 *     tags: [PropertyTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property type ID
 *     responses:
 *       200:
 *         description: Property type retrieved successfully
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
 *                   $ref: '#/components/schemas/PropertyType'
 *       404:
 *         description: Property type not found
 */
router.get('/:id', propertyTypesController.getById);

/**
 * @swagger
 * /api/property-types:
 *   post:
 *     summary: Create a new property type
 *     tags: [PropertyTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique code for the property type
 *               name:
 *                 type: string
 *                 description: Display name for the property type
 *               description:
 *                 type: string
 *                 description: Description of the property type
 *               icon:
 *                 type: string
 *                 description: Icon emoji or class for the property type
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the property type is active
 *           example:
 *             code: "SHOPHOUSE"
 *             name: "Shophouse"
 *             description: "Traditional mixed-use building with commercial ground floor"
 *             icon: "🏪"
 *             isActive: true
 *     responses:
 *       201:
 *         description: Property type created successfully
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
 *                   $ref: '#/components/schemas/PropertyType'
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
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isLength({ max: 50 })
      .withMessage('Code must be at most 50 characters')
      .matches(/^[A-Z_]+$/)
      .withMessage('Code must contain only uppercase letters and underscores'),
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be at most 500 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  propertyTypesController.create
);

/**
 * @swagger
 * /api/property-types/{id}:
 *   put:
 *     summary: Update property type by ID
 *     tags: [PropertyTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique code for the property type
 *               name:
 *                 type: string
 *                 description: Display name for the property type
 *               description:
 *                 type: string
 *                 description: Description of the property type
 *               icon:
 *                 type: string
 *                 description: Icon emoji or class for the property type
 *               isActive:
 *                 type: boolean
 *                 description: Whether the property type is active
 *           example:
 *             name: "Shophouse"
 *             description: "Traditional mixed-use building with commercial ground floor and residential upper floors"
 *             icon: "🏪"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Property type updated successfully
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
 *                   $ref: '#/components/schemas/PropertyType'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property type not found
 */
router.put(
  '/:id',
  auth,
  authorize('ADMIN'),
  [
    body('code')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Code must be at most 50 characters')
      .matches(/^[A-Z_]+$/)
      .withMessage('Code must contain only uppercase letters and underscores'),
    body('name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be at most 500 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  propertyTypesController.update
);

/**
 * @swagger
 * /api/property-types/{id}:
 *   delete:
 *     summary: Delete property type by ID
 *     tags: [PropertyTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property type ID
 *     responses:
 *       200:
 *         description: Property type deleted successfully
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
 *         description: Property type not found
 */
router.delete('/:id', auth, authorize('ADMIN'), propertyTypesController.delete);

module.exports = router;
