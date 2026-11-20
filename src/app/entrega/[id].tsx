// Confirmar entrega (vista del PROVEEDOR / repartidor)
// Se confirma con el codigo de 4 digitos que dicta el cliente (el mismo de su app y su PDF)
// o con su firma: se compara contra la firma que dio al comprar y debe PARECERSE (no ser identica)
// Al confirmar: el pedido queda ENTREGADO y PAGADO, el telefono vibra (expo-haptics)
// y el cliente recibe una notificacion (expo-notifications)
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { formatearPrecio, referenciaCompra } from '@/utils/formato';
import { soloDigitos, validarCodigoEntrega } from '@/utils/validaciones';
import FormField, { inputStyles } from '@/components/FormField';
import CategoryChips from '@/components/CategoryChips';
import SignaturePad, { totalPuntos } from '@/components/SignaturePad';
import { parecidoFirmas, UMBRAL_FIRMA } from '@/utils/firma';
import { esperandoPago } from '@/utils/envio';
import EmptyState from '@/components/EmptyState';
import { vibrarError, vibrarPagoAprobado } from '@/utils/feedback';
import { notificar } from '@/utils/notificaciones';
import type { Punto } from '@/types';

type Modo = 'codigo' | 'firma';
const PUNTOS_MINIMOS = 20; // para evitar que un simple toque cuente como firma

