const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { validateEnv } = require('../src/config/env.config');
const good={PORT:'8080',NODE_ENV:'test',MONGODB_URI:'mongodb://localhost/shipnow_test'};
test('Configuración pura: obligatorias, PORT estricto, URI y NODE_ENV',()=>{
  const config=validateEnv(good);assert.equal(config.port,8080);assert.ok(Object.isFrozen(config));
  for(const key of Object.keys(good))for(const value of [undefined,'',' '])assert.throws(()=>validateEnv({...good,[key]:value}),new RegExp(key));
  for(const PORT of ['8080abc','NaN','-1','0','65536','1.5',' 8080','Infinity'])assert.throws(()=>validateEnv({...good,PORT}),/PORT/);
  for(const NODE_ENV of ['dev','TEST',' production'])assert.throws(()=>validateEnv({...good,NODE_ENV}),/NODE_ENV/);
  for(const MONGODB_URI of ['https://example.test','mongodb://','mongodb://host/ db'])assert.throws(()=>validateEnv({...good,MONGODB_URI}),/MONGODB_URI/);
  assert.equal(validateEnv({...good,MONGODB_URI:'mongodb+srv://example.test/shipnow_test'}).nodeEnv,'test');
});
test('Arranque aislado: valores vacíos o inválidos impiden conectar y escuchar',()=>{
  const server=path.resolve(__dirname,'../src/server.js');
  for(const patch of [{PORT:''},{PORT:'8080abc'},{NODE_ENV:''},{NODE_ENV:'other'},{MONGODB_URI:''},{MONGODB_URI:'https://invalid'}]) {
    // Explicit empty sentinels cannot be replaced by the real local .env (override:false).
    const child=spawnSync(process.execPath,[server],{env:{...process.env,...good,...patch},encoding:'utf8',timeout:5000});
    assert.equal(child.status,1,child.stderr);assert.match(child.stderr,/Configuración inválida/);assert.doesNotMatch(child.stdout,/escuchando/);
    assert.doesNotMatch(child.stderr,/mongodb:\/\/localhost/);
  }
});
test('Importar app no carga modelos, configura entorno, conecta ni escucha',()=>{
  const app=path.resolve(__dirname,'../src/app.js');
  const code='require('+JSON.stringify(app)+'); if(Object.keys(require.cache).some(p=>/mongoose|env.config/.test(p)))process.exit(2);';
  const child=spawnSync(process.execPath,['-e',code],{env:{...process.env,PORT:'',NODE_ENV:'',MONGODB_URI:''},encoding:'utf8',timeout:5000});
  assert.equal(child.status,0,child.stderr);assert.equal(child.stdout,'');
});

test('Arranque: fallo de conexión y puerto ocupado terminan sin filtrar secretos',()=>{
  for(const mode of ['connection','occupied']) {
    const child=spawnSync(process.execPath,[path.resolve(__dirname,'helpers/startup-child.js'),mode],{env:{...process.env,...good},encoding:'utf8',timeout:5000});
    assert.equal(child.status,1,child.stderr);assert.doesNotMatch(child.stderr,/private|secret|example.test/);
    assert.match(child.stderr,mode==='occupied'?/puerto configurado está ocupado/:/No se pudo iniciar/);
  }
});
