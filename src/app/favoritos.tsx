// Favoritos (Wish List): reutiliza la misma tarjeta del catalogo
import { FlatList, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTienda } from '@/context/TiendaContext';
import { SPACING } from '@/constants/theme';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { vibrarError, vibrarToque, conToque } from '@/utils/feedback';

const GAP = 12;

export default function FavoritosScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { productos, favoritos, alternarFavorito, agregarAlCarrito, obtenerTienda } = useTienda();

  const lista = productos.filter((p) => favoritos.includes(p.id));
  const anchoTarjeta = (width - SPACING * 2 - GAP) / 2;

  return (
    <FlatList
      data={lista}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={styles.lista}
      renderItem={({ item }) => (
        <ProductCard
          producto={item}
          nombreTienda={obtenerTienda(item.tiendaId)?.nombre ?? 'Tienda'}
          ancho={anchoTarjeta}
          esFavorito
          onPress={() => router.push({ pathname: '/producto/[id]', params: { id: item.id } })}
          onFavorito={() => alternarFavorito(item.id)}
          onAgregar={() => {
            if (agregarAlCarrito(item.id)) {
              vibrarToque();
            } else {
              vibrarError();
              Alert.alert('Sin existencias', `Ya no hay más piezas de "${item.nombre}".`);
            }
          }}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icono="heart-outline"
          titulo="Tu Wish List está vacía"
          mensaje="Toca el corazón de un producto para guardarlo aquí"
          accion={{ label: 'Explorar catálogo', onPress: () => router.navigate('/') }}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: SPACING, paddingBottom: 32, gap: GAP, flexGrow: 1 },
});
