// Isolated startup probes: no MongoDB connection or production data.
const http = require('node:http');
const mode = process.argv[2];
const db = require('../../src/config/db');
db.connectDB = async () => { if (mode === 'connection') throw new Error('mongodb://private:secret@example.test'); };
db.disconnectDB = async () => {};
require('../../src/repositories/products.repository').prototype.initialize = async () => {};
require('../../src/repositories/users.repository').prototype.initialize = async () => {};
const { startServer } = require('../../src/server');
(async () => {
  if (mode === 'connection') { await startServer(); return; }
  const occupied = http.createServer();
  await new Promise(resolve => occupied.listen(0, resolve));
  process.env.PORT = String(occupied.address().port);
  await startServer();
  await new Promise(resolve => occupied.close(resolve));
})();
