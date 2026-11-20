// Poner oferta (vista del PROVEEDOR)
// El proveedor elige el % de descuento y cuantos dias dura; ve el precio final antes de publicar
// Solo se pueden poner ofertas a productos de la tienda propia
import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { formatearFecha, formatearPrecio } from '@/utils/formato';
import { ofertaActiva } from '@/utils/precios';
import { soloDigitos, validarDescuento } from '@/utils/validaciones';
import { vibrarError, vibrarExito, vibrarSeleccion } from '@/utils/feedback';
import FormField, { inputStyles } from '@/components/FormField';
import CategoryChips from '@/components/CategoryChips';
import ProductImage from '@/components/ProductImage';
import EmptyState from '@/components/EmptyState';

const DESCUENTOS_RAPIDOS = ['10', '15', '20', '30', '50'];
const DURACIONES = [
  { id: '1', label: '24 horas' },
  { id: '3', label: '3 días' },
  { id: '7', label: '1 semana' },
  { id: '15', label: '15 días' },
];

export default function OfertaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { obtenerProducto, esMio, ponerOferta, quitarOferta } = useTienda();
  const producto = obtenerProducto(id);

  // Si ya tiene oferta, el formulario arranca con su descuento
  const [descuento, setDescuento] = useState(producto?.oferta ? String(producto.oferta.descuento) : '20');
  const [dias, setDias] = useState('3');
  const [error, setError] = useState<string | undefined>(undefined);

  if (!producto || !esMio(producto)) {
    return (
      <EmptyState
        icono="pricetag-outline"
        titulo="Solo puedes poner ofertas a tus productos"
        accion={{ label: 'Volver', onPress: () => router.back() }}
      />
    );
  }

  const activa = ofertaActiva(producto);
  const errorActual = validarDescuento(descuento);
  const porcentaje = errorActual ? 0 : Number(descuento);
  const nuevoPrecio = Math.round(producto.precio * (1 - porcentaje / 100) * 100) / 100;

  const publicar = () => {
    const e = validarDescuento(descuento);
    setError(e);
    if (e) {
      vibrarError();
      return;
    }
    ponerOferta(producto.id, Number(descuento), Number(dias));
    vibrarExito();
    Alert.alert('¡Oferta publicada!', `"${producto.nombre}" ya aparece en Ofertas con ${descuento} % de descuento.`);
    router.back();
  };

  const confirmarQuitar = () => {
    vibrarSeleccion();
    Alert.alert('Quitar oferta', `¿Regresar "${producto.nombre}" a su precio normal?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          quitarOferta(producto.id);
          vibrarExito();
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: activa ? 'Editar oferta' : 'Poner en oferta' }} />

      {/* Vista previa de como se vera */}
      <View style={styles.preview}>
        <View>
          <ProductImage producto={producto} style={styles.imagen} iconSize={30} />
          {porcentaje > 0 && (
            <View style={styles.badge}>
              <Text style={styles.textoBadge}>-{porcentaje}%</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre} numberOfLines={2}>{producto.nombre}</Text>
          <Text style={styles.precioViejo}>{formatearPrecio(producto.precio)}</Text>
          <Text style={styles.precioNuevo}>{formatearPrecio(nuevoPrecio)}</Text>
          {porcentaje > 0 && (
            <Text style={styles.ahorro}>El cliente ahorra {formatearPrecio(producto.precio - nuevoPrecio)}</Text>
          )}
        </View>
      </View>

      {activa && producto.oferta && (
        <View style={styles.aviso}>
          <Ionicons name="flame" size={16} color={COLORS.oferta} />
          <Text style={styles.textoAviso}>
            Oferta activa de {producto.oferta.descuento} % hasta {formatearFecha(producto.oferta.hasta)}
          </Text>
        </View>
      )}

      <FormField label="Descuento" requerido error={error}>
        <CategoryChips
          opciones={DESCUENTOS_RAPIDOS.map((d) => ({ id: d, label: `${d} %` }))}
          seleccionado={DESCUENTOS_RAPIDOS.includes(descuento) ? descuento : ''}
          onSeleccionar={(d) => {
            setDescuento(d);
            setError(undefined);
          }}
        />
        <View style={styles.filaOtro}>
          <Text style={styles.etiquetaOtro}>Otro:</Text>
          <TextInput
            style={[inputStyles.input, styles.inputOtro, !!error && inputStyles.inputError]}
            value={descuento}
            onChangeText={(t) => {
              setDescuento(soloDigitos(t));
              setError(undefined);
            }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="25"
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.etiquetaOtro}>%</Text>
        </View>
      </FormField>

      <FormField label="¿Cuánto dura?" requerido>
        <CategoryChips opciones={DURACIONES} seleccionado={dias} onSeleccionar={setDias} />
      </FormField>

      <Pressable style={({ pressed }) => [styles.boton, pressed && { opacity: 0.85 }]} onPress={publicar}>
        <Ionicons name="flame" size={20} color={COLORS.white} />
        <Text style={styles.textoBoton}>{activa ? 'Actualizar oferta' : 'Publicar oferta'}</Text>
      </Pressable>

      {activa && (
        <Pressable style={styles.botonQuitar} onPress={confirmarQuitar}>
          <Text style={styles.textoQuitar}>Quitar oferta</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACING, paddingBottom: 48 },
  preview: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    padding: 14,
    ...SHADOW,
  },
  imagen: { width: 96, height: 96, borderRadius: 14 },
  badge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: COLORS.oferta,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  textoBadge: { color: COLORS.white, fontWeight: '900', fontSize: 13 },
  nombre: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  precioViejo: { fontSize: 13, color: COLORS.textMuted, textDecorationLine: 'line-through', marginTop: 6 },
  precioNuevo: { fontSize: 24, fontWeight: '900', color: COLORS.oferta },
  ahorro: { fontSize: 12, color: COLORS.accent, fontWeight: '700' },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ofertaLight,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  textoAviso: { flex: 1, color: COLORS.oferta, fontWeight: '700', fontSize: 12 },
  filaOtro: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  etiquetaOtro: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  inputOtro: { width: 80, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.oferta,
    paddingVertical: 15,
    borderRadius: RADIUS,
    marginTop: 28,
  },
  textoBoton: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  botonQuitar: { alignItems: 'center', paddingVertical: 14 },
  textoQuitar: { color: COLORS.danger, fontWeight: '700' },
});
