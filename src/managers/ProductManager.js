const Product = require("../models/Product");

const normalizeProduct = (product) => {
  if (!product) return null;

  const source = typeof product.toObject === "function" ? product.toObject() : product;

  return {
    ...source,
    id: String(source._id),
  };
};

const sanitizeCodeSegment = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 8);

const buildCodeBase = ({ category, title }) => {
  const categorySegment = sanitizeCodeSegment(category).split("-")[0] || "ACC";
  const titleSegment = sanitizeCodeSegment(title).split("-")[0] || "ITEM";

  return `${categorySegment}-${titleSegment}`;
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

  async generateUniqueCode(productData) {
    const baseCode = buildCodeBase(productData);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`
        .toUpperCase()
        .slice(-8);
      const code = `${baseCode}-${suffix}`;
      const existingProduct = await Product.exists({ code });

      if (!existingProduct) {
        return code;
      }
    }

    throw new Error("No se pudo generar un código único para el producto");
  }

  async createProduct(productData) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const payload = {
          ...productData,
          code: await this.generateUniqueCode(productData),
        };

        const createdProduct = await Product.create(payload);
        return normalizeProduct(createdProduct);
      } catch (error) {
        if (error.code !== 11000 || attempt === 4) {
          throw error;
        }
      }
    }

    throw new Error("No se pudo crear el producto");
  }

  async updateProduct(id, updates) {
    if ("_id" in updates) {
      delete updates._id;
    }

    if ("code" in updates) {
      delete updates.code;
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