const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const ProductManager = require("../managers/ProductManager");

const router = express.Router();
const productManager = new ProductManager();
const uploadsDir = path.join(__dirname, "../public/img/uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

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

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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
  status: body.status === undefined ? true : body.status === true || String(body.status).toLowerCase() === "true",
  stock: Number(body.stock),
  category: String(body.category || "").trim(),
});

const buildPaginationLink = (req, page) => {
  const params = new URLSearchParams(req.query);
  params.set("page", page);
  return `${req.baseUrl}?${params.toString()}`;
};

router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    const result = await productManager.getProducts({
      limit: Number(limit) || 10,
      page: Number(page) || 1,
      sort,
      query,
    });

    res.json({
      status: "success",
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? buildPaginationLink(req, result.prevPage) : null,
      nextLink: result.hasNextPage ? buildPaginationLink(req, result.nextPage) : null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      payload: null,
      totalPages: 0,
      prevPage: null,
      nextPage: null,
      page: Number(req.query.page) || 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevLink: null,
      nextLink: null,
    });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.pid)) {
      return res.status(400).json({ status: "error", message: "ID de producto inválido" });
    }

    const product = await productManager.getProductById(req.params.pid);

    if (!product) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }

    res.json({ status: "success", payload: product });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error buscando producto" });
  }
});

router.post("/", (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    next();
    return;
  }

  upload.single("image")(req, res, (error) => {
    if (error) {
      res.status(400).json({ status: "error", message: error.message || "Error subiendo imagen" });
      return;
    }

    next();
  });
});

router.post("/", async (req, res) => {
  try {
    const productData = parseBody(req.body);
    const thumbnails = normalizeThumbnails(req.body.thumbnails);

    if (req.file) {
      thumbnails.push(`/img/uploads/${req.file.filename}`);
    }

    productData.thumbnails = thumbnails;

    const product = await productManager.createProduct(productData);
    const io = req.app.get("io");

    if (io) {
      const products = await productManager.getProducts({ paginate: false, sort: "desc" });
      io.emit("productsUpdated", products);
    }

    res.status(201).json({ status: "success", payload: product });
  } catch (error) {
    const isValidationError = error.name === "ValidationError" || error.code === 11000;
    res.status(isValidationError ? 400 : 500).json({
      status: "error",
      message: error.code === 11000 ? "El código del producto ya existe" : error.message || "Error creando producto",
    });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.pid)) {
      return res.status(400).json({ status: "error", message: "ID de producto inválido" });
    }

    const updates = { ...req.body };
    delete updates._id;

    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.status !== undefined) {
      updates.status = updates.status === true || String(updates.status).toLowerCase() === "true";
    }
    if (updates.thumbnails !== undefined) {
      updates.thumbnails = normalizeThumbnails(updates.thumbnails);
    }

    const product = await productManager.updateProduct(req.params.pid, updates);

    if (!product) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }

    res.json({ status: "success", payload: product });
  } catch (error) {
    const isValidationError = error.name === "ValidationError" || error.code === 11000;
    res.status(isValidationError ? 400 : 500).json({
      status: "error",
      message: error.code === 11000 ? "El código del producto ya existe" : error.message || "Error actualizando producto",
    });
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.pid)) {
      return res.status(400).json({ status: "error", message: "ID de producto inválido" });
    }

    const deletedProduct = await productManager.deleteProduct(req.params.pid);

    if (!deletedProduct) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }

    const io = req.app.get("io");
    if (io) {
      const products = await productManager.getProducts({ paginate: false, sort: "desc" });
      io.emit("productsUpdated", products);
    }

    res.json({ status: "success", payload: deletedProduct });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error eliminando producto" });
  }
});

module.exports = router;