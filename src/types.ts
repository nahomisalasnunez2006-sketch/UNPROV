// Tipos de datos de la app UNPROV
// Definirlos en un solo lugar ayuda a que TypeScript detecte errores en todas las pantallas

export type CategoriaId = 'abarrotes' | 'limpieza' | 'papeleria' | 'electronica' | 'otros';

// Cada proveedor tiene una tienda con sus datos de cobro
export interface Tienda {
  id: string;
  nombre: string;
  titular: string; // a nombre de quien esta la cuenta
  banco: string;
  clabe: string; // 18 digitos
  paypal: string; // correo de PayPal (opcional, puede ir vacio)
}

export type NuevaTienda = Omit<Tienda, 'id'>;

// Oferta que pone el proveedor: un porcentaje de descuento hasta cierta fecha
export interface Oferta {
  descuento: number; // de 5 a 80 (%)
  hasta: string; // fecha ISO en que termina
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: CategoriaId;
  tiendaId: string; // a que tienda pertenece
  // string = foto tomada con la camara o galeria (uri)
  // number = imagen incluida dentro de la app con require (productos de ejemplo)
  imagen: string | number | null;
  oferta?: Oferta; // si no tiene, se vende a precio normal
  vendidos: number; // piezas vendidas (para la seccion "Lo mas vendido")
}

// Datos que llena el formulario (el id, la tienda, la oferta y los vendidos los pone el contexto)
export type NuevoProducto = Omit<Producto, 'id' | 'tiendaId' | 'oferta' | 'vendidos'>;

// En el carrito solo se guarda el id del producto y la cantidad
export interface ItemCarrito {
  productoId: string;
  cantidad: number;
}

// Copia de los datos del producto al momento de comprar
export interface ItemCompra {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export type MetodoPago = 'tarjeta' | 'transferencia' | 'paypal' | 'efectivo';
export type EstadoPago = 'pagado' | 'pendiente';

// Etapas del envio, en orden
export type EstadoEnvio = 'confirmado' | 'preparado' | 'enviado' | 'en_reparto' | 'entregado';

export interface EventoEnvio {
  estado: EstadoEnvio;
  fecha: string;
}

// Un punto de la firma dibujada en pantalla
export interface Punto {
  x: number;
  y: number;
}

// Como se confirmo la entrega: con el codigo que dio el cliente o con su firma
export interface Entrega {
  metodo: 'codigo' | 'firma';
  recibio: string; // nombre de quien recibio
  firma?: Punto[][]; // lista de trazos (solo si firmo)
  fecha: string;
}

export interface Direccion {
  nombre: string;
  telefono: string;
  calle: string;
  colonia: string;
  cp: string;
}

// Una compra se divide en un pedido por cada tienda (como en Amazon)
export interface PedidoTienda {
  id: string;
  tiendaId: string;
  nombreTienda: string;
  items: ItemCompra[];
  subtotal: number;
  envio: number; // costo de envio de esta tienda
  metodo: MetodoPago; // copia del metodo de la compra (para saber si espera confirmacion)
  estado: EstadoPago;
  pagoConfirmado?: string; // fecha en que el proveedor confirmo la transferencia o PayPal
  envioEstado: EstadoEnvio;
  historial: EventoEnvio[];
  codigoEntrega: string; // 4 digitos que el cliente le da al repartidor
  entrega?: Entrega;
}

export interface Compra {
  id: string;
  fecha: string;
  metodo: MetodoPago;
  ultimos4?: string; // solo se guardan los ultimos 4 digitos de la tarjeta
  direccion: Direccion;
  firmaReferencia: Punto[][]; // firma que el cliente da al comprar, para compararla al entregar
  pedidos: PedidoTienda[];
  subtotal: number;
  envio: number;
  total: number;
}
