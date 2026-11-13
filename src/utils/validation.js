const AppError = require('../errors/AppError');
const invalid = message => { throw new AppError(400, message); };
const id = value => {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) invalid('ID inválido');
  return value;
};
const fields = (input, allowed) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Se requiere un objeto');
  for (const key of Object.keys(input)) if (!allowed.includes(key)) invalid('Campo no permitido: ' + key);
};
const string = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) invalid(name + ' debe ser texto no vacío');
  return value.trim();
};
const number = (value, name, integer = false, min = 0) => {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim()))) invalid(name + ' inválido');
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || (integer && !Number.isSafeInteger(parsed))) invalid(name + ' inválido');
  return parsed;
};
const pagination = (input = {}) => {
  const page = input.page === undefined ? 1 : number(input.page, 'page', true, 1);
  const limit = input.limit === undefined ? 10 : number(input.limit, 'limit', true, 1);
  if (limit > 100) invalid('limit no puede superar 100');
  return { page, limit };
};
const found = (value, name) => {
  if (!value) throw new AppError(404, name + ' no encontrado');
  return value;
};
module.exports = { invalid, id, fields, string, number, pagination, found };
