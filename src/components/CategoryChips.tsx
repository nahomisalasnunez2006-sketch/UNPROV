// Fila horizontal de categorias en forma de "chips"
// Se usa como filtro en el Home y como selector en el formulario de alta
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, type IconName } from '@/constants/theme';
import { vibrarSeleccion } from '@/utils/feedback';

export interface OpcionChip<T extends string> {
  id: T;
  label: string;
  icon?: IconName;
}

interface Props<T extends string> {
  opciones: OpcionChip<T>[];
  seleccionado: T | '';
  onSeleccionar: (id: T) => void;
  conError?: boolean;
}

export default function CategoryChips<T extends string>({
  opciones,
  seleccionado,
  onSeleccionar,
  conError = false,
}: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
      {opciones.map((opcion) => {
        const activo = opcion.id === seleccionado;
        const color = activo ? COLORS.white : COLORS.text;
        return (
          <Pressable
            key={opcion.id}
            onPress={() => {
              vibrarSeleccion();
              onSeleccionar(opcion.id);
            }}
            style={[styles.chip, activo && styles.chipActivo, conError && !activo && styles.chipError]}
          >
            {opcion.icon && <Ionicons name={opcion.icon} size={15} color={color} />}
            <Text style={[styles.texto, { color }, activo && styles.textoActivo]}>{opcion.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fila: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipError: { borderColor: COLORS.danger },
  texto: { fontSize: 14, fontWeight: '500' },
  textoActivo: { fontWeight: '700' },
});
