const { validationResult } = require('express-validator');
const amenitiesService = require('./amenities.service');

class AmenitiesController {
  async getAll(req, res) {
    try {
      const { category, search, page = 1, limit = 10 } = req.query;

      const filters = {};
      if (category) {
        filters.category = category;
      }
      if (search) {
        filters.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await amenitiesService.getAll(filters, pagination);

      res.status(200).json({
        success: true,
        message: 'Amenities retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Amenities getAll error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const amenity = await amenitiesService.getById(id);

      if (!amenity) {
        return res.status(404).json({
          success: false,
          message: 'Amenity not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Amenity retrieved successfully',
        data: amenity,
      });
    } catch (error) {
      console.error('Amenities getById error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { name, category } = req.body;

      const amenity = await amenitiesService.create({
        name,
        category,
      });

      res.status(201).json({
        success: true,
        message: 'Amenity created successfully',
        data: amenity,
      });
    } catch (error) {
      console.error('Amenities create error:', error);

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Amenity name already exists',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const amenity = await amenitiesService.update(id, updateData);

      if (!amenity) {
        return res.status(404).json({
          success: false,
          message: 'Amenity not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Amenity updated successfully',
        data: amenity,
      });
    } catch (error) {
      console.error('Amenities update error:', error);

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Amenity name already exists',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const success = await amenitiesService.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Amenity not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Amenity deleted successfully',
      });
    } catch (error) {
      console.error('Amenities delete error:', error);

      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete amenity. It is being used by properties.',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await amenitiesService.getCategories();

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      console.error('Amenities getCategories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

module.exports = new AmenitiesController();
