// Seguimiento de un pedido (vista del CLIENTE, solo lectura)
// El cliente NO puede cambiar nada: el pago y el envio solo los actualiza la tienda
// - Si pago por transferencia o PayPal y la tienda aun no confirma: solo se ven los datos para pagar
// - Cuando el pago esta aceptado: linea de tiempo, codigo de entrega y comprobante PDF (con el mismo codigo)
// Si la tienda actualiza la etapa mientras esta pantalla esta abierta, el telefono vibra
import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, METODOS_PAGO, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { formatearFecha, formatearPrecio, referenciaCompra } from '@/utils/formato';
import { esperandoPago, obtenerEtapa } from '@/utils/envio';
import { vibrarAviso, vibrarExito, vibrarPagoAprobado, vibrarSeleccion } from '@/utils/feedback';
import { compartirComprobante } from '@/utils/comprobante';
import EnvioTimeline from '@/components/EnvioTimeline';
import EnvioBadge from '@/components/EnvioBadge';
import TiendaAvatar from '@/components/TiendaAvatar';
import ResumenTotales from '@/components/ResumenTotales';
import DatosPagoTienda from '@/components/DatosPagoTienda';
import SignaturePad from '@/components/SignaturePad';
import EmptyState from '@/components/EmptyState';

export default function SeguimientoPedidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { obtenerPedido, obtenerTienda } = useTienda();
  const encontrado = obtenerPedido(id);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // Vibra cuando la tienda cambia el pago o la etapa del envio (no la primera vez que se abre)
  const firmaEstado = encontrado ? `${encontrado.pedido.estado}-${encontrado.pedido.envioEstado}` : '';
  const anterior = useRef(firmaEstado);
  useEffect(() => {
    if (anterior.current && firmaEstado && firmaEstado !== anterior.current) {
      if (firmaEstado.startsWith('pagado-confirmado') && anterior.current.startsWith('pendiente')) {
        // La tienda acaba de aceptar el pago: vibra fuerte y suena
        vibrarPagoAprobado();
      } else if (firmaEstado.endsWith('entregado')) vibrarExito();
      else vibrarAviso();
    }
    anterior.current = firmaEstado;
  }, [firmaEstado]);

  if (!encontrado) {
    return (
      <EmptyState
        icono="alert-circle-outline"
        titulo="Pedido no encontrado"
        accion={{ label: 'Volver', onPress: () => router.back() }}
      />
    );
  }

  const { compra, pedido } = encontrado;
  const tienda = obtenerTienda(pedido.tiendaId);
  const metodo = METODOS_PAGO.find((m) => m.id === compra.metodo);
  const porConfirmar = esperandoPago(pedido);
  const entregado = pedido.envioEstado === 'entregado';
  const pagado = pedido.estado === 'pagado';
  const total = pedido.subtotal + pedido.envio;
  const referencia = referenciaCompra(compra.id);

  const descargarComprobante = async () => {
    vibrarSeleccion();
    setGenerandoPdf(true);
    const resultado = await compartirComprobante(compra);
    setGenerandoPdf(false);
    if (!resultado.ok) Alert.alert('No se pudo generar el PDF', resultado.error);
  };

  // ---------- Encabezado comun ----------
  const encabezado = (
    <View style={[styles.tarjeta, styles.encabezado]}>
      <TiendaAvatar nombre={pedido.nombreTienda} tamano={48} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.nombreTienda}>{pedido.nombreTienda}</Text>
        <Text style={styles.meta}>
          {referencia} · {formatearFecha(compra.fecha)}
        </Text>
        {porConfirmar ? (
          <View style={[styles.badgePago, { backgroundColor: COLORS.warningLight, alignSelf: 'flex-start' }]}>
            <Text style={[styles.textoBadgePago, { color: COLORS.warning }]}>Pago pendiente</Text>
          </View>
        ) : (
          <EnvioBadge estado={pedido.envioEstado} />
        )}
      </View>
    </View>
  );

  // ==================== A) Esperando que la tienda confirme el pago ====================
  if (porConfirmar) {
    return (
      <ScrollView contentContainerStyle={styles.contenido}>
        <Stack.Screen options={{ title: 'Pago pendiente' }} />
        {encabezado}

        <View style={styles.esperando}>
          <Ionicons name="hourglass-outline" size={36} color={COLORS.warning} />
          <Text style={styles.tituloEsperando}>Esperando confirmación de la tienda</Text>
          <Text style={styles.textoEsperando}>
            Haz tu pago de {formatearPrecio(total)} con los datos de abajo. Cuando {pedido.nombreTienda} confirme que
            lo recibió, aquí aparecerán el seguimiento, tu código de entrega y tu comprobante PDF.
          </Text>
        </View>

        {tienda && (pedido.metodo === 'transferencia' || pedido.metodo === 'paypal') && (
          <DatosPagoTienda tienda={tienda} monto={total} metodo={pedido.metodo} referencia={referencia} />
        )}

        <View style={styles.nota}>
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.textoNota}>Solo la tienda puede confirmar tu pago. Te llegará una notificación.</Text>
        </View>
      </ScrollView>
    );
  }

  // ==================== B) Pago aceptado: seguimiento completo ====================
  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: 'Seguimiento' }} />
      {encabezado}

      {/* Codigo de entrega o confirmacion */}
      {!entregado ? (
        <View style={styles.tarjetaCodigo}>
          <Text style={styles.etiquetaCodigo}>CÓDIGO DE ENTREGA</Text>
          <Text style={styles.codigo}>{pedido.codigoEntrega.split('').join(' ')}</Text>
          <Text style={styles.textoCodigo}>
            Dáselo al repartidor al recibir, o firma igual que cuando compraste. Es el mismo código de tu comprobante PDF.
          </Text>
        </View>
      ) : (
        pedido.entrega && (
          <View style={[styles.tarjeta, styles.tarjetaEntregado]}>
            <View style={styles.filaIcono}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />
              <Text style={styles.tituloEntregado}>Entregado a {pedido.entrega.recibio}</Text>
            </View>
            <Text style={styles.meta}>
              {formatearFecha(pedido.entrega.fecha)} ·{' '}
              {pedido.entrega.metodo === 'codigo' ? 'Confirmado con código' : 'Confirmado con firma'}
            </Text>
            {pedido.entrega.firma && (
              <View style={{ marginTop: 10 }}>
                <SignaturePad trazos={pedido.entrega.firma} soloLectura alto={160} />
              </View>
            )}
          </View>
        )
      )}

      {/* Linea de tiempo */}
      <Text style={styles.seccion}>Estado del envío</Text>
      <View style={styles.tarjeta}>
        <Text style={styles.etapaActual}>{obtenerEtapa(pedido.envioEstado).descripcion}</Text>
        <View style={{ marginTop: 14 }}>
          <EnvioTimeline estadoActual={pedido.envioEstado} historial={pedido.historial} />
        </View>
      </View>

      {/* Direccion */}
      <Text style={styles.seccion}>Dirección de entrega</Text>
      <View style={styles.tarjeta}>
        <View style={styles.filaIcono}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.textoFuerte}>{compra.direccion.nombre}</Text>
            <Text style={styles.meta}>
              {compra.direccion.calle}, {compra.direccion.colonia}, C.P. {compra.direccion.cp}
            </Text>
            <Text style={styles.meta}>Tel. {compra.direccion.telefono}</Text>
          </View>
        </View>
      </View>

      {/* Productos y totales */}
      <Text style={styles.seccion}>Productos</Text>
      <View style={styles.tarjeta}>
        {pedido.items.map((i) => (
          <View key={i.productoId} style={styles.filaItem}>
            <Text style={styles.item} numberOfLines={1}>
              {i.cantidad} × {i.nombre}
            </Text>
            <Text style={styles.textoFuerte}>{formatearPrecio(i.precio * i.cantidad)}</Text>
          </View>
        ))}
        <View style={{ marginTop: 10 }}>
          <ResumenTotales subtotal={pedido.subtotal} envio={pedido.envio} />
        </View>
      </View>

      {/* Pago (solo lectura) */}
      <Text style={styles.seccion}>Pago</Text>
      <View style={styles.tarjeta}>
        <View style={styles.filaIcono}>
          <Ionicons name={metodo?.icon ?? 'card-outline'} size={20} color={COLORS.primary} />
          <Text style={[styles.textoFuerte, { flex: 1 }]}>
            {compra.metodo === 'tarjeta' ? `Tarjeta •••• ${compra.ultimos4}` : metodo?.label}
          </Text>
          <View style={[styles.badgePago, { backgroundColor: pagado ? COLORS.accentLight : COLORS.warningLight }]}>
            <Text style={[styles.textoBadgePago, { color: pagado ? COLORS.accent : COLORS.warning }]}>
              {pagado ? 'Pago aceptado' : 'Pagas al recibir'}
            </Text>
          </View>
        </View>
        {pedido.pagoConfirmado && (
          <Text style={[styles.meta, { marginTop: 8 }]}>
            {pedido.nombreTienda} confirmó tu pago el {formatearFecha(pedido.pagoConfirmado)}
          </Text>
        )}
        {!pagado && compra.metodo === 'efectivo' && (
          <Text style={styles.avisoPago}>Ten listo {formatearPrecio(total)} en efectivo para el repartidor.</Text>
        )}
      </View>

      <Pressable style={styles.botonPdf} onPress={descargarComprobante} disabled={generandoPdf}>
        {generandoPdf ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <>
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.textoPdf}>Descargar comprobante con código (PDF)</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACING, paddingBottom: 40 },
  tarjeta: { backgroundColor: COLORS.card, borderRadius: RADIUS, padding: 14, marginTop: 12, ...SHADOW },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 0 },
  nombreTienda: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted },
  esperando: {
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS,
    padding: 18,
    marginTop: 12,
    gap: 6,
  },
  tituloEsperando: { fontSize: 16, fontWeight: '800', color: COLORS.warning, textAlign: 'center' },
  textoEsperando: { fontSize: 13, color: COLORS.text, textAlign: 'center', lineHeight: 19 },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, justifyContent: 'center' },
  textoNota: { fontSize: 12, color: COLORS.textMuted, flexShrink: 1 },
  tarjetaCodigo: {
    backgroundColor: COLORS.dark,
    borderRadius: RADIUS,
    padding: 18,
    marginTop: 12,
    alignItems: 'center',
    ...SHADOW,
  },
  etiquetaCodigo: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  codigo: { color: COLORS.white, fontSize: 40, fontWeight: '800', letterSpacing: 6, marginVertical: 6 },
  textoCodigo: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center' },
  tarjetaEntregado: { borderWidth: 1.5, borderColor: COLORS.accent },
  tituloEntregado: { fontSize: 16, fontWeight: '800', color: COLORS.accent, flex: 1 },
  filaIcono: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seccion: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 22,
  },
  etapaActual: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  textoFuerte: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  filaItem: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 3 },
  item: { flex: 1, fontSize: 14, color: COLORS.text },
  badgePago: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  textoBadgePago: { fontSize: 12, fontWeight: '800' },
  avisoPago: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '600',
    backgroundColor: COLORS.warningLight,
    padding: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  botonPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  textoPdf: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
});
