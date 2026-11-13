const { Router } = require('express');
const controller = require('../controllers/users.controller');
module.exports = service => {
  const router = Router();
  const c = controller(service);
  router.get('/', c.list);
  router.get('/:uid', c.get);
  router.post('/', c.create);
  router.put('/:uid', c.update);
  router.delete('/:uid', c.remove);
  return router;
};
