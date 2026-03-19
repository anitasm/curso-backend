const Cart = require("../models/Cart");

const normalizeCart = (cart) => {
  if (!cart) return null;

  const source = typeof cart.toObject === "function" ? cart.toObject() : cart;

  return {
    ...source,
    id: String(source._id),
  };
};

class CartManager {
  async createCart() {
    const cart = await Cart.create({ products: [] });
    return normalizeCart(cart);
  }

  async getCartById(id) {
    const cart = await Cart.findById(id).populate("products.product").lean();
    return normalizeCart(cart);
  }

  async addProductToCart(cartId, productId) {
    const cart = await Cart.findById(cartId);

    if (!cart) {
      return null;
    }

    const productIndex = cart.products.findIndex(
      (item) => String(item.product) === String(productId)
    );

    if (productIndex === -1) {
      cart.products.push({ product: productId, quantity: 1 });
    } else {
      cart.products[productIndex].quantity += 1;
    }

    await cart.save();
    return this.getCartById(cartId);
  }

  async removeProductFromCart(cartId, productId) {
    const cart = await Cart.findById(cartId);

    if (!cart) {
      return null;
    }

    cart.products = cart.products.filter(
      (item) => String(item.product) !== String(productId)
    );

    await cart.save();
    return this.getCartById(cartId);
  }

  async updateCartProducts(cartId, products) {
    const cart = await Cart.findByIdAndUpdate(
      cartId,
      { products },
      { new: true, runValidators: true }
    );

    if (!cart) {
      return null;
    }

    return this.getCartById(cartId);
  }

  async updateProductQuantityInCart(cartId, productId, quantity) {
    const cart = await Cart.findById(cartId);

    if (!cart) {
      return null;
    }

    const productIndex = cart.products.findIndex(
      (item) => String(item.product) === String(productId)
    );

    if (productIndex === -1) {
      return false;
    }

    cart.products[productIndex].quantity = quantity;
    await cart.save();
    return this.getCartById(cartId);
  }

  async clearCart(cartId) {
    const cart = await Cart.findByIdAndUpdate(
      cartId,
      { products: [] },
      { new: true }
    );

    if (!cart) {
      return null;
    }

    return this.getCartById(cartId);
  }
}

module.exports = CartManager;