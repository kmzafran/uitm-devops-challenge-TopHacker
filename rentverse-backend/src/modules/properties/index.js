const propertiesRoutes = require('./properties.routes');
const propertiesController = require('./properties.controller');
const propertiesService = require('./properties.service');
const propertiesRepository = require('./properties.repository');

module.exports = {
  routes: propertiesRoutes,
  controller: propertiesController,
  service: propertiesService,
  repository: propertiesRepository,
};
