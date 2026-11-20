// Opcion de metodo de pago (tipo "radio button" grande)
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW, type IconName } from '@/constants/theme';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  icono: IconName;
  titulo: string;
  descripcion: string;
  seleccionado: boolean;
  deshabilitado?: boolean;
  onPress: () => void;
}

export default function PaymentOption({ icono, titulo, descripcion, seleccionado, deshabilitado = false, onPress }: Props) {
  return (
    <Pressable
      onPress={() => {
        vibrarSeleccion();
        onPress();
      }}
      disabled={deshabilitado}
      style={[styles.opcion, seleccionado && styles.seleccionada, deshabilitado && styles.deshabilitada]}
    >
      <View style={[styles.icono, seleccionado && { backgroundColor: COLORS.primary }]}>
        <Ionicons name={icono} size={20} color={seleccionado ? COLORS.white : COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
      </View>
      <Ionicons
        name={seleccionado ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={seleccionado ? COLORS.primary : COLORS.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginTop: 10,
    ...SHADOW,
  },
  seleccionada: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  deshabilitada: { opacity: 0.45 },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  descripcion: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
