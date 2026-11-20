// Circulo con las iniciales de la tienda y un color fijo segun su nombre
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, colorDeTexto } from '@/constants/theme';

interface Props {
  nombre: string;
  tamano?: number;
  activo?: boolean;
}

// "Granos del Norte" -> "GN"
function iniciales(nombre: string): string {
  const palabras = nombre.split(' ').filter((p) => p.length > 2 || /^[A-Z]/.test(p));
  return (palabras[0]?.[0] ?? '') + (palabras[1]?.[0] ?? '');
}

export default function TiendaAvatar({ nombre, tamano = 44, activo = false }: Props) {
  const color = colorDeTexto(nombre);
  return (
    <View
      style={[
        styles.circulo,
        {
          width: tamano,
          height: tamano,
          borderRadius: tamano / 2,
          backgroundColor: color,
          borderColor: activo ? COLORS.dark : 'transparent',
        },
      ]}
    >
      <Text style={[styles.texto, { fontSize: tamano * 0.36 }]}>{iniciales(nombre).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center', borderWidth: 2.5 },
  texto: { color: COLORS.white, fontWeight: '800' },
});
