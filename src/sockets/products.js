function registerProductSocket(io, productsService) {
  io.on('connection', async socket => {
    try { socket.emit('productsUpdated', await productsService.getProducts({ paginate: false, sort: 'desc' })); }
    catch { socket.emit('errorMessage', 'No se pudo cargar la lista de productos'); }
  });
}
async function notifyProducts(io, productsService) {
  if (!io) return;
  try { io.emit('productsUpdated', await productsService.getProducts({ paginate: false, sort: 'desc' })); }
  catch {
    // A notification failure does not undo an already completed write.
    console.warn('Producto guardado; no se pudo notificar la actualización');
    try { io.emit('errorMessage', 'Catálogo actualizado; recargá la vista para ver los cambios'); } catch { /* disconnected transport */ }
  }
}
module.exports = { registerProductSocket, notifyProducts };
