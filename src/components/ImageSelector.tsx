// Selector de foto del producto (API del dispositivo: galeria y camara)
// Usa expo-image-picker: abre la galeria o la camara del telefono y regresa la uri de la foto
// La uri se manda al padre con onCambiar (flujo hijo -> padre)
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '@/constants/theme';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  imagen: string | null;
  onCambiar: (uri: string | null) => void;
  conError?: boolean;
}

const OPCIONES: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

export default function ImageSelector({ imagen, onCambiar, conError = false }: Props) {
  // La galeria usa el selector del sistema, por eso no requiere pedir permiso antes
  const elegirDeGaleria = async () => {
    vibrarSeleccion();
    const resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES);
    if (!resultado.canceled) {
      onCambiar(resultado.assets[0].uri);
    }
  };

  // La camara si necesita permiso explicito del usuario
  const tomarFoto = async () => {
    vibrarSeleccion();
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso denegado', 'Activa el permiso de cámara para fotografiar tu producto.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync(OPCIONES);
    if (!resultado.canceled) {
      onCambiar(resultado.assets[0].uri);
    }
  };

  return (
    <View style={styles.contenedor}>
      {imagen ? (
        <View>
          <Image source={{ uri: imagen }} style={styles.preview} contentFit="cover" />
          <Pressable
            style={styles.quitar}
            onPress={() => {
              vibrarSeleccion();
              onCambiar(null);
            }}
            hitSlop={8}
            accessibilityLabel="Quitar foto"
          >
            <Ionicons name="close" size={16} color={COLORS.white} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.preview, styles.previewVacio, conError && styles.previewError]}>
          <Ionicons name="image-outline" size={34} color={conError ? COLORS.danger : COLORS.primary} />
          <Text style={[styles.textoVacio, conError && { color: COLORS.danger }]}>Sin foto</Text>
        </View>
      )}

      <View style={styles.botones}>
        <Pressable style={styles.boton} onPress={elegirDeGaleria}>
          <Ionicons name="images-outline" size={18} color={COLORS.primary} />
          <Text style={styles.textoBoton}>Galería</Text>
        </Pressable>
        <Pressable style={styles.boton} onPress={tomarFoto}>
          <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
          <Text style={styles.textoBoton}>Cámara</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  preview: { width: 110, height: 110, borderRadius: RADIUS },
  previewVacio: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewError: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  textoVacio: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
  quitar: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.danger,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botones: { flex: 1, gap: 10 },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  textoBoton: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
});
