// Pestana MI CUENTA (vista del COMPRADOR)
// Todo lo que tiene que ver con comprar: compras, envios, favoritos, ayuda
// Lo del vendedor esta en su propia pestana (vender.tsx)
// Los numeros salen de utils/estadisticas.ts, igual que en "Mis compras", para que coincidan
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, DEGRADADOS, RADIUS, SHADOW, SPACING, type IconName } from '@/constants/theme';
import { resumenComprador } from '@/utils/estadisticas';
import { vibrarAviso, vibrarSeleccion } from '@/utils/feedback';
import { useEnfocada } from '@/hooks/useEnfocada';
import MenuItem from '@/components/MenuItem';

// Cuadro con un numero y su etiqueta (se puede tocar)
function Dato({ valor, etiqueta, icono, color, onPress }: {
  valor: number;
  etiqueta: string;
  icono: IconName;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.dato, pressed && { opacity: 0.7 }]}
      onPress={() => {
        vibrarSeleccion();
        onPress();
      }}
    >
      <View style={[styles.iconoDato, { backgroundColor: color }]}>
        <Ionicons name={icono} size={16} color={COLORS.white} />
      </View>
      <Text style={styles.valorDato}>{valor}</Text>
      <Text style={styles.etiquetaDato}>{etiqueta}</Text>
    </Pressable>
  );
}

export default function CuentaScreen() {
  const router = useRouter();
  const enfocada = useEnfocada();
  const { compras, favoritos, totalArticulos, restablecerDatos } = useTienda();
  const r = resumenComprador(compras);

  const irACompras = () => router.push('/mis-compras');

  const confirmarRestablecer = () => {
    Alert.alert(
      'Restablecer datos',
      'Se borrarán tu tienda, productos, carrito y compras guardados en este teléfono. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            vibrarAviso();
            restablecerDatos();
          },
        },
      ]
    );
  };

  const mostrarAyuda = () => {
    Alert.alert(
      'Ayuda para compradores',
      '• Agrega productos de varias tiendas a tu carrito y paga todo junto.\n\n' +
        '• Una COMPRA se divide en un PEDIDO por cada tienda (cada una envía lo suyo).\n\n' +
        '• Con transferencia o PayPal verás "Por pagar" hasta que la tienda confirme tu pago.\n\n' +
        '• Al recibir, da tu código de entrega o firma parecido a como firmaste al comprar.'
    );
  };

  return (
    <View style={styles.contenedor}>
      {enfocada && <StatusBar style="light" />}
      <LinearGradient colors={DEGRADADOS.principal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.encabezado}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rol}>COMPRADOR</Text>
              <Text style={styles.titulo}>Mi cuenta</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.contenido}>
        {/* Resumen: se explica la diferencia compra / pedido para que los numeros se entiendan */}
        <View style={styles.tarjetaResumen}>
          <Text style={styles.textoResumen}>
            {r.compras} {r.compras === 1 ? 'compra' : 'compras'} · {r.pedidos}{' '}
            {r.pedidos === 1 ? 'pedido' : 'pedidos'} (uno por tienda)
          </Text>
          <View style={styles.filaDatos}>
            <Dato valor={r.porPagar} etiqueta="Por pagar" icono="hourglass" color={COLORS.warning} onPress={irACompras} />
            <Dato valor={r.enCamino} etiqueta="En camino" icono="bicycle" color={COLORS.primary} onPress={irACompras} />
            <Dato valor={r.entregados} etiqueta="Entregados" icono="checkmark-done" color={COLORS.accent} onPress={irACompras} />
          </View>
        </View>

        <Text style={styles.seccion}>Mis compras</Text>
        <View style={styles.tarjeta}>
          <MenuItem
            icono="receipt-outline"
            label="Compras y envíos"
            contador={r.activos}
            onPress={irACompras}
          />
          <MenuItem icono="cart-outline" label="Mi carrito" contador={totalArticulos} onPress={() => router.navigate('/carrito')} />
          <MenuItem icono="heart-outline" label="Favoritos" contador={favoritos.length} ultimo onPress={() => router.push('/favoritos')} />
        </View>
        <Text style={styles.nota}>El número junto a "Compras y envíos" son tus pedidos activos (por pagar + en camino).</Text>

        <Text style={styles.seccion}>Ayuda y configuración</Text>
        <View style={styles.tarjeta}>
          <MenuItem icono="help-circle-outline" label="Ayuda" onPress={mostrarAyuda} />
          <MenuItem icono="refresh-circle-outline" label="Restablecer datos de demostración" ultimo onPress={confirmarRestablecer} />
        </View>

        {/* Acceso al otro rol */}
        <Pressable
          style={({ pressed }) => [styles.cambio, pressed && { opacity: 0.8 }]}
          onPress={() => {
            vibrarSeleccion();
            router.navigate('/vender');
          }}
        >
          <Ionicons name="storefront" size={22} color={COLORS.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloCambio}>¿También vendes?</Text>
            <Text style={styles.textoCambio}>Ve a tu panel de vendedor</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
        </Pressable>

        <Text style={styles.version}>UNPROV · Unión de Proveedores · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORS.background },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: SPACING, paddingBottom: 22 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rol: { color: COLORS.amarillo, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  titulo: { color: COLORS.white, fontSize: 26, fontWeight: '900' },
  contenido: { padding: SPACING, paddingBottom: 32 },
  tarjetaResumen: { backgroundColor: COLORS.card, borderRadius: RADIUS, padding: 14, marginTop: -6, ...SHADOW },
  textoResumen: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  filaDatos: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dato: { flex: 1, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, paddingVertical: 12 },
  iconoDato: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  valorDato: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginTop: 6 },
  etiquetaDato: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  seccion: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 8,
  },
  tarjeta: { backgroundColor: COLORS.card, borderRadius: RADIUS, ...SHADOW },
  nota: { fontSize: 11, color: COLORS.textMuted, marginTop: 6, marginHorizontal: 4 },
  cambio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
  },
  tituloCambio: { fontSize: 14, fontWeight: '900', color: COLORS.accent },
  textoCambio: { fontSize: 12, color: COLORS.accent },
  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 28 },
});
