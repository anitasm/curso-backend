# ShipNow | Catálogo y gestión de perfiles

Proyecto de backend para emprendimientos de accesorios, desarrollado como preentrega del **módulo 1 de Backend III**. Integra una API REST y una interfaz web, con **Rina** como tienda de ejemplo.

ShipNow propone una base para futuras funcionalidades logísticas. Esta etapa se concentra en productos, carritos y perfiles de usuario; no incluye envíos reales.

## Funcionalidades

- **Productos:** creación, consulta, edición y eliminación, con filtros, paginación e imágenes.
- **Catálogo en tiempo real:** actualización de la interfaz mediante Socket.io.
- **Carritos:** gestión de productos y cantidades, con cálculo de subtotales y total.
- **Usuarios:** gestión de perfiles, validación de email y control de duplicados.

## Tecnologías

Node.js, Express, MongoDB, Mongoose, Handlebars, Socket.io y Multer. El proyecto utiliza CommonJS y pruebas nativas de Node.js.

## Arquitectura

```text
Router → Controller → Service → Repository → Model / MongoDB
```

Los controllers gestionan las peticiones HTTP; los servicios validan y aplican reglas del negocio; los repositorios concentran el acceso a datos; los modelos definen esquemas e índices.

```text
src/
├── config/          # Configuración y conexión
├── constants/       # Roles y estados
├── controllers/     # Peticiones HTTP y vistas
├── middlewares/     # Archivos y errores
├── models/          # Product, Cart y User
├── repositories/    # Persistencia
├── routes/          # Rutas de la aplicación
├── services/        # Reglas del negocio
├── sockets/         # Eventos en tiempo real
├── public/          # Estilos, scripts e imágenes
├── views/           # Plantillas Handlebars
├── app.js           # Creación de la aplicación
└── server.js        # Conexión y arranque
test/                # Pruebas automatizadas
```

## Cambios de esta entrega

Se reorganizó la aplicación existente por capas, se incorporó el módulo Users y se adaptaron carritos, vistas y sockets para utilizar servicios. También se separó el arranque de la aplicación, se reforzaron las validaciones y se centralizó el manejo de errores.

Se conserva la interfaz Rina y los contratos principales del catálogo y los carritos. La disponibilidad de los productos se calcula a partir de su estado y stock, sin duplicarla en la base de datos.

## Ejecución

Desde la carpeta del proyecto, con la conexión a MongoDB configurada:

```powershell
npm.cmd ci
npm.cmd run dev
```

Para iniciar sin reinicio automático: `npm.cmd start`.

## Rutas principales

| Ruta | Función |
| --- | --- |
| `/api/products` | API de productos |
| `/api/users` | API de perfiles |
| `/api/carts` | API de carritos |
| `/products` | Catálogo y acceso al detalle de productos |
| `/realtimeproducts` | Gestión del catálogo en tiempo real |
| `/carts/:cid` | Vista de un carrito |

## Pruebas y alcance

```powershell
npm.cmd test
```

La suite cuenta con **18 pruebas aprobadas** que cubren validaciones, endpoints, carritos, vistas, imágenes, sockets y arranque. Las pruebas automatizadas utilizan dependencias de prueba y no requieren Atlas.


Repositorio de origen: [anitasm/curso-backend](https://github.com/anitasm/curso-backend).
