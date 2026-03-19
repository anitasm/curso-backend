const express = require("express");
const mongoose = require("mongoose");

const CartManager = require("../managers/CartManager");
const ProductManager = require("../managers/ProductManager");

const router = express.Router();
const cartManager = new CartManager();
const productManager = new ProductManager();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateCartAndProductIds = (req, res, next) => {
  const { cid, pid } = req.params;

  if (cid && !isValidObjectId(cid)) {
    return res.status(400).json({ status: "error", message: "ID de carrito inválido" });
  }

  if (pid && !isValidObjectId(pid)) {
    return res.status(400).json({ status: "error", message: "ID de producto inválido" });
  }

  next();
};

const getProductsPayload = (body) => (Array.isArray(body) ? body : body.products);

const validateProductsPayload = (products) => {
  if (!Array.isArray(products)) {
    return "El body debe incluir un arreglo products o un arreglo raíz válido";
  }

  const hasInvalidItem = products.some((item) => {
    const quantity = Number(item.quantity);
    return !item.product || !isValidObjectId(item.product) || !Number.isInteger(quantity) || quantity < 1;
  });

  if (hasInvalidItem) {
    return "Cada item debe incluir product válido y quantity mayor o igual a 1";
  }

  return null;
};

router.post("/", async (_req, res) => {
  try {
    const cart = await cartManager.createCart();
    res.status(201).json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error creando carrito" });
  }
});

router.get("/:cid", validateCartAndProductIds, async (req, res) => {
  try {
    const cart = await cartManager.getCartById(req.params.cid);

    if (!cart) {
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
    }

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error leyendo carrito" });
  }
});

router.post("/:cid/product/:pid", validateCartAndProductIds, async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid);

    if (!product) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }

    const cart = await cartManager.addProductToCart(req.params.cid, req.params.pid);

    if (!cart) {
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
    }

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error agregando producto al carrito" });
  }
});

router.delete("/:cid/products/:pid", validateCartAndProductIds, async (req, res) => {
  try {
    const cart = await cartManager.removeProductFromCart(req.params.cid, req.params.pid);

    if (!cart) {
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
    }

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error eliminando producto del carrito" });
  }
});

router.put("/:cid", validateCartAndProductIds, async (req, res) => {
  try {
    const productsPayload = getProductsPayload(req.body);
    const validationMessage = validateProductsPayload(productsPayload);
    if (validationMessage) {
      return res.status(400).json({ status: "error", message: validationMessage });
    }

    const cart = await cartManager.updateCartProducts(req.params.cid, productsPayload);

    if (!cart) {
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
    }

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error actualizando carrito" });
  }
});

router.put("/:cid/products/:pid", validateCartAndProductIds, async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ status: "error", message: "quantity debe ser un entero mayor o igual a 1" });
    }

    const cart = await cartManager.updateProductQuantityInCart(req.params.cid, req.params.pid, quantity);

    if (cart === false) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado en el carrito" });
    }

    if (!cart) {
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
    }

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error actualizando cantidad del producto" });
  }
});

router.delete("/:cid", validateCartAndProductIds, async (req, res) => {
  try {
    const cart = await cartManager.clearCart(req.params.cid);

    if (!cart) {
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
    }

    res.json({ status: "success", payload: cart });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error vaciando carrito" });
  }
});

module.exports = router;