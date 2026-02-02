const express = require("express");
const path = require("path");
const ProductManager = require("../managers/ProductManager");

const router = express.Router();

const productsPath = path.join(__dirname, "../data/products.json");
const productManager = new ProductManager(productsPath);

router.get("/", async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error leyendo productos" });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Error buscando producto" });
  }
});

// Crea prod con id autogenerado
router.post("/", async (req, res) => {
  try {
    const result = await productManager.addProduct(req.body);
    if (!result.ok) return res.status(400).json({ error: result.message });
    res.status(201).json(result.product);
  } catch (error) {
    res.status(500).json({ error: "Error creando producto" });
  }
});


router.put("/:pid", async (req, res) => {
  try {
    const result = await productManager.updateProduct(req.params.pid, req.body);
    if (!result.ok) return res.status(404).json({ error: result.message });
    res.json(result.product);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

// Elimina producto por id
router.delete("/:pid", async (req, res) => {
  try {
    const result = await productManager.deleteProduct(req.params.pid);
    if (!result.ok) return res.status(404).json({ error: result.message });
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando producto" });
  }
});

module.exports = router;
