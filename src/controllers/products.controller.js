const { paginated } = require('../utils/presentation');
const { cleanupUpload } = require('../middlewares/upload');
const { notifyProducts } = require('../sockets/products');
module.exports = service => ({
  list: async (req, res, next) => {
    try { res.json(paginated(await service.getProducts(req.query), req.baseUrl, req.query)); } catch (error) { next(error); }
  },
  get: async (req, res, next) => {
    try { res.json({ status: 'success', payload: await service.getProductById(req.params.pid) }); } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    let product;
    try { product = await service.createProduct(req.body, req.file ? '/img/uploads/' + req.file.filename : undefined); }
    catch (error) { await cleanupUpload(req.file); return next(error); }
    await notifyProducts(req.app.get('io'), service);
    res.status(201).json({ status: 'success', payload: product });
  },
  update: async (req, res, next) => {
    try {
      const product = await service.updateProduct(req.params.pid, req.body);
      await notifyProducts(req.app.get('io'), service);
      res.json({ status: 'success', payload: product });
    } catch (error) { next(error); }
  },
  remove: async (req, res, next) => {
    try {
      const product = await service.deleteProduct(req.params.pid);
      await notifyProducts(req.app.get('io'), service);
      res.json({ status: 'success', payload: product });
    } catch (error) { next(error); }
  },
});
