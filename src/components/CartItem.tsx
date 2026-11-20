// Renglon del carrito: imagen (ARTICULO), descripcion y control de cantidad
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';
import ProductImage from './ProductImage';
import QuantityControl from './QuantityControl';
import { ofertaActiva, precioFinal } from '@/utils/precios';
import type { Producto } from '@/types';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  producto: Producto;
  cantidad: number;
  onPress: () => void;
  onRestar: () => void;
  onSumar: () => void;
}

export default function CartItem({ producto, cantidad, onPress, onRestar, onSumar }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => {
          vibrarSeleccion();
          onPress();
        }}
      >
        <ProductImage producto={producto} style={styles.imagen} iconSize={30} />
      </Pressable>

      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>{producto.nombre}</Text>
        <Text style={styles.descripcion} numberOfLines={2}>{producto.descripcion}</Text>
        <Text style={styles.unitario}>
          {formatearPrecio(precioFinal(producto))} c/u
          {ofertaActiva(producto) && producto.oferta ? `  ·  -${producto.oferta.descuento}% aplicado` : ''}
        </Text>

        <View style={styles.filaInferior}>
          <QuantityControl cantidad={cantidad} max={producto.stock} onRestar={onRestar} onSumar={onSumar} />
          <Text style={styles.subtotal}>{formatearPrecio(precioFinal(producto) * cantidad)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    ...SHADOW,
  },
  imagen: { width: 88, height: 88, borderRadius: 12 },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  descripcion: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  unitario: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  filaInferior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  subtotal: { fontSize: 15, fontWeight: '800', color: COLORS.primaryDark },
});
