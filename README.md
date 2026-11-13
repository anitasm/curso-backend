# ShipNow · Backend III, módulo 1

Preentrega académica para emprendimientos de indumentaria y accesorios. **Rina** se conserva como tienda de ejemplo. Esta etapa implementa catálogo, carritos y perfiles; prepara una base para futuras funcionalidades logísticas. No existen envíos reales ni integración con una empresa, API o SDK externo llamado ShipNow.

Origen: [anitasm/curso-backend](https://github.com/anitasm/curso-backend.git). Rama de trabajo: `feature/backend-iii-modulo-1`.

## Instalación en Windows 10 / PowerShell

Objetivo del curso: **Node.js 24 LTS**. Esta entrega se desarrolló y probó con la versión instalada **Node v26.13.0 / npm 11.20.0**, sin instalar programas ni modificar configuración global. La ejecución específica en Node 24 queda pendiente.

```powershell
Set-Location C:\Users\ana_s\curso-backend
node --version
npm.cmd --version
npm.cmd ci
# Solo cuando todavía NO existe .env:
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Abrí `.env` desde el explorador de VS Code. Si ya tenés una conexión funcionando, **renombrá únicamente la clave `MONGO_URI` a `MONGODB_URI`, conservando su valor en tu editor**. No copies la URI a un chat ni al README. Completá también `PORT` y `NODE_ENV` si faltan. Esta tarea no modifica tu `.env`.

El archivo público `.env.example` contiene exactamente:

```dotenv
PORT=8080
NODE_ENV=development
MONGODB_URI=
```

En Atlas, utilizá un usuario de base de datos con acceso a la base elegida, habilitá la IP de tu equipo y completá localmente la cadena de conexión con un nombre de base explícito. Una URI con formato válido no garantiza conectividad. Para pruebas manuales que escriban datos, usá exclusivamente una base separada, por ejemplo `shipnow_modulo1_test`, nunca la base que contiene tu catálogo histórico.

Las tres variables son obligatorias. `PORT` debe contener únicamente dígitos, entre 1 y 65535; `NODE_ENV` acepta `development`, `test` o `production`; `MONGODB_URI` comienza con `mongodb://` o `mongodb+srv://` y no admite espacios ni contenido vacío. No hay valores de respaldo ni compatibilidad silenciosa con el nombre anterior.

`env.config.js` carga `.env` desde la raíz real del proyecto, sin sobrescribir variables del proceso. Si ya definiste una variable en PowerShell, esa variable tiene prioridad, incluso si está vacía. No se imprimen valores de configuración sensibles.

```powershell
npm.cmd run dev
# Alternativa sin Nodemon:
npm.cmd start
# En otra terminal, pruebas independientes de Atlas:
npm.cmd test
Invoke-RestMethod http://localhost:8080/api/products
```

`npm.cmd` evita el problema de `npm.ps1` bloqueado sin cambiar políticas de ejecución. También podés usar `npm run dev`, `npm start` y `npm test` si tu terminal lo permite. Nodemon es una dependencia local.

## Arquitectura y decisiones

```text
Router -> Controller -> Service -> Repository -> Model / MongoDB
```

- **Router:** paths, middleware HTTP y métodos del controller.
- **Controller:** adapta `req`/`res`, construye links, renderiza o responde y deriva errores a `next` mediante `try/catch` para Express 4.
- **Service:** valida entradas y aplica reglas. Products genera el código y calcula disponibilidad; Users asigna el rol permitido; Carts calcula subtotales y total. No conoce Express, modelos ni Mongoose. Recibe un repositorio por constructor.
- **Repository:** encapsula filtros, proyecciones públicas, `lean`, normalización de `_id`/`id`, paginación y opciones de escritura. Traduce errores de persistencia a `AppError`.
- **Model:** esquema, restricciones e índices. Se mantienen `Product`, `Cart` y sus colecciones; se agrega `User`.

`src/config/db.js` también importa Mongoose porque es el adaptador de infraestructura encargado de conectar y desconectar. Es la excepción de infraestructura a la expresión “Repository conoce MongoDB”; no contiene decisiones del negocio ni handlers HTTP.

`src/app.js` exporta `createApp({ productsService, usersService, cartsService, upload?, io? })`: importarlo no carga configuración ni conecta ni escucha. `src/server.js` valida configuración, compone dependencias reales, conecta, espera los índices únicos e inicia HTTP + Socket.io. Fallas de configuración, conexión, índices o listener terminan con código no cero y mensajes sin credenciales. Los repositorios falsos existen solo en `test`, inyectados explícitamente: no hay persistencia en memoria como alternativa de producción.

Se retiraron `ProductManager` y `CartManager`; no existe una segunda implementación activa. CommonJS, Express 4, Mongoose 9, Handlebars, recursos y fotos históricas se conservan.

## Products

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/products` | Lista paginada |
| GET | `/api/products/:pid` | Detalle |
| POST | `/api/products` | Alta JSON o multipart, 201 |
| PUT | `/api/products/:pid` | Actualización parcial |
| DELETE | `/api/products/:pid` | Elimina el producto |

Las rutas también aceptan barra final. IDs: 24 caracteres hexadecimales. Se conservan `_id` y alias `id` de string, campos actuales y timestamps.

Campos obligatorios al crear: `title`, `description`, `category` (texto recortado no vacío), `price` (número finito >= 0), `stock` (entero seguro >= 0). `status` es booleano, con default `true` solo si está ausente. Acepta también las cadenas exactas `true` y `false` de formularios. Se admiten números decimales de formulario con conversión estricta; no se admiten booleanos, `null`, texto vacío, negativos ni sufijos como `12abc`. `thumbnails` acepta arreglo de strings o texto separado por comas; por defecto `[]`.

Los campos desconocidos y operadores MongoDB se rechazan. `code`, `_id`, `id`, `createdAt` y `updatedAt` no son editables ni se reciben en el alta. `PUT` vacío da 400. El código se genera en el servicio con segmentos del título/categoría y sufijo aleatorio; reintenta solo colisiones de código, hasta cinco intentos. El índice único es la garantía final ante carreras, no una consulta previa `exists`.

`PRODUCT_STATUS` está congelado y se usa en `availability`, que no se guarda en MongoDB:

| Condición | availability |
| --- | --- |
| `status=false` | `inactive` |
| `status=true`, `stock=0` | `out_of_stock` |
| `status=true`, `stock>0` | `available` |

`status` sigue siendo booleano. No se ocultan automáticamente productos sin stock.

Parámetros del listado:

- `page`: entero positivo, default 1.
- `limit`: entero positivo, default 10; **más de 100 devuelve 400**, no se recorta silenciosamente.
- `sort`: `asc` o `desc` por precio; desempate por `_id`. Sin orden explícito: creación descendente y `_id`.
- `query`: categoría exacta sin distinguir mayúsculas; caracteres regex se escapan. `query=true` y `query=false` filtran el booleano `status`.

No se aceptan filtros ni ordenamientos arbitrarios. `paginate:false` es una opción interna de servicios para las vistas de gestión y sockets, no un parámetro HTTP.

Envelope conservado:

```json
{
  "status": "success",
  "payload": [],
  "totalPages": 1,
  "prevPage": null,
  "nextPage": null,
  "page": 1,
  "hasPrevPage": false,
  "hasNextPage": false,
  "prevLink": null,
  "nextLink": null
}
```

Ejemplo completo en PowerShell, **solo contra tu base separada de prueba**:

```powershell
$base = 'http://localhost:8080'
$productBody = @{
  title = 'Aro de prueba Rina'
  description = 'Accesorio académico de acero'
  price = 1200.50
  stock = 3
  category = 'Accesorios'
  status = $true
  thumbnails = @('/img/imagen-dos.jpeg')
} | ConvertTo-Json
$product = (Invoke-RestMethod "$base/api/products" -Method Post -ContentType 'application/json' -Body $productBody).payload
Invoke-RestMethod "$base/api/products?limit=10&page=1&sort=asc&query=Accesorios"
Invoke-RestMethod "$base/api/products/$($product.id)"
Invoke-RestMethod "$base/api/products/$($product.id)" -Method Put -ContentType 'application/json' -Body '{"stock":0}'
Invoke-RestMethod "$base/api/products/$($product.id)" -Method Delete
```

Multipart conserva campo `image`, máximo **2 MB**, MIME declarado `image/*` y URL pública `/img/uploads`. Ejemplo, si `curl.exe` está disponible (reemplazá la ruta por una imagen local):

```powershell
curl.exe -X POST http://localhost:8080/api/products -F 'title=Aro de prueba' -F 'description=Acero' -F 'price=1200' -F 'stock=2' -F 'category=Accesorios' -F 'status=true' -F 'image=@C:/ruta/imagen.png'
```

Multer está fuera del router. Si falla el alta tras subir una imagen, se elimina exclusivamente el archivo generado para esa petición. No se eliminan fotos históricas ni archivos indicados por el cliente; borrar un producto tampoco borra su imagen. El filtro MIME es básico, no un análisis del contenido del archivo.

Socket.io conserva `productsUpdated` y `errorMessage`. La carga inicial y las notificaciones usan el servicio. Crear, editar o eliminar exitosamente provoca una actualización; una notificación fallida después de guardar no convierte la escritura en error ni la repite.

## Users: perfiles académicos

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/users?page=1&limit=10` | Lista paginada; máximo 100 |
| GET | `/api/users/:uid` | Perfil |
| POST | `/api/users` | Alta, 201 |
| PUT | `/api/users/:uid` | Actualización parcial |
| DELETE | `/api/users/:uid` | Elimina perfil |

Campos permitidos: `firstName`, `lastName`, `email`. Son obligatorios y no vacíos al crear. Email se recorta, normaliza a minúsculas y valida con formato razonable; tiene índice único y los duplicados, incluidos conflictos concurrentes, devuelven 409.

`USER_ROLES = Object.freeze({ ADMIN: 'admin', USER: 'user' })` es la única fuente de roles. Las altas asignan `USER`. Se rechaza **cualquier campo `role` recibido por HTTP**, incluso `user`, tanto en POST como en PUT. ADMIN se reserva para futuras etapas y fixtures controlados. También se rechazan password, tokens y otros campos no soportados. No se permiten actualizaciones vacías.

**Guardar un rol no implementa permisos. No hay autenticación ni autorización.** No usar esta preentrega como plataforma pública con perfiles reales. No hay login, contraseñas, JWT u OAuth.

```powershell
$userBody = @{
  firstName = 'Perfil'
  lastName = 'Ejemplo'
  email = 'perfil@example.test'
} | ConvertTo-Json
$user = (Invoke-RestMethod "$base/api/users" -Method Post -ContentType 'application/json' -Body $userBody).payload
Invoke-RestMethod "$base/api/users?limit=10&page=1"
Invoke-RestMethod "$base/api/users/$($user.id)"
Invoke-RestMethod "$base/api/users/$($user.id)" -Method Put -ContentType 'application/json' -Body '{"lastName":"Actualizado"}'
Invoke-RestMethod "$base/api/users/$($user.id)" -Method Delete
```

## Carritos y vistas conservados

| Método | Ruta | Acción |
| --- | --- | --- |
| POST | `/api/carts` | Crea carrito vacío |
| GET | `/api/carts/:cid` | Lee con `populate(products.product)` |
| POST | `/api/carts/:cid/product/:pid` | Agrega una unidad |
| DELETE | `/api/carts/:cid/products/:pid` | Quita producto |
| PUT | `/api/carts/:cid` | Reemplaza productos |
| PUT | `/api/carts/:cid/products/:pid` | Cambia cantidad |
| DELETE | `/api/carts/:cid` | Vacía productos; conserva el documento |

Reemplazo admite un arreglo raíz `[{"product":"ID_HEXADECIMAL_DE_24_CARACTERES","quantity":2}]` o `{ "products": [...] }`. Cantidades: enteros >=1. El alta de una unidad comprueba el producto mediante ProductsService. Como en la implementación previa, el reemplazo valida IDs y cantidades pero no agrega una nueva regla de existencia para cada referencia. No se reservan ni descuentan existencias. Productos eliminados pueden aparecer como `null` por populate; el servicio asigna subtotal cero y la vista indica “Producto eliminado”.

Vistas: `/` redirige a `/products`; se conservan `/products`, `/products/:pid`, `/carts/:cid` y `/realtimeproducts`. El listado visual usa ocho productos por defecto. Se conserva `rina_cart_id` en localStorage. Totales y subtotales están en CartsService; etiquetas y links, en ViewsController. Los cálculos no son un sistema de cobro ni de contabilidad.

## Respuestas y errores

Operaciones individuales: `{ "status": "success", "payload": ... }`. Errores: `{ "status": "error", "message": "..." }`.

| Código | Situación |
| --- | --- |
| 200 | Lectura, edición o eliminación exitosa |
| 201 | Alta exitosa |
| 400 | ID, campos, números, query, JSON o archivo inválido |
| 404 | Recurso o ruta ausente |
| 409 | Clave única duplicada |
| 500 | Fallo interno o de persistencia |

No se exponen stacks ni mensajes crudos del driver. Cambio deliberado: el listado inválido ahora responde 400 con este envelope de error, en lugar del 500 con paginación vacía anterior. Entradas antes convertidas silenciosamente (status desconocido, números inválidos, código inmutable) ahora se rechazan. `availability` es aditivo; no reemplaza `status`.

## Pruebas y verificación

```powershell
npm.cmd test
```

Se utiliza `node:test`, `node:assert/strict`, HTTP/fetch y FormData nativos. **No se agregaron dependencias**, ni Supertest. Los archivos temporales de multipart se crean en una carpeta de prueba del sistema y se eliminan sin tocar imágenes del repositorio.

Cobertura: reglas de Products con repositorios falsos; CRUD HTTP Products/Users; roles, email y duplicados; filtros, links y límites; traducción de errores e índices de modelos sin DB; carritos y vistas con referencias eliminadas; multipart exitoso y limpieza en error; handlers de sockets y handshake real de Socket.io en localhost; validación pura, procesos hijos con variables vacías/incorrectas, importación de app sin efectos, fallo de conexión simulado y puerto ocupado.

Verificación realizada en esta entrega:

- `npm.cmd ls --depth=0`: dependencias instaladas verificadas; se conservan las versiones mayores.
- `npm.cmd install --package-lock-only --ignore-scripts`: lockfile generado por npm, sin editarlo manualmente.
- `npm.cmd test`: 18 pruebas aprobadas, 0 fallas; suite independiente de Atlas. El sandbox inicialmente bloqueó localhost con EACCES; se ejecutó con permiso fuera del sandbox.
- Revisión de imports: Mongoose solo en modelos y adaptador de conexión; imports de modelos solo en repositories. `process.env` y dotenv solo en `env.config.js` dentro de código productivo.
- `.env` y variantes locales ignorados; `.env.example` y `package-lock.json` versionables.

**Pendiente:** integración con MongoDB/Atlas real y ejecución específica en Node 24. No se configuró ni se utilizó una base de prueba real; las pruebas de repositorios con modelos interceptados no demuestran conectividad, índices efectivos ni carreras en Atlas. Antes de validar escrituras reales, configurá localmente una URI con base explícita de prueba y ejecutá los ejemplos. No hay scripts de limpieza de base, drops ni seeds automáticos.

## Cumplimiento del módulo

| Requisito | Archivos |
| --- | --- |
| Configuración centralizada y validación pura | `src/config/env.config.js`, `.env.example` |
| App importable y arranque separado | `src/app.js`, `src/server.js`, `src/config/db.js` |
| Constantes congeladas | `src/constants/index.js` |
| Products por capas | `src/routes/products.router.js`, `src/controllers/products.controller.js`, `src/services/products.service.js`, `src/repositories/products.repository.js`, `src/models/Product.js` |
| Users por capas | `src/routes/users.router.js`, `src/controllers/users.controller.js`, `src/services/users.service.js`, `src/repositories/users.repository.js`, `src/models/User.js` |
| Carritos compatibles | `src/routes/carts.router.js`, `src/controllers/carts.controller.js`, `src/services/carts.service.js`, `src/repositories/carts.repository.js`, `src/models/Cart.js` |
| Vistas y sockets por servicios | `src/controllers/views.controller.js`, `src/routes/views.router.js`, `src/sockets/products.js` |
| Multipart y limpieza acotada | `src/middlewares/upload.js`, `src/controllers/products.controller.js` |
| Errores y validaciones | `src/errors/AppError.js`, `src/middlewares/errors.js`, `src/utils/validation.js`, `src/repositories/persistence.js` |
| Paginación HTTP | `src/utils/presentation.js` |
| Pruebas aisladas y regresión | `test/products.test.js`, `test/http.test.js`, `test/config.test.js`, `test/repositories.test.js`, `test/sockets.test.js`, `test/helpers/` |
| Instalación reproducible | `package.json`, `package-lock.json`, `.gitignore` |

## Historia y alcance

Backend I aportó el catálogo y carritos iniciales con JSON, luego vistas y tiempo real. Los archivos de `src/data` se conservan como material legado: **no son persistencia activa ni se importan automáticamente a MongoDB**. Los datos de Atlas no forman parte del ZIP del repositorio.

Esta preentrega no agrega pedidos, pagos, tarifas, transportistas, repartidores, SDK, Docker, Swagger ni logging avanzado. La gestión de carritos conserva la funcionalidad académica y no ofrece garantías transaccionales de inventario. La vista de gestión y la carga inicial del socket siguen listando todo el catálogo, apropiado al alcance actual, sin implementar escalabilidad de una plataforma de producción.

Para revisar la entrega localmente: `git status --short`, `git diff --stat` y `git diff`. Los archivos nuevos aparecen como no rastreados hasta que decidas agregarlos; revisalos también en el editor. No se hicieron commits, push ni publicaciones.
