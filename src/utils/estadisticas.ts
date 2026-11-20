// Conteos de comprador y vendedor
// TODAS las pantallas (pestanas, Mi cuenta, Vender, Mis compras, Pedidos recibidos) usan estas
// funciones, asi los numeros siempre coinciden.
//
// Diferencia importante:
// - Una COMPRA es lo que se paga de una vez en el checkout
// - Un PEDIDO es la parte de esa compra que envia UNA tienda
//   Ej. una compra con productos de 2 tiendas = 1 compra y 2 pedidos
import { esperandoPago } from './envio';
import { ofertaActiva } from './precios';
import type { Compra, PedidoTienda, Producto } from '@/types';

export interface ResumenComprador {
  compras: number; // veces que se pago en el checkout
  pedidos: number; // pedidos (uno por tienda) de todas las compras
  porPagar: number; // esperan que la tienda confirme la transferencia o PayPal
  enCamino: number; // pago aceptado (o contra entrega) y todavia no se entregan
  entregados: number;
  activos: number; // porPagar + enCamino (los que todavia no terminan)
}

export function resumenComprador(compras: Compra[]): ResumenComprador {
  const pedidos = compras.flatMap((c) => c.pedidos);
  const porPagar = pedidos.filter((p) => esperandoPago(p)).length;
  const entregados = pedidos.filter((p) => p.envioEstado === 'entregado').length;
  const enCamino = pedidos.length - porPagar - entregados;
  return { compras: compras.length, pedidos: pedidos.length, porPagar, enCamino, entregados, activos: porPagar + enCamino };
}

export interface ResumenVendedor {
  productos: number;
  ofertasActivas: number;
  pedidos: number;
  porCobrar: number; // esperan que YO confirme que me llego el pago
  porAtender: number; // pagados (o contra entrega) en etapa confirmado o preparado
  enCamino: number; // enviados o en reparto
  entregados: number;
  pendientes: number; // porCobrar + porAtender (requieren que el vendedor haga algo)
  vendido: number; // suma de lo vendido (sin envio)
}

export function resumenVendedor(pedidosRecibidos: PedidoTienda[], misProductos: Producto[]): ResumenVendedor {
  const porCobrar = pedidosRecibidos.filter((p) => esperandoPago(p)).length;
  const sinCobrar = pedidosRecibidos.filter((p) => !esperandoPago(p));
  const porAtender = sinCobrar.filter((p) => p.envioEstado === 'confirmado' || p.envioEstado === 'preparado').length;
  const enCamino = sinCobrar.filter((p) => p.envioEstado === 'enviado' || p.envioEstado === 'en_reparto').length;
  const entregados = sinCobrar.filter((p) => p.envioEstado === 'entregado').length;
  return {
    productos: misProductos.length,
    ofertasActivas: misProductos.filter((p) => ofertaActiva(p)).length,
    pedidos: pedidosRecibidos.length,
    porCobrar,
    porAtender,
    enCamino,
    entregados,
    pendientes: porCobrar + porAtender,
    vendido: pedidosRecibidos.reduce((suma, p) => suma + p.subtotal, 0),
  };
}