export default function ConfirmarEntregaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { obtenerPedido, confirmarEntrega } = useTienda();
  const encontrado = obtenerPedido(id);

  const [modo, setModo] = useState<Modo>('codigo');
  const [recibio, setRecibio] = useState(encontrado?.compra.direccion.nombre ?? '');
  const [codigo, setCodigo] = useState('');
  const [trazos, setTrazos] = useState<Punto[][]>([]);
  const [dibujando, setDibujando] = useState(false);
  const [errores, setErrores] = useState<{ recibio?: string; codigo?: string; firma?: string }>({});
  const [ultimoParecido, setUltimoParecido] = useState<number | null>(null);

  if (!encontrado || encontrado.pedido.envioEstado === 'entregado') {
    return (
      <EmptyState
        icono="checkmark-done-circle-outline"
        titulo={encontrado ? 'Este pedido ya fue entregado' : 'Pedido no encontrado'}
        accion={{ label: 'Volver', onPress: () => router.back() }}
      />
    );
  }

  const { compra, pedido } = encontrado;
  // Compras guardadas con la version anterior de la app no tienen firma de referencia
  const firmaRef = compra.firmaReferencia ?? [];

  // No se puede entregar algo cuyo pago por transferencia o PayPal no se ha confirmado
  if (esperandoPago(pedido)) {
    return (
      <EmptyState
        icono="cash-outline"
        titulo="Primero confirma el pago"
        mensaje="Este pedido espera que confirmes que recibiste la transferencia o el pago por PayPal"
        accion={{ label: 'Volver', onPress: () => router.back() }}
      />
    );
  }

  const total = pedido.subtotal + pedido.envio;
  const cobrarEfectivo = compra.metodo === 'efectivo' && pedido.estado === 'pendiente';

  const confirmar = () => {
    const nuevos: typeof errores = {};
    if (recibio.trim().length < 3) nuevos.recibio = 'Escribe quién recibe el pedido';
    if (modo === 'codigo') {
      nuevos.codigo = validarCodigoEntrega(codigo, pedido.codigoEntrega);
    } else if (totalPuntos(trazos) < PUNTOS_MINIMOS) {
      nuevos.firma = 'La firma está incompleta, pide que firme de nuevo';
    } else {
      // Se compara con la firma que el cliente dio al comprar
      const parecido = parecidoFirmas(firmaRef, trazos);
      setUltimoParecido(parecido);
      if (parecido < UMBRAL_FIRMA) {
        nuevos.firma = `La firma no se parece a la registrada (${Math.round(parecido * 100)} %). Pide que firme de nuevo o usa el código.`;
      }
    }
    setErrores(nuevos);

    if (nuevos.recibio || nuevos.codigo || nuevos.firma) {
      vibrarError();
      return;
    }

    confirmarEntrega(pedido.id, {
      metodo: modo,
      recibio: recibio.trim(),
      firma: modo === 'firma' ? trazos : undefined,
    });
    vibrarPagoAprobado(); // entrega confirmada = pedido pagado: vibra fuerte y suena
    notificar(
      '¡Pedido entregado!',
      `Recibiste tu pedido de ${pedido.nombreTienda}. Gracias por comprar en UNPROV.`,
      pedido.id
    );
    Alert.alert('¡Entrega confirmada!', `El pedido quedó como entregado y pagado (${formatearPrecio(total)}).`);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Confirmar entrega' }} />
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!dibujando} // mientras firma, la pantalla no se mueve
      >
        {/* Resumen del pedido */}
        <View style={styles.tarjeta}>
          <Text style={styles.meta}>{referenciaCompra(compra.id)}</Text>
          <Text style={styles.cliente}>{compra.direccion.nombre}</Text>
          <Text style={styles.meta}>
            {compra.direccion.calle}, {compra.direccion.colonia}
          </Text>
          {pedido.items.map((i) => (
            <Text key={i.productoId} style={styles.item}>
              {i.cantidad} × {i.nombre}
            </Text>
          ))}
        </View>

        {cobrarEfectivo && (
          <View style={styles.cobro}>
            <Ionicons name="cash" size={22} color={COLORS.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tituloCobro}>Cobra {formatearPrecio(total)} en efectivo</Text>
              <Text style={styles.textoCobro}>Al confirmar, el pedido queda marcado como pagado.</Text>
            </View>
          </View>
        )}

        <FormField label="¿Quién recibe?" requerido error={errores.recibio}>
          <TextInput
            style={[inputStyles.input, !!errores.recibio && inputStyles.inputError]}
            value={recibio}
            onChangeText={(t) => {
              setRecibio(t);
              setErrores((e) => ({ ...e, recibio: undefined }));
            }}
            placeholder="Nombre de quien recibe"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Confirmar con">
          <CategoryChips<Modo>
            opciones={[
              { id: 'codigo', label: 'Código del cliente', icon: 'keypad-outline' },
              { id: 'firma', label: 'Firma', icon: 'create-outline' },
            ]}
            seleccionado={modo}
            onSeleccionar={(m) => {
              setModo(m);
              setErrores({});
            }}
          />
        </FormField>

        {modo === 'codigo' ? (
          <FormField
            label="Código de entrega"
            requerido
            error={errores.codigo}
            ayuda="El cliente lo ve en el seguimiento de su pedido"
          >
            <TextInput
              style={[inputStyles.input, styles.inputCodigo, !!errores.codigo && inputStyles.inputError]}
              value={codigo}
              onChangeText={(t) => {
                setCodigo(soloDigitos(t));
                setErrores((e) => ({ ...e, codigo: undefined }));
              }}
              placeholder="0000"
              placeholderTextColor={COLORS.border}
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
            />
          </FormField>
        ) : (
          <>
            <FormField label="Firma registrada al comprar" ayuda="Pide al cliente que firme parecido a esta">
              <SignaturePad trazos={firmaRef} soloLectura alto={140} />
            </FormField>
          <FormField
            label="Firma del cliente"
            requerido
            error={errores.firma}
            ayuda={
              ultimoParecido !== null
                ? `Parecido con la firma registrada: ${Math.round(ultimoParecido * 100)} % (mínimo ${Math.round(UMBRAL_FIRMA * 100)} %)`
                : undefined
            }
          >
            <SignaturePad
              trazos={trazos}
              onCambiar={(t) => {
                setTrazos(t);
                if (errores.firma) setErrores((e) => ({ ...e, firma: undefined }));
              }}
              onDibujando={setDibujando}
              conError={!!errores.firma}
            />
          </FormField>
          </>
        )}

        <Pressable style={({ pressed }) => [styles.boton, pressed && { opacity: 0.85 }]} onPress={confirmar}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
          <Text style={styles.textoBoton}>Confirmar entrega</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACING, paddingBottom: 48 },
  tarjeta: { backgroundColor: COLORS.card, borderRadius: RADIUS, padding: 14, ...SHADOW },
  cliente: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  meta: { fontSize: 12, color: COLORS.textMuted },
  item: { fontSize: 13, color: COLORS.text, marginTop: 4 },
  cobro: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS,
    padding: 14,
    marginTop: 14,
  },
  tituloCobro: { fontSize: 15, fontWeight: '800', color: COLORS.warning },
  textoCobro: { fontSize: 12, color: COLORS.warning, marginTop: 2 },
  inputCodigo: { fontSize: 32, fontWeight: '800', letterSpacing: 12, paddingVertical: 14 },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
    borderRadius: RADIUS,
    marginTop: 28,
  },
  textoBoton: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
