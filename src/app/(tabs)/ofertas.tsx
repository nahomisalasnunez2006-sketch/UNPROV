// Pestana OFERTAS: todos los productos con descuento vigente
// Se pueden ordenar por mayor descuento, menor precio o los que terminan pronto
// Los proveedores ven un acceso directo para poner ofertas a sus productos
import { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEnfocada } from '@/hooks/useEnfocada';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, DEGRADADOS, RADIUS, SPACING } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';
import { ahorro, ofertaActiva, precioFinal } from '@/utils/precios';
import { vibrarError, vibrarToque, conToque } from '@/utils/feedback';
import { useAhora } from '@/hooks/useAhora';
import ProductCard from '@/components/ProductCard';
import CategoryChips, { type OpcionChip } from '@/components/CategoryChips';
import CuentaRegresiva from '@/components/CuentaRegresiva';
import EmptyState from '@/components/EmptyState';
import type { Producto } from '@/types';

type Orden = 'descuento' | 'precio' | 'termina';

const ORDENES: OpcionChip<Orden>[] = [
  { id: 'descuento', label: 'Mayor descuento', icon: 'flame-outline' },
  { id: 'precio', label: 'Menor precio', icon: 'cash-outline' },
  { id: 'termina', label: 'Terminan pronto', icon: 'time-outline' },
];

const GAP = 12;

export default function OfertasScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const enfocada = useEnfocada();
  const ahora = useAhora(30000);
  const { productos, miTienda, obtenerTienda, agregarAlCarrito, esFavorito, alternarFavorito } = useTienda();
  const [orden, setOrden] = useState<Orden>('descuento');

  const anchoTarjeta = (width - SPACING * 2 - GAP) / 2;

  // Copia + sort para no modificar la lista original
  const ofertas = productos
    .filter((p) => ofertaActiva(p, ahora))
    .sort((a, b) => {
      if (orden === 'precio') return precioFinal(a) - precioFinal(b);
      if (orden === 'termina') return new Date(a.oferta?.hasta ?? 0).getTime() - new Date(b.oferta?.hasta ?? 0).getTime();
      return (b.oferta?.descuento ?? 0) - (a.oferta?.descuento ?? 0);
    });

  const ahorroTotal = ofertas.reduce((suma, p) => suma + ahorro(p), 0);
  const mayorDescuento = Math.max(0, ...ofertas.map((p) => p.oferta?.descuento ?? 0));
  const terminaPrimero = [...ofertas].sort(
    (a, b) => new Date(a.oferta?.hasta ?? 0).getTime() - new Date(b.oferta?.hasta ?? 0).getTime()
  )[0];

  const agregar = (producto: Producto) => {
    if (agregarAlCarrito(producto.id)) {
      vibrarToque();
    } else {
      vibrarError();
      Alert.alert('Sin existencias', `Ya no hay más piezas disponibles de "${producto.nombre}".`);
    }
  };

  return (
    <View style={styles.contenedor}>
      {enfocada && <StatusBar style="light" />}
      <LinearGradient colors={DEGRADADOS.oferta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.encabezado}>
            <View style={styles.circulo} />
            <View style={styles.filaTitulo}>
              <Ionicons name="flame" size={30} color={COLORS.amarillo} />
              <Text style={styles.titulo}>Ofertas</Text>
            </View>
            <Text style={styles.subtitulo}>
              {ofertas.length} productos con descuento · hasta -{mayorDescuento}%
            </Text>
            {terminaPrimero?.oferta && (
              <View style={styles.reloj}>
                <Text style={styles.textoReloj}>La próxima termina en</Text>
                <CuentaRegresiva hasta={terminaPrimero.oferta.hasta} claro />
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={ofertas}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Acceso para proveedores */}
            <Pressable
              style={styles.proveedor}
              onPress={() => {
                vibrarToque();
                router.navigate('/vender');
              }}
            >
              <Ionicons name="megaphone" size={22} color={COLORS.oferta} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloProveedor}>¿Eres proveedor?</Text>
                <Text style={styles.textoProveedor}>
                  {miTienda ? 'Pon en oferta tus productos desde Mis productos' : 'Registra tu tienda y publica tus ofertas'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.oferta} />
            </Pressable>

            {ofertas.length > 0 && (
              <View style={styles.ahorro}>
                <Ionicons name="wallet" size={18} color={COLORS.accent} />
                <Text style={styles.textoAhorro}>
                  Ahorra hasta {formatearPrecio(ahorroTotal)} si compras una pieza de cada oferta
                </Text>
              </View>
            )}

            <View style={{ marginVertical: 12 }}>
              <CategoryChips opciones={ORDENES} seleccionado={orden} onSeleccionar={setOrden} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            producto={item}
            nombreTienda={obtenerTienda(item.tiendaId)?.nombre ?? 'Tienda'}
            ancho={anchoTarjeta}
            esFavorito={esFavorito(item.id)}
            onPress={() => router.push({ pathname: '/producto/[id]', params: { id: item.id } })}
            onAgregar={() => agregar(item)}
            onFavorito={() => alternarFavorito(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icono="pricetags-outline"
            titulo="No hay ofertas activas"
            mensaje="Vuelve pronto: los proveedores publican ofertas nuevas cada semana"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORS.background },
  encabezado: { paddingHorizontal: SPACING, paddingTop: 8, paddingBottom: 18, overflow: 'hidden' },
  circulo: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  subtitulo: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  reloj: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },
  textoReloj: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  lista: { paddingHorizontal: SPACING, paddingBottom: 28, gap: GAP, flexGrow: 1 },
  proveedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.ofertaLight,
    borderRadius: RADIUS,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.oferta,
    borderStyle: 'dashed',
  },
  tituloProveedor: { fontSize: 14, fontWeight: '900', color: COLORS.ofertaDark },
  textoProveedor: { fontSize: 12, color: COLORS.ofertaDark },
  ahorro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  textoAhorro: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.accent },
});
