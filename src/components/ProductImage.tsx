// Muestra la imagen del producto, en este orden:
// 1) La foto que subio el proveedor (camara o galeria)
// 2) La imagen de ejemplo incluida en la app (se busca por el id del producto)
// 3) Si no hay ninguna, el icono de su categoria
// Se reutiliza en el catalogo, carrito, detalle, favoritos y mis productos
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, obtenerCategoria } from '@/constants/theme';
import { IMAGENES_EJEMPLO } from '@/data/imagenesEjemplo';
import type { Producto } from '@/types';

interface Props {
  producto: Pick<Producto, 'id' | 'imagen' | 'categoria'>;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}

export default function ProductImage({ producto, style, iconSize = 36 }: Props) {
  // La imagen de ejemplo NO se guarda en los datos: se busca aqui cada vez,
  // asi funciona aunque los productos se hayan guardado antes de agregar las fotos
  const fuente =
    typeof producto.imagen === 'string'
      ? { uri: producto.imagen } // foto tomada con la camara o galeria
      : IMAGENES_EJEMPLO[producto.id]; // imagen incluida en la app (require)

  if (fuente) {
    return (
      <View style={[styles.base, style]}>
        <Image
          source={fuente}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>
    );
  }

  const categoria = obtenerCategoria(producto.categoria);
  return (
    <View style={[styles.base, styles.vacia, style]}>
      <Ionicons name={categoria.icon} size={iconSize} color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: COLORS.primaryLight },
  vacia: { alignItems: 'center', justifyContent: 'center' },
});
