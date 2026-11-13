const Cart = require('../models/Cart');
const { persist, normalize } = require('./persistence');
const PRODUCT_FIELDS = 'title description code price stock status category thumbnails createdAt updatedAt';
class CartsRepository {
  createCart() { return persist(async () => normalize(await Cart.create({ products: [] }))); }
  getCartById(id) {
    return persist(async () => {
      const cart = normalize(await Cart.findById(id).select('products createdAt updatedAt').populate({ path: 'products.product', select: PRODUCT_FIELDS }).lean());
      if (cart) cart.products = cart.products.map(item => ({ ...item, _id: String(item._id), product: normalize(item.product) }));
      return cart;
    });
  }
  addProductToCart(cartId, productId) {
    return persist(async () => {
      const cart = await Cart.findById(cartId);
      if (!cart) return null;
      const item = cart.products.find(item => String(item.product) === productId);
      if (item) item.quantity += 1;
      else cart.products.push({ product: productId, quantity: 1 });
      await cart.save();
      return this.getCartById(cartId);
    });
  }
  removeProductFromCart(cartId, productId) {
    return persist(async () => {
      const cart = await Cart.findByIdAndUpdate(cartId, { $pull: { products: { product: productId } } }, { new: true, runValidators: true });
      return cart ? this.getCartById(cartId) : null;
    });
  }
  updateCartProducts(cartId, products) {
    return persist(async () => {
      const cart = await Cart.findByIdAndUpdate(cartId, { $set: { products } }, { new: true, runValidators: true });
      return cart ? this.getCartById(cartId) : null;
    });
  }
  updateProductQuantityInCart(cartId, productId, quantity) {
    return persist(async () => {
      const cart = await Cart.findById(cartId);
      if (!cart) return null;
      const item = cart.products.find(item => String(item.product) === productId);
      if (!item) return false;
      item.quantity = quantity;
      await cart.save();
      return this.getCartById(cartId);
    });
  }
  clearCart(cartId) { return this.updateCartProducts(cartId, []); }
}
module.exports = CartsRepository;
