const express = require("express");
const path = require("path");
const multer = require("multer");
const ProductManager = require("../managers/ProductManager");

const router = express.Router();

const productsPath = path.join(__dirname, "../data/products.json");
const fallbackProductManager = new ProductManager(productsPath);

const uploadsDir = path.join(__dirname, "../public/img/uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const sanitizedOriginalName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "");

    cb(null, `${Date.now()}-${sanitizedOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Solo se permiten archivos de imagen"));
      return;
    }
    cb(null, true);
  },
});

const getProductManager = (req) => req.app.get("productManager") || fallbackProductManager;

const normalizeThumbnails = (raw) => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(raw)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBody = (body) => ({
  title: String(body.title || "").trim(),
  description: String(body.description || "").trim(),
  code: String(body.code || "").trim(),
  price: Number(body.price),
  status: body.status === true || String(body.status).toLowerCase() === "true",
  stock: Number(body.stock),
  category: String(body.category || "").trim(),
});

router.get("/", async (req, res) => {
  try {
    const products = await getProductManager(req).getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error leyendo productos" });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const product = await getProductManager(req).getProductById(req.params.pid);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Error buscando producto" });
  }
});

router.post("/", (req, res, next) => {
  const isMultipart = req.is("multipart/form-data");
  if (!isMultipart) {
    next();
    return;
  }

  upload.single("image")(req, res, (error) => {
    if (error) {
      const status = error instanceof multer.MulterError ? 400 : 400;
      res.status(status).json({ error: error.message || "Error subiendo imagen" });
      return;
    }
    next();
  });
});

router.post("/", async (req, res) => {
  try {
    const productManager = getProductManager(req);
    const productData = parseBody(req.body);

    const thumbnails = normalizeThumbnails(req.body.thumbnails);
    if (req.file) {
      thumbnails.push(`/img/uploads/${req.file.filename}`);
    }

    productData.thumbnails = thumbnails;

    const result = await productManager.addProduct(productData);
    if (!result.ok) return res.status(400).json({ error: result.message });

    const io = req.app.get("io");
    const products = await productManager.getProducts();
    if (io) io.emit("productsUpdated", products);

    res.status(201).json(result.product);
  } catch (error) {
    res.status(500).json({ error: "Error creando producto" });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    const result = await getProductManager(req).updateProduct(req.params.pid, req.body);
    if (!result.ok) return res.status(404).json({ error: result.message });
    res.json(result.product);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    const productManager = getProductManager(req);
    const result = await productManager.deleteProduct(req.params.pid);
    if (!result.ok) return res.status(404).json({ error: result.message });

    const io = req.app.get("io");
    const products = await productManager.getProducts();
    if (io) io.emit("productsUpdated", products);

    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando producto" });
  }
});

module.exports = router;
