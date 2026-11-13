const AppError = require('../errors/AppError');
const normalize = document => {
  if (!document) return null;
  const source = typeof document.toObject === 'function' ? document.toObject() : document;
  return { ...source, _id: String(source._id), id: String(source._id) };
};
async function persist(operation) {
  try { return await operation(); }
  catch (error) {
    if (error instanceof AppError) throw error;
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
      throw new AppError(409, 'Ya existe un registro con ese valor único', field === 'code' ? 'DUPLICATE_CODE' : 'DUPLICATE_KEY');
    }
    if (['ValidationError', 'CastError', 'StrictModeError'].includes(error.name)) throw new AppError(400, 'Datos incompatibles con el esquema');
    throw new AppError(500, 'No se pudo completar la operación de persistencia');
  }
}
module.exports = { normalize, persist };
