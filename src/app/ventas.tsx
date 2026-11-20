// Pedidos recibidos (vista del PROVEEDOR)
// El proveedor ve los pedidos de su tienda, los filtra y:
// 1) Si el cliente pago por transferencia o PayPal, CONFIRMA que si le llego el dinero
// 2) Avanza el envio: confirmado -> preparado -> enviado -> salio a entrega
// 3) Confirma la entrega con el codigo o la firma del cliente
import { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda, type PedidoConCompra } from '@/context/TiendaContext';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { formatearFecha, formatearPrecio, referenciaCompra } from '@/utils/formato';
import { ETAPAS, esperandoPago, indiceEtapa, siguienteEtapa } from '@/utils/envio';
import CategoryChips, { type OpcionChip } from '@/components/CategoryChips';
import EnvioBadge from '@/components/EnvioBadge';
import EmptyState from '@/components/EmptyState';
import { vibrarAviso, vibrarExito, conToque, vibrarSeleccion } from '@/utils/feedback';
import { notificar } from '@/utils/notificaciones';
import { vibrarPagoAprobado } from '@/utils/feedback';
import type { EstadoEnvio, PedidoTienda } from '@/types';

type FiltroVentas = 'todos' | 'por_cobrar' | 'por_atender' | 'en_camino' | 'entregados';

// Que etapas entran en cada filtro ("por cobrar" se revisa aparte con esperandoPago)
const GRUPOS: Record<Exclude<FiltroVentas, 'todos' | 'por_cobrar'>, EstadoEnvio[]> = {
  por_atender: ['confirmado', 'preparado'],
  en_camino: ['enviado', 'en_reparto'],
  entregados: ['entregado'],
};

function cumpleFiltro(filtro: FiltroVentas, pedido: PedidoTienda): boolean {
  if (filtro === 'todos') return true;
  if (filtro === 'por_cobrar') return esperandoPago(pedido);
  // Un pedido sin pago confirmado no cuenta como "por atender"
  return !esperandoPago(pedido) && GRUPOS[filtro].includes(pedido.envioEstado);
}

// Barrita de progreso con 5 segmentos (uno por etapa)
function Progreso({ estado }: { estado: EstadoEnvio }) {
  const actual = indiceEtapa(estado);
  return (
    <View style={styles.progreso}>
      {ETAPAS.map((e, i) => (
        <View
          key={e.id}
          style={[
            styles.segmento,
            i <= actual && { backgroundColor: estado === 'entregado' ? COLORS.accent : COLORS.primary },
          ]}
        />
      ))}
    </View>
  );
}

