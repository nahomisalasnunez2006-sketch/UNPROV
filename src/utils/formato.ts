// Funciones para mostrar precios y fechas de forma legible

// 1234.5 -> "$1,234.50"
export function formatearPrecio(valor: number): string {
  return `$${valor.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Fecha ISO -> "17 nov 2026, 10:30"
export function formatearFecha(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const dia = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${hora}`;
}

// Escribe "1 artículo" o "3 artículos"
export function textoArticulos(n: number): string {
  return `${n} ${n === 1 ? 'artículo' : 'artículos'}`;
}

// Concepto que el cliente pone en su transferencia para que la tienda identifique el pago
export function referenciaCompra(compraId: string): string {
  return `UNPROV-${compraId.slice(-6)}`;
}
