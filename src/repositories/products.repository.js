const Product = require('../models/Product');
const { normalize, persist } = require('./persistence');
const PUBLIC_FIELDS = 'title description code price stock status category thumbnails createdAt updatedAt';
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
class ProductsRepository {
  initialize() { return persist(() => Product.init()); }
  getProducts({ page = 1, limit = 10, sort, query, paginate = true } = {}) {
    return persist(async () => {
      const filter = {};
      if (query === 'true' || query === 'false') filter.status = query === 'true';
      else if (query) filter.category = { $regex: '^' + escapeRegex(query) + '$', $options: 'i' };
      const order = sort ? { price: sort === 'asc' ? 1 : -1, _id: 1 } : { createdAt: -1, _id: 1 };
      if (!paginate) return (await Product.find(filter).select(PUBLIC_FIELDS).sort(order).lean()).map(normalize);
      const result = await Product.paginate(filter, { page, limit, sort: order, select: PUBLIC_FIELDS, lean: true, leanWithId: false });
      return { ...result, docs: result.docs.map(normalize) };
    });
  }
  getProductById(id) { return persist(async () => normalize(await Product.findById(id).select(PUBLIC_FIELDS).lean())); }
  createProduct(data) { return persist(async () => normalize(await Product.create(data))); }
  updateProduct(id, data) { return persist(async () => normalize(await Product.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).select(PUBLIC_FIELDS).lean())); }
  deleteProduct(id) { return persist(async () => normalize(await Product.findByIdAndDelete(id).select(PUBLIC_FIELDS).lean())); }
}
module.exports = ProductsRepository;
