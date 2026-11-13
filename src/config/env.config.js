const path = require('node:path');
const dotenv = require('dotenv');
function validateEnv(values) {
  for (const key of ['PORT', 'MONGODB_URI', 'NODE_ENV']) {
    if (typeof values[key] !== 'string' || !values[key].trim()) throw new Error('Configuración inválida: ' + key + ' es obligatoria y no puede estar vacía');
  }
  if (!/^\d+$/.test(values.PORT) || Number(values.PORT) < 1 || Number(values.PORT) > 65535) throw new Error('Configuración inválida: PORT debe ser un entero entre 1 y 65535');
  if (!['development', 'test', 'production'].includes(values.NODE_ENV)) throw new Error('Configuración inválida: NODE_ENV debe ser development, test o production');
  if (!/^mongodb(?:\+srv)?:\/\/\S+$/.test(values.MONGODB_URI)) throw new Error('Configuración inválida: MONGODB_URI debe comenzar con mongodb:// o mongodb+srv://');
  return Object.freeze({ port: Number(values.PORT), mongoUri: values.MONGODB_URI, nodeEnv: values.NODE_ENV });
}
function loadConfig() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false, quiet: true });
  return validateEnv(process.env);
}
module.exports = { validateEnv, loadConfig };
