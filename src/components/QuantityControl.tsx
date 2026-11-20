// Control de cantidad "- 1 +" del wireframe del carrito
// Cuando la cantidad es 1, el boton de restar se convierte en un bote de basura
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { vibrarSeleccion } from '@/utils/feedback';

interface Props {
  cantidad: number;
  max: number;
  onRestar: () => void;
  onSumar: () => void;
  mostrarBasura?: boolean;
}

export default function QuantityControl({ cantidad, max, onRestar, onSumar, mostrarBasura = true }: Props) {
  const usarBasura = mostrarBasura && cantidad === 1;
  const puedeSumar = cantidad < max;

  return (
    <View style={styles.contenedor}>
      <Pressable
        onPress={() => {
          vibrarSeleccion();
          onRestar();
        }}
        hitSlop={6} style={styles.boton} accessibilityLabel="Restar">
        <Ionicons
          name={usarBasura ? 'trash-outline' : 'remove'}
          size={16}
          color={usarBasura ? COLORS.danger : COLORS.text}
        />
      </Pressable>
      <Text style={styles.cantidad}>{cantidad}</Text>
      <Pressable
        onPress={() => {
          vibrarSeleccion();
          onSumar();
        }}
        disabled={!puedeSumar}
        hitSlop={6}
        style={[styles.boton, !puedeSumar && styles.deshabilitado]}
        accessibilityLabel="Sumar"
      >
        <Ionicons name="add" size={16} color={puedeSumar ? COLORS.text : COLORS.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignSelf: 'flex-start',
  },
  boton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  deshabilitado: { opacity: 0.4 },
  cantidad: { minWidth: 28, textAlign: 'center', fontSize: 15, fontWeight: '700', color: COLORS.text },
});
