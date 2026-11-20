// Mis compras (vista del CLIENTE): cada compra con sus pedidos por tienda
// Al tocar un pedido se abre su seguimiento, EXCEPTO si espera que la tienda confirme el pago:
// en ese caso solo se muestran los datos para pagar (el cliente no puede cambiar el estado)
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, METODOS_PAGO, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { formatearFecha, formatearPrecio, referenciaCompra } from '@/utils/formato';
import EnvioBadge from '@/components/EnvioBadge';
import TiendaAvatar from '@/components/TiendaAvatar';
import ResumenTotales from '@/components/ResumenTotales';
import EmptyState from '@/components/EmptyState';
import { compartirComprobante, comprobanteDisponible } from '@/utils/comprobante';
import { esperandoPago } from '@/utils/envio';
import { resumenComprador } from '@/utils/estadisticas';
import DatosPagoTienda from '@/components/DatosPagoTienda';
import type { Compra } from '@/types';
import { conToque, vibrarSeleccion } from '@/utils/feedback';

export default function MisComprasScreen() {
  const router = useRouter();
  const { compras, obtenerTienda } = useTienda();

  const textoMetodo = (compra: Compra) => {
    if (compra.metodo === 'tarjeta') return `Tarjeta •••• ${compra.ultimos4}`;
    return METODOS_PAGO.find((m) => m.id === compra.metodo)?.label ?? compra.metodo;
  };

  // expo-print genera el PDF y expo-sharing abre el menu para guardarlo o enviarlo
  const descargar = async (compra: Compra) => {
    vibrarSeleccion();
    const resultado = await compartirComprobante(compra);
    if (!resultado.ok) Alert.alert('No se pudo generar el PDF', resultado.error);
  };

  const r = resumenComprador(compras);

  return (
    <FlatList
      data={compras}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        compras.length > 0 ? (
          <View style={styles.resumen}>
            <Text style={styles.textoResumen}>
              {r.compras} {r.compras === 1 ? 'compra' : 'compras'} · {r.pedidos} {r.pedidos === 1 ? 'pedido' : 'pedidos'}{' '}
              (uno por tienda)
            </Text>
            <View style={styles.filaResumen}>
              <View style={[styles.chipResumen, { backgroundColor: COLORS.warningLight }]}>
                <Text style={[styles.textoChip, { color: COLORS.warning }]}>{r.porPagar} por pagar</Text>
              </View>
              <View style={[styles.chipResumen, { backgroundColor: COLORS.primaryLight }]}>
                <Text style={[styles.textoChip, { color: COLORS.primaryDark }]}>{r.enCamino} en camino</Text>
              </View>
              <View style={[styles.chipResumen, { backgroundColor: COLORS.accentLight }]}>
                <Text style={[styles.textoChip, { color: COLORS.accent }]}>{r.entregados} entregados</Text>
              </View>
            </View>
          </View>
        ) : null
      }
      renderItem={({ item: compra }) => {
        const metodo = METODOS_PAGO.find((m) => m.id === compra.metodo);
        return (
          <View style={styles.tarjeta}>
            <View style={styles.encabezado}>
              <View style={styles.iconoMetodo}>
                <Ionicons name={metodo?.icon ?? 'receipt-outline'} size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fecha}>{formatearFecha(compra.fecha)}</Text>
                <Text style={styles.meta}>
                  {textoMetodo(compra)} · {referenciaCompra(compra.id)}
                </Text>
              </View>
            </View>

            {compra.pedidos.map((pedido) => {
              const piezas = pedido.items.reduce((s, i) => s + i.cantidad, 0);
              const pagado = pedido.estado === 'pagado';
              const tienda = obtenerTienda(pedido.tiendaId);

              // Pago por confirmar: sin seguimiento, solo datos para pagar
              if (esperandoPago(pedido)) {
                return (
                  <View key={pedido.id} style={styles.pedidoPendiente}>
                    <View style={styles.filaPendiente}>
                      <TiendaAvatar nombre={pedido.nombreTienda} tamano={38} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.nombreTienda}>{pedido.nombreTienda}</Text>
                        <Text style={styles.meta}>
                          {piezas} {piezas === 1 ? 'pieza' : 'piezas'} · {formatearPrecio(pedido.subtotal + pedido.envio)}
                        </Text>
                        <View style={styles.badgePendiente}>
                          <Ionicons name="hourglass-outline" size={12} color={COLORS.warning} />
                          <Text style={styles.textoPendiente}>Pago pendiente · la tienda debe confirmarlo</Text>
                        </View>
                      </View>
                    </View>
                    {tienda && (pedido.metodo === 'transferencia' || pedido.metodo === 'paypal') && (
                      <DatosPagoTienda
                        tienda={tienda}
                        monto={pedido.subtotal + pedido.envio}
                        metodo={pedido.metodo}
                        referencia={referenciaCompra(compra.id)}
                      />
                    )}
                  </View>
                );
              }

              return (
                <Pressable
                  key={pedido.id}
                  style={({ pressed }) => [styles.pedido, pressed && { opacity: 0.6 }]}
                  onPress={conToque(() => router.push({ pathname: '/pedido/[id]', params: { id: pedido.id } }))}
                >
                  <TiendaAvatar nombre={pedido.nombreTienda} tamano={38} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.nombreTienda}>{pedido.nombreTienda}</Text>
                    <Text style={styles.meta}>
                      {piezas} {piezas === 1 ? 'pieza' : 'piezas'} · {formatearPrecio(pedido.subtotal + pedido.envio)}
                      {pagado ? ' · pago aceptado' : ' · pagas al recibir'}
                    </Text>
                    <EnvioBadge estado={pedido.envioEstado} />
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </Pressable>
              );
            })}

            <View style={styles.totales}>
              <ResumenTotales subtotal={compra.subtotal} envio={compra.envio} />
            </View>
            {comprobanteDisponible(compra) && (
              <Pressable style={styles.botonPdf} onPress={() => descargar(compra)}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                <Text style={styles.textoPdf}>Comprobante con código (PDF)</Text>
              </Pressable>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icono="receipt-outline"
          titulo="Todavía no tienes compras"
          mensaje="Cuando compres desde tu carrito, aparecerán aquí"
          accion={{ label: 'Ir al catálogo', onPress: () => router.navigate('/') }}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: SPACING, paddingBottom: 32, flexGrow: 1 },
  resumen: { backgroundColor: COLORS.card, borderRadius: RADIUS, padding: 12, marginBottom: 14, ...SHADOW },
  textoResumen: { fontSize: 13, color: COLORS.textMuted, fontWeight: '700', textAlign: 'center' },
  filaResumen: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chipResumen: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  textoChip: { fontSize: 12, fontWeight: '800' },
  tarjeta: { backgroundColor: COLORS.card, borderRadius: RADIUS, padding: 14, marginBottom: 14, ...SHADOW },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  iconoMetodo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fecha: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted },
  pedido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  nombreTienda: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  pedidoPendiente: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 8 },
  filaPendiente: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgePendiente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  textoPendiente: { fontSize: 11, fontWeight: '700', color: COLORS.warning },
  totales: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 4 },
  botonPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  textoPdf: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
});
