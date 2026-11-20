// Pestana VENDER (vista del VENDEDOR / proveedor)
// Todo lo que tiene que ver con vender: tienda, productos, ofertas y pedidos recibidos
// Lo del comprador esta en su propia pestana (cuenta.tsx)
// Los numeros salen de utils/estadisticas.ts, igual que en "Pedidos recibidos", para que coincidan
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, DEGRADADOS, RADIUS, SHADOW, SPACING, type IconName } from '@/constants/theme';
import { formatearPrecio, referenciaCompra } from '@/utils/formato';
import { resumenVendedor } from '@/utils/estadisticas';
import { esperandoPago } from '@/utils/envio';
import { vibrarSeleccion } from '@/utils/feedback';
import { useEnfocada } from '@/hooks/useEnfocada';
import MenuItem from '@/components/MenuItem';
import EnvioBadge from '@/components/EnvioBadge';

// Boton grande de accion rapida
function Accion({ icono, texto, color, onPress }: { icono: IconName; texto: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.accion, pressed && { opacity: 0.75 }]}
      onPress={() => {
        vibrarSeleccion();
        onPress();
      }}
    >
      <View style={[styles.iconoAccion, { backgroundColor: color }]}>
        <Ionicons name={icono} size={22} color={COLORS.white} />
      </View>
      <Text style={styles.textoAccion}>{texto}</Text>
    </Pressable>
  );
}

// Cuadro con un numero
function Dato({ valor, etiqueta, color }: { valor: string | number; etiqueta: string; color: string }) {
  return (
    <View style={styles.dato}>
      <Text style={[styles.valorDato, { color }]}>{valor}</Text>
      <Text style={styles.etiquetaDato}>{etiqueta}</Text>
    </View>
  );
}

