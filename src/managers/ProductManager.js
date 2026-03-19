const Product = require("../models/Product");

const normalizeProduct = (product) => {
  if (!product) return null;

  const source = typeof product.toObject === "function" ? product.toObject() : product;

  return {
    ...source,
    id: String(source._id),
  };
};

class ProductManager {
  async getProducts(options = {}) {
    const {
      limit = 10,
      page = 1,
      sort,
      query,
      paginate = true,
    } = options;

    const filter = {};

    if (typeof query === "string" && query.trim()) {
      const normalizedQuery = query.trim();

      if (normalizedQuery === "true" || normalizedQuery === "false") {
        filter.status = normalizedQuery === "true";
      } else {
        filter.category = { $regex: new RegExp(`^${normalizedQuery}$`, "i") };
      }
    }

    const sortOption = sort === "asc" || sort === "desc" ? { price: sort === "asc" ? 1 : -1 } : undefined;

    if (!paginate) {
      const products = await Product.find(filter).sort(sortOption || { createdAt: -1 }).lean();
      return products.map(normalizeProduct);
    }

    const result = await Product.paginate(filter, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: sortOption,
      lean: true,
      leanWithId: false,
    });

    return {
      ...result,
      docs: result.docs.map(normalizeProduct),
    };
  }

  async getProductById(id) {
    const product = await Product.findById(id).lean();
    return normalizeProduct(product);
  }

  async createProduct(productData) {
    const createdProduct = await Product.create(productData);
    return normalizeProduct(createdProduct);
  }

  async addProduct(productData) {
    return this.createProduct(productData);
  }

  async updateProduct(id, updates) {
    if ("_id" in updates) {
      delete updates._id;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    return normalizeProduct(updatedProduct);
  }

  async deleteProduct(id) {
    const deletedProduct = await Product.findByIdAndDelete(id).lean();
    return normalizeProduct(deletedProduct);
  }
}

module.exports = ProductManager;
