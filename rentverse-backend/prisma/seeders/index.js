// Central export for all seeders
module.exports = {
  seedPropertyTypes: require('./propertyTypes').seedPropertyTypes,
  seedAmenities: require('./amenities').seedAmenities,
  seedUsers: require('./users').seedUsers,
  seedProperties: require('./properties').seedProperties,
  
  // Cleanup functions
  cleanupPropertyTypes: require('./propertyTypes').cleanupPropertyTypes,
  cleanupAmenities: require('./amenities').cleanupAmenities,
  cleanupUsers: require('./users').cleanupUsers,
  cleanupProperties: require('./properties').cleanupProperties,
};
