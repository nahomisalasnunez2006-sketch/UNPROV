// APIS NUEVAS: expo-print + expo-sharing
// Por que: en compras de mayoreo el cliente necesita un comprobante para su contabilidad
// expo-print convierte un HTML en un archivo PDF y expo-sharing abre el menu del telefono
// para guardarlo o mandarlo por WhatsApp, correo, Drive, etc.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatearFecha, formatearPrecio, referenciaCompra } from './formato';
import { esperandoPago, obtenerEtapa } from './envio';
import type { Compra, MetodoPago } from '@/types';

const NOMBRES_METODO: Record<MetodoPago, string> = {
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia SPEI',
  paypal: 'PayPal',
  efectivo: 'Pago contra entrega',
};

// Arma el HTML del comprobante (una tabla por tienda)
function htmlComprobante(compra: Compra): string {
  const metodo =
    compra.metodo === 'tarjeta' ? `Tarjeta •••• ${compra.ultimos4}` : NOMBRES_METODO[compra.metodo];

  const pedidos = compra.pedidos
    .map((p) => {
      const porConfirmar = esperandoPago(p);
      const estadoTexto = porConfirmar
        ? 'Pago por confirmar'
        : `${obtenerEtapa(p.envioEstado).titulo} · ${p.estado === 'pagado' ? 'Pago aceptado' : 'Pago al recibir'}`;
      // El codigo SOLO aparece cuando el pago esta aceptado (o es contra entrega)
      const bloqueCodigo = porConfirmar
        ? `<div class="pendiente">El código de entrega aparecerá cuando ${p.nombreTienda} confirme tu pago.</div>`
        : `<div class="codigo"><div class="etq">CÓDIGO DE ENTREGA</div><div class="num">${p.codigoEntrega
            .split('')
            .join(' ')}</div><div class="etq">El repartidor lo verifica en la app UNPROV: debe coincidir exactamente</div></div>`;
      return `
      <h3>${p.nombreTienda} <span class="estado">${estadoTexto}</span></h3>
      ${bloqueCodigo}
      <table>
        <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr>
        ${p.items
          .map(
            (i) =>
              `<tr><td>${i.nombre}</td><td>${i.cantidad}</td><td>${formatearPrecio(i.precio)}</td><td>${formatearPrecio(
                i.precio * i.cantidad
              )}</td></tr>`
          )
          .join('')}
        <tr class="sub"><td colspan="3">Envío</td><td>${p.envio === 0 ? 'Gratis' : formatearPrecio(p.envio)}</td></tr>
        <tr class="sub"><td colspan="3">Subtotal tienda</td><td>${formatearPrecio(p.subtotal + p.envio)}</td></tr>
      </table>`;
    })
    .join('');

  return `
  <html><head><meta charset="utf-8" />
  <style>
    body { font-family: Helvetica, Arial, sans-serif; color: #14213D; padding: 24px; }
    .marca { font-size: 28px; font-weight: 900; color: #208AEF; letter-spacing: 2px; }
    .meta { color: #6B7280; font-size: 12px; }
    h3 { margin-top: 24px; font-size: 16px; }
    .estado { font-size: 11px; color: #6B7280; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; background: #E6F2FE; padding: 6px; }
    td { padding: 6px; border-bottom: 1px solid #E3E8EF; }
    .sub td { font-weight: bold; }
    .total { margin-top: 24px; font-size: 20px; font-weight: 900; text-align: right; }
    .caja { background: #F5F7FA; padding: 12px; border-radius: 8px; font-size: 12px; margin-top: 12px; }
    .codigo { background: #0F1B33; color: white; text-align: center; padding: 10px; border-radius: 8px; margin: 8px 0; }
    .codigo .num { font-size: 30px; font-weight: 900; letter-spacing: 8px; margin: 4px 0; }
    .codigo .etq { font-size: 9px; letter-spacing: 1px; opacity: 0.7; }
    .pendiente { background: #FEF6E4; color: #B7791F; padding: 10px; border-radius: 8px; font-size: 12px; margin: 8px 0; }
  </style></head>
  <body>
    <div class="marca">UNPROV</div>
    <div class="meta">Unión de Proveedores · Comprobante de compra</div>
    <div class="caja">
      <b>Pedido:</b> ${referenciaCompra(compra.id)}<br/>
      <b>Fecha:</b> ${formatearFecha(compra.fecha)}<br/>
      <b>Pago:</b> ${metodo}<br/>
      <b>Entregar a:</b> ${compra.direccion.nombre}, ${compra.direccion.calle}, ${compra.direccion.colonia},
      C.P. ${compra.direccion.cp} · Tel. ${compra.direccion.telefono}
    </div>
    ${pedidos}
    <div class="total">Total: ${formatearPrecio(compra.total)}</div>
    <p class="meta">Documento generado por la app UNPROV (proyecto escolar). No es un comprobante fiscal.</p>
  </body></html>`;
}

// Hay algun pedido con codigo listo? (si todos esperan pago, todavia no hay comprobante)
export function comprobanteDisponible(compra: Compra): boolean {
  return compra.pedidos.some((p) => !esperandoPago(p));
}

// Genera el PDF y abre el menu de compartir
// 1) Intenta crear el archivo PDF (expo-print) y compartirlo (expo-sharing)
// 2) Si compartir no se puede, abre el dialogo de impresion del sistema,
//    donde tambien se puede elegir "Guardar como PDF"
// Regresa ok o el mensaje de error real para mostrarlo en pantalla
export async function compartirComprobante(compra: Compra): Promise<{ ok: boolean; error?: string }> {
  const html = htmlComprobante(compra);
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Comprobante ${referenciaCompra(compra.id)}`,
        UTI: 'com.adobe.pdf',
      });
      return { ok: true };
    }
  } catch {
    // seguimos con el plan B
  }
  try {
    await Print.printAsync({ html });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
