// Celda con el "+" verde del wireframe para dar de alta un producto
import { Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '@/constants/theme';
import { vibrarToque } from '@/utils/feedback';

interface Props {
  ancho: number;
  onPress: () => void;
}

export default function AddProductCard({ ancho, onPress }: Props) {
  return (
    <Pressable
      onPress={() => {
        vibrarToque();
        onPress();
      }}
      style={({ pressed }) => [styles.card, { width: ancho }, pressed && { opacity: 0.7 }]}
      accessibilityLabel="Dar de alta producto"
    >
      <Ionicons name="add" size={64} color={COLORS.accent} />
      <Text style={styles.texto}>Dar de alta{'\n'}producto</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 240,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { color: COLORS.accent, fontWeight: '700', textAlign: 'center', marginTop: 4 },
});
