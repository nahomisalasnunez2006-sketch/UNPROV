// Precios con oferta
// Todas las pantallas usan estas funciones para que el descuento se aplique igual en
// el catalogo, el carrito, el pago, la compra guardada y el comprobante
import type { Producto } from '@/types';

// La oferta cuenta solo si existe y su fecha de fin todavia no pasa
export function ofertaActiva(producto: Pick<Producto, 'oferta'>, ahora = Date.now()): boolean {
  return !!producto.oferta && new Date(producto.oferta.hasta).getTime() > ahora;
}

// Precio que realmente paga el cliente (redondeado a centavos)
export function precioFinal(producto: Pick<Producto, 'precio' | 'oferta'>, ahora = Date.now()): number {
  if (!ofertaActiva(producto, ahora) || !producto.oferta) return producto.precio;
  const conDescuento = producto.precio * (1 - producto.oferta.descuento / 100);
  return Math.round(conDescuento * 100) / 100;
}

// Cuanto se ahorra por pieza
export function ahorro(producto: Pick<Producto, 'precio' | 'oferta'>): number {
  return Math.round((producto.precio - precioFinal(producto)) * 100) / 100;
}

// Milisegundos que le quedan a la oferta (0 si ya termino)
export function tiempoRestante(producto: Pick<Producto, 'oferta'>, ahora = Date.now()): number {
  if (!producto.oferta) return 0;
  return Math.max(0, new Date(producto.oferta.hasta).getTime() - ahora);
}

// 93784000 ms -> "1d 02:03:04"  /  7384000 ms -> "02:03:04"
export function formatearCuentaRegresiva(ms: number): string {
  const totalSeg = Math.floor(ms / 1000);
  const dias = Math.floor(totalSeg / 86400);
  const horas = Math.floor((totalSeg % 86400) / 3600);
  const minutos = Math.floor((totalSeg % 3600) / 60);
  const segundos = totalSeg % 60;
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  const reloj = `${dosDigitos(horas)}:${dosDigitos(minutos)}:${dosDigitos(segundos)}`;
  return dias > 0 ? `${dias}d ${reloj}` : reloj;
}
