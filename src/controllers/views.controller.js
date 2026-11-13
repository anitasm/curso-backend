const { link } = require('../utils/presentation');
const { PRODUCT_STATUS } = require('../constants');
const mapProduct = product => ({ ...product, displayStatus: product.availability === PRODUCT_STATUS.INACTIVE ? 'No disponible' : product.availability === PRODUCT_STATUS.OUT_OF_STOCK ? 'Sin stock' : 'Disponible', isAvailable: product.availability === PRODUCT_STATUS.AVAILABLE, mainThumbnail: product.thumbnails?.[0] || null });
module.exports = (productsService, cartsService) => ({
  home: (_req, res) => res.redirect('/products'),
  products: async (req, res, next) => {
    try {
      const input = { ...req.query, limit: req.query.limit === undefined ? 8 : req.query.limit };
      // Empty select controls are normal browser form submissions.
      if (input.sort === '') delete input.sort;
      const result = await productsService.getProducts(input);
      res.render('products', {
        title: 'ShipNow | Rina', products: result.docs.map(mapProduct),
        pagination: { ...result, prevLink: result.hasPrevPage ? link('/products', req.query, result.prevPage) : null, nextLink: result.hasNextPage ? link('/products', req.query, result.nextPage) : null },
        filters: { query: input.query || '', sortAscSelected: input.sort === 'asc' ? 'selected' : '', sortDescSelected: input.sort === 'desc' ? 'selected' : '', limit: input.limit },
      });
    } catch (error) { next(error); }
  },
  product: async (req, res, next) => {
    try { const product = await productsService.getProductById(req.params.pid); res.render('productDetail', { title: product.title, product: mapProduct(product) }); } catch (error) { next(error); }
  },
  cart: async (req, res, next) => {
    try {
      const cart = await cartsService.getCartSummary(req.params.cid);
      const products = cart.products.map(item => ({ ...item, mainThumbnail: item.product?.thumbnails?.[0] || null }));
      res.render('cartDetail', { title: 'Carrito ' + cart.id, cart: { ...cart, products }, hasProducts: products.length > 0, total: cart.total });
    } catch (error) { next(error); }
  },
  realtime: async (_req, res, next) => {
    try { res.render('realTimeProducts', { title: 'ShipNow | Gestión de catálogo', products: await productsService.getProducts({ paginate: false, sort: 'desc' }) }); } catch (error) { next(error); }
  },
});
