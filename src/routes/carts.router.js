const { Router } = require('express');
const controller = require('../controllers/carts.controller');
module.exports = service => {
  const router = Router();
  const c = controller(service);
  router.post('/', c.create);
  router.get('/:cid', c.get);
  router.post('/:cid/product/:pid', c.add);
  router.delete('/:cid/products/:pid', c.remove);
  router.put('/:cid', c.replace);
  router.put('/:cid/products/:pid', c.quantity);
  router.delete('/:cid', c.clear);
  return router;
};
