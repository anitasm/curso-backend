const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { Server } = require('socket.io');
const { registerProductSocket } = require('../src/sockets/products');
test('Socket: carga inicial y errorMessage usan el servicio',async()=>{
  let connection;
  const events=[];
  const socket={emit:(name,data)=>events.push({name,data})};
  const io={on:(event,handler)=>{assert.equal(event,'connection');connection=handler;}};
  registerProductSocket(io,{getProducts:async options=>{assert.deepEqual(options,{paginate:false,sort:'desc'});return [{id:'example'}];}});
  await connection(socket);assert.equal(events[0].name,'productsUpdated');assert.equal(events[0].data[0].id,'example');
  registerProductSocket(io,{getProducts:async()=>{throw new Error('private');}});
  await connection(socket);assert.equal(events[1].name,'errorMessage');assert.doesNotMatch(events[1].data,/private/);
});
test('Socket.io real: handshake HTTP y productsUpdated inicial',async t=>{
  const server=http.createServer();const io=new Server(server);
  registerProductSocket(io,{getProducts:async()=>[{id:'1234567890abcdef12345678'}]});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>io.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port+'/socket.io/?EIO=4&transport=polling';
  const open=await (await fetch(base)).text();const sid=JSON.parse(open.slice(1)).sid;
  assert.ok(sid);
  assert.equal((await fetch(base+'&sid='+sid,{method:'POST',headers:{'Content-Type':'text/plain'},body:'40'})).status,200);
  let packets=await (await fetch(base+'&sid='+sid)).text();
  if(!packets.includes('productsUpdated'))packets+=await (await fetch(base+'&sid='+sid)).text();
  assert.match(packets,/productsUpdated/);assert.match(packets,/1234567890abcdef12345678/);
});
