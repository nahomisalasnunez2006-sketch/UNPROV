// Carrusel de anuncios que cambia solo cada 4 segundos (y tambien se puede deslizar)
// API NUEVA: expo-linear-gradient
// Por que: una app de ventas necesita banners llamativos; React Native solo pinta colores
// planos, y con degradados los anuncios se ven como los de las tiendas en linea
import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW, SPACING, type IconName } from '@/constants/theme';
import { vibrarToque } from '@/utils/feedback';

export interface Banner {
  id: string;
  etiqueta: string; // texto pequeno arriba, ej. "OFERTA RELAMPAGO"
  titulo: string;
  subtitulo: string;
  boton: string;
  icono: IconName;
  colores: readonly [string, string];
  onPress: () => void;
}

const INTERVALO = 4000;

export default function PromoCarousel({ banners }: { banners: Banner[] }) {
  const { width } = useWindowDimensions();
  const ancho = width - SPACING * 2;
  const scroll = useRef<ScrollView>(null);
  const [actual, setActual] = useState(0);

  // Avance automatico: cada 4 s pasa al siguiente banner (al final regresa al primero)
  useEffect(() => {
    if (banners.length < 2) return;
    const intervalo = setInterval(() => {
      setActual((i) => {
        const siguiente = (i + 1) % banners.length;
        scroll.current?.scrollTo({ x: siguiente * ancho, animated: true });
        return siguiente;
      });
    }, INTERVALO);
    return () => clearInterval(intervalo);
  }, [banners.length, ancho]);

  return (
    <View>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / ancho))}
        style={{ borderRadius: RADIUS + 4 }}
      >
        {banners.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => {
              vibrarToque();
              b.onPress();
            }}
            style={{ width: ancho }}
          >
            <LinearGradient
              colors={b.colores}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              {/* Circulos decorativos de fondo */}
              <View style={[styles.circulo, { width: 160, height: 160, right: -40, top: -50 }]} />
              <View style={[styles.circulo, { width: 90, height: 90, right: 70, bottom: -40 }]} />

              <View style={{ flex: 1 }}>
                <View style={styles.etiqueta}>
                  <Text style={styles.textoEtiqueta}>{b.etiqueta}</Text>
                </View>
                <Text style={styles.titulo} numberOfLines={2}>{b.titulo}</Text>
                <Text style={styles.subtitulo} numberOfLines={2}>{b.subtitulo}</Text>
                <View style={styles.boton}>
                  <Text style={[styles.textoBoton, { color: b.colores[1] }]}>{b.boton}</Text>
                  <Ionicons name="arrow-forward" size={14} color={b.colores[1]} />
                </View>
              </View>
              <Ionicons name={b.icono} size={64} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      {/* Puntitos que indican cual banner se ve */}
      <View style={styles.puntos}>
        {banners.map((b, i) => (
          <View key={b.id} style={[styles.punto, i === actual && styles.puntoActivo]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 18,
    minHeight: 160,
    borderRadius: RADIUS + 4,
    overflow: 'hidden',
    ...SHADOW,
  },
  circulo: { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)' },
  etiqueta: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.amarillo,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  textoEtiqueta: { fontSize: 10, fontWeight: '900', color: COLORS.dark, letterSpacing: 0.5 },
  titulo: { color: COLORS.white, fontSize: 20, fontWeight: '900', marginTop: 8 },
  subtitulo: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  textoBoton: { fontSize: 12, fontWeight: '900' },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  puntoActivo: { width: 20, backgroundColor: COLORS.primary },
});
