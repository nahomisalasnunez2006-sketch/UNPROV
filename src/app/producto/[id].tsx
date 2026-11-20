// Detalle de producto (ruta dinamica /producto/[id])
// Lee el id de la URL, busca el producto en el estado global y permite
// elegir cantidad, agregar al carrito, marcar favorito y eliminar si es del usuario
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, RADIUS, SPACING, obtenerCategoria } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';
import ProductImage from '@/components/ProductImage';
import QuantityControl from '@/components/QuantityControl';
import EmptyState from '@/components/EmptyState';
import CuentaRegresiva from '@/components/CuentaRegresiva';
import { ahorro, ofertaActiva, precioFinal } from '@/utils/precios';
import { vibrarError, vibrarExito, vibrarToque, conToque, vibrarSeleccion } from '@/utils/feedback';

export default function DetalleProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    obtenerProducto,
    obtenerTienda,
    esMio,
    agregarAlCarrito,
    cantidadEnCarrito,
    esFavorito,
    alternarFavorito,
    eliminarProducto,
  } = useTienda();

  const [cantidad, setCantidad] = useState(1);
  const producto = obtenerProducto(id);

  // Si el producto ya no existe (por ejemplo, se acaba de eliminar)
  if (!producto) {
    return (
      <EmptyState
        icono="alert-circle-outline"
        titulo="Producto no encontrado"
        accion={{ label: 'Volver', onPress: () => router.back() }}
      />
    );
  }

  const categoria = obtenerCategoria(producto.categoria);
  const enCarrito = cantidadEnCarrito(producto.id);
  const disponibles = producto.stock - enCarrito; // lo que todavia se puede agregar
  const favorito = esFavorito(producto.id);
  const tienda = obtenerTienda(producto.tiendaId);
  const esProductoMio = esMio(producto);

  // Formas de pago que acepta la tienda (PayPal solo si registro su correo)
  const formasPago = ['Tarjeta', 'Transferencia', ...(tienda?.paypal ? ['PayPal'] : [])];

  const agregar = () => {
    const ok = agregarAlCarrito(producto.id, cantidad);
    if (!ok) {
      vibrarError();
      Alert.alert('Sin existencias', 'No hay suficientes piezas disponibles.');
      return;
    }
    setCantidad(1);
    vibrarExito();
    Alert.alert('Agregado al carrito', `${cantidad} × ${producto.nombre}`, [
      { text: 'Seguir viendo', style: 'cancel' },
      { text: 'Ir al carrito', onPress: () => router.navigate('/carrito') },
    ]);
  };

  const confirmarEliminar = () => {
    vibrarSeleccion();
    Alert.alert('Eliminar producto', `¿Eliminar "${producto.nombre}" de tu catálogo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          eliminarProducto(producto.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      {/* El titulo del header cambia al nombre del producto */}
      <Stack.Screen options={{ title: producto.nombre }} />

      <View>
        <ProductImage producto={producto} style={styles.imagen} iconSize={80} />
        <Pressable
          style={styles.botonFavorito}
          onPress={() => {
            vibrarToque();
            alternarFavorito(producto.id);
          }}
          accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Ionicons name={favorito ? 'heart' : 'heart-outline'} size={22} color={favorito ? COLORS.danger : COLORS.text} />
        </Pressable>
      </View>

      <View style={styles.chipCategoria}>
        <Ionicons name={categoria.icon} size={14} color={COLORS.primaryDark} />
        <Text style={styles.textoCategoria}>{categoria.label}</Text>
      </View>

      <Text style={styles.nombre}>{producto.nombre}</Text>
      {/* Al tocar la tienda se abre su pagina con todos sus productos */}
      <Pressable
        style={styles.filaProveedor}
        onPress={conToque(() => router.push({ pathname: '/tienda/[id]', params: { id: producto.tiendaId } }))}
      >
        <Ionicons name="storefront-outline" size={16} color={COLORS.primary} />
        <Text style={[styles.proveedor, styles.enlaceTienda]}>{tienda?.nombre ?? 'Tienda'}</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        {esProductoMio && <Text style={styles.etiquetaMio}>Tu producto</Text>}
      </Pressable>

      {ofertaActiva(producto) && producto.oferta ? (
        <View style={styles.bloqueOferta}>
          <View style={styles.filaPrecioOferta}>
            <Text style={[styles.precio, { color: COLORS.oferta, marginTop: 0 }]}>
              {formatearPrecio(precioFinal(producto))}
            </Text>
            <View style={styles.etiquetaDescuento}>
              <Text style={styles.textoDescuento}>-{producto.oferta.descuento}%</Text>
            </View>
          </View>
          <Text style={styles.precioViejo}>
            Antes {formatearPrecio(producto.precio)} · Ahorras {formatearPrecio(ahorro(producto))}
          </Text>
          <View style={{ marginTop: 6 }}>
            <CuentaRegresiva hasta={producto.oferta.hasta} />
          </View>
        </View>
      ) : (
        <Text style={styles.precio}>{formatearPrecio(producto.precio)}</Text>
      )}
      <Text style={styles.vendidos}>{producto.vendidos ?? 0} vendidos</Text>
      <Text style={[styles.stock, producto.stock === 0 && { color: COLORS.danger }]}>
        {producto.stock === 0 ? 'Agotado' : `${producto.stock} disponibles`}
        {enCarrito > 0 ? ` · ${enCarrito} en tu carrito` : ''}
      </Text>

      <Text style={styles.tituloSeccion}>Descripción</Text>
      <Text style={styles.descripcion}>{producto.descripcion}</Text>

      <Text style={styles.tituloSeccion}>Formas de pago de esta tienda</Text>
      <View style={styles.filaPagos}>
        {formasPago.map((forma) => (
          <View key={forma} style={styles.chipPago}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
            <Text style={styles.textoPago}>{forma}</Text>
          </View>
        ))}
      </View>

      {disponibles > 0 ? (
        <View style={styles.filaCompra}>
          <QuantityControl
            cantidad={cantidad}
            max={disponibles}
            mostrarBasura={false}
            onRestar={() => setCantidad((c) => Math.max(1, c - 1))}
            onSumar={() => setCantidad((c) => Math.min(disponibles, c + 1))}
          />
          <Pressable
            style={({ pressed }) => [styles.botonAgregar, pressed && { opacity: 0.85 }]}
            onPress={agregar}
          >
            <Ionicons name="cart" size={18} color={COLORS.white} />
            <Text style={styles.textoAgregar}>Agregar · {formatearPrecio(precioFinal(producto) * cantidad)}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.avisoSinStock}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} />
          <Text style={styles.textoAviso}>
            {producto.stock === 0 ? 'Este producto está agotado.' : 'Ya agregaste todas las piezas disponibles.'}
          </Text>
        </View>
      )}

      {esProductoMio && (
        <Pressable
          style={[styles.botonEditar, producto.stock === 0 && styles.botonReabastecer]}
          onPress={conToque(() => router.push({ pathname: '/alta-producto', params: { id: producto.id } }))}
        >
          <Ionicons name={producto.stock === 0 ? 'refresh' : 'create-outline'} size={18} color={COLORS.white} />
          <Text style={styles.textoOferta}>
            {producto.stock === 0 ? 'Reabastecer existencias' : 'Editar producto y existencias'}
          </Text>
        </Pressable>
      )}

      {esProductoMio && (
        <Pressable
          style={styles.botonOferta}
          onPress={conToque(() => router.push({ pathname: '/oferta/[id]', params: { id: producto.id } }))}
        >
          <Ionicons name="flame" size={18} color={COLORS.white} />
          <Text style={styles.textoOferta}>{ofertaActiva(producto) ? 'Editar oferta' : 'Poner en oferta'}</Text>
        </Pressable>
      )}

      {esProductoMio && (
        <Pressable style={styles.botonEliminar} onPress={confirmarEliminar}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          <Text style={styles.textoEliminar}>Eliminar de mi catálogo</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACING, paddingBottom: 40 },
  imagen: { width: '100%', aspectRatio: 1, borderRadius: RADIUS + 4 },
  botonFavorito: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 16,
  },
  textoCategoria: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark },
  nombre: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 10 },
  filaProveedor: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  proveedor: { fontSize: 14, color: COLORS.textMuted },
  etiquetaMio: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  precio: { fontSize: 28, fontWeight: '800', color: COLORS.primaryDark, marginTop: 14 },
  stock: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  bloqueOferta: {
    backgroundColor: COLORS.ofertaLight,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  filaPrecioOferta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  etiquetaDescuento: { backgroundColor: COLORS.oferta, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  textoDescuento: { color: COLORS.white, fontWeight: '900', fontSize: 14 },
  precioViejo: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  vendidos: { fontSize: 12, color: COLORS.textMuted, marginTop: 6, fontWeight: '600' },
  botonOferta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.oferta,
    paddingVertical: 14,
    borderRadius: RADIUS,
    marginTop: 16,
  },
  textoOferta: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  enlaceTienda: { color: COLORS.primary, fontWeight: '700' },
  botonEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS,
    marginTop: 16,
  },
  botonReabastecer: { backgroundColor: COLORS.accent },
  tituloSeccion: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 20 },
  descripcion: { fontSize: 14, color: COLORS.text, lineHeight: 21, marginTop: 6 },
  filaPagos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chipPago: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textoPago: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  filaCompra: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24 },
  botonAgregar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS,
  },
  textoAgregar: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  avisoSinStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.warningLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  textoAviso: { flex: 1, color: COLORS.warning, fontWeight: '600' },
  botonEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
  },
  textoEliminar: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
});
