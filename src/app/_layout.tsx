// Layout raiz de la app
// 1) Envuelve todo con TiendaProvider para compartir el estado global
// 2) Define un Stack: el grupo (tabs) es la base y encima se abren las demas pantallas
// 3) Configura las notificaciones y abre el seguimiento cuando el usuario toca una
// 4) Muestra una pantalla de carga mientras se leen los datos guardados
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { TiendaProvider, useTienda } from '@/context/TiendaContext';
import { COLORS } from '@/constants/theme';
import { configurarNotificaciones } from '@/utils/notificaciones';
import { precargarSonidos } from '@/utils/sonido';

function Navegacion() {
  const { cargando } = useTienda();

  useEffect(() => {
    configurarNotificaciones();
    precargarSonidos(); // deja listos todos los sonidos de la app

    // Al tocar una notificacion de pedido, se abre su seguimiento
    const suscripcion = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      const pedidoId = respuesta.notification.request.content.data?.pedidoId;
      if (typeof pedidoId === 'string') {
        router.push({ pathname: '/pedido/[id]', params: { id: pedidoId } });
      }
    });
    return () => suscripcion.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.primary,
          headerTitleStyle: { fontWeight: '700', color: COLORS.text },
          headerShadowVisible: false,
          headerBackTitle: 'Atrás',
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="producto/[id]" options={{ title: 'Producto' }} />
        <Stack.Screen name="alta-producto" options={{ title: 'Dar de alta producto', presentation: 'modal' }} />
        <Stack.Screen name="mis-productos" options={{ title: 'Mis productos' }} />
        <Stack.Screen name="mis-compras" options={{ title: 'Mis compras' }} />
        <Stack.Screen name="favoritos" options={{ title: 'Favoritos' }} />
        <Stack.Screen name="checkout" options={{ title: 'Pagar' }} />
        <Stack.Screen name="pedido/[id]" options={{ title: 'Seguimiento' }} />
        <Stack.Screen name="ventas" options={{ title: 'Pedidos recibidos' }} />
        <Stack.Screen name="entrega/[id]" options={{ title: 'Confirmar entrega', presentation: 'modal' }} />
        <Stack.Screen name="mi-tienda" options={{ title: 'Mi tienda', presentation: 'modal' }} />
        <Stack.Screen name="oferta/[id]" options={{ title: 'Poner en oferta', presentation: 'modal' }} />
        <Stack.Screen name="tienda/[id]" options={{ title: 'Tienda' }} />
      </Stack>

      {/* Capa de carga encima de todo mientras se leen los datos guardados */}
      {cargando && (
        <View style={styles.carga}>
          <Text style={styles.marca}>UNPROV</Text>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <TiendaProvider>
      <Navegacion />
    </TiendaProvider>
  );
}

const styles = StyleSheet.create({
  carga: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  marca: { color: COLORS.white, fontSize: 36, fontWeight: '900', letterSpacing: 3 },
});
