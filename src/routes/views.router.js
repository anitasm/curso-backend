const express = require("express");
const mongoose = require("mongoose");

const ProductManager = require("../managers/ProductManager");
const CartManager = require("../managers/CartManager");

const router = express.Router();
const productManager = new ProductManager();
const cartManager = new CartManager();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildViewLink = (basePath, query, page) => {
  const params = new URLSearchParams(query);
  params.set("page", page);
  return `${basePath}?${params.toString()}`;
};

const mapProductForView = (product) => ({
  ...product,
  displayStatus: product.status ? "Disponible" : "No disponible",
  isAvailable: product.status && product.stock > 0,
  mainThumbnail: product.thumbnails?.[0] || null,
});

router.get("/", (_req, res) => {
  res.redirect("/products");
});

router.get("/products", async (req, res) => {
  try {
    const { limit = 8, page = 1, sort, query } = req.query;
    const result = await productManager.getProducts({
      limit: Number(limit) || 8,
      page: Number(page) || 1,
      sort,
      query,
    });

    res.render("products", {
      title: "Productos",
      products: result.docs.map(mapProductForView),
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage ? buildViewLink("/products", req.query, result.prevPage) : null,
        nextLink: result.hasNextPage ? buildViewLink("/products", req.query, result.nextPage) : null,
      },
      filters: {
        query: query || "",
        sortAscSelected: sort === "asc" ? "selected" : "",
        sortDescSelected: sort === "desc" ? "selected" : "",
        limit,
      },
    });
  } catch (error) {
    res.status(500).send("Error renderizando productos");
  }
});

router.get("/products/:pid", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.pid)) {
      return res.status(400).send("ID de producto inválido");
    }

    const product = await productManager.getProductById(req.params.pid);

    if (!product) {
      return res.status(404).send("Producto no encontrado");
    }

    res.render("productDetail", {
      title: product.title,
      product: mapProductForView(product),
    });
  } catch (error) {
    res.status(500).send("Error renderizando detalle del producto");
  }
});

router.get("/carts/:cid", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.cid)) {
      return res.status(400).send("ID de carrito inválido");
    }

    const cart = await cartManager.getCartById(req.params.cid);

    if (!cart) {
      return res.status(404).send("Carrito no encontrado");
    }

    const products = cart.products.map((item) => {
      const product = item.product;
      const subtotal = product ? product.price * item.quantity : 0;

      return {
        ...item,
        product,
        quantity: item.quantity,
        subtotal,
        mainThumbnail: product?.thumbnails?.[0] || null,
      };
    });

    const total = products.reduce((acc, item) => acc + item.subtotal, 0);

    res.render("cartDetail", {
      title: `Carrito ${cart.id}`,
      cart: {
        ...cart,
        products,
      },
      hasProducts: products.length > 0,
      total,
    });
  } catch (error) {
    res.status(500).send("Error renderizando carrito");
  }
});

router.get("/realtimeproducts", async (_req, res) => {
  try {
    const products = await productManager.getProducts({ paginate: false, sort: "desc" });
    res.render("realTimeProducts", { title: "Real Time Products", products });
  } catch (error) {
    res.status(500).send("Error renderizando vista en tiempo real");
  }
});

module.exports = router;