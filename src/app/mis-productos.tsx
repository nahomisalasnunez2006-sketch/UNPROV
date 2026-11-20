// Mis productos (Seccion Vendedor): lista de lo que el usuario publico, con opcion de eliminar
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, RADIUS, SHADOW, SPACING, obtenerCategoria } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';
import ProductImage from '@/components/ProductImage';
import EmptyState from '@/components/EmptyState';
import { ofertaActiva, precioFinal } from '@/utils/precios';
import { vibrarAviso, conToque, vibrarSeleccion } from '@/utils/feedback';
import type { Producto } from '@/types';

export default function MisProductosScreen() {
  const router = useRouter();
  const { productos, eliminarProducto, esMio, miTienda } = useTienda();
  const misProductos = productos.filter(esMio);

  const confirmarEliminar = (producto: Producto) => {
    vibrarSeleccion();
    Alert.alert('Eliminar producto', `¿Eliminar "${producto.nombre}" de tu catálogo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          vibrarAviso();
          eliminarProducto(producto.id);
        },
      },
    ]);
  };

  // Sin tienda registrada no hay donde publicar
  if (!miTienda) {
    return (
      <EmptyState
        icono="storefront-outline"
        titulo="Primero registra tu tienda"
        mensaje="Necesitamos tus datos de cobro para que los clientes puedan pagarte"
        accion={{ label: 'Registrar mi tienda', onPress: () => router.push('/mi-tienda') }}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: miTienda.nombre,
          headerRight: () => (
            <Pressable onPress={conToque(() => router.push('/alta-producto'))} hitSlop={10} accessibilityLabel="Dar de alta producto">
              <Ionicons name="add-circle" size={28} color={COLORS.accent} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={misProductos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          misProductos.length > 0 ? (
            <Text style={styles.resumen}>Tienes {misProductos.length} producto(s) publicados</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.fila, pressed && { opacity: 0.7 }]}
            onPress={conToque(() => router.push({ pathname: '/producto/[id]', params: { id: item.id } }))}
          >
            <ProductImage producto={item} style={styles.imagen} iconSize={26} />
            <View style={styles.info}>
              <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
              <Text style={styles.meta}>
                {obtenerCategoria(item.categoria).label} ·{' '}
                {item.stock === 0 ? <Text style={styles.agotado}>AGOTADO</Text> : `${item.stock} pzas`}
              </Text>
              <View style={styles.filaPrecio}>
                <Text style={[styles.precio, ofertaActiva(item) && { color: COLORS.oferta }]}>
                  {formatearPrecio(precioFinal(item))}
                </Text>
                {ofertaActiva(item) && item.oferta && (
                  <View style={styles.etiquetaOferta}>
                    <Text style={styles.textoEtiquetaOferta}>-{item.oferta.descuento}%</Text>
                  </View>
                )}
              </View>
            </View>
            <Pressable
              onPress={conToque(() => router.push({ pathname: '/alta-producto', params: { id: item.id } }))}
              hitSlop={8}
              style={[styles.botonEditar, item.stock === 0 && styles.botonReabastecer]}
              accessibilityLabel={`Editar ${item.nombre}`}
            >
              <Ionicons name={item.stock === 0 ? 'refresh' : 'create-outline'} size={18} color={item.stock === 0 ? COLORS.white : COLORS.primary} />
            </Pressable>
            <Pressable
              onPress={conToque(() => router.push({ pathname: '/oferta/[id]', params: { id: item.id } }))}
              hitSlop={8}
              style={styles.botonOferta}
              accessibilityLabel={`Oferta para ${item.nombre}`}
            >
              <Ionicons name="flame" size={18} color={COLORS.oferta} />
            </Pressable>
            <Pressable
              onPress={() => confirmarEliminar(item)}
              hitSlop={10}
              style={styles.botonEliminar}
              accessibilityLabel={`Eliminar ${item.nombre}`}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icono="cube-outline"
            titulo="Aún no publicas productos"
            mensaje="Da de alta tu mercancía con foto para que los compradores la vean"
            accion={{ label: 'Dar de alta producto', onPress: () => router.push('/alta-producto') }}
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  lista: { padding: SPACING, paddingBottom: 32, flexGrow: 1 },
  resumen: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    padding: 12,
    marginBottom: 12,
    ...SHADOW,
  },
  imagen: { width: 64, height: 64, borderRadius: 12 },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  precio: { fontSize: 14, fontWeight: '800', color: COLORS.primaryDark, marginTop: 4 },
  botonEliminar: { padding: 8 },
  botonOferta: { padding: 8, backgroundColor: COLORS.ofertaLight, borderRadius: 10 },
  botonEditar: { padding: 8, backgroundColor: COLORS.primaryLight, borderRadius: 10, marginRight: 6 },
  botonReabastecer: { backgroundColor: COLORS.accent },
  agotado: { color: COLORS.danger, fontWeight: '900' },
  filaPrecio: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  etiquetaOferta: { backgroundColor: COLORS.oferta, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  textoEtiquetaOferta: { color: COLORS.white, fontWeight: '900', fontSize: 10 },
});