export default function VenderScreen() {
  const router = useRouter();
  const enfocada = useEnfocada();
  const { miTienda, productos, esMio, pedidosRecibidos } = useTienda();
  const r = resumenVendedor(
    pedidosRecibidos.map((x) => x.pedido),
    productos.filter(esMio)
  );

  // Pedidos que requieren que el vendedor haga algo (primero los que esperan cobro)
  const porHacer = pedidosRecibidos
    .filter((x) => esperandoPago(x.pedido) || x.pedido.envioEstado === 'confirmado' || x.pedido.envioEstado === 'preparado')
    .sort((a, b) => Number(esperandoPago(b.pedido)) - Number(esperandoPago(a.pedido)))
    .slice(0, 3);

  const encabezado = (
    <LinearGradient colors={DEGRADADOS.verde} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView edges={['top']}>
        <View style={styles.encabezado}>
          <View style={styles.avatar}>
            <Ionicons name="storefront" size={26} color={COLORS.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rol}>VENDEDOR</Text>
            <Text style={styles.titulo} numberOfLines={1}>{miTienda ? miTienda.nombre : 'Vende en UNPROV'}</Text>
          </View>
          {miTienda && (
            <Pressable
              style={styles.botonEditar}
              onPress={() => {
                vibrarSeleccion();
                router.push('/mi-tienda');
              }}
              accessibilityLabel="Editar mi tienda"
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.white} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  // ---------- Sin tienda: invitacion a registrarse ----------
  if (!miTienda) {
    return (
      <View style={styles.contenedor}>
        {enfocada && <StatusBar style="light" />}
        {encabezado}
        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={styles.invitacion}>
            <Ionicons name="rocket" size={44} color={COLORS.accent} />
            <Text style={styles.tituloInvitacion}>Abre tu tienda gratis</Text>
            {[
              'Publica productos con foto y precio de mayoreo',
              'Pon ofertas con cuenta regresiva',
              'Recibe pagos con tarjeta, SPEI, PayPal o efectivo',
              'Controla tus envíos paso a paso',
            ].map((t) => (
              <View key={t} style={styles.beneficio}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                <Text style={styles.textoBeneficio}>{t}</Text>
              </View>
            ))}
            <Pressable
              style={({ pressed }) => [styles.botonRegistrar, pressed && { opacity: 0.85 }]}
              onPress={() => {
                vibrarSeleccion();
                router.push('/mi-tienda');
              }}
            >
              <Text style={styles.textoRegistrar}>Registrar mi tienda</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------- Con tienda: panel ----------
  return (
    <View style={styles.contenedor}>
      {enfocada && <StatusBar style="light" />}
      {encabezado}
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.tarjetaResumen}>
          <View style={styles.filaDatos}>
            <Dato valor={r.porCobrar} etiqueta="Por cobrar" color={COLORS.warning} />
            <Dato valor={r.porAtender} etiqueta="Por atender" color={COLORS.primary} />
            <Dato valor={r.enCamino} etiqueta="En camino" color="#6D28D9" />
            <Dato valor={r.entregados} etiqueta="Entregados" color={COLORS.accent} />
          </View>
          <View style={styles.vendido}>
            <Text style={styles.etiquetaVendido}>Vendido en total</Text>
            <Text style={styles.valorVendido}>{formatearPrecio(r.vendido)}</Text>
          </View>
        </View>

        {/* Acciones rapidas */}
        <View style={styles.acciones}>
          <Accion icono="add" texto="Nuevo producto" color={COLORS.accent} onPress={() => router.push('/alta-producto')} />
          <Accion icono="cube" texto="Mis productos" color={COLORS.primary} onPress={() => router.push('/mis-productos')} />
          <Accion icono="flame" texto="Ofertas" color={COLORS.oferta} onPress={() => router.push('/mis-productos')} />
          <Accion icono="file-tray-full" texto="Pedidos" color={COLORS.dark} onPress={() => router.push('/ventas')} />
        </View>

        {/* Lo que hay que hacer */}
        <Text style={styles.seccion}>Requieren tu atención ({r.pendientes})</Text>
        {porHacer.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="checkmark-done-circle" size={22} color={COLORS.accent} />
            <Text style={styles.textoVacio}>Todo al día. No tienes pedidos pendientes.</Text>
          </View>
        ) : (
          porHacer.map(({ compra, pedido }) => (
            <Pressable
              key={pedido.id}
              style={({ pressed }) => [styles.pendiente, pressed && { opacity: 0.75 }]}
              onPress={() => {
                vibrarSeleccion();
                router.push('/ventas');
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cliente}>{compra.direccion.nombre}</Text>
                <Text style={styles.meta}>
                  {referenciaCompra(compra.id)} · {formatearPrecio(pedido.subtotal)}
                </Text>
                {esperandoPago(pedido) ? (
                  <Text style={styles.porCobrar}>Confirma si te llegó el pago</Text>
                ) : (
                  <EnvioBadge estado={pedido.envioEstado} />
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </Pressable>
          ))
        )}

        <Text style={styles.seccion}>Mi tienda</Text>
        <View style={styles.tarjeta}>
          <MenuItem
            icono="eye-outline"
            label="Ver mi tienda como cliente"
            onPress={() => router.push({ pathname: '/tienda/[id]', params: { id: miTienda.id } })}
          />
          <MenuItem icono="file-tray-full-outline" label="Pedidos recibidos" contador={r.pendientes} onPress={() => router.push('/ventas')} />
          <MenuItem icono="cube-outline" label="Mis productos y existencias" contador={r.productos} onPress={() => router.push('/mis-productos')} />
          <MenuItem icono="flame-outline" label="Mis ofertas activas" contador={r.ofertasActivas} onPress={() => router.push('/mis-productos')} />
          <MenuItem icono="card-outline" label="Datos de cobro (CLABE, PayPal)" ultimo onPress={() => router.push('/mi-tienda')} />
        </View>
        <Text style={styles.nota}>El número junto a "Pedidos recibidos" son los que requieren tu atención (por cobrar + por atender).</Text>

        <Pressable
          style={({ pressed }) => [styles.cambio, pressed && { opacity: 0.8 }]}
          onPress={() => {
            vibrarSeleccion();
            router.navigate('/cuenta');
          }}
        >
          <Ionicons name="person-circle" size={22} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloCambio}>¿Quieres comprar?</Text>
            <Text style={styles.textoCambio}>Ve a tu cuenta de comprador</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORS.background },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: SPACING, paddingBottom: 22 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rol: { color: COLORS.amarillo, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  titulo: { color: COLORS.white, fontSize: 24, fontWeight: '900' },
  botonEditar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: { padding: SPACING, paddingBottom: 32 },
  tarjetaResumen: { backgroundColor: COLORS.card, borderRadius: RADIUS, padding: 14, marginTop: -6, ...SHADOW },
  filaDatos: { flexDirection: 'row' },
  dato: { flex: 1, alignItems: 'center' },
  valorDato: { fontSize: 22, fontWeight: '900' },
  etiquetaDato: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', textAlign: 'center' },
  vendido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 12,
    paddingTop: 10,
  },
  etiquetaVendido: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  valorVendido: { fontSize: 18, fontWeight: '900', color: COLORS.accent },
  acciones: { flexDirection: 'row', gap: 10, marginTop: 16 },
  accion: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    paddingVertical: 12,
    ...SHADOW,
  },
  iconoAccion: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  textoAccion: { fontSize: 11, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  seccion: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 8,
  },
  vacio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 12,
  },
  textoVacio: { flex: 1, color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  pendiente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    padding: 12,
    marginBottom: 10,
    ...SHADOW,
  },
  cliente: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted },
  porCobrar: { fontSize: 12, fontWeight: '800', color: COLORS.warning },
  tarjeta: { backgroundColor: COLORS.card, borderRadius: RADIUS, ...SHADOW },
  nota: { fontSize: 11, color: COLORS.textMuted, marginTop: 6, marginHorizontal: 4 },
  invitacion: { backgroundColor: COLORS.card, borderRadius: RADIUS, padding: 20, alignItems: 'center', gap: 10, ...SHADOW },
  tituloInvitacion: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  beneficio: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  textoBeneficio: { flex: 1, fontSize: 14, color: COLORS.text },
  botonRegistrar: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS,
    paddingVertical: 14,
    marginTop: 8,
  },
  textoRegistrar: { color: COLORS.white, fontWeight: '900', fontSize: 16 },
  cambio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  tituloCambio: { fontSize: 14, fontWeight: '900', color: COLORS.primaryDark },
  textoCambio: { fontSize: 12, color: COLORS.primaryDark },
});
