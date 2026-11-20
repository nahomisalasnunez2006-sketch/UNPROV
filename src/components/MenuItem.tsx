// Opcion de la pantalla de Menu: icono, texto, contador opcional y flecha
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, type IconName } from '@/constants/theme';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  icono: IconName;
  label: string;
  contador?: number;
  ultimo?: boolean;
  onPress: () => void;
}

export default function MenuItem({ icono, label, contador, ultimo = false, onPress }: Props) {
  return (
    <Pressable
      onPress={() => {
        vibrarSeleccion();
        onPress();
      }}
      style={({ pressed }) => [styles.fila, !ultimo && styles.separador, pressed && { opacity: 0.6 }]}
    >
      <View style={styles.icono}>
        <Ionicons name={icono} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      {contador !== undefined && contador > 0 && (
        <View style={styles.contador}>
          <Text style={styles.textoContador}>{contador}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  separador: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  contador: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  textoContador: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
});
