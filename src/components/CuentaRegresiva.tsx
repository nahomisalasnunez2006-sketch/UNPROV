// Reloj de "Termina en 1d 02:03:04" que avanza cada segundo
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useAhora } from '@/hooks/useAhora';
import { formatearCuentaRegresiva } from '@/utils/precios';

interface Props {
  hasta: string; // fecha ISO de fin
  claro?: boolean; // texto blanco (para usar sobre fondos de color)
  compacto?: boolean;
}

export default function CuentaRegresiva({ hasta, claro = false, compacto = false }: Props) {
  const ahora = useAhora(1000);
  const restante = Math.max(0, new Date(hasta).getTime() - ahora);
  const color = claro ? COLORS.white : COLORS.oferta;

  return (
    <View style={[styles.fila, !claro && styles.fondo]}>
      <Ionicons name="time-outline" size={compacto ? 11 : 13} color={color} />
      <Text style={[styles.texto, { color, fontSize: compacto ? 10 : 12 }]}>
        {restante === 0 ? 'Terminó' : `${compacto ? '' : 'Termina en '}${formatearCuentaRegresiva(restante)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start' },
  fondo: { backgroundColor: COLORS.ofertaLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  texto: { fontWeight: '800', fontVariant: ['tabular-nums'] },
});
