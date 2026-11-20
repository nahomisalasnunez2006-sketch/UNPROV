// Barra de navegacion inferior (TabBar): Inicio, Ofertas, Carrito, Mi cuenta (comprador) y Vender (vendedor)
// Comprador y vendedor son pantallas INDEPENDIENTES, cada una con su pestana
// - Ofertas muestra cuantos productos tienen descuento vigente
// - Carrito muestra el numero de articulos agregados
// - Cada vez que se toca una pestana, el telefono da un toque suave (expo-haptics)
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useTienda } from '@/context/TiendaContext';
import { ofertaActiva } from '@/utils/precios';
import { vibrarSeleccion } from '@/utils/feedback';
import { resumenComprador, resumenVendedor } from '@/utils/estadisticas';

export default function TabsLayout() {
  const { totalArticulos, productos, compras, pedidosRecibidos, esMio } = useTienda();
  const ofertasActivas = productos.filter((p) => ofertaActiva(p)).length;
  // Los mismos numeros que se ven dentro de cada pantalla
  const comprador = resumenComprador(compras);
  const vendedor = resumenVendedor(
    pedidosRecibidos.map((x) => x.pedido),
    productos.filter(esMio)
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // cada pantalla dibuja su propio encabezado
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        sceneStyle: { backgroundColor: COLORS.background },
      }}
      screenListeners={{ tabPress: () => vibrarSeleccion() }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ofertas"
        options={{
          title: 'Ofertas',
          tabBarActiveTintColor: COLORS.oferta,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'flame' : 'flame-outline'} size={size} color={focused ? COLORS.oferta : color} />
          ),
          tabBarBadge: ofertasActivas > 0 ? ofertasActivas : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.oferta },
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
          ),
          tabBarBadge: totalArticulos > 0 ? totalArticulos : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.danger },
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: 'Mi cuenta',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
          ),
          // pedidos activos del comprador (por pagar + en camino)
          tabBarBadge: comprador.activos > 0 ? comprador.activos : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.primary },
        }}
      />
      <Tabs.Screen
        name="vender"
        options={{
          title: 'Vender',
          tabBarActiveTintColor: COLORS.accent,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={size} color={focused ? COLORS.accent : color} />
          ),
          // pedidos que requieren al vendedor (por cobrar + por atender)
          tabBarBadge: vendedor.pendientes > 0 ? vendedor.pendientes : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.accent },
        }}
      />
    </Tabs>
  );
}
