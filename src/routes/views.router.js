const { Router } = require('express');
const controller = require('../controllers/views.controller');
module.exports = (productsService, cartsService) => {
  const router = Router();
  const c = controller(productsService, cartsService);
  router.get('/', c.home);
  router.get('/products', c.products);
  router.get('/products/:pid', c.product);
  router.get('/carts/:cid', c.cart);
  router.get('/realtimeproducts', c.realtime);
  return router;
};
