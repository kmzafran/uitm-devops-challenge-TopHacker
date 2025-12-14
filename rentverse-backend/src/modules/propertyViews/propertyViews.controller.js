const propertiesService = require('../properties/properties.service');
const { validationResult } = require('express-validator');

class PropertyViewsController {
  /**
   * Log property view
   * POST /api/properties/:id/view
   */
  async logView(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id: propertyId } = req.params;
      const userId = req.user?.id; // Optional - may be null for guest users
      const ipAddress =
        req.ip ||
        req.connection.remoteAddress ||
        req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      const result = await propertiesService.logPropertyView(propertyId, {
        userId,
        ipAddress,
        userAgent,
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          property: result.property,
          viewLogged: result.viewLogged,
        },
      });
    } catch (error) {
      console.error('Log property view error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get property view statistics
   * GET /api/properties/:id/view-stats
   */
  async getViewStats(req, res) {
    try {
      const { id: propertyId } = req.params;
      const { days = 30 } = req.query;

      const stats = await propertiesService.getPropertyViewStats(
        propertyId,
        parseInt(days)
      );

      res.status(200).json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      console.error('Get property view stats error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // ==================== RATING METHODS ====================

  /**
   * Create or update property rating
   * POST /api/properties/:id/rating
   */
  async createOrUpdateRating(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id: propertyId } = req.params;
      const userId = req.user.id; // Required for ratings
      const { rating, comment } = req.body;

      const result = await propertiesService.createOrUpdateRating(
        propertyId,
        userId,
        {
          rating,
          comment,
        }
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          rating: result.rating,
        },
      });
    } catch (error) {
      console.error('Create/update rating error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      if (error.message === 'Rating must be between 1 and 5') {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get property ratings
   * GET /api/properties/:id/ratings
   */
  async getPropertyRatings(req, res) {
    try {
      const { id: propertyId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await propertiesService.getPropertyRatings(propertyId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get property ratings error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get user's rating for a property
   * GET /api/properties/:id/my-rating
   */
  async getUserRating(req, res) {
    try {
      const { id: propertyId } = req.params;
      const userId = req.user.id;

      const rating = await propertiesService.getUserRating(propertyId, userId);

      res.status(200).json({
        success: true,
        data: {
          rating,
        },
      });
    } catch (error) {
      console.error('Get user rating error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Delete user's rating
   * DELETE /api/properties/:id/rating
   */
  async deleteRating(req, res) {
    try {
      const { id: propertyId } = req.params;
      const userId = req.user.id;

      const result = await propertiesService.deleteRating(propertyId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Delete rating error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      if (error.message === 'Rating not found') {
        return res.status(404).json({
          success: false,
          message: 'Rating not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get detailed rating statistics
   * GET /api/properties/:id/rating-stats
   */
  async getRatingStats(req, res) {
    try {
      const { id: propertyId } = req.params;

      const stats = await propertiesService.getDetailedRatingStats(propertyId);

      res.status(200).json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      console.error('Get rating stats error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // ==================== FAVORITE METHODS ====================

  /**
   * Toggle property favorite status
   * POST /api/properties/:id/favorite
   */
  async toggleFavorite(req, res) {
    try {
      const { id: propertyId } = req.params;
      const userId = req.user.id; // Required for favorites

      const result = await propertiesService.toggleFavorite(propertyId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          action: result.action,
          isFavorited: result.isFavorited,
          favoriteCount: result.favoriteCount,
        },
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get user's favorite properties
   * GET /api/properties/favorites
   */
  async getUserFavorites(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await propertiesService.getUserFavorites(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get user favorites error:', error);

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get property favorite status
   * GET /api/properties/:id/favorite-status
   */
  async getFavoriteStatus(req, res) {
    try {
      const { id: propertyId } = req.params;
      const userId = req.user.id;

      const result = await propertiesService.getFavoriteStatus(
        propertyId,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get favorite status error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get property favorite statistics
   * GET /api/properties/:id/favorite-stats
   */
  async getFavoriteStats(req, res) {
    try {
      const { id: propertyId } = req.params;

      const result = await propertiesService.getFavoriteStats(propertyId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get favorite stats error:', error);

      if (error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new PropertyViewsController();
