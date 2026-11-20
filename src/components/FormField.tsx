// Envoltura de un campo del formulario: etiqueta, contenido y mensaje de error
// Evita repetir el mismo diseno en cada input
import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

interface Props {
  label: string;
  requerido?: boolean;
  error?: string;
  ayuda?: string;
  children: ReactNode;
}

export default function FormField({ label, requerido = false, error, ayuda, children }: Props) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>
        {label} {requerido && <Text style={styles.requerido}>*</Text>}
      </Text>
      {children}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : ayuda ? (
        <Text style={styles.ayuda}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

// Estilos de input que comparten todas las pantallas con formulario
export const inputStyles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },
  multilinea: { minHeight: 96, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  campo: { marginTop: 18 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  requerido: { color: COLORS.danger },
  error: { color: COLORS.danger, fontSize: 13, marginTop: 6 },
  ayuda: { color: COLORS.textMuted, fontSize: 12, marginTop: 6 },
});
