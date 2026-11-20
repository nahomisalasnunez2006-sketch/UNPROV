# UNPROV - Unión de Proveedores

## 1. Descripción del Proyecto
Marketplace móvil en **React Native (Expo SDK 58 + Expo Router + TypeScript)**. Varias tiendas (proveedores) publican sus productos con foto y precio; los compradores arman un solo carrito con productos de distintas tiendas y pagan con **tarjeta, transferencia SPEI o PayPal**. Cada compra se divide en un pedido por tienda, como en Amazon, con **costo de envío por tienda**, **seguimiento en tiempo real** y **entrega confirmada con código o firma**.

## 2. Participación del Equipo
- **Nahomi Salas Núñez:** Configuración del entorno en React Native con Expo, estructura del proyecto, alcances, wireframes (Home, Carrito y Menú), instalación de paquetes nativos e implementación de pantallas.
- **Carlos Josué Sosa López:** Conceptualización del flujo de usuarios, definición de arquitectura y componentes principales, investigación de APIs de pago/notificaciones para trabajo futuro y documento de presentación.

## 3. Cómo ejecutar

### 3.1 Instalar las APIs nuevas
```bash
npx expo install expo-image-picker expo-location expo-notifications expo-local-authentication expo-haptics expo-clipboard expo-print expo-sharing expo-sqlite
```
Después de instalar, reemplazar `src/`, `app.json` y agregar `eas.json` con los de esta entrega.

### 3.2 Probar en Expo Go
```bash
npx expo start -c
```

### 3.3 Generar el APK instalable (Android)
```bash
npm install -g eas-cli      # una sola vez
eas login                   # cuenta gratuita de expo.dev
eas init                    # liga el proyecto a la cuenta (agrega projectId en app.json)
eas build -p android --profile preview
```
El build se hace en los servidores de Expo (10–20 min). Al terminar da un **link y un QR para descargar el `.apk`**; en el teléfono hay que permitir "instalar apps de origen desconocido".

## 4. APIs nuevas y por qué se usan
Ninguna venía en la plantilla del proyecto; todas se agregaron para resolver una necesidad concreta de UNPROV.

| API | Para qué se usa en UNPROV | Por qué es necesaria | Dónde está |
|---|---|---|---|
| **expo-image-picker** | Tomar o elegir la foto del producto | Un marketplace sin fotos no genera confianza; el proveedor fotografía su mercancía desde el teléfono | `components/ImageSelector.tsx` |
| **expo-sqlite** (`kv-store`) | Guardar tiendas, productos, carrito, compras y envíos en el teléfono | Sin persistencia todo se borra al cerrar la app; una app instalable debe conservar los datos | `utils/almacenamiento.ts`, `context/TiendaContext.tsx` |
| **expo-location** | Botón "Usar mi ubicación actual" en el pago | Escribir la dirección a mano es lento y con errores; el GPS + `reverseGeocodeAsync` llena calle, colonia y C.P. | `app/checkout.tsx` |
| **expo-notifications** | Avisar al cliente cuando su pedido se confirma, avanza de etapa o se entrega; al tocarla abre el seguimiento | El cliente debe enterarse del estado de su envío sin tener la pantalla abierta (notificaciones locales, sin servidor) | `utils/notificaciones.ts`, `app/_layout.tsx` |
| **expo-local-authentication** | Pedir huella o rostro antes de pagar con tarjeta | Un pago debe autorizarlo el dueño del teléfono, igual que en las apps de bancos | `app/checkout.tsx` |
| **expo-haptics** | Vibración de éxito, error y aviso | Retroalimentación física: el usuario siente si el pago se aprobó, si hay un error o si cambió el envío | `utils/feedback.ts` |
| **expo-clipboard** | Copiar la CLABE o el correo PayPal | El cliente debe pegar 18 dígitos en su app bancaria; copiarlos evita equivocarse en uno | `components/DatosPagoTienda.tsx` |
| **expo-print** + **expo-sharing** | Generar y compartir el comprobante de compra en PDF | En compras de mayoreo el negocio necesita un comprobante para su control; se puede guardar o mandar por WhatsApp/correo | `utils/comprobante.ts` |

