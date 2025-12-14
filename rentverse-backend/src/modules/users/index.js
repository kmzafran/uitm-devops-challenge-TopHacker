const usersRoutes = require('./users.routes');
const usersController = require('./users.controller');
const usersService = require('./users.service');
const usersRepository = require('./users.repository');

module.exports = {
  routes: usersRoutes,
  controller: usersController,
  service: usersService,
  repository: usersRepository,
};
