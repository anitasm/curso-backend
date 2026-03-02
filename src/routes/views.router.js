const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const productManager = req.app.get("productManager");
    const products = await productManager.getProducts();
    res.render("home", { title: "Home", products });
  } catch (error) {
    res.status(500).send("Error renderizando home");
  }
});

router.get("/realtimeproducts", async (req, res) => {
  try {
    const productManager = req.app.get("productManager");
    const products = await productManager.getProducts();
    res.render("realTimeProducts", { title: "Real Time Products", products });
  } catch (error) {
    res.status(500).send("Error renderizando vista en tiempo real");
  }
});

module.exports = router;