// Pantalla Principal (Inicio) con diseno de tienda en linea:
// 1) Encabezado con degradado, carrito y busqueda
// 2) Carrusel de anuncios que cambia solo
// 3) Categorias en circulos (Todo, Abarrotes, Limpieza...)
// 4) Tiendas en circulos: cada una abre su pagina con todos sus productos
// 5) "Ofertas relampago" con cuenta regresiva
// 6) "Lo mas vendido"
// 7) Catalogo completo en cuadricula (con la celda "+" del wireframe)
import { useRef, useState, type ReactNode } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEnfocada } from '@/hooks/useEnfocada';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { CATEGORIAS, COLORS, DEGRADADOS, RADIUS, SHADOW, SPACING, type IconName } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';
import { ENVIO_GRATIS_DESDE } from '@/utils/envio';
import { ofertaActiva, precioFinal } from '@/utils/precios';
import { vibrarError, vibrarSeleccion, vibrarToque, conToque } from '@/utils/feedback';
import { useAhora } from '@/hooks/useAhora';
import TiendaAvatar from '@/components/TiendaAvatar';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import ProductCardMini from '@/components/ProductCardMini';
import AddProductCard from '@/components/AddProductCard';
import PromoCarousel, { type Banner } from '@/components/PromoCarousel';
import CuentaRegresiva from '@/components/CuentaRegresiva';
import EmptyState from '@/components/EmptyState';
import type { CategoriaId, Producto } from '@/types';

type Filtro = 'todas' | CategoriaId;

const OPCIONES_CATEGORIA: { id: Filtro; label: string; icon: IconName }[] = [
  { id: 'todas', label: 'Todo', icon: 'apps' },
  ...CATEGORIAS,
];

// Cada celda de la cuadricula puede ser un producto o el boton "+"
type Celda = { tipo: 'producto'; producto: Producto } | { tipo: 'agregar' };

const GAP = 12;

