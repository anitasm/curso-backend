
const fs = require("fs/promises");

class CartManager {
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

  _getNextId(carts) {
    if (carts.length === 0) return 1;
    const maxId = carts.reduce((max, c) => (c.id > max ? c.id : max), 0);
    return maxId + 1;
  }

  async createCart() {
    const carts = await this._readFile();

    const newCart = {
      id: this._getNextId(carts),
      products: [], 
    };

    carts.push(newCart);
    await this._writeFile(carts);

    return newCart;
  }

  async getCartById(id) {
    const carts = await this._readFile();
    const cid = Number(id);
    return carts.find((c) => c.id === cid) || null;
  }

  async addProductToCart(cid, pid) {
    const carts = await this._readFile();
    const cartId = Number(cid);
    const productId = Number(pid);

    const cartIndex = carts.findIndex((c) => c.id === cartId);
    if (cartIndex === -1) return { ok: false, message: "Carrito no encontrado" };

    
    // products: [{ product: <id>, quantity: <n> }]
    const cart = carts[cartIndex];

    const existingIndex = cart.products.findIndex((p) => p.product === productId);

    if (existingIndex === -1) {
      cart.products.push({ product: productId, quantity: 1 });
    } else {
      cart.products[existingIndex].quantity += 1;
    }

    carts[cartIndex] = cart;
    await this._writeFile(carts);

    return { ok: true, cart };
  }
}

module.exports = CartManager;
