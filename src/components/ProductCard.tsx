// Tarjeta de producto para la cuadricula (CardComponent del wireframe)
// Recibe el producto y funciones por props; no modifica el estado por si misma
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';
import ProductImage from './ProductImage';
import { ofertaActiva, precioFinal } from '@/utils/precios';
import { vibrarToque } from '@/utils/feedback';
import type { Producto } from '@/types';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  producto: Producto;
  nombreTienda: string;
  ancho: number;
  esFavorito: boolean;
  onPress: () => void;
  onAgregar: () => void;
  onFavorito: () => void;
}

export default function ProductCard({
  producto,
  nombreTienda,
  ancho,
  esFavorito,
  onPress,
  onAgregar,
  onFavorito,
}: Props) {
  const agotado = producto.stock === 0;
  const enOferta = ofertaActiva(producto);
  const masVendido = (producto.vendidos ?? 0) >= 40;

  return (
    <Pressable
      onPress={() => {
        vibrarSeleccion();
        onPress();
      }}
      style={({ pressed }) => [styles.card, { width: ancho }, pressed && styles.presionada]}
    >
      <View>
        <ProductImage producto={producto} style={styles.imagen} iconSize={40} />
        <Pressable
          onPress={() => {
            vibrarToque();
            onFavorito();
          }}
          hitSlop={8}
          style={styles.botonFavorito}
          accessibilityLabel={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Ionicons
            name={esFavorito ? 'heart' : 'heart-outline'}
            size={18}
            color={esFavorito ? COLORS.danger : COLORS.text}
          />
        </Pressable>
        {/* Etiquetas de venta: descuento y mas vendido */}
        <View style={styles.etiquetasVenta}>
          {enOferta && producto.oferta && (
            <View style={styles.etiquetaOferta}>
              <Text style={styles.textoEtiquetaOferta}>-{producto.oferta.descuento}%</Text>
            </View>
          )}
          {masVendido && (
            <View style={styles.etiquetaVendido}>
              <Ionicons name="trending-up" size={10} color={COLORS.dark} />
              <Text style={styles.textoEtiquetaVendido}>TOP</Text>
            </View>
          )}
        </View>
        {agotado && (
          <View style={styles.etiquetaAgotado}>
            <Text style={styles.textoAgotado}>Agotado</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={2}>{producto.nombre}</Text>
        <Text style={styles.proveedor} numberOfLines={1}>{nombreTienda}</Text>
        <View style={styles.filaPrecio}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.precio, enOferta && { color: COLORS.oferta }]}>
              {formatearPrecio(precioFinal(producto))}
            </Text>
            {enOferta && <Text style={styles.precioViejo}>{formatearPrecio(producto.precio)}</Text>}
          </View>
          <Pressable
            onPress={onAgregar}
            disabled={agotado}
            hitSlop={6}
            style={[styles.botonAgregar, agotado && styles.botonDeshabilitado]}
            accessibilityLabel={`Agregar ${producto.nombre} al carrito`}
          >
            <Ionicons name="cart" size={16} color={COLORS.white} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    ...SHADOW,
  },
  presionada: { opacity: 0.75 },
  imagen: { width: '100%', aspectRatio: 1, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS },
  botonFavorito: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiquetaAgotado: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  textoAgotado: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  info: { padding: 10 },
  nombre: { fontSize: 14, fontWeight: '600', color: COLORS.text, minHeight: 36 },
  proveedor: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  filaPrecio: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  precio: { fontSize: 15, fontWeight: '800', color: COLORS.primaryDark },
  botonAgregar: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonDeshabilitado: { backgroundColor: COLORS.border },
  etiquetasVenta: { position: 'absolute', top: 8, left: 8, gap: 4 },
  etiquetaOferta: { backgroundColor: COLORS.oferta, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  textoEtiquetaOferta: { color: COLORS.white, fontWeight: '900', fontSize: 12 },
  etiquetaVendido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.amarillo,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  textoEtiquetaVendido: { color: COLORS.dark, fontWeight: '900', fontSize: 10 },
  precioViejo: { fontSize: 11, color: COLORS.textMuted, textDecorationLine: 'line-through' },
});
