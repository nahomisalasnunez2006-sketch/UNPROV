// Formulario "Dar de alta producto" y "Editar producto" (Seccion Vendedor)
// - Sin parametro: crea un producto nuevo
// - Con ?id=...: abre el producto con sus datos llenos y guarda los cambios
//   (sirve para reabastecer existencias, cambiar precio, foto, etc.)
// Todos los inputs son controlados: su valor vive en el estado y se actualiza con onChangeText
// Al guardar se valida todo; si hay errores se muestran debajo de cada campo
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { CATEGORIAS, COLORS, RADIUS, SPACING } from '@/constants/theme';
import {
  normalizarPrecio,
  validarProducto,
  type ErroresProducto,
  type FormProducto,
} from '@/utils/validaciones';
import FormField, { inputStyles } from '@/components/FormField';
import CategoryChips from '@/components/CategoryChips';
import ImageSelector from '@/components/ImageSelector';
import EmptyState from '@/components/EmptyState';
import { vibrarError, vibrarExito, vibrarSeleccion } from '@/utils/feedback';

const FORM_INICIAL: FormProducto = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  categoria: '',
  imagen: null,
};

export default function AltaProductoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { productos, agregarProducto, actualizarProducto, obtenerProducto, miTienda, esMio } = useTienda();

  // Si viene un id de un producto MIO, el formulario esta en modo edicion
  const original = id ? obtenerProducto(id) : undefined;
  const editando = !!original && esMio(original);

  const [form, setForm] = useState<FormProducto>(
    editando && original
      ? {
          nombre: original.nombre,
          descripcion: original.descripcion,
          precio: String(original.precio),
          stock: String(original.stock),
          categoria: original.categoria,
          imagen: typeof original.imagen === 'string' ? original.imagen : null,
        }
      : FORM_INICIAL
  );
  const [errores, setErrores] = useState<ErroresProducto>({});

  // Actualiza un solo campo copiando el objeto (inmutabilidad)
  // y borra el error de ese campo en cuanto el usuario lo corrige
  const cambiar = <K extends keyof FormProducto>(campo: K, valor: FormProducto[K]) => {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
    if (errores[campo]) {
      setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
    }
  };

  const guardar = () => {
    // Solo se compara contra los productos de mi tienda (otras tiendas pueden vender lo mismo)
    // y, al editar, sin contar el propio producto. Al editar se permite 0 existencias (agotado)
    const nuevosErrores = validarProducto(
      form,
      productos.filter((p) => esMio(p) && p.id !== original?.id).map((p) => p.nombre),
      editando ? 0 : 1
    );
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0 || !form.categoria) {
      vibrarError();
      Alert.alert('Revisa el formulario', 'Hay campos con errores marcados en rojo.');
      return;
    }

    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(normalizarPrecio(form.precio)),
      stock: Number(form.stock.trim()),
      categoria: form.categoria,
      imagen: form.imagen,
    };

    if (editando && original) {
      actualizarProducto(original.id, datos);
      vibrarExito();
      Alert.alert(
        'Cambios guardados',
        datos.stock === 0
          ? `"${datos.nombre}" quedó como agotado.`
          : `"${datos.nombre}" ahora tiene ${datos.stock} ${datos.stock === 1 ? 'pieza disponible' : 'piezas disponibles'}.`
      );
    } else {
      agregarProducto(datos);
      vibrarExito();
      Alert.alert('¡Producto publicado!', `"${datos.nombre}" ya aparece en el catálogo.`);
    }
    router.back();
  };

  const estiloInput = (campo: keyof FormProducto) => [inputStyles.input, !!errores[campo] && inputStyles.inputError];

  // Un proveedor debe registrar su tienda (con datos de cobro) antes de publicar
  if (!miTienda) {
    return (
      <EmptyState
        icono="storefront-outline"
        titulo="Primero registra tu tienda"
        mensaje="Así los clientes sabrán a quién le compran y cómo pagarte"
        accion={{ label: 'Registrar mi tienda', onPress: () => router.replace('/mi-tienda') }}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: editando ? 'Editar producto' : 'Dar de alta producto' }} />
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.bannerTienda}>
          <Ionicons name={editando ? 'create' : 'storefront'} size={18} color={COLORS.primaryDark} />
          <Text style={styles.textoBanner}>
            {editando ? 'Editando en ' : 'Publicando en '}
            <Text style={{ fontWeight: '800' }}>{miTienda.nombre}</Text>
          </Text>
        </View>
        {editando && original && original.stock === 0 && (
          <View style={styles.avisoAgotado}>
            <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
            <Text style={styles.textoAgotado}>Este producto está agotado. Escribe cuántas piezas tienes para volver a venderlo.</Text>
          </View>
        )}
        <FormField label="Foto del producto" requerido error={errores.imagen}>
          <ImageSelector imagen={form.imagen} onCambiar={(uri) => cambiar('imagen', uri)} conError={!!errores.imagen} />
        </FormField>

        <FormField label="Nombre" requerido error={errores.nombre}>
          <TextInput
            style={estiloInput('nombre')}
            value={form.nombre}
            onChangeText={(t) => cambiar('nombre', t)}
            placeholder="Ej. Azúcar estándar 50 kg"
            placeholderTextColor={COLORS.textMuted}
            maxLength={40}
          />
        </FormField>

        <FormField
          label="Descripción"
          requerido
          error={errores.descripcion}
          ayuda={`${form.descripcion.length}/200`}
        >
          <TextInput
            style={[...estiloInput('descripcion'), inputStyles.multilinea]}
            value={form.descripcion}
            onChangeText={(t) => cambiar('descripcion', t)}
            placeholder="Presentación, marca, condiciones de venta…"
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={200}
          />
        </FormField>

        <FormField label="Precio (MXN)" requerido error={errores.precio}>
          <TextInput
            style={estiloInput('precio')}
            value={form.precio}
            onChangeText={(t) => cambiar('precio', t)}
            placeholder="Ej. 450.00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
            maxLength={9}
          />
        </FormField>

        <FormField
          label={editando ? 'Existencias (piezas disponibles)' : 'Piezas disponibles'}
          requerido
          error={errores.stock}
          ayuda={editando ? 'Escribe cuántas piezas tienes ahora, o súmalas con los botones' : undefined}
        >
          <TextInput
            style={estiloInput('stock')}
            value={form.stock}
            onChangeText={(t) => cambiar('stock', t)}
            placeholder="Ej. 20"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={4}
          />
          {editando && (
            <View style={styles.filaSumar}>
              {[1, 5, 10, 50].map((n) => (
                <Pressable
                  key={n}
                  style={styles.botonSumar}
                  onPress={() => {
                    vibrarSeleccion();
                    const actual = Number(form.stock.trim()) || 0;
                    cambiar('stock', String(Math.min(9999, actual + n)));
                  }}
                >
                  <Text style={styles.textoSumar}>+{n}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </FormField>

        <FormField label="Categoría" requerido error={errores.categoria}>
          <CategoryChips
            opciones={CATEGORIAS}
            seleccionado={form.categoria}
            onSeleccionar={(id) => cambiar('categoria', id)}
            conError={!!errores.categoria}
          />
        </FormField>


        <Pressable style={({ pressed }) => [styles.botonGuardar, pressed && { opacity: 0.85 }]} onPress={guardar}>
          <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
          <Text style={styles.textoGuardar}>{editando ? 'Guardar cambios' : 'Publicar producto'}</Text>
        </Pressable>

        {!editando && (
          <Pressable
            style={styles.botonLimpiar}
            onPress={() => {
              vibrarSeleccion();
              setForm(FORM_INICIAL);
              setErrores({});
            }}
          >
            <Text style={styles.textoLimpiar}>Limpiar formulario</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACING, paddingBottom: 48 },
  bannerTienda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
  },
  textoBanner: { color: COLORS.primaryDark, fontSize: 14 },
  avisoAgotado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  textoAgotado: { flex: 1, color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  filaSumar: { flexDirection: 'row', gap: 8, marginTop: 8 },
  botonSumar: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  textoSumar: { color: COLORS.accent, fontWeight: '900', fontSize: 14 },
  botonGuardar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
    borderRadius: RADIUS,
    marginTop: 28,
  },
  textoGuardar: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  botonLimpiar: { alignItems: 'center', paddingVertical: 14 },
  textoLimpiar: { color: COLORS.textMuted, fontWeight: '600' },
});
