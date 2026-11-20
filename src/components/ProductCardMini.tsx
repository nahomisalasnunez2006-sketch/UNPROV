// Tarjeta pequena para filas horizontales ("Ofertas relampago" y "Lo mas vendido")
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';
import { ofertaActiva, precioFinal } from '@/utils/precios';
import ProductImage from './ProductImage';
import CuentaRegresiva from './CuentaRegresiva';
import type { Producto } from '@/types';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  producto: Producto;
  posicion?: number; // si viene, muestra el lugar en "mas vendidos" (1, 2, 3...)
  onPress: () => void;
  onAgregar: () => void;
}

export default function ProductCardMini({ producto, posicion, onPress, onAgregar }: Props) {
  const enOferta = ofertaActiva(producto);
  const agotado = producto.stock === 0;

  return (
    <Pressable
      onPress={() => {
        vibrarSeleccion();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
      <View>
        <ProductImage producto={producto} style={styles.imagen} iconSize={34} />
        {enOferta && producto.oferta && (
          <View style={styles.descuento}>
            <Text style={styles.textoDescuento}>-{producto.oferta.descuento}%</Text>
          </View>
        )}
        {posicion !== undefined && (
          <View style={styles.lugar}>
            <Text style={styles.textoLugar}>#{posicion}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={2}>{producto.nombre}</Text>
        <Text style={[styles.precio, enOferta && { color: COLORS.oferta }]}>{formatearPrecio(precioFinal(producto))}</Text>
        {enOferta ? (
          <Text style={styles.precioViejo}>{formatearPrecio(producto.precio)}</Text>
        ) : (
          <Text style={styles.vendidos}>{producto.vendidos ?? 0} vendidos</Text>
        )}
        {enOferta && producto.oferta && (
          <View style={{ marginTop: 4 }}>
            <CuentaRegresiva hasta={producto.oferta.hasta} compacto />
          </View>
        )}
      </View>
      <Pressable
        onPress={onAgregar}
        disabled={agotado}
        style={[styles.agregar, agotado && { backgroundColor: COLORS.border }]}
        hitSlop={6}
        accessibilityLabel={`Agregar ${producto.nombre} al carrito`}
      >
        <Ionicons name="add" size={18} color={COLORS.white} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 150, backgroundColor: COLORS.card, borderRadius: RADIUS, ...SHADOW },
  imagen: { width: 150, height: 120, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS },
  descuento: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.oferta,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  textoDescuento: { color: COLORS.white, fontWeight: '900', fontSize: 12 },
  lugar: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.amarillo,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  textoLugar: { color: COLORS.dark, fontWeight: '900', fontSize: 12 },
  info: { padding: 10, paddingBottom: 12 },
  nombre: { fontSize: 13, fontWeight: '600', color: COLORS.text, minHeight: 34 },
  precio: { fontSize: 16, fontWeight: '900', color: COLORS.primaryDark, marginTop: 4 },
  precioViejo: { fontSize: 11, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  vendidos: { fontSize: 11, color: COLORS.textMuted },
  agregar: {
    position: 'absolute',
    right: 8,
    top: 92,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
