const fileUploadService = require('../utils/fileUpload');

class UploadController {
  /**
   * Upload single file
   */
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided',
        });
      }

      const optimize = req.body.optimize !== 'false'; // Default to true

      const result = await fileUploadService.uploadFile(req.file, optimize);

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: result,
      });
    } catch (error) {
      console.error('Upload single file error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'File upload failed',
      });
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided',
        });
      }

      const optimize = req.body.optimize !== 'false'; // Default to true

      const results = await fileUploadService.uploadMultipleFiles(
        req.files,
        optimize
      );

      res.status(200).json({
        success: true,
        message: `${results.length} files uploaded successfully`,
        data: results,
      });
    } catch (error) {
      console.error('Upload multiple files error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'File upload failed',
      });
    }
  }

  /**
   * Upload property images
   */
  async uploadPropertyImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images provided',
        });
      }

      const results = await fileUploadService.uploadMultipleFiles(
        req.files,
        true
      );

      // Create thumbnails for each image
      const thumbnailPromises = req.files.map(file =>
        fileUploadService.createThumbnail(file)
      );

      const thumbnails = await Promise.all(thumbnailPromises);

      res.status(200).json({
        success: true,
        message: `${results.length} property images uploaded successfully`,
        data: {
          images: results,
          thumbnails: thumbnails,
        },
      });
    } catch (error) {
      console.error('Upload property images error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Property images upload failed',
      });
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No avatar image provided',
        });
      }

      // Upload original avatar
      const avatar = await fileUploadService.uploadFile(req.file, true);

      // Create thumbnail
      const thumbnail = await fileUploadService.createThumbnail(req.file);

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar,
          thumbnail,
        },
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Avatar upload failed',
      });
    }
  }

  /**
   * Delete file
   */
  async deleteFile(req, res) {
    try {
      const { publicId } = req.params;
      const { resourceType = 'image' } = req.body;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Public ID is required',
        });
      }

      const result = await fileUploadService.deleteFile(publicId, resourceType);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'File deletion failed',
      });
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(req, res) {
    try {
      const { publicIds } = req.body;

      if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Public IDs array is required',
        });
      }

      const result = await fileUploadService.deleteMultipleFiles(publicIds);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Delete multiple files error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Files deletion failed',
      });
    }
  }

  /**
   * Get video thumbnail
   */
  async getVideoThumbnail(req, res) {
    try {
      const { publicId } = req.params;
      const { startOffset = '1s' } = req.query;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Public ID is required',
        });
      }

      const thumbnailUrl = await fileUploadService.getVideoThumbnail(publicId, {
        startOffset,
      });

      res.status(200).json({
        success: true,
        message: 'Video thumbnail generated successfully',
        data: {
          thumbnailUrl,
        },
      });
    } catch (error) {
      console.error('Get video thumbnail error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Video thumbnail generation failed',
      });
    }
  }
}

module.exports = new UploadController();
