// Mensaje para listas vacias, con un boton de accion opcional
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, type IconName } from '@/constants/theme';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  icono: IconName;
  titulo: string;
  mensaje?: string;
  accion?: { label: string; onPress: () => void };
}

export default function EmptyState({ icono, titulo, mensaje, accion }: Props) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.circulo}>
        <Ionicons name={icono} size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
      {accion ? (
        <Pressable
          style={styles.boton}
          onPress={() => {
            vibrarSeleccion();
            accion.onPress();
          }}
        >
          <Text style={styles.textoBoton}>{accion.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  circulo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 16, textAlign: 'center' },
  mensaje: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 6 },
  boton: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  textoBoton: { color: COLORS.white, fontWeight: '700' },
});
