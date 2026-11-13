const { Router } = require('express');
const controller = require('../controllers/products.controller');
const { createUpload } = require('../middlewares/upload');
module.exports = (service, upload = createUpload()) => {
  const router = Router();
  const c = controller(service);
  router.get('/', c.list);
  router.get('/:pid', c.get);
  router.post('/', upload, c.create);
  router.put('/:pid', c.update);
  router.delete('/:pid', c.remove);
  return router;
};
