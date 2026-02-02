const express = require("express");
const path = require("path");

const CartManager = require("../managers/CartManager");
const ProductManager = require("../managers/ProductManager");

const router = express.Router();

const cartsPath = path.join(__dirname, "../data/carts.json");
const productsPath = path.join(__dirname, "../data/products.json");

const cartManager = new CartManager(cartsPath);
const productManager = new ProductManager(productsPath);

router.post("/", async (req, res) => {
  try {
    const cart = await cartManager.createCart();
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: "Error creando carrito" });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const cart = await cartManager.getCartById(req.params.cid);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });
    res.json(cart.products);
  } catch (error) {
    res.status(500).json({ error: "Error leyendo carrito" });
  }
});

router.post("/:cid/product/:pid", async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid);
    if (!product) return res.status(404).json({ error: "Producto no existe" });

    const result = await cartManager.addProductToCart(req.params.cid, req.params.pid);
    if (!result.ok) return res.status(404).json({ error: result.message });

    res.json(result.cart);
  } catch (error) {
    res.status(500).json({ error: "Error agregando producto al carrito" });
  }
});

module.exports = router;
