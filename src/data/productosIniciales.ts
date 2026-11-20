// Tiendas y productos de ejemplo para que el catalogo no arranque vacio
// Las CLABE son ficticias pero cumplen el digito verificador
import type { Producto, Tienda } from '@/types';

// Fecha ISO dentro de N dias (para que las ofertas de ejemplo siempre esten vigentes)
function enDias(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

// Id fijo de la tienda del usuario (Seccion Vendedor)
export const MI_TIENDA_ID = 'mi-tienda';

export const TIENDAS_INICIALES: Tienda[] = [
  {
    id: 't1',
    nombre: 'Granos del Norte',
    titular: 'Granos del Norte SA de CV',
    banco: 'BBVA',
    clabe: '012580001234567897',
    paypal: 'pagos@granosdelnorte.mx',
  },
  {
    id: 't2',
    nombre: 'Limpia Mayoreo',
    titular: 'Laura Méndez Treviño',
    banco: 'Banorte',
    clabe: '072580009876543211',
    paypal: '', // esta tienda no acepta PayPal
  },
  {
    id: 't3',
    nombre: 'TecnoSupply',
    titular: 'TecnoSupply Distribuciones',
    banco: 'Santander',
    clabe: '014580005556667770',
    paypal: 'ventas@tecnosupply.mx',
  },
];

export const PRODUCTOS_INICIALES: Producto[] = [
  {
    id: 'p1',
    nombre: 'Arroz súper extra 25 kg',
    descripcion: 'Bulto de arroz grano largo, ideal para tiendas de abarrotes y restaurantes.',
    precio: 520,
    stock: 30,
    categoria: 'abarrotes',
    tiendaId: 't1',
    imagen: null, // su foto se busca en imagenesEjemplo.ts por el id
    vendidos: 48,
  },
  {
    id: 'p2',
    nombre: 'Detergente líquido 20 L',
    descripcion: 'Garrafa de detergente multiusos con aroma a lavanda, rinde hasta 200 lavadas.',
    precio: 389.9,
    stock: 15,
    categoria: 'limpieza',
    tiendaId: 't2',
    imagen: null, // su foto se busca en imagenesEjemplo.ts por el id
    vendidos: 35,
    oferta: { descuento: 20, hasta: enDias(2) },
  },
  {
    id: 'p3',
    nombre: 'Cloro concentrado 10 L',
    descripcion: 'Blanqueador desinfectante para negocio, presentación garrafa de 10 litros.',
    precio: 145,
    stock: 25,
    categoria: 'limpieza',
    tiendaId: 't2',
    imagen: null, // su foto se busca en imagenesEjemplo.ts por el id
    vendidos: 12,
    oferta: { descuento: 30, hasta: enDias(0.5) },
  },
  {
    id: 'p4',
    nombre: 'Cable USB-C (paquete 10)',
    descripcion: 'Paquete de 10 cables USB-C de carga rápida, 1 metro, para reventa.',
    precio: 299,
    stock: 40,
    categoria: 'electronica',
    tiendaId: 't3',
    imagen: null, // su foto se busca en imagenesEjemplo.ts por el id
    vendidos: 61,
    oferta: { descuento: 15, hasta: enDias(5) },
  },
  {
    id: 'p5',
    nombre: 'Frijol negro 10 kg',
    descripcion: 'Costal de frijol negro seleccionado, cosecha nacional.',
    precio: 310,
    stock: 3,
    categoria: 'abarrotes',
    tiendaId: 't1',
    imagen: null, // su foto se busca en imagenesEjemplo.ts por el id
    vendidos: 22,
  },
  {
    id: 'p6',
    nombre: 'Aceite vegetal 20 L',
    descripcion: 'Bidón de aceite vegetal comestible para cocinas y fondas, rinde más que el de 1 L.',
    precio: 690,
    stock: 18,
    categoria: 'abarrotes',
    tiendaId: 't1',
    imagen: null, // su foto se busca en imagenesEjemplo.ts por el id
    vendidos: 40,
    oferta: { descuento: 25, hasta: enDias(1) },
  },
  {
    id: 'p7',
    nombre: 'Papel higiénico 48 rollos',
    descripcion: 'Paquete institucional de papel higiénico doble hoja para negocio u oficina.',
    precio: 259,
    stock: 50,
    categoria: 'limpieza',
    tiendaId: 't2',
    imagen: null, // su foto se busca en imagenesEjemplo.ts por el id
    vendidos: 73,
  },
  {
    id: 'p8',
    nombre: 'Audífonos Bluetooth (5 pzas)',
    descripcion: 'Lote de 5 audífonos inalámbricos con estuche de carga, ideal para reventa.',
    precio: 1250,
    stock: 12,
    categoria: 'electronica',
    tiendaId: 't3',
    imagen: null, // su foto se busca en imagenesEjemplo.ts por el id
    vendidos: 19,
    oferta: { descuento: 35, hasta: enDias(3) },
  },
];
