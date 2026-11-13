const { paginated } = require('../utils/presentation');
module.exports = service => ({
  list: async (req, res, next) => { try { res.json(paginated(await service.list(req.query), req.baseUrl, req.query)); } catch (error) { next(error); } },
  get: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.get(req.params.uid) }); } catch (error) { next(error); } },
  create: async (req, res, next) => { try { res.status(201).json({ status: 'success', payload: await service.create(req.body) }); } catch (error) { next(error); } },
  update: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.update(req.params.uid, req.body) }); } catch (error) { next(error); } },
  remove: async (req, res, next) => { try { res.json({ status: 'success', payload: await service.remove(req.params.uid) }); } catch (error) { next(error); } },
});
