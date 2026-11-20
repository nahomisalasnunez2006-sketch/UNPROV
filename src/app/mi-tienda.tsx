// Mi tienda (Seccion Vendedor): el proveedor registra o edita sus datos de cobro
// Con estos datos el cliente sabe a donde transferir o a que correo pagar por PayPal
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { MI_TIENDA_ID } from '@/data/productosIniciales';
import { BANCOS, COLORS, RADIUS, SPACING } from '@/constants/theme';
import { soloDigitos, validarTienda, type ErroresTienda, type FormTienda } from '@/utils/validaciones';
import FormField, { inputStyles } from '@/components/FormField';
import CategoryChips from '@/components/CategoryChips';
import { vibrarError, vibrarExito } from '@/utils/feedback';

export default function MiTiendaScreen() {
  const router = useRouter();
  const { miTienda, tiendas, guardarMiTienda } = useTienda();
  const editando = !!miTienda;

  // Si ya existe la tienda, el formulario arranca con sus datos
  const [form, setForm] = useState<FormTienda>({
    nombre: miTienda?.nombre ?? '',
    titular: miTienda?.titular ?? '',
    banco: miTienda?.banco ?? '',
    clabe: miTienda?.clabe ?? '',
    paypal: miTienda?.paypal ?? '',
  });
  const [errores, setErrores] = useState<ErroresTienda>({});

  const cambiar = (campo: keyof FormTienda, valor: string) => {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
    if (errores[campo]) {
      setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
    }
  };

  const guardar = () => {
    // El nombre no puede repetirse con el de otra tienda (la mia si se puede conservar)
    const nombresOcupados = tiendas.filter((t) => t.id !== MI_TIENDA_ID).map((t) => t.nombre);
    const nuevosErrores = validarTienda(form, nombresOcupados);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      vibrarError();
      Alert.alert('Revisa el formulario', 'Hay campos con errores marcados en rojo.');
      return;
    }

    guardarMiTienda({
      nombre: form.nombre.trim(),
      titular: form.titular.trim(),
      banco: form.banco,
      clabe: soloDigitos(form.clabe),
      paypal: form.paypal.trim().toLowerCase(),
    });

    vibrarExito();
    Alert.alert(
      editando ? 'Datos actualizados' : '¡Tienda registrada!',
      editando ? 'Tus datos de cobro se guardaron.' : 'Ya puedes dar de alta tus productos.'
    );
    router.back();
  };

  const estiloInput = (campo: keyof FormTienda) => [inputStyles.input, !!errores[campo] && inputStyles.inputError];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: editando ? 'Editar mi tienda' : 'Registrar mi tienda' }} />
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.aviso}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primaryDark} />
          <Text style={styles.textoAviso}>
            Estos datos se muestran a tus clientes cuando eligen pagar por transferencia o PayPal.
          </Text>
        </View>

        <Text style={styles.seccion}>Datos de la tienda</Text>
        <FormField label="Nombre de la tienda" requerido error={errores.nombre}>
          <TextInput
            style={estiloInput('nombre')}
            value={form.nombre}
            onChangeText={(t) => cambiar('nombre', t)}
            placeholder="Ej. Abarrotes La Esperanza"
            placeholderTextColor={COLORS.textMuted}
            maxLength={30}
          />
        </FormField>

        <Text style={styles.seccion}>Datos para transferencia</Text>
        <FormField label="Titular de la cuenta" requerido error={errores.titular}>
          <TextInput
            style={estiloInput('titular')}
            value={form.titular}
            onChangeText={(t) => cambiar('titular', t)}
            placeholder="Nombre completo o razón social"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="words"
            maxLength={50}
          />
        </FormField>

        <FormField label="Banco" requerido error={errores.banco}>
          <CategoryChips
            opciones={BANCOS.map((b) => ({ id: b, label: b }))}
            seleccionado={form.banco}
            onSeleccionar={(b) => cambiar('banco', b)}
            conError={!!errores.banco}
          />
        </FormField>

        <FormField
          label="CLABE interbancaria"
          requerido
          error={errores.clabe}
          ayuda={`${soloDigitos(form.clabe).length}/18 dígitos · Para probar: 002180700112233446`}
        >
          <TextInput
            style={estiloInput('clabe')}
            value={form.clabe}
            onChangeText={(t) => cambiar('clabe', soloDigitos(t))}
            placeholder="18 dígitos"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={18}
          />
        </FormField>

        <Text style={styles.seccion}>PayPal (opcional)</Text>
        <FormField
          label="Correo de PayPal"
          error={errores.paypal}
          ayuda="Si lo dejas vacío, tus clientes no podrán elegir PayPal"
        >
          <TextInput
            style={estiloInput('paypal')}
            value={form.paypal}
            onChangeText={(t) => cambiar('paypal', t)}
            placeholder="ventas@mitienda.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </FormField>

        <Pressable style={({ pressed }) => [styles.boton, pressed && { opacity: 0.85 }]} onPress={guardar}>
          <Ionicons name="save-outline" size={20} color={COLORS.white} />
          <Text style={styles.textoBoton}>{editando ? 'Guardar cambios' : 'Registrar tienda'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACING, paddingBottom: 48 },
  aviso: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
  },
  textoAviso: { flex: 1, color: COLORS.primaryDark, fontSize: 13 },
  seccion: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 26,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS,
    marginTop: 28,
  },
  textoBoton: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
