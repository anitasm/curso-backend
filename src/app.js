const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { engine } = require("express-handlebars");

const ProductManager = require("./managers/ProductManager");
const productsRouter = require("./routes/products.router");
const cartsRouter = require("./routes/carts.router");
const viewsRouter = require("./routes/views.router");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const PORT = 8080;

const productsPath = path.join(__dirname, "data/products.json");
const productManager = new ProductManager(productsPath);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("io", io);
app.set("productManager", productManager);

app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", viewsRouter);

io.on("connection", async (socket) => {
  try {
    const products = await productManager.getProducts();
    socket.emit("productsUpdated", products);
  } catch (error) {
    socket.emit("errorMessage", "No se pudo cargar la lista de productos");
  }

  socket.on("addProduct", async (payload) => {
    try {
      const result = await productManager.addProduct(payload);
      if (!result.ok) {
        socket.emit("errorMessage", result.message);
        return;
      }

      const products = await productManager.getProducts();
      io.emit("productsUpdated", products);
    } catch (error) {
      socket.emit("errorMessage", "Error al agregar producto");
    }
  });

  socket.on("deleteProduct", async (pid) => {
    try {
      const result = await productManager.deleteProduct(pid);
      if (!result.ok) {
        socket.emit("errorMessage", result.message);
        return;
      }

      const products = await productManager.getProducts();
      io.emit("productsUpdated", products);
    } catch (error) {
      socket.emit("errorMessage", "Error al eliminar producto");
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
