const v = require('../utils/validation');
class CartsService {
  constructor(repository, productsService) { this.repository = repository; this.productsService = productsService; }
  async createCart() { return this.repository.createCart(); }
  async getCartById(id) { return v.found(await this.repository.getCartById(v.id(id)), 'Carrito'); }
  async addProductToCart(cid, pid) {
    v.id(cid); v.id(pid);
    await this.productsService.getProductById(pid);
    return v.found(await this.repository.addProductToCart(cid, pid), 'Carrito');
  }
  async removeProductFromCart(cid, pid) { return v.found(await this.repository.removeProductFromCart(v.id(cid), v.id(pid)), 'Carrito'); }
  async updateCartProducts(cid, input) {
    v.id(cid);
    if (!Array.isArray(input)) { v.fields(input, ['products']); input = input.products; }
    if (!Array.isArray(input)) v.invalid('Se requiere un arreglo products o un arreglo raíz');
    const products = input.map(item => {
      v.fields(item, ['product', 'quantity']);
      return { product: v.id(item.product), quantity: v.number(item.quantity, 'quantity', true, 1) };
    });
    return v.found(await this.repository.updateCartProducts(cid, products), 'Carrito');
  }
  async updateProductQuantityInCart(cid, pid, input) {
    v.fields(input, ['quantity']);
    const cart = await this.repository.updateProductQuantityInCart(v.id(cid), v.id(pid), v.number(input.quantity, 'quantity', true, 1));
    return v.found(cart, cart === false ? 'Producto en el carrito' : 'Carrito');
  }
  async clearCart(cid) { return v.found(await this.repository.clearCart(v.id(cid)), 'Carrito'); }
  async getCartSummary(cid) {
    const cart = await this.getCartById(cid);
    const products = cart.products.map(item => ({ ...item, subtotal: item.product ? item.product.price * item.quantity : 0 }));
    return { ...cart, products, total: products.reduce((sum, item) => sum + item.subtotal, 0) };
  }
}
module.exports = CartsService;
