/**
 * Utility functions for generating property codes
 */

/**
 * Generate a slug from title
 * @param {string} title - Property title
 * @returns {string} - Slugified title
 */
function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate property code from title
 * @param {string} title - Property title
 * @param {string} propertyTypeCode - Property type code (e.g., "APARTMENT", "HOUSE")
 * @returns {string} - Generated property code
 */
function generatePropertyCode(title, propertyTypeCode = '') {
  // Get first 3 letters of property type
  const typePrefix = propertyTypeCode.substring(0, 3).toUpperCase();

  // Get meaningful words from title (max 2 words)
  const words = title
    .split(' ')
    .filter(word => word.length > 2) // Filter out short words like "a", "an", "the"
    .slice(0, 2) // Take first 2 meaningful words
    .map(word => word.substring(0, 3).toUpperCase()); // Take first 3 chars and uppercase

  const titlePart = words.join('');

  // Generate random suffix (3 digits)
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 100-999

  return `${typePrefix}${titlePart}${randomSuffix}`;
}

/**
 * Generate unique property code
 * @param {string} title - Property title
 * @param {string} propertyTypeCode - Property type code
 * @param {Function} checkExistence - Function to check if code exists
 * @param {number} maxAttempts - Maximum attempts to generate unique code
 * @returns {Promise<string>} - Unique property code
 */
async function generateUniquePropertyCode(
  title,
  propertyTypeCode = '',
  checkExistence,
  maxAttempts = 10
) {
  let attempts = 0;
  let code;

  while (attempts < maxAttempts) {
    code = generatePropertyCode(title, propertyTypeCode);

    // Check if code already exists
    const exists = await checkExistence(code);
    if (!exists) {
      return code;
    }

    attempts++;
  }

  // If all attempts failed, use timestamp-based approach
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  const typePrefix = propertyTypeCode.substring(0, 3).toUpperCase();
  const fallbackCode = `${typePrefix}PROP${timestamp}`;

  return fallbackCode;
}

/**
 * Generate property code with city prefix
 * @param {string} title - Property title
 * @param {string} city - Property city
 * @param {string} propertyTypeCode - Property type code
 * @returns {string} - Generated property code with city prefix
 */
function generatePropertyCodeWithLocation(title, city, propertyTypeCode = '') {
  // Get first 2 letters of city
  const cityPrefix = city.substring(0, 2).toUpperCase();

  // Get first 2 letters of property type
  const typePrefix = propertyTypeCode.substring(0, 2).toUpperCase();

  // Get meaningful words from title (max 1 word)
  const words = title
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 1)
    .map(word => word.substring(0, 3).toUpperCase());

  const titlePart = words.join('') || 'PROP';

  // Generate random suffix (3 digits)
  const randomSuffix = Math.floor(100 + Math.random() * 900);

  return `${cityPrefix}${typePrefix}${titlePart}${randomSuffix}`;
}

module.exports = {
  slugify,
  generatePropertyCode,
  generateUniquePropertyCode,
  generatePropertyCodeWithLocation,
};
