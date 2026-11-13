const http = require('node:http');
const { Server } = require('socket.io');
const { loadConfig } = require('./config/env.config');
const { connectDB, disconnectDB } = require('./config/db');
const createApp = require('./app');
const { registerProductSocket } = require('./sockets/products');
async function startServer() {
  let server;
  try {
    const config = loadConfig();
    // Compose only after validation. Tests explicitly inject their own repositories.
    const ProductsRepository = require('./repositories/products.repository');
    const UsersRepository = require('./repositories/users.repository');
    const CartsRepository = require('./repositories/carts.repository');
    const ProductsService = require('./services/products.service');
    const UsersService = require('./services/users.service');
    const CartsService = require('./services/carts.service');
    const productsService = new ProductsService(new ProductsRepository());
    const usersService = new UsersService(new UsersRepository());
    const cartsService = new CartsService(new CartsRepository(), productsService);
    await connectDB(config.mongoUri);
    // Wait for the unique indexes before accepting writes.
    await Promise.all([new ProductsRepository().initialize(), new UsersRepository().initialize()]);
    const app = createApp({ productsService, usersService, cartsService });
    server = http.createServer(app);
    const io = new Server(server);
    app.set('io', io);
    registerProductSocket(io, productsService);
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.port, resolve); });
    server.on('error', () => { console.error('Error del servidor HTTP'); process.exitCode = 1; server.close(); void disconnectDB(); });
    console.log('ShipNow / Rina escuchando en http://localhost:' + config.port);
    return { app, server, io };
  } catch (error) {
    const message = error.message.startsWith('Configuración inválida:') || error.message.startsWith('No se pudo conectar') ? error.message : error.code === 'EADDRINUSE' ? 'El puerto configurado está ocupado' : 'No se pudo iniciar la aplicación';
    console.error(message);
    if (server) server.close();
    await disconnectDB();
    process.exitCode = 1;
  }
}
if (require.main === module) void startServer();
module.exports = { startServer };
