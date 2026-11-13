const { randomBytes } = require('node:crypto');
const { PRODUCT_STATUS } = require('../constants');
const v = require('../utils/validation');
const permitted = ['title', 'description', 'price', 'stock', 'category', 'status', 'thumbnails'];
const availability = product => ({ ...product, availability: !product.status ? PRODUCT_STATUS.INACTIVE : product.stock === 0 ? PRODUCT_STATUS.OUT_OF_STOCK : PRODUCT_STATUS.AVAILABLE });
const segment = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 8) || 'ITEM';
function validateProduct(input, partial = false) {
  v.fields(input, permitted);
  if (partial && !Object.keys(input).length) v.invalid('Actualización vacía');
  const result = {};
  for (const key of ['title', 'description', 'category']) if (!partial || key in input) result[key] = v.string(input[key], key);
  for (const key of ['price', 'stock']) if (!partial || key in input) result[key] = v.number(input[key], key, key === 'stock');
  if ('status' in input) {
    if (![true, false, 'true', 'false'].includes(input.status)) v.invalid('status debe ser true o false');
    result.status = input.status === true || input.status === 'true';
  } else if (!partial) result.status = true;
  if ('thumbnails' in input) {
    const raw = input.thumbnails;
    if (typeof raw !== 'string' && !Array.isArray(raw)) v.invalid('thumbnails debe ser texto o un arreglo');
    result.thumbnails = raw === '' ? [] : (Array.isArray(raw) ? raw : raw.split(',')).map(item => v.string(item, 'thumbnail'));
  } else if (!partial) result.thumbnails = [];
  return result;
}
class ProductsService {
  constructor(repository) { this.repository = repository; }
  async getProducts(input = {}) {
    v.fields(input, ['page', 'limit', 'sort', 'query', 'paginate']);
    const options = v.pagination(input);
    if (input.sort !== undefined && !['asc', 'desc'].includes(input.sort)) v.invalid('sort debe ser asc o desc');
    if (input.query !== undefined && typeof input.query !== 'string') v.invalid('query debe ser texto');
    if (input.paginate !== undefined && typeof input.paginate !== 'boolean') v.invalid('paginate inválido');
    Object.assign(options, { sort: input.sort, query: input.query?.trim(), paginate: input.paginate !== false });
    const result = await this.repository.getProducts(options);
    return options.paginate ? { ...result, docs: result.docs.map(availability) } : result.map(availability);
  }
  async getProductById(id) { return availability(v.found(await this.repository.getProductById(v.id(id)), 'Producto')); }
  async createProduct(input, uploadedImage) {
    const data = validateProduct(input);
    if (uploadedImage) data.thumbnails.push(uploadedImage);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = segment(data.category) + '-' + segment(data.title) + '-' + randomBytes(4).toString('hex').toUpperCase();
      try { return availability(await this.repository.createProduct({ ...data, code })); }
      catch (error) { if (error.code !== 'DUPLICATE_CODE' || attempt === 4) throw error; }
    }
  }
  async updateProduct(id, input) { return availability(v.found(await this.repository.updateProduct(v.id(id), validateProduct(input, true)), 'Producto')); }
  async deleteProduct(id) { return availability(v.found(await this.repository.deleteProduct(v.id(id)), 'Producto')); }
}
module.exports = ProductsService;
