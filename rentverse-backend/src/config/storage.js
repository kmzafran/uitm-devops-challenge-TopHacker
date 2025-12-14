const { v2: cloudinary } = require('cloudinary');

// Check if Cloudinary is configured
const isCloudinaryConfigured =
  process.env.CLOUD_NAME &&
  process.env.CLOUD_API_KEY &&
  process.env.CLOUD_API_SECRET &&
  process.env.CLOUD_NAME !== 'your_cloudinary_cloud_name_here' &&
  process.env.CLOUD_API_KEY !== 'your_cloudinary_api_key_here' &&
  process.env.CLOUD_API_SECRET !== 'your_cloudinary_api_secret_here';

let cloudinaryClient = null;

if (isCloudinaryConfigured) {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
      secure: true,
    });

    cloudinaryClient = cloudinary;

    console.log('✅ Cloudinary storage configured successfully');
  } catch (error) {
    console.error('❌ Failed to configure Cloudinary storage:', error.message);
  }
} else {
  console.warn(
    '⚠️ Cloudinary storage not configured. File upload features will be disabled.'
  );
  console.warn(
    'Please set CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET in your .env file'
  );
}

const CLOUD_FOLDER_PREFIX = process.env.CLOUD_FOLDER_PREFIX || 'rentverse';

module.exports = {
  cloudinaryClient,
  cloudinary,
  CLOUD_FOLDER_PREFIX,
  isCloudinaryConfigured,
};
