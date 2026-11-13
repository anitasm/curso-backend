module.exports = service => ({
  create: async (_req, res, next) => { try { res.status(201).json({ status: 'success', payload: await service.createCart() }); } catch (error) { next(error); } },
  get: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.getCartById(req.params.cid) }); } catch (error) { next(error); } },
  add: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.addProductToCart(req.params.cid, req.params.pid) }); } catch (error) { next(error); } },
  remove: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.removeProductFromCart(req.params.cid, req.params.pid) }); } catch (error) { next(error); } },
  replace: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.updateCartProducts(req.params.cid, req.body) }); } catch (error) { next(error); } },
  quantity: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.updateProductQuantityInCart(req.params.cid, req.params.pid, req.body) }); } catch (error) { next(error); } },
  clear: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.clearCart(req.params.cid) }); } catch (error) { next(error); } },
});
