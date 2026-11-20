// Renglones de Productos / Envio / Total que se repiten en carrito, checkout y pedidos
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';

interface Props {
  subtotal: number;
  envio: number;
  etiquetaEnvio?: string;
  grande?: boolean;
}

export default function ResumenTotales({ subtotal, envio, etiquetaEnvio = 'Envío', grande = false }: Props) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.fila}>
        <Text style={styles.etiqueta}>Productos</Text>
        <Text style={styles.valor}>{formatearPrecio(subtotal)}</Text>
      </View>
      <View style={styles.fila}>
        <Text style={styles.etiqueta}>{etiquetaEnvio}</Text>
        <Text style={[styles.valor, envio === 0 && styles.gratis]}>
          {envio === 0 ? 'GRATIS' : formatearPrecio(envio)}
        </Text>
      </View>
      <View style={[styles.fila, styles.filaTotal]}>
        <Text style={styles.etiquetaTotal}>Total</Text>
        <Text style={[styles.total, grande && { fontSize: 22 }]}>{formatearPrecio(subtotal + envio)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 4 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiqueta: { fontSize: 14, color: COLORS.textMuted },
  valor: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  gratis: { color: COLORS.accent, fontWeight: '800' },
  filaTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 6, marginTop: 2 },
  etiquetaTotal: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  total: { fontSize: 18, fontWeight: '800', color: COLORS.text },
});