APIs de React Native que también se usan: `Share` (compartir datos de pago), `PanResponder` (firma con el dedo).

## 5. Estructura de rutas y carpetas

```
src/
  app/                          -> RUTAS (Expo Router)
    _layout.tsx                 -> Stack raíz + TiendaProvider
    (tabs)/
      _layout.tsx               -> TabBar: Inicio | Carrito | Menú
      index.tsx                 -> Home: grid, búsqueda, filtro por categoría y por tienda, botón "+"
      carrito.tsx               -> Carrito agrupado por tienda, - 1 +, COMPRAR TODO AHORA
      menu.tsx                  -> Menú (Usuario, Vendedor, Soporte)
    producto/[id].tsx           -> Detalle (ruta dinámica) + formas de pago de la tienda
    checkout.tsx                -> Dirección, envío por tienda, método de pago
    pedido/[id].tsx             -> Seguimiento del pedido (cliente): línea de tiempo y código
    ventas.tsx                  -> Pedidos recibidos (proveedor): avanzar etapas
    entrega/[id].tsx            -> Confirmar entrega con código o firma (proveedor)
    mi-tienda.tsx               -> Registro/edición de tienda y datos de cobro (modal)
    alta-producto.tsx           -> Formulario "Dar de alta producto" (modal)
    mis-productos.tsx           -> Productos de mi tienda + eliminar
    mis-compras.tsx             -> Historial con estado de pago por tienda
    favoritos.tsx               -> Wish List
  components/                   -> SearchBar, CategoryChips, ProductCard, AddProductCard, ProductImage,
                                   CartItem, QuantityControl, ImageSelector, FormField, MenuItem,
                                   EmptyState, PaymentOption, DatosPagoTienda, TiendaAvatar,
                                   EnvioTimeline, EnvioBadge, ResumenTotales, SignaturePad
  context/TiendaContext.tsx     -> Estado global (useState + Context)
  constants/theme.ts            -> Colores, categorías, bancos y métodos de pago
  data/productosIniciales.ts    -> Tiendas y productos de ejemplo
  utils/validaciones.ts         -> Producto, tienda (CLABE) y tarjeta (Luhn)
  utils/formato.ts              -> Precios, fechas y referencia de pago
  utils/envio.ts                -> Costo de envío, etapas del seguimiento, código de entrega
  utils/almacenamiento.ts       -> Guardar/cargar datos (expo-sqlite kv-store)
  utils/notificaciones.ts       -> Notificaciones locales (expo-notifications)
  utils/feedback.ts             -> Vibraciones con significado (expo-haptics)
  utils/comprobante.ts          -> Comprobante PDF (expo-print + expo-sharing)
  types.ts                      -> Tipos de TypeScript
```

## 6. Flujo de pago
| Método | Qué pasa |
|---|---|
| **Tarjeta** | Formulario validado (Luhn, vencimiento, CVV). "Procesando pago…", doble vibración y "¡Pago aprobado!". **Simulado**: solo se guardan los últimos 4 dígitos |
| **Transferencia SPEI** | Pedido **pendiente**; se muestra banco, titular, CLABE y monto de cada tienda (con botón Compartir) |
| **PayPal** | Igual, con el correo PayPal de cada tienda. Solo si todas las tiendas del carrito lo aceptan |
| **Contra entrega** | Se paga en efectivo al repartidor; queda pagado al confirmar la entrega |

