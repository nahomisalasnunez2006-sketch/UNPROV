// Etiqueta de color con la etapa actual del envio
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { obtenerEtapa } from '@/utils/envio';
import type { EstadoEnvio } from '@/types';

// Colores por etapa: azul mientras avanza, morado en reparto, verde al entregar
const COLORES: Record<EstadoEnvio, { texto: string; fondo: string }> = {
  confirmado: { texto: COLORS.primaryDark, fondo: COLORS.primaryLight },
  preparado: { texto: COLORS.primaryDark, fondo: COLORS.primaryLight },
  enviado: { texto: COLORS.primaryDark, fondo: COLORS.primaryLight },
  en_reparto: { texto: '#6D28D9', fondo: '#EFE7FF' },
  entregado: { texto: COLORS.accent, fondo: COLORS.accentLight },
};

export default function EnvioBadge({ estado }: { estado: EstadoEnvio }) {
  const etapa = obtenerEtapa(estado);
  const color = COLORES[estado];
  return (
    <View style={[styles.badge, { backgroundColor: color.fondo }]}>
      <Ionicons name={etapa.icon} size={13} color={color.texto} />
      <Text style={[styles.texto, { color: color.texto }]}>{etapa.titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  texto: { fontSize: 11, fontWeight: '700' },
});
