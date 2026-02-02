const fs = require("fs/promises");
const path = require("path");

class ProductManager {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async _readFile() {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
        return [];
      }
      throw error;
    }
  }

  async _writeFile(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  _getNextId(products) {
    if (products.length === 0) return 1;
    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    return maxId + 1;
  }

  _validateProductFields(product) {
    const required = [
      "title",
      "description",
      "code",
      "price",
      "status",
      "stock",
      "category",
      "thumbnails"
    ];

    for (const field of required) {
      if (product[field] === undefined || product[field] === null) {
        return { ok: false, message: `Falta campo obligatorio: ${field}` };
      }
      if (typeof product[field] === "string" && product[field].trim() === "") {
        return { ok: false, message: `El campo ${field} no puede ser vacío` };
      }
    }

    if (typeof product.price !== "number" || !Number.isFinite(product.price)) {
      return { ok: false, message: "price debe ser Number válido" };
    }

    if (!Number.isInteger(product.stock) || product.stock < 0) {
      return { ok: false, message: "stock debe ser entero >= 0" };
    }

    if (typeof product.status !== "boolean") {
      return { ok: false, message: "status debe ser Boolean" };
    }

    if (!Array.isArray(product.thumbnails)) {
      return { ok: false, message: "thumbnails debe ser un Array de Strings" };
    }

    const allStrings = product.thumbnails.every((t) => typeof t === "string");
    if (!allStrings) {
      return { ok: false, message: "thumbnails debe contener solo strings" };
    }

    return { ok: true };
  }

  async getProducts() {
    return await this._readFile();
  }

  async getProductById(id) {
    const products = await this._readFile();
    const pid = Number(id);
    return products.find((p) => p.id === pid) || null;
  }

  async addProduct(productData) {
    const products = await this._readFile();

    // Validar campos obligatorios
    const validation = this._validateProductFields(productData);
    if (!validation.ok) {
      return { ok: false, message: validation.message };
    }

    // Validar code único
    const codeExists = products.some((p) => p.code === productData.code);
    if (codeExists) {
      return { ok: false, message: `El code "${productData.code}" ya existe` };
    }

    const newProduct = {
      id: this._getNextId(products), // autogenerado
      ...productData,
    };

    products.push(newProduct);
    await this._writeFile(products);

    return { ok: true, product: newProduct };
  }

  async updateProduct(id, updates) {
    const products = await this._readFile();
    const pid = Number(id);

    const index = products.findIndex((p) => p.id === pid);
    if (index === -1) return { ok: false, message: "Producto no encontrado" };

    if ("id" in updates) delete updates.id;

    const updated = { ...products[index], ...updates };

    if (updates.code && updates.code !== products[index].code) {
      const codeExists = products.some((p) => p.code === updates.code);
      if (codeExists) {
        return { ok: false, message: `El code "${updates.code}" ya existe` };
      }
    }

    products[index] = updated;
    await this._writeFile(products);

    return { ok: true, product: updated };
  }

  async deleteProduct(id) {
    const products = await this._readFile();
    const pid = Number(id);

    const exists = products.some((p) => p.id === pid);
    if (!exists) return { ok: false, message: "Producto no encontrado" };

    const filtered = products.filter((p) => p.id !== pid);
    await this._writeFile(filtered);

    return { ok: true };
  }
}

module.exports = ProductManager;
