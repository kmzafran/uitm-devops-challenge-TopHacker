const bookingsController = require('./bookings.controller');
const bookingsService = require('./bookings.service');
const bookingsRoutes = require('./bookings.routes');

module.exports = {
  controller: bookingsController,
  service: bookingsService,
  routes: bookingsRoutes,
};
