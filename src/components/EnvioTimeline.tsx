// Linea de tiempo del envio (como el seguimiento de Amazon)
// Las etapas ya cumplidas se pintan de color y muestran su fecha; las siguientes quedan en gris
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { ETAPAS, indiceEtapa } from '@/utils/envio';
import { formatearFecha } from '@/utils/formato';
import type { EstadoEnvio, EventoEnvio } from '@/types';

interface Props {
  estadoActual: EstadoEnvio;
  historial: EventoEnvio[];
}

export default function EnvioTimeline({ estadoActual, historial }: Props) {
  const actual = indiceEtapa(estadoActual);

  return (
    <View>
      {ETAPAS.map((etapa, i) => {
        const cumplida = i <= actual;
        const esActual = i === actual;
        const evento = historial.find((h) => h.estado === etapa.id);
        const esUltima = i === ETAPAS.length - 1;
        const color = cumplida ? (etapa.id === 'entregado' ? COLORS.accent : COLORS.primary) : COLORS.border;

        return (
          <View key={etapa.id} style={styles.fila}>
            {/* Columna izquierda: circulo + linea */}
            <View style={styles.columnaLinea}>
              <View
                style={[
                  styles.circulo,
                  { backgroundColor: cumplida ? color : COLORS.card, borderColor: color },
                  esActual && styles.circuloActual,
                ]}
              >
                <Ionicons name={etapa.icon} size={esActual ? 18 : 14} color={cumplida ? COLORS.white : COLORS.textMuted} />
              </View>
              {!esUltima && (
                <View style={[styles.linea, { backgroundColor: i < actual ? COLORS.primary : COLORS.border }]} />
              )}
            </View>

            {/* Columna derecha: textos */}
            <View style={styles.textos}>
              <Text style={[styles.titulo, !cumplida && styles.tituloPendiente, esActual && { color }]}>
                {etapa.titulo}
              </Text>
              <Text style={styles.descripcion}>
                {cumplida && evento ? formatearFecha(evento.fecha) : etapa.descripcion}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 12 },
  columnaLinea: { alignItems: 'center', width: 40 },
  circulo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloActual: { width: 38, height: 38, borderRadius: 19 },
  linea: { width: 3, flex: 1, minHeight: 22, borderRadius: 2, marginVertical: 2 },
  textos: { flex: 1, paddingBottom: 18, paddingTop: 4 },
  titulo: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  tituloPendiente: { color: COLORS.textMuted, fontWeight: '500' },
  descripcion: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
