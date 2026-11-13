const express = require('express');
const path = require('node:path');
const morgan = require('morgan');
const { engine } = require('express-handlebars');
const errors = require('./middlewares/errors');
const AppError = require('./errors/AppError');
function createApp({ productsService, usersService, cartsService, upload, io } = {}) {
  const app = express();
  app.engine('handlebars', engine());
  app.set('view engine', 'handlebars');
  app.set('views', path.join(__dirname, 'views'));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  if (io) app.set('io', io);
  app.use('/api/products', require('./routes/products.router')(productsService, upload));
  app.use('/api/users', require('./routes/users.router')(usersService));
  app.use('/api/carts', require('./routes/carts.router')(cartsService));
  app.use('/', require('./routes/views.router')(productsService, cartsService));
  app.use((_req, _res, next) => next(new AppError(404, 'Ruta no encontrada')));
  app.use(errors);
  return app;
}
module.exports = createApp;
