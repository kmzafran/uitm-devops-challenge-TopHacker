const multer = require('multer');
const fileUploadService = require('../utils/fileUpload');

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    fileUploadService.validateFile(file);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileUploadService.maxFileSize,
    files: 20, // Maximum 20 files per request (increased for video support)
  },
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Middleware for multiple files upload
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for multiple fields upload
const uploadFields = fields => {
  return upload.fields(fields);
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${fileUploadService.maxFileSize} bytes`,
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 20 files allowed',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name for file upload',
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
        });
    }
  }

  if (
    error.message.includes('File type') ||
    error.message.includes('File size')
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
};
