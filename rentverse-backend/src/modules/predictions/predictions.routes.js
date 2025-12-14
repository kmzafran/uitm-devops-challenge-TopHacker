const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../../middleware/auth');
const predictionsController = require('./predictions.controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PredictionStatus:
 *       type: object
 *       properties:
 *         isEnabled:
 *           type: boolean
 *           description: Whether prediction service is enabled
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: When the status was last updated
 *         updatedBy:
 *           type: string
 *           description: Who updated the status
 *       example:
 *         isEnabled: true
 *         lastUpdated: "2025-10-01T18:30:00Z"
 *         updatedBy: "admin@rentverse.com"
 */

/**
 * @swagger
 * tags:
 *   name: Predictions
 *   description: Price prediction service management and proxy
 */

/**
 * @swagger
 * /api/predictions/status:
 *   get:
 *     summary: Get current prediction service status
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current prediction service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       $ref: '#/components/schemas/PredictionStatus'
 *       401:
 *         description: Unauthorized
 */
router.get('/status', auth, predictionsController.getStatus);

/**
 * @swagger
 * /api/predictions/toggle:
 *   post:
 *     summary: Toggle prediction service ON/OFF (Admin only)
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Set to true to enable, false to disable
 *             example:
 *               enabled: true
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Prediction service enabled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       $ref: '#/components/schemas/PredictionStatus'
 *       400:
 *         description: Bad request - invalid enabled value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/toggle',
  auth,
  authorize('ADMIN'),
  [
    body('enabled')
      .isBoolean()
      .withMessage('Field "enabled" must be a boolean value'),
  ],
  predictionsController.toggleStatus
);

/**
 * @swagger
 * /api/predictions/predict:
 *   post:
 *     summary: Predict property price (Proxy to AI model)
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - area
 *               - bathrooms
 *               - bedrooms
 *               - furnished
 *               - location
 *               - property_type
 *             properties:
 *               area:
 *                 type: number
 *                 description: Area in square feet
 *                 example: 1200
 *               bathrooms:
 *                 type: integer
 *                 description: Number of bathrooms
 *                 example: 2
 *               bedrooms:
 *                 type: integer
 *                 description: Number of bedrooms
 *                 example: 3
 *               furnished:
 *                 type: string
 *                 description: Whether property is furnished
 *                 enum: ["Yes", "No"]
 *                 example: "Yes"
 *               location:
 *                 type: string
 *                 description: Property location
 *                 example: "KLCC, Kuala Lumpur"
 *               property_type:
 *                 type: string
 *                 description: Property type
 *                 example: "Condominium"
 *           example:
 *             area: 1200
 *             bathrooms: 2
 *             bedrooms: 3
 *             furnished: "Yes"
 *             location: "KLCC, Kuala Lumpur"
 *             property_type: "Condominium"
 *     responses:
 *       200:
 *         description: Prediction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     predicted_price:
 *                       type: number
 *                       example: 4500.00
 *                     currency:
 *                       type: string
 *                       example: "MYR"
 *                     confidence:
 *                       type: number
 *                       example: 0.85
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized
 *       502:
 *         description: Bad Gateway - Unable to connect to prediction service
 *       503:
 *         description: Service Unavailable - Prediction service is disabled
 *       504:
 *         description: Gateway Timeout - Prediction service timeout
 */
router.post('/predict', auth, predictionsController.predict);

module.exports = router;
