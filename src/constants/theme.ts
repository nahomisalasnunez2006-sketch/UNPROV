// Colores, categorias y constantes compartidas
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { CategoriaId, MetodoPago } from '@/types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const COLORS = {
  primary: '#208AEF',
  primaryDark: '#1663B3',
  primaryLight: '#E6F2FE',
  accent: '#22A559', // verde del boton "+" del wireframe
  accentLight: '#E5F6EC',
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#14213D',
  textMuted: '#6B7280',
  border: '#E3E8EF',
  danger: '#E5484D',
  dangerLight: '#FDECEC',
  warning: '#B7791F',
  warningLight: '#FEF6E4',
  white: '#FFFFFF',
  dark: '#0F1B33',
  // Colores de venta: rojo/naranja para ofertas y amarillo para destacar
  oferta: '#FF3D2E',
  ofertaLight: '#FFE9E5',
  ofertaDark: '#D62A1D',
  amarillo: '#FFC531',
  amarilloLight: '#FFF6D9',
};

// Degradados (expo-linear-gradient) para encabezados y banners
export const DEGRADADOS = {
  principal: ['#0F4FB8', '#208AEF'] as const,
  oferta: ['#FF6A3D', '#FF3D2E'] as const,
  noche: ['#0F1B33', '#27406E'] as const,
  verde: ['#159947', '#22C55E'] as const,
};

export const SPACING = 16;
export const RADIUS = 16;

export interface Categoria {
  id: CategoriaId;
  label: string;
  icon: IconName;
}

export const CATEGORIAS: Categoria[] = [
  { id: 'abarrotes', label: 'Abarrotes', icon: 'basket-outline' },
  { id: 'limpieza', label: 'Limpieza', icon: 'sparkles-outline' },
  { id: 'papeleria', label: 'Papelería', icon: 'document-text-outline' },
  { id: 'electronica', label: 'Electrónica', icon: 'hardware-chip-outline' },
  { id: 'otros', label: 'Otros', icon: 'cube-outline' },
];

export function obtenerCategoria(id: CategoriaId): Categoria {
  return CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1];
}

// Bancos que puede elegir el proveedor al registrar su tienda
export const BANCOS = ['BBVA', 'Banorte', 'Santander', 'Banamex', 'HSBC', 'Banco Azteca', 'Otro'];

// Formas de pago del checkout
export const METODOS_PAGO: { id: MetodoPago; label: string; descripcion: string; icon: IconName }[] = [
  { id: 'tarjeta', label: 'Tarjeta de crédito o débito', descripcion: 'Pago inmediato', icon: 'card-outline' },
  { id: 'transferencia', label: 'Transferencia SPEI', descripcion: 'Te damos la CLABE de cada tienda', icon: 'swap-horizontal-outline' },
  { id: 'paypal', label: 'PayPal', descripcion: 'Pagas al correo PayPal de cada tienda', icon: 'logo-paypal' },
  { id: 'efectivo', label: 'Pago contra entrega', descripcion: 'Pagas en efectivo al recibir', icon: 'cash-outline' },
];

// Sombra suave para tarjetas (iOS usa shadow*, Android usa elevation)
export const SHADOW = {
  shadowColor: '#14213D',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

// Colores para los avatares de las tiendas
const COLORES_AVATAR = ['#208AEF', '#22A559', '#F5A524', '#8B5CF6', '#E5484D', '#0EA5A4'];

// Siempre el mismo color para el mismo nombre (suma de los codigos de sus letras)
export function colorDeTexto(texto: string): string {
  const suma = texto.split('').reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return COLORES_AVATAR[suma % COLORES_AVATAR.length];
}
