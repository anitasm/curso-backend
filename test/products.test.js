const { test } = require('node:test');
const assert = require('node:assert/strict');
const Service = require('../src/services/products.service');
const AppError = require('../src/errors/AppError');
const id = '1234567890abcdef12345678';
const valid = { title: ' Aro ', description: ' Acero ', category: ' Accesorios ', price: '12.50', stock: '2' };
const repository = { createProduct: async data => ({ ...data, _id: id, id }), updateProduct: async (_id, data) => ({ ...valid, status: true, ...data, id }), getProductById: async () => null };
test('Products: alta, edición, disponibilidad y código generado', async () => {
  const service = new Service(repository);
  const product = await service.createProduct(valid);
  assert.equal(product.title, 'Aro'); assert.equal(product.price, 12.5); assert.equal(product.stock, 2);
  assert.equal(product.availability, 'available'); assert.match(product.code, /^ACCESORI-ARO-/);
  assert.equal((await service.updateProduct(id, {stock: 0})).availability, 'out_of_stock');
  assert.equal((await service.updateProduct(id, {status: false})).availability, 'inactive');
});
test('Products: entradas inválidas, campos protegidos, IDs y paginación', async () => {
  const service = new Service(repository);
  for (const key of ['price', 'stock']) for (const value of [null, true, '', ' ', '12abc', -1, Infinity, NaN, {}]) {
    await assert.rejects(service.createProduct({...valid, [key]: value}), {status:400});
  }
  await assert.rejects(service.createProduct({...valid, stock:1.5}), {status:400});
  for (const status of [null, 1, 'TRUE', 'unknown']) await assert.rejects(service.createProduct({...valid, status}), {status:400});
  for (const key of ['code', '_id', 'id', 'createdAt', 'updatedAt', '$set']) await assert.rejects(service.updateProduct(id, {[key]:'x'}), {status:400});
  await assert.rejects(service.updateProduct(id, {}), {status:400});
  await assert.rejects(service.getProductById('bad'), {status:400});
  await assert.rejects(service.getProductById(id), {status:404});
  for (const input of [{page:0},{page:'2x'},{limit:101},{limit:null},{sort:'other'},{query:{}},{paginate:'false'}]) await assert.rejects(service.getProducts(input), {status:400});
});
test('Products: filtros existentes y listado paginado', async () => {
  let received;
  const service = new Service({ getProducts: async options => { received = options; return {docs:[],page:options.page,totalPages:1}; } });
  for (const query of ['true','false','Aros.*']) {
    const result = await service.getProducts({query,limit:'100',page:'2',sort:'asc'});
    assert.equal(received.query,query); assert.equal(received.limit,100); assert.equal(result.page,2);
  }
});
test('Products: solo reintenta colisiones de código, máximo cinco', async () => {
  let calls = 0;
  const service = new Service({createProduct: async data => { calls++; if (calls < 3) throw new AppError(409,'duplicado','DUPLICATE_CODE'); return data; }});
  await service.createProduct(valid); assert.equal(calls,3);
  calls=0;
  service.repository.createProduct = async () => { calls++; throw new AppError(500,'fallo'); };
  await assert.rejects(service.createProduct(valid)); assert.equal(calls,1);
  calls=0;
  service.repository.createProduct = async () => { calls++; throw new AppError(409,'duplicado','DUPLICATE_CODE'); };
  await assert.rejects(service.createProduct(valid)); assert.equal(calls,5);
});
