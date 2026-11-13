const { USER_ROLES } = require('../constants');
const v = require('../utils/validation');
function validate(input, partial = false) {
  // No role supplied over HTTP is accepted; ADMIN is reserved for controlled fixtures.
  v.fields(input, ['firstName', 'lastName', 'email']);
  if (partial && !Object.keys(input).length) v.invalid('Actualización vacía');
  const data = {};
  for (const key of ['firstName', 'lastName', 'email']) if (!partial || key in input) data[key] = v.string(input[key], key);
  if (data.email !== undefined) {
    data.email = data.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) v.invalid('email inválido');
  }
  if (!partial) data.role = USER_ROLES.USER;
  return data;
}
class UsersService {
  constructor(repository) { this.repository = repository; }
  async list(input = {}) { v.fields(input, ['page', 'limit']); return this.repository.list(v.pagination(input)); }
  async get(id) { return v.found(await this.repository.get(v.id(id)), 'Usuario'); }
  async create(input) { return this.repository.create(validate(input)); }
  async update(id, input) { return v.found(await this.repository.update(v.id(id), validate(input, true)), 'Usuario'); }
  async remove(id) { return v.found(await this.repository.remove(v.id(id)), 'Usuario'); }
}
module.exports = UsersService;
