// Reglas de envio: costo, etapas del seguimiento y codigo de entrega
import type { IconName } from '@/constants/theme';
import type { EstadoEnvio, PedidoTienda } from '@/types';

// ===================== PAGO POR CONFIRMAR =====================
// Con transferencia o PayPal el dinero llega directo a la tienda, asi que SOLO el proveedor
// puede confirmar que lo recibio. Mientras tanto el pedido no avanza, no hay seguimiento,
// no se muestra el codigo de entrega y no se genera el comprobante
export function esperandoPago(pedido: Pick<PedidoTienda, 'estado' | 'metodo'>): boolean {
  return pedido.estado === 'pendiente' && (pedido.metodo === 'transferencia' || pedido.metodo === 'paypal');
}

// ===================== COSTO DE ENVIO =====================
// Cada tienda envia su parte por separado, asi que se cobra un envio por tienda:
//   tarifa base + un porcentaje del subtotal de esa tienda
//   y es GRATIS si el subtotal de la tienda llega al minimo
export const ENVIO_BASE = 49;
export const ENVIO_PORCENTAJE = 0.03; // 3 %
export const ENVIO_GRATIS_DESDE = 1500;

export function calcularEnvio(subtotalTienda: number): number {
  if (subtotalTienda <= 0 || subtotalTienda >= ENVIO_GRATIS_DESDE) return 0;
  const costo = ENVIO_BASE + subtotalTienda * ENVIO_PORCENTAJE;
  return Math.round(costo * 100) / 100; // redondeo a centavos
}

// Cuanto falta para que el envio de una tienda sea gratis
export function faltaParaEnvioGratis(subtotalTienda: number): number {
  return Math.max(0, ENVIO_GRATIS_DESDE - subtotalTienda);
}

// ===================== ETAPAS DEL SEGUIMIENTO =====================
export interface Etapa {
  id: EstadoEnvio;
  titulo: string; // lo que ve el cliente
  descripcion: string;
  accion: string; // texto del boton que ve el proveedor para llegar a esta etapa
  icon: IconName;
}

export const ETAPAS: Etapa[] = [
  {
    id: 'confirmado',
    titulo: 'Pedido confirmado',
    descripcion: 'La tienda recibió tu pedido',
    accion: 'Confirmar pedido',
    icon: 'receipt-outline',
  },
  {
    id: 'preparado',
    titulo: 'Preparado',
    descripcion: 'Tu pedido está empacado y listo',
    accion: 'Marcar como preparado',
    icon: 'cube-outline',
  },
  {
    id: 'enviado',
    titulo: 'Enviado',
    descripcion: 'Tu pedido va en camino a tu ciudad',
    accion: 'Marcar como enviado',
    icon: 'airplane-outline',
  },
  {
    id: 'en_reparto',
    titulo: 'Salió a entrega',
    descripcion: 'El repartidor va hacia tu domicilio',
    accion: 'Marcar que salió a entrega',
    icon: 'bicycle-outline',
  },
  {
    id: 'entregado',
    titulo: 'Entregado',
    descripcion: 'Recibiste tu pedido',
    accion: 'Confirmar entrega',
    icon: 'home-outline',
  },
];

export function indiceEtapa(estado: EstadoEnvio): number {
  return ETAPAS.findIndex((e) => e.id === estado);
}

export function obtenerEtapa(estado: EstadoEnvio): Etapa {
  return ETAPAS[indiceEtapa(estado)];
}

// Siguiente etapa, o null si ya se entrego
export function siguienteEtapa(estado: EstadoEnvio): Etapa | null {
  return ETAPAS[indiceEtapa(estado) + 1] ?? null;
}

// ===================== CODIGO DE ENTREGA =====================
// 4 digitos al azar, de 1000 a 9999
export function generarCodigoEntrega(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
