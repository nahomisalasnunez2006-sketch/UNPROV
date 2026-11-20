// Recuadro para firmar con el dedo
// Usa PanResponder (incluido en React Native) para leer el movimiento del dedo
// Cada trazo es una lista de puntos; entre cada par de puntos se dibuja una rayita girada
// asi no se necesita instalar ninguna libreria de dibujo
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, StyleSheet, type GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '@/constants/theme';
import type { Punto } from '@/types';
import { vibrarSeleccion } from '@/utils/feedback';

const GROSOR = 3;

interface Props {
  trazos: Punto[][];
  onCambiar?: (trazos: Punto[][]) => void;
  onDibujando?: (dibujando: boolean) => void; // para bloquear el scroll mientras se firma
  alto?: number;
  soloLectura?: boolean;
  conError?: boolean;
}

// Cuenta cuantos puntos tiene la firma (sirve para saber si de verdad firmaron)
export function totalPuntos(trazos: Punto[][]): number {
  return trazos.reduce((suma, t) => suma + t.length, 0);
}

// Rayita entre dos puntos: se calcula su largo y su angulo y se gira un View
function Segmento({ a, b }: { a: Punto; b: Punto }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const largo = Math.sqrt(dx * dx + dy * dy) + GROSOR / 2;
  const angulo = Math.atan2(dy, dx);
  return (
    <View
      style={{
        position: 'absolute',
        left: (a.x + b.x) / 2 - largo / 2,
        top: (a.y + b.y) / 2 - GROSOR / 2,
        width: largo,
        height: GROSOR,
        borderRadius: GROSOR / 2,
        backgroundColor: COLORS.dark,
        transform: [{ rotate: `${angulo}rad` }],
      }}
    />
  );
}

export default function SignaturePad({
  trazos,
  onCambiar,
  onDibujando,
  alto = 200,
  soloLectura = false,
  conError = false,
}: Props) {
  // PanResponder se crea una sola vez; por eso guardamos en refs los valores mas recientes
  const trazosRef = useRef(trazos);
  const onCambiarRef = useRef(onCambiar);
  const onDibujandoRef = useRef(onDibujando);
  useEffect(() => {
    trazosRef.current = trazos;
    onCambiarRef.current = onCambiar;
    onDibujandoRef.current = onDibujando;
  });

  const punto = (e: GestureResponderEvent): Punto => ({
    x: Math.round(e.nativeEvent.locationX),
    y: Math.round(e.nativeEvent.locationY),
  });

  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Dedo abajo: empieza un trazo nuevo
      onPanResponderGrant: (e) => {
        onDibujandoRef.current?.(true);
        const nuevos = [...trazosRef.current, [punto(e)]];
        trazosRef.current = nuevos;
        onCambiarRef.current?.(nuevos);
      },
      // Dedo moviendose: se agrega el punto al ultimo trazo (copiando, sin mutar)
      onPanResponderMove: (e) => {
        const actuales = trazosRef.current;
        if (actuales.length === 0) return;
        const ultimo = actuales[actuales.length - 1];
        const nuevos = [...actuales.slice(0, -1), [...ultimo, punto(e)]];
        trazosRef.current = nuevos;
        onCambiarRef.current?.(nuevos);
      },
      // Dedo arriba: termina el trazo
      onPanResponderRelease: () => onDibujandoRef.current?.(false),
      onPanResponderTerminate: () => onDibujandoRef.current?.(false),
    })
  );

  const vacia = trazos.length === 0;

  return (
    <View>
      <View
        style={[styles.lienzo, { height: alto }, conError && styles.lienzoError, soloLectura && styles.lienzoLectura]}
        {...(soloLectura ? {} : responder.panHandlers)}
      >
        {/* pointerEvents="none" para que las rayitas no "roben" el toque y las coordenadas salgan bien */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {vacia && !soloLectura && (
            <View style={styles.guia}>
              <Ionicons name="create-outline" size={22} color={COLORS.textMuted} />
              <Text style={styles.textoGuia}>Firma aquí con tu dedo</Text>
            </View>
          )}
          <View style={styles.linea} />
          {trazos.map((trazo, t) =>
            trazo.length === 1 ? (
              <View
                key={`p${t}`}
                style={[styles.punto, { left: trazo[0].x - GROSOR, top: trazo[0].y - GROSOR }]}
              />
            ) : (
              trazo.slice(1).map((p, i) => <Segmento key={`${t}-${i}`} a={trazo[i]} b={p} />)
            )
          )}
        </View>
      </View>

      {!soloLectura && !vacia && (
        <Pressable
          style={styles.borrar}
          onPress={() => {
            vibrarSeleccion();
            onCambiar?.([]);
          }}
          hitSlop={8}
        >
          <Ionicons name="refresh" size={15} color={COLORS.primary} />
          <Text style={styles.textoBorrar}>Borrar firma</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lienzo: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  lienzoError: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },
  lienzoLectura: { borderStyle: 'solid', borderColor: COLORS.border },
  guia: { position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center', gap: 4 },
  textoGuia: { color: COLORS.textMuted, fontSize: 13 },
  linea: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    height: 1,
    backgroundColor: COLORS.border,
  },
  punto: {
    position: 'absolute',
    width: GROSOR * 2,
    height: GROSOR * 2,
    borderRadius: GROSOR,
    backgroundColor: COLORS.dark,
  },
  borrar: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 8 },
  textoBorrar: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
});