## 7. Envío y seguimiento
- **Costo de envío por tienda:** $49 + 3 % del subtotal de esa tienda; **gratis** desde $1,500 por tienda. El checkout avisa cuánto falta para el envío gratis.
- **Etapas:** Pedido confirmado → Preparado → Enviado → Salió a entrega → Entregado.
- **Proveedor** (Menú → Pedidos recibidos): filtra por etapa y avanza cada pedido con un botón (vibra).
- **Cliente** (Mis compras → pedido): ve la línea de tiempo con fechas y su **código de entrega de 4 dígitos**. Si la etapa cambia con la pantalla abierta, el teléfono vibra.
- **Entrega:** el proveedor confirma con el **código** que le dicta el cliente o con la **firma** del cliente en pantalla. Al confirmar, el pedido queda **Entregado y Pagado** y el teléfono vibra.

## 8. Cumplimiento de la rúbrica

| Criterio | Implementación |
|---|---|
| **Funcionalidad** | **Lista:** catálogo, pedidos recibidos, compras. **Agregar:** alta de productos, registro de tienda, carrito y pedidos. **Eliminar:** productos propios y artículos del carrito, con confirmación. **Filtro:** búsqueda + tiendas + categorías en el catálogo, y filtro por etapa en Pedidos recibidos |
| **Navegación** | Stack raíz → grupo `(tabs)` con 3 pestañas (badge en Carrito) + rutas dinámicas `producto/[id]`, `pedido/[id]`, `entrega/[id]` + `checkout`, `ventas`, `mi-tienda` y `alta-producto` (modales), `mis-productos`, `mis-compras`, `favoritos` |
| **Manejo de estado** | `useState` en `TiendaContext`. Actualizaciones inmutables con spread, `filter` y `map` (incluso en datos anidados: compra → pedidos → historial de envío, con la función `actualizarPedido`). Props hacia abajo y callbacks hacia arriba. Totales, grupos por tienda y listas filtradas se derivan |
| **Formulario y validaciones** | Cinco formularios controlados: **producto**, **tienda** (CLABE con dígito verificador, PayPal), **dirección** (teléfono 10 dígitos, C.P. 5 dígitos, calle con número), **tarjeta** (Luhn, fecha, CVV) y **entrega** (código correcto o firma con trazo mínimo). Errores en rojo bajo cada campo |
| **UX** | Basado en los wireframes; banner, avatares de tiendas, sombras, línea de tiempo del envío, vista previa de tarjeta, pantalla de procesando, estados vacíos y etiquetas de color |
| **API del dispositivo** | 8 APIs nuevas: cámara/galería, ubicación (GPS), notificaciones, biometría, hápticos, portapapeles, PDF y almacenamiento local (ver sección 4) |

## 9. Datos de prueba
- Tarjeta: `4242 4242 4242 4242`, cualquier fecha futura, CVV `123`
- CLABE para registrar tu tienda: `002180700112233446`
- Dirección: cualquier nombre, teléfono de 10 dígitos, calle con número y C.P. de 5 dígitos

## 10. Guion de la demo (ver los dos lados en un solo teléfono)
1. Menú → Registrar mi tienda → Dar de alta producto (con foto).
2. Agregar al carrito tu producto y uno de otra tienda → Comprar → llenar dirección → **Contra entrega**.
3. Mis compras → abrir el pedido de tu tienda → anotar el **código de entrega**.
4. Menú → Pedidos recibidos → Preparado → Enviado → Salió a entrega (vibra en cada paso).
5. Confirmar entrega → escribir el código (o elegir Firma) → queda **Entregado y Pagado**.
6. Volver al seguimiento del cliente: línea de tiempo completa y firma guardada.

## 11. Alcances
**Sí hace:** varias tiendas, catálogo y filtros, favoritos, carrito multi-tienda con stock, envío por tienda, checkout con 4 métodos de pago simulados, seguimiento por etapas, panel de ventas del proveedor, entrega con código o firma, alta/baja de productos con foto.

**No hace (trabajo futuro):** cobros reales (Stripe), notificaciones push remotas/SMS/correo (Twilio, SendGrid), paqueterías reales y servidor con cuentas de usuario. Los datos se guardan en el teléfono (no hay servidor, así que no se comparten entre dispositivos).
