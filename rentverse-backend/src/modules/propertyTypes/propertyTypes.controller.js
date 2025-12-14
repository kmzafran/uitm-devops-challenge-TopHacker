const { validationResult } = require('express-validator');
const propertyTypesService = require('./propertyTypes.service');

class PropertyTypesController {
  async getAll(req, res) {
    try {
      const { active, page = 1, limit = 10 } = req.query;

      const filters = {};
      if (active !== undefined) {
        filters.isActive = active === 'true';
      }

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await propertyTypesService.getAll(filters, pagination);

      res.status(200).json({
        success: true,
        message: 'Property types retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('PropertyTypes getAll error:', error);
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
      const propertyType = await propertyTypesService.getById(id);

      if (!propertyType) {
        return res.status(404).json({
          success: false,
          message: 'Property type not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Property type retrieved successfully',
        data: propertyType,
      });
    } catch (error) {
      console.error('PropertyTypes getById error:', error);
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

      const { code, name, description, isActive = true } = req.body;

      const propertyType = await propertyTypesService.create({
        code,
        name,
        description,
        isActive,
      });

      res.status(201).json({
        success: true,
        message: 'Property type created successfully',
        data: propertyType,
      });
    } catch (error) {
      console.error('PropertyTypes create error:', error);

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Property type code already exists',
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

      const propertyType = await propertyTypesService.update(id, updateData);

      if (!propertyType) {
        return res.status(404).json({
          success: false,
          message: 'Property type not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Property type updated successfully',
        data: propertyType,
      });
    } catch (error) {
      console.error('PropertyTypes update error:', error);

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Property type code already exists',
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

      const success = await propertyTypesService.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Property type not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Property type deleted successfully',
      });
    } catch (error) {
      console.error('PropertyTypes delete error:', error);

      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message:
            'Cannot delete property type. It is being used by properties.',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}

module.exports = new PropertyTypesController();
