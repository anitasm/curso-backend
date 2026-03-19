const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");
const http = require("http");
const morgan = require("morgan");
const { Server } = require("socket.io");
const { engine } = require("express-handlebars");

const connectDB = require("./config/db");
const ProductManager = require("./managers/ProductManager");
const productsRouter = require("./routes/products.router");
const cartsRouter = require("./routes/carts.router");
const viewsRouter = require("./routes/views.router");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const PORT = Number(process.env.PORT) || 8080;
const productManager = new ProductManager();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
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
    const products = await productManager.getProducts({ paginate: false, sort: "desc" });
    socket.emit("productsUpdated", products);
  } catch (_error) {
    socket.emit("errorMessage", "No se pudo cargar la lista de productos");
  }
});

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No fue posible iniciar la aplicación:", error.message);
    process.exit(1);
  }
};

startServer();

