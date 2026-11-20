// Barra de busqueda superior (SearchBar del wireframe)
// Es un input controlado: el texto vive en el estado del padre y llega por props
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Buscar productos' }: Props) {
  return (
    <View style={styles.contenedor}>
      <Ionicons name="search" size={18} color={COLORS.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            vibrarSeleccion();
            onChangeText('');
          }} hitSlop={10} accessibilityLabel="Borrar búsqueda">
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 15, color: COLORS.text },
});
