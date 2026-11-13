const mongoose = require('mongoose');
async function connectDB(uri) {
  try { await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 }); }
  catch { throw new Error('No se pudo conectar con MongoDB. Revisá configuración y acceso de red.'); }
}
module.exports = { connectDB, disconnectDB: () => mongoose.disconnect() };
