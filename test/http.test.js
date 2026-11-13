const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const createApp = require('../src/app');
const { createUpload } = require('../src/middlewares/upload');
const { fixtures, validProduct } = require('./helpers/fixtures');
async function setup(t) {
  const deps = fixtures();
  const directory = await fs.mkdtemp(path.join(os.tmpdir(),'shipnow-test-'));
  const events=[];
  const app=createApp({...deps,upload:createUpload(directory),io:{emit:(name,data)=>events.push({name,data})}});
  const server=http.createServer(app);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async ()=>{await new Promise(resolve=>server.close(resolve)); const names=await fs.readdir(directory); for(const name of names) await fs.unlink(path.join(directory,name)); await fs.rmdir(directory);});
  const request=async (url,method='GET',body) => {
    const multipart=body instanceof FormData;
    const response=await fetch('http://127.0.0.1:'+server.address().port+url,{method,headers:body&&!multipart?{'Content-Type':'application/json'}:{},body:body?(multipart?body:JSON.stringify(body)):undefined,redirect:'manual'});
    const text=await response.text();
    return {status:response.status,body:response.headers.get('content-type')?.includes('json')?JSON.parse(text):text,headers:response.headers};
  };
  return {...deps,request,events,directory,app};
}
test('HTTP Products: CRUD, envelope, filtros, validación y notificaciones',async t=>{
  const {request,events,productsRepository}=await setup(t);
  const created=await request('/api/products','POST',validProduct);
  assert.equal(created.status,201); const id=created.body.payload.id;
  assert.equal(created.body.payload._id,id);assert.equal(events.length,1);
  assert.equal((await request('/api/products/'+id)).status,200);
  await request('/api/products/','POST',{...validProduct,title:'Otro',price:50,stock:0});
  const list=await request('/api/products/?limit=1&sort=asc&query=true');
  assert.deepEqual(Object.keys(list.body).sort(),['status','payload','totalPages','prevPage','nextPage','page','hasPrevPage','hasNextPage','prevLink','nextLink'].sort());
  assert.equal(list.body.payload[0].price,50); assert.equal(list.body.payload[0].availability,'out_of_stock');
  assert.match(list.body.nextLink,/page=2/);assert.equal(list.body.totalPages,2);
  assert.equal((await request('/api/products?query=false')).body.payload.length,0);
  assert.equal((await request('/api/products?query=Accesorios')).body.payload.length,2);
  for(const query of ['limit=101','page=abc','query[$ne]=x','sort=bad'])assert.equal((await request('/api/products?'+query)).status,400);
  assert.equal((await request('/api/products/'+id,'PUT',{stock:0,status:false})).body.payload.availability,'inactive');
  assert.equal((await request('/api/products/'+id,'PUT',{code:'forbidden'})).status,400);
  assert.equal((await request('/api/products/not-an-id')).status,400);
  // A committed write remains successful if reloading for socket notification fails.
  const original=productsRepository.getProducts;
  productsRepository.getProducts=async()=>{throw new Error('private connection detail');};
  assert.equal((await request('/api/products/'+id,'PUT',{stock:5})).status,200);
  productsRepository.getProducts=original;
  assert.equal(events.at(-1).name,'errorMessage');
  assert.equal((await request('/api/products/'+id,'DELETE')).status,200);
  assert.equal((await request('/api/products/'+id)).status,404);
  assert.ok(events.filter(e=>e.name==='productsUpdated').length>=4);
});
test('HTTP Users: CRUD, normalización, duplicados, campos sensibles y roles',async t=>{
  const {request}=await setup(t);
  const data={firstName:' Ana ',lastName:' Ejemplo ',email:'ANA@example.test '};
  const created=await request('/api/users','POST',data);
  assert.equal(created.status,201);const user=created.body.payload;
  assert.equal(user.role,'user');assert.equal(user.email,'ana@example.test');assert.equal(user.firstName,'Ana');
  assert.equal((await request('/api/users','POST',data)).status,409);
  for(const extra of [{role:'admin'},{role:'user'},{password:'x'},{token:'x'},{email:'bad'}]) assert.equal((await request('/api/users','POST',{...data,...extra})).status,400);
  assert.equal((await request('/api/users/'+user.id,'PUT',{role:'admin'})).status,400);
  assert.equal((await request('/api/users/'+user.id,'PUT',{})).status,400);
  assert.equal((await request('/api/users/'+user.id,'PUT',{lastName:'Cambio'})).body.payload.lastName,'Cambio');
  const second=await request('/api/users','POST',{...data,email:'second@example.test'});
  assert.equal((await request('/api/users/'+second.body.payload.id,'PUT',{email:'ana@example.test'})).status,409);
  assert.equal((await request('/api/users?limit=1')).body.hasNextPage,true);
  assert.equal((await request('/api/users?limit=101')).status,400);
  assert.equal((await request('/api/users/'+user.id)).status,200);
  assert.equal((await request('/api/users/'+user.id,'DELETE')).status,200);
  assert.equal((await request('/api/users/'+user.id)).status,404);
  assert.equal((await request('/api/users/bad')).status,400);
});
test('HTTP carritos y vistas: contratos, totales y producto eliminado',async t=>{
  const {request}=await setup(t);
  const p=(await request('/api/products','POST',validProduct)).body.payload;
  const c=(await request('/api/carts','POST')).body.payload;
  assert.equal((await request('/api/carts/'+c.id+'/product/'+p.id,'POST')).status,200);
  assert.equal((await request('/api/carts/'+c.id+'/products/'+p.id,'PUT',{quantity:3})).body.payload.products[0].quantity,3);
  for(const quantity of [true,null,0,1.5,'']) assert.equal((await request('/api/carts/'+c.id+'/products/'+p.id,'PUT',{quantity})).status,400);
  for(const body of [[{product:p.id,quantity:2}],{products:[{product:p.id,quantity:2}]}]) assert.equal((await request('/api/carts/'+c.id,'PUT',body)).status,200);
  const cartView=await request('/carts/'+c.id);assert.equal(cartView.status,200);assert.match(cartView.body,/200/);
  assert.equal((await request('/')).headers.get('location'),'/products');
  for(const route of ['/products','/products?sort=&query=','/products/'+p.id,'/realtimeproducts','/js/storefront.js','/socket.io-missing']) {
    const response=await request(route);assert.equal(response.status,route==='/socket.io-missing'?404:200);
  }
  assert.match((await request('/js/storefront.js')).body,/rina_cart_id/);
  assert.equal((await request('/api/carts/'+c.id+'/products/'+p.id,'DELETE')).body.payload.products.length,0);
  await request('/api/carts/'+c.id+'/product/'+p.id,'POST');
  await request('/api/products/'+p.id,'DELETE');
  assert.equal((await request('/api/carts/'+c.id)).body.payload.products[0].product,null);
  assert.match((await request('/carts/'+c.id)).body,/Producto eliminado/);
  assert.equal((await request('/api/carts/'+c.id,'DELETE')).body.payload.products.length,0);
  assert.equal((await request('/api/carts/'+c.id)).status,200);
});
test('multipart: alta, limpieza tras error, tipo de archivo y máximo 2 MB',async t=>{
  const {request,directory}=await setup(t);
  const form=(price,size=3,type='image/png')=>{const data=new FormData();for(const [key,value]of Object.entries({...validProduct,price}))data.set(key,String(value));data.set('image',new Blob([new Uint8Array(size)],{type}),'test.png');return data;};
  const created=await request('/api/products','POST',form(15));assert.equal(created.status,201);
  assert.match(created.body.payload.thumbnails[0],/^\/img\/uploads\//);
  const baseline=await fs.readdir(directory);assert.equal(baseline.length,1);
  assert.equal((await request('/api/products','POST',form('invalid'))).status,400);
  assert.deepEqual(await fs.readdir(directory),baseline);
  assert.equal((await request('/api/products','POST',form(15,2*1024*1024+1))).status,400);
  assert.equal((await request('/api/products','POST',form(15,3,'text/plain'))).status,400);
  assert.deepEqual(await fs.readdir(directory),baseline);
});
test('HTTP: errores inesperados no exponen detalles privados',async t=>{
  const {request,usersRepository}=await setup(t);
  usersRepository.list=async()=>{throw new Error('mongodb://secret:password@private');};
  const result=await request('/api/users');assert.equal(result.status,500);assert.deepEqual(result.body,{status:'error',message:'Error interno del servidor'});
});
