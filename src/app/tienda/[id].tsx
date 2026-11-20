// Pagina de una TIENDA (ruta dinamica /tienda/[id])
// Muestra los datos de la tienda, sus formas de pago y TODOS sus productos
// Se abre desde los circulos de tiendas del Inicio o tocando el nombre de la tienda en un producto
import { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { CATEGORIAS, COLORS, RADIUS, SHADOW, SPACING, colorDeTexto } from '@/constants/theme';
import { ofertaActiva } from '@/utils/precios';
import { vibrarError, vibrarToque, conToque } from '@/utils/feedback';
import ProductCard from '@/components/ProductCard';
import TiendaAvatar from '@/components/TiendaAvatar';
import CategoryChips, { type OpcionChip } from '@/components/CategoryChips';
import EmptyState from '@/components/EmptyState';
import type { CategoriaId, Producto } from '@/types';

const GAP = 12;

export default function TiendaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { obtenerTienda, productos, miTienda, agregarAlCarrito, esFavorito, alternarFavorito } = useTienda();
  const [filtro, setFiltro] = useState<'todas' | CategoriaId>('todas');

  const tienda = obtenerTienda(id);
  if (!tienda) {
    return (
      <EmptyState
        icono="storefront-outline"
        titulo="Tienda no encontrada"
        accion={{ label: 'Volver', onPress: () => router.back() }}
      />
    );
  }

  const esMiTienda = tienda.id === miTienda?.id;
  const deLaTienda = productos.filter((p) => p.tiendaId === tienda.id);
  const lista = deLaTienda.filter((p) => filtro === 'todas' || p.categoria === filtro);
  const vendidos = deLaTienda.reduce((suma, p) => suma + (p.vendidos ?? 0), 0);
  const enOferta = deLaTienda.filter((p) => ofertaActiva(p)).length;
  const anchoTarjeta = (width - SPACING * 2 - GAP) / 2;
  const color = colorDeTexto(tienda.nombre);

  // Solo se muestran las categorias que esta tienda si vende
  const opciones: OpcionChip<'todas' | CategoriaId>[] = [
    { id: 'todas', label: `Todo (${deLaTienda.length})` },
    ...CATEGORIAS.filter((c) => deLaTienda.some((p) => p.categoria === c.id)),
  ];

  const formasPago = ['Tarjeta', 'Transferencia', ...(tienda.paypal ? ['PayPal'] : []), 'Contra entrega'];

  const agregar = (producto: Producto) => {
    if (agregarAlCarrito(producto.id)) {
      vibrarToque();
    } else {
      vibrarError();
      Alert.alert('Sin existencias', `Ya no hay más piezas disponibles de "${producto.nombre}".`);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: tienda.nombre }} />
      <FlatList
        data={lista}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Portada de la tienda con su color */}
            <LinearGradient colors={[color, COLORS.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.portada}>
              <TiendaAvatar nombre={tienda.nombre} tamano={64} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>{tienda.nombre}</Text>
                <Text style={styles.datos}>
                  {deLaTienda.length} {deLaTienda.length === 1 ? 'producto' : 'productos'} · {vendidos} vendidos
                  {enOferta > 0 ? ` · ${enOferta} en oferta` : ''}
                </Text>
                {esMiTienda && (
                  <View style={styles.etiquetaMia}>
                    <Text style={styles.textoMia}>TU TIENDA</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Formas de pago */}
            <View style={styles.pagos}>
              {formasPago.map((f) => (
                <View key={f} style={styles.chipPago}>
                  <Ionicons name="checkmark-circle" size={13} color={COLORS.accent} />
                  <Text style={styles.textoPago}>{f}</Text>
                </View>
              ))}
            </View>

            {esMiTienda && (
              <Pressable style={styles.botonPanel} onPress={conToque(() => router.navigate('/vender'))}>
                <Ionicons name="storefront" size={18} color={COLORS.white} />
                <Text style={styles.textoPanel}>Ir a mi panel de vendedor</Text>
              </Pressable>
            )}

            {deLaTienda.length > 0 && (
              <View style={{ marginVertical: 12 }}>
                <CategoryChips opciones={opciones} seleccionado={filtro} onSeleccionar={setFiltro} />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            producto={item}
            nombreTienda={tienda.nombre}
            ancho={anchoTarjeta}
            esFavorito={esFavorito(item.id)}
            onPress={() => router.push({ pathname: '/producto/[id]', params: { id: item.id } })}
            onAgregar={() => agregar(item)}
            onFavorito={() => alternarFavorito(item.id)}
          />
        )}
        ListEmptyComponent={
          esMiTienda ? (
            <EmptyState
              icono="cube-outline"
              titulo="Tu tienda aún no tiene productos"
              mensaje="Publica tu primer producto con foto para que los compradores lo vean"
              accion={{ label: 'Dar de alta producto', onPress: () => router.push('/alta-producto') }}
            />
          ) : (
            <EmptyState icono="cube-outline" titulo="Esta tienda aún no tiene productos" />
          )
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  lista: { padding: SPACING, paddingBottom: 32, gap: GAP, flexGrow: 1 },
  portada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: RADIUS + 4,
    padding: 18,
    ...SHADOW,
  },
  nombre: { color: COLORS.white, fontSize: 22, fontWeight: '900' },
  datos: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  etiquetaMia: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.amarillo,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
  },
  textoMia: { fontSize: 10, fontWeight: '900', color: COLORS.dark, letterSpacing: 0.5 },
  pagos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chipPago: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textoPago: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  botonPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS,
    paddingVertical: 12,
    marginTop: 12,
  },
  textoPanel: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
});