export default function VentasScreen() {
  const router = useRouter();
  const { miTienda, pedidosRecibidos, avanzarEnvio, confirmarPagoRecibido } = useTienda();
  const [filtro, setFiltro] = useState<FiltroVentas>('todos');

  if (!miTienda) {
    return (
      <EmptyState
        icono="storefront-outline"
        titulo="Primero registra tu tienda"
        mensaje="Aquí verás los pedidos que te hagan tus clientes"
        accion={{ label: 'Registrar mi tienda', onPress: () => router.push('/mi-tienda') }}
      />
    );
  }

  const contar = (f: FiltroVentas) => pedidosRecibidos.filter((x) => cumpleFiltro(f, x.pedido)).length;

  const opciones: OpcionChip<FiltroVentas>[] = [
    { id: 'todos', label: `Todos (${pedidosRecibidos.length})` },
    { id: 'por_cobrar', label: `Por cobrar (${contar('por_cobrar')})`, icon: 'cash-outline' },
    { id: 'por_atender', label: `Por atender (${contar('por_atender')})`, icon: 'alert-circle-outline' },
    { id: 'en_camino', label: `En camino (${contar('en_camino')})`, icon: 'bicycle-outline' },
    { id: 'entregados', label: `Entregados (${contar('entregados')})`, icon: 'checkmark-done' },
  ];

  const lista = pedidosRecibidos.filter((x) => cumpleFiltro(filtro, x.pedido));

  // Lo que la tienda ha vendido (sin contar envio)
  const vendido = pedidosRecibidos.reduce((suma, x) => suma + x.pedido.subtotal, 0);

  // Avanza la etapa, vibra y le manda una notificacion al cliente
  const avanzar = (pedido: PedidoTienda) => {
    const siguiente = siguienteEtapa(pedido.envioEstado);
    if (!siguiente) return;
    avanzarEnvio(pedido.id);
    vibrarAviso();
    notificar(`Tu pedido de ${pedido.nombreTienda}`, `${siguiente.titulo}: ${siguiente.descripcion}`, pedido.id);
  };

  // Solo el proveedor confirma que le llego el dinero (transferencia o PayPal)
  const confirmarPago = (item: PedidoConCompra) => {
    vibrarSeleccion();
    const { compra, pedido } = item;
    const medio = pedido.metodo === 'transferencia' ? 'la transferencia' : 'el pago por PayPal';
    Alert.alert(
      'Confirmar pago recibido',
      `¿Ya te llegó ${medio} de ${formatearPrecio(pedido.subtotal + pedido.envio)} con el concepto ${referenciaCompra(compra.id)}?`,
      [
        { text: 'Todavía no', style: 'cancel' },
        {
          text: 'Sí, ya llegó',
          onPress: () => {
            confirmarPagoRecibido(pedido.id);
            vibrarPagoAprobado();
            notificar(
              '¡Pago aceptado!',
              `${pedido.nombreTienda} confirmó tu pago. Tu pedido ya está en camino de prepararse; toca para ver tu código de entrega.`,
              pedido.id
            );
          },
        },
      ]
    );
  };

  const renderPedido = ({ item }: { item: PedidoConCompra }) => {
    const { compra, pedido } = item;
    const siguiente = siguienteEtapa(pedido.envioEstado);
    const pagado = pedido.estado === 'pagado';
    const porCobrar = esperandoPago(pedido);

    return (
      <View style={styles.tarjeta}>
        <View style={styles.filaEntre}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cliente}>{compra.direccion.nombre}</Text>
            <Text style={styles.meta}>
              {referenciaCompra(compra.id)} · {formatearFecha(compra.fecha)}
            </Text>
          </View>
          <Text style={styles.monto}>{formatearPrecio(pedido.subtotal)}</Text>
        </View>

        <View style={styles.filaBadges}>
          {porCobrar ? (
            <View style={[styles.badgePago, { backgroundColor: COLORS.warningLight }]}>
              <Text style={[styles.textoBadgePago, { color: COLORS.warning }]}>
                Esperando {pedido.metodo === 'transferencia' ? 'transferencia' : 'pago PayPal'}
              </Text>
            </View>
          ) : (
            <EnvioBadge estado={pedido.envioEstado} />
          )}
          <View style={[styles.badgePago, { backgroundColor: pagado ? COLORS.accentLight : COLORS.warningLight }]}>
            <Text style={[styles.textoBadgePago, { color: pagado ? COLORS.accent : COLORS.warning }]}>
              {pagado ? 'Pagado' : compra.metodo === 'efectivo' ? 'Cobrar al entregar' : 'Pago pendiente'}
            </Text>
          </View>
        </View>

        {!porCobrar && <Progreso estado={pedido.envioEstado} />}

        {pedido.items.map((i) => (
          <Text key={i.productoId} style={styles.item} numberOfLines={1}>
            {i.cantidad} × {i.nombre}
          </Text>
        ))}

        <View style={styles.direccion}>
          <Ionicons name="location-outline" size={15} color={COLORS.textMuted} />
          <Text style={styles.textoDireccion} numberOfLines={2}>
            {compra.direccion.calle}, {compra.direccion.colonia}, C.P. {compra.direccion.cp} · Tel.{' '}
            {compra.direccion.telefono}
          </Text>
        </View>

        {/* Boton de la siguiente accion: primero cobrar, luego enviar */}
        {porCobrar && (
          <Pressable
            style={({ pressed }) => [styles.boton, styles.botonCobro, pressed && { opacity: 0.85 }]}
            onPress={() => confirmarPago(item)}
          >
            <Ionicons name="cash" size={18} color={COLORS.white} />
            <Text style={styles.textoBoton}>Confirmar pago recibido</Text>
          </Pressable>
        )}
        {!porCobrar && siguiente && siguiente.id !== 'entregado' && (
          <Pressable
            style={({ pressed }) => [styles.boton, pressed && { opacity: 0.85 }]}
            onPress={() => avanzar(pedido)}
          >
            <Ionicons name={siguiente.icon} size={18} color={COLORS.white} />
            <Text style={styles.textoBoton}>{siguiente.accion}</Text>
          </Pressable>
        )}
        {!porCobrar && siguiente?.id === 'entregado' && (
          <Pressable
            style={({ pressed }) => [styles.boton, styles.botonEntrega, pressed && { opacity: 0.85 }]}
            onPress={conToque(() => router.push({ pathname: '/entrega/[id]', params: { id: pedido.id } }))}
          >
            <Ionicons name="shield-checkmark" size={18} color={COLORS.white} />
            <Text style={styles.textoBoton}>Confirmar entrega (código o firma)</Text>
          </Pressable>
        )}
        {pedido.entrega && (
          <View style={styles.entregado}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
            <Text style={styles.textoEntregado}>
              Recibió {pedido.entrega.recibio} · {pedido.entrega.metodo === 'codigo' ? 'con código' : 'con firma'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={lista}
      keyExtractor={(x) => x.pedido.id}
      renderItem={renderPedido}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        <View>
          <View style={styles.resumen}>
            <View style={styles.dato}>
              <Text style={styles.valorDato}>{pedidosRecibidos.length}</Text>
              <Text style={styles.etiquetaDato}>Pedidos</Text>
            </View>
            <View style={styles.separadorDato} />
            <View style={styles.dato}>
              <Text style={styles.valorDato}>{contar('por_atender')}</Text>
              <Text style={styles.etiquetaDato}>Por atender</Text>
            </View>
            <View style={styles.separadorDato} />
            <View style={styles.dato}>
              <Text style={styles.valorDato}>{formatearPrecio(vendido)}</Text>
              <Text style={styles.etiquetaDato}>Vendido</Text>
            </View>
          </View>
          <CategoryChips opciones={opciones} seleccionado={filtro} onSeleccionar={setFiltro} />
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icono="file-tray-outline"
          titulo={pedidosRecibidos.length === 0 ? 'Aún no tienes pedidos' : 'Nada en este filtro'}
          mensaje={
            pedidosRecibidos.length === 0
              ? 'Cuando alguien compre productos de tu tienda aparecerán aquí'
              : 'Prueba con otro filtro'
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: SPACING, paddingBottom: 40, flexGrow: 1 },
  resumen: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark,
    borderRadius: RADIUS,
    paddingVertical: 16,
    marginBottom: 14,
    ...SHADOW,
  },
  dato: { flex: 1, alignItems: 'center' },
  valorDato: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  etiquetaDato: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  separadorDato: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  tarjeta: { backgroundColor: COLORS.card, borderRadius: RADIUS, padding: 14, marginTop: 14, ...SHADOW },
  filaEntre: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cliente: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  monto: { fontSize: 17, fontWeight: '800', color: COLORS.primaryDark },
  filaBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badgePago: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  textoBadgePago: { fontSize: 11, fontWeight: '700' },
  progreso: { flexDirection: 'row', gap: 4, marginVertical: 12 },
  segmento: { flex: 1, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  item: { fontSize: 13, color: COLORS.text, paddingVertical: 1 },
  direccion: { flexDirection: 'row', gap: 6, marginTop: 8 },
  textoDireccion: { flex: 1, fontSize: 12, color: COLORS.textMuted },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  botonEntrega: { backgroundColor: COLORS.accent },
  botonCobro: { backgroundColor: COLORS.warning },
  textoBoton: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  entregado: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  textoEntregado: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
});