// Titulo de cada seccion con icono y un boton opcional "Ver todo"
function TituloSeccion({
  icono,
  color,
  titulo,
  extra,
  onVerTodo,
}: {
  icono: IconName;
  color: string;
  titulo: string;
  extra?: ReactNode;
  onVerTodo?: () => void;
}) {
  return (
    <View style={styles.tituloSeccion}>
      <View style={[styles.iconoSeccion, { backgroundColor: color }]}>
        <Ionicons name={icono} size={16} color={COLORS.white} />
      </View>
      <Text style={styles.textoSeccion}>{titulo}</Text>
      {extra}
      <View style={{ flex: 1 }} />
      {onVerTodo && (
        <Pressable onPress={onVerTodo} hitSlop={8}>
          <Text style={styles.verTodo}>Ver todo</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { productos, tiendas, miTienda, totalArticulos, obtenerTienda, agregarAlCarrito, esFavorito, alternarFavorito } =
    useTienda();
  const ahora = useAhora(30000); // se recalculan las ofertas vigentes cada 30 s
  const enfocada = useEnfocada(); // para poner la barra de estado en blanco solo en esta pestana

  // Estado local: solo le importa a esta pantalla
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const anchoTarjeta = (width - SPACING * 2 - GAP) / 2;
  const nombreTienda = (tiendaId: string) => obtenerTienda(tiendaId)?.nombre ?? 'Tienda';

  // ---------- Secciones de venta (valores derivados) ----------
  const enOferta = productos
    .filter((p) => ofertaActiva(p, ahora) && p.stock > 0)
    .sort((a, b) => (b.oferta?.descuento ?? 0) - (a.oferta?.descuento ?? 0));
  const masVendidos = [...productos].sort((a, b) => (b.vendidos ?? 0) - (a.vendidos ?? 0)).slice(0, 6);
  // La oferta que termina mas pronto (para el reloj del titulo)
  const terminaPrimero = [...enOferta].sort(
    (a, b) => new Date(a.oferta?.hasta ?? 0).getTime() - new Date(b.oferta?.hasta ?? 0).getTime()
  )[0];

  const verProducto = (id: string) => router.push({ pathname: '/producto/[id]', params: { id } });

  // Anuncios del carrusel: las 2 mejores ofertas + promociones fijas
  const banners: Banner[] = [
    ...enOferta.slice(0, 2).map(
      (p, i): Banner => ({
        id: `oferta-${p.id}`,
        etiqueta: i === 0 ? 'OFERTA RELÁMPAGO' : 'POR TIEMPO LIMITADO',
        titulo: `-${p.oferta?.descuento}% en ${p.nombre}`,
        subtitulo: `Ahora ${formatearPrecio(precioFinal(p))} · antes ${formatearPrecio(p.precio)}`,
        boton: 'Comprar ya',
        icono: i === 0 ? 'flash' : 'pricetags',
        colores: i === 0 ? DEGRADADOS.oferta : DEGRADADOS.noche,
        onPress: () => verProducto(p.id),
      })
    ),
    {
      id: 'envio',
      etiqueta: 'ENVÍO GRATIS',
      titulo: `Envío gratis desde ${formatearPrecio(ENVIO_GRATIS_DESDE)}`,
      subtitulo: 'Por tienda. Junta productos del mismo proveedor y ahorra.',
      boton: 'Ver ofertas',
      icono: 'rocket',
      colores: DEGRADADOS.principal,
      onPress: () => router.navigate('/ofertas'),
    },
    {
      id: 'vende',
      etiqueta: 'PARA PROVEEDORES',
      titulo: '¿Tienes un negocio? Vende aquí',
      subtitulo: 'Registra tu tienda gratis, publica productos y pon tus propias ofertas.',
      boton: miTienda ? 'Publicar producto' : 'Registrar tienda',
      icono: 'storefront',
      colores: DEGRADADOS.verde,
      onPress: () => router.push(miTienda ? '/alta-producto' : '/mi-tienda'),
    },
  ];

  // ---------- Catalogo con filtros ----------
  const texto = busqueda.trim().toLowerCase();
  const filtrados = productos.filter((p) => {
    const coincideTexto =
      p.nombre.toLowerCase().includes(texto) || nombreTienda(p.tiendaId).toLowerCase().includes(texto);
    const coincideCategoria = filtro === 'todas' || p.categoria === filtro;
    return coincideTexto && coincideCategoria;
  });
  const hayFiltros = texto.length > 0 || filtro !== 'todas';

  const celdas: Celda[] = filtrados.map((producto) => ({ tipo: 'producto' as const, producto }));
  if (!hayFiltros) celdas.push({ tipo: 'agregar' });

  const agregar = (producto: Producto) => {
    if (agregarAlCarrito(producto.id)) {
      vibrarToque();
    } else {
      vibrarError();
      Alert.alert('Sin existencias', `Ya no hay más piezas disponibles de "${producto.nombre}".`);
    }
  };

  // Al filtrar se ocultan los anuncios y la lista se hace mas corta: se regresa arriba
  // para que los resultados queden a la vista (antes la pantalla podia quedar en blanco)
  const lista = useRef<FlatList<Celda>>(null);
  const subir = () => lista.current?.scrollToOffset({ offset: 0, animated: true });

  const elegirCategoria = (id: Filtro) => {
    vibrarSeleccion();
    setFiltro(id);
    subir();
  };

  const abrirTienda = (id: string) => {
    vibrarSeleccion();
    router.push({ pathname: '/tienda/[id]', params: { id } });
  };

  const renderCelda = ({ item }: { item: Celda }) => {
    if (item.tipo === 'agregar') {
      return <AddProductCard ancho={anchoTarjeta} onPress={() => router.push('/alta-producto')} />;
    }
    const { producto } = item;
    return (
      <ProductCard
        producto={producto}
        nombreTienda={nombreTienda(producto.tiendaId)}
        ancho={anchoTarjeta}
        esFavorito={esFavorito(producto.id)}
        onPress={() => verProducto(producto.id)}
        onAgregar={() => agregar(producto)}
        onFavorito={() => alternarFavorito(producto.id)}
      />
    );
  };

  // Mientras se busca o filtra, se ocultan los anuncios para enfocarse en resultados
  const mostrarSeccionesVenta = !hayFiltros;

  return (
    <View style={styles.contenedor}>
      {enfocada && <StatusBar style="light" />}
      {/* ---------- Encabezado con degradado ---------- */}
      <LinearGradient colors={DEGRADADOS.principal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.encabezado}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saludo}>Compra directo al proveedor</Text>
              <Text style={styles.marca}>UNPROV</Text>
            </View>
            <Pressable
              style={styles.botonHeader}
              onPress={() => {
                vibrarSeleccion();
                router.navigate('/carrito');
              }}
              accessibilityLabel="Ir al carrito"
            >
              <Ionicons name="cart" size={22} color={COLORS.white} />
              {totalArticulos > 0 && (
                <View style={styles.badgeCarrito}>
                  <Text style={styles.textoBadgeCarrito}>{totalArticulos}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.botonHeader}
              onPress={() => {
                vibrarSeleccion();
                router.navigate('/cuenta');
              }}
              accessibilityLabel="Abrir mi cuenta"
            >
              <Ionicons name="person" size={20} color={COLORS.white} />
            </Pressable>
          </View>
          <View style={styles.buscador}>
            <SearchBar
              value={busqueda}
              onChangeText={(t) => {
                setBusqueda(t);
                subir();
              }}
              placeholder="Buscar producto o tienda"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Franja amarilla de beneficios */}
      <View style={styles.franja}>
        <Ionicons name="flash" size={14} color={COLORS.dark} />
        <Text style={styles.textoFranja} numberOfLines={1}>
          Hasta -{enOferta[0]?.oferta?.descuento ?? 0}% hoy · Envío gratis desde {formatearPrecio(ENVIO_GRATIS_DESDE)} ·
          Tarjeta, SPEI, PayPal o efectivo
        </Text>
      </View>

      <FlatList
        ref={lista}
        data={celdas}
        keyExtractor={(item) => (item.tipo === 'agregar' ? 'agregar' : item.producto.id)}
        renderItem={renderCelda}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {mostrarSeccionesVenta && (
              <View style={{ marginTop: 14 }}>
                <PromoCarousel banners={banners} />
              </View>
            )}

            {/* Categorias en circulos */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaCategorias}>
              {OPCIONES_CATEGORIA.map((c) => {
                const activa = filtro === c.id;
                return (
                  <Pressable key={c.id} style={styles.categoria} onPress={() => elegirCategoria(c.id)}>
                    <View style={[styles.circuloCategoria, activa && styles.circuloActivo]}>
                      <Ionicons name={c.icon} size={22} color={activa ? COLORS.white : COLORS.primary} />
                    </View>
                    <Text style={[styles.textoCategoria, activa && styles.textoCategoriaActiva]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Tiendas (siempre visibles, debajo de las categorias):
                cada circulo abre la pagina de esa tienda con todos sus productos */}
            <TituloSeccion icono="storefront" color={COLORS.accent} titulo="Tiendas" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaTiendas}>
              {tiendas.map((t) => (
                <Pressable key={t.id} style={styles.tienda} onPress={() => abrirTienda(t.id)}>
                  <TiendaAvatar nombre={t.nombre} tamano={52} activo={t.id === miTienda?.id} />
                  <Text style={styles.nombreTienda} numberOfLines={2}>
                    {t.nombre}
                  </Text>
                  <Text style={styles.cuentaTienda}>
                    {productos.filter((p) => p.tiendaId === t.id).length} prod.
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Ofertas relampago */}
            {mostrarSeccionesVenta && enOferta.length > 0 && (
              <>
                <TituloSeccion
                  icono="flash"
                  color={COLORS.oferta}
                  titulo="Ofertas relámpago"
                  extra={terminaPrimero?.oferta ? <CuentaRegresiva hasta={terminaPrimero.oferta.hasta} compacto /> : null}
                  onVerTodo={() => router.navigate('/ofertas')}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaMini}>
                  {enOferta.map((p) => (
                    <ProductCardMini key={p.id} producto={p} onPress={() => verProducto(p.id)} onAgregar={() => agregar(p)} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Lo mas vendido */}
            {mostrarSeccionesVenta && (
              <>
                <TituloSeccion icono="trophy" color={COLORS.amarillo} titulo="Lo más vendido" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaMini}>
                  {masVendidos.map((p, i) => (
                    <ProductCardMini
                      key={p.id}
                      producto={p}
                      posicion={i + 1}
                      onPress={() => verProducto(p.id)}
                      onAgregar={() => agregar(p)}
                    />
                  ))}
                </ScrollView>
              </>
            )}


            <TituloSeccion
              icono="grid"
              color={COLORS.primary}
              titulo={hayFiltros ? `Resultados (${filtrados.length})` : 'Todos los productos'}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icono="search-outline"
            titulo="Sin resultados"
            mensaje="Prueba con otra búsqueda, tienda o categoría"
            accion={{
              label: 'Limpiar filtros',
              onPress: () => {
                setBusqueda('');
                setFiltro('todas');
              },
            }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORS.background },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING,
    paddingTop: 6,
  },
  saludo: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  marca: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: 1.5 },
  botonHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCarrito: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.amarillo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBadgeCarrito: { fontSize: 10, fontWeight: '900', color: COLORS.dark },
  buscador: { flexDirection: 'row', paddingHorizontal: SPACING, paddingTop: 12, paddingBottom: 14 },
  franja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.amarillo,
    paddingHorizontal: SPACING,
    paddingVertical: 7,
  },
  textoFranja: { flex: 1, fontSize: 12, fontWeight: '800', color: COLORS.dark },
  filaCategorias: { gap: 14, paddingVertical: 16, paddingRight: SPACING },
  categoria: { alignItems: 'center', width: 64, gap: 6 },
  circuloCategoria: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  circuloActivo: { backgroundColor: COLORS.primary },
  textoCategoria: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  textoCategoriaActiva: { color: COLORS.primary, fontWeight: '900' },
  tituloSeccion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12 },
  iconoSeccion: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  textoSeccion: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  verTodo: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  filaMini: { gap: 12, paddingBottom: 18, paddingRight: SPACING, paddingTop: 2 },
  filaTiendas: { gap: 14, paddingRight: SPACING, paddingBottom: 18 },
  tienda: { alignItems: 'center', width: 64, gap: 6 },
  todas: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  todasActiva: { backgroundColor: COLORS.primary, borderColor: COLORS.dark },
  nombreTienda: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
  nombreActivo: { color: COLORS.text, fontWeight: '800' },
  cuentaTienda: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700' },
  lista: { paddingHorizontal: SPACING, paddingBottom: 24, gap: GAP },
});
