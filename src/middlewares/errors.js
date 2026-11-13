const AppError = require('../errors/AppError');
module.exports = (error, _req, res, _next) => {
  const status = error instanceof AppError ? error.status : error.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ status: 'error', message: error instanceof AppError ? error.message : status === 400 ? 'JSON inválido' : 'Error interno del servidor' });
};
