// Pantalla "Tu Carrito": articulos agrupados por tienda, control - 1 + y boton "COMPRAR TODO AHORA"
import { View, Text, SectionList, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda, type RenglonCarrito } from '@/context/TiendaContext';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { formatearPrecio, textoArticulos } from '@/utils/formato';
import CartItem from '@/components/CartItem';
import EmptyState from '@/components/EmptyState';
import ResumenTotales from '@/components/ResumenTotales';
import { vibrarAviso, vibrarToque, conToque } from '@/utils/feedback';

export default function CarritoScreen() {
  const router = useRouter();
  const { carritoPorTienda, cambiarCantidad, quitarDelCarrito, totalArticulos, totalCarrito, envioCarrito } =
    useTienda();

  // SectionList necesita secciones con "data": una seccion por tienda
  const secciones = carritoPorTienda().map((g) => ({
    tienda: g.tienda,
    subtotal: g.subtotal,
    envio: g.envio,
    data: g.renglones,
  }));

  // Si la cantidad es 1, restar significa eliminar: se pide confirmacion
  const restar = (renglon: RenglonCarrito) => {
    if (renglon.cantidad === 1) {
      Alert.alert('Quitar del carrito', `¿Quitar "${renglon.producto.nombre}" del carrito?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: () => {
            vibrarAviso();
            quitarDelCarrito(renglon.producto.id);
          },
        },
      ]);
      return;
    }
    cambiarCantidad(renglon.producto.id, -1);
  };

  return (
    <SafeAreaView style={styles.contenedor} edges={['top']}>
      {/* Encabezado del wireframe */}
      <View style={styles.encabezado}>
        <Ionicons name="cart" size={28} color={COLORS.primary} />
        <Text style={styles.titulo}>Tu carrito</Text>
        {totalArticulos > 0 && <Text style={styles.subtitulo}>{textoArticulos(totalArticulos)}</Text>}
      </View>

      {/* Banner interactivo -> Wish List */}
      <Pressable
        style={({ pressed }) => [styles.banner, pressed && { opacity: 0.8 }]}
        onPress={conToque(() => router.push('/favoritos'))}
      >
        <Ionicons name="pricetags-outline" size={20} color={COLORS.primaryDark} />
        <Text style={styles.textoBanner}>
          Obtén información sobre las ofertas de hoy o visita tu <Text style={styles.negritas}>Wish List</Text>
        </Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primaryDark} />
      </Pressable>

      <SectionList
        sections={secciones}
        keyExtractor={(r) => r.producto.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.encabezadoTienda}>
            <Ionicons name="storefront-outline" size={16} color={COLORS.primary} />
            <Text style={styles.nombreTienda}>Vendido por {section.tienda.nombre}</Text>
            <Text style={styles.subtotalTienda}>
              {formatearPrecio(section.subtotal)}
              {section.envio === 0 ? ' · envío gratis' : ` + ${formatearPrecio(section.envio)} envío`}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <CartItem
            producto={item.producto}
            cantidad={item.cantidad}
            onPress={() => router.push({ pathname: '/producto/[id]', params: { id: item.producto.id } })}
            onRestar={() => restar(item)}
            onSumar={() => cambiarCantidad(item.producto.id, 1)}
          />
        )}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icono="cart-outline"
            titulo="Tu carrito está vacío"
            mensaje="Agrega productos desde el catálogo"
            accion={{ label: 'Ir al catálogo', onPress: () => router.navigate('/') }}
          />
        }
      />

      {/* Resumen y boton para ir a pagar */}
      {secciones.length > 0 && (
        <View style={styles.pie}>
          <View style={styles.filaTotal}>
            <ResumenTotales
              subtotal={totalCarrito}
              envio={envioCarrito}
              etiquetaEnvio={`Envío (${secciones.length} ${secciones.length === 1 ? 'tienda' : 'tiendas'})`}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.botonComprar, pressed && { opacity: 0.85 }]}
            onPress={() => {
              vibrarToque();
              router.push('/checkout');
            }}
          >
            <Ionicons name="bag-check" size={20} color={COLORS.white} />
            <Text style={styles.textoComprar}>COMPRAR TODO AHORA</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORS.background },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING,
    paddingTop: 12,
  },
  titulo: { fontSize: 24, fontWeight: '800', color: COLORS.text, flex: 1 },
  subtitulo: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SPACING,
    marginTop: 14,
    marginBottom: 6,
    padding: 14,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  textoBanner: { flex: 1, fontSize: 13, color: COLORS.primaryDark },
  negritas: { fontWeight: '800' },
  lista: { padding: SPACING, paddingBottom: 24, flexGrow: 1 },
  encabezadoTienda: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 8 },
  nombreTienda: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  subtotalTienda: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  pie: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING,
  },
  filaTotal: { marginBottom: 12 },
  etiquetaTotal: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },
  total: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  botonComprar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS,
  },
  textoComprar: { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
