const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const AppError = require('../errors/AppError');
const uploadsDir = path.resolve(__dirname, '../public/img/uploads');
function createUpload(directory = uploadsDir) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => { fs.mkdir(directory, { recursive: true }).then(() => cb(null, directory), cb); },
    filename: (_req, file, cb) => cb(null, randomUUID() + '-' + path.basename(file.originalname).toLowerCase().replace(/[^a-z0-9._-]/g, '-')),
  });
  const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(file.mimetype.startsWith('image/') ? null : new AppError(400, 'Solo se permiten imágenes'), file.mimetype.startsWith('image/')) }).single('image');
  return (req, res, next) => upload(req, res, error => next(error ? new AppError(400, 'No se pudo subir la imagen (máximo 2 MB, campo image)') : undefined));
}
async function cleanupUpload(file) {
  // Only the server-generated Multer file object of this request is used.
  if (file) await fs.unlink(file.path).catch(error => { if (error.code !== 'ENOENT') console.warn('No se pudo limpiar una imagen de la petición fallida'); });
}
module.exports = { createUpload, cleanupUpload };
