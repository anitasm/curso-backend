const { test } = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../src/models/Product');
const User = require('../src/models/User');
const Cart = require('../src/models/Cart');
const Repository = require('../src/repositories/products.repository');
const UsersRepository = require('../src/repositories/users.repository');
const { persist } = require('../src/repositories/persistence');
const AppError = require('../src/errors/AppError');
test('Repository Products: regex literal, proyección, paginación y orden estable',async t=>{
  let captured;
  t.mock.method(Product,'paginate',async (filter,options)=>{captured={filter,options};return {docs:[{_id:'1234567890abcdef12345678',title:'Test'}],page:2};});
  const repo=new Repository();
  const result=await repo.getProducts({query:'Aros.*[x]',page:2,limit:10,sort:'desc'});
  assert.equal(captured.filter.category.$regex,String.raw`^Aros\.\*\[x\]$`);
  const regex=new RegExp(captured.filter.category.$regex,'i');assert.ok(regex.test('aros.*[x]'));assert.ok(!regex.test('Aros anything'));
  assert.deepEqual(captured.options.sort,{price:-1,_id:1});assert.equal(captured.options.page,2);assert.equal(captured.options.lean,true);assert.match(captured.options.select,/thumbnails/);
  assert.equal(result.docs[0].id,result.docs[0]._id);
  for(const query of ['true','false']){await repo.getProducts({query});assert.deepEqual(captured.filter,{status:query==='true'});}
});
test('Repository: duplicados concurrentes, validación y fallos internos se traducen',async t=>{
  t.mock.method(Product,'create',async()=>{throw {code:11000,keyPattern:{code:1}};});
  await assert.rejects(new Repository().createProduct({}),{status:409,code:'DUPLICATE_CODE'});
  t.mock.method(User,'create',async()=>{throw {code:11000,keyPattern:{email:1}};});
  await assert.rejects(new UsersRepository().create({}),{status:409,code:'DUPLICATE_KEY'});
  for(const name of ['ValidationError','CastError'])await assert.rejects(persist(async()=>{throw {name};}),{status:400});
  await assert.rejects(persist(async()=>{throw new Error('secret');}),{status:500,message:'No se pudo completar la operación de persistencia'});
  const error=new AppError(404,'Ausente');await assert.rejects(persist(async()=>{throw error;}),value=>value===error);
});
test('Modelos: índices únicos, roles, restricciones numéricas y nombres conservados',async()=>{
  assert.equal(Product.modelName,'Product');assert.equal(Cart.modelName,'Cart');
  assert.ok(Product.schema.indexes().some(([keys,options])=>keys.code===1&&options.unique));
  assert.ok(User.schema.indexes().some(([keys,options])=>keys.email===1&&options.unique));
  const valid={title:'Aro',description:'Acero',code:'TEST',category:'Aros',price:1,stock:1};
  await assert.rejects(new Product({...valid,price:-1}).validate());
  await assert.rejects(new Product({...valid,stock:1.5}).validate());
  await assert.rejects(new User({firstName:'A',lastName:'B',email:'x@example.test',role:'other'}).validate());
});
