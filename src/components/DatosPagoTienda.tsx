// Tarjeta con los datos para pagarle a una tienda por transferencia o PayPal
// Incluye un boton para compartir los datos (WhatsApp, correo, notas...) con la API Share del telefono
// API NUEVA: expo-clipboard
// Por que: para pagar, el cliente tiene que pegar la CLABE (18 digitos) o el correo PayPal
// en la app de su banco; copiarlos a mano es facil equivocarse en un digito
import { useState } from 'react';
import { View, Text, Pressable, Share, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { vibrarToque } from '@/utils/feedback';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { formatearPrecio } from '@/utils/formato';
import type { Tienda } from '@/types';

interface Props {
  tienda: Tienda;
  monto: number;
  metodo: 'transferencia' | 'paypal';
  referencia: string;
}

// "002180700112233446" -> "002 180 70011223344 6" (asi se lee mas facil)
export function formatearClabe(clabe: string): string {
  return clabe.replace(/^(\d{3})(\d{3})(\d{11})(\d)$/, '$1 $2 $3 $4');
}

// Renglon etiqueta / valor
function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Text style={[styles.valor, destacado && styles.valorDestacado]} selectable>
        {valor}
      </Text>
    </View>
  );
}

export default function DatosPagoTienda({ tienda, monto, metodo, referencia }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await Clipboard.setStringAsync(metodo === 'transferencia' ? tienda.clabe : tienda.paypal);
    vibrarToque();
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartir = async () => {
    vibrarToque();
    const texto =
      metodo === 'transferencia'
        ? `Pago UNPROV a ${tienda.nombre}\nBanco: ${tienda.banco}\nTitular: ${tienda.titular}\nCLABE: ${tienda.clabe}\nMonto: ${formatearPrecio(monto)}\nConcepto: ${referencia}`
        : `Pago UNPROV a ${tienda.nombre}\nPayPal: ${tienda.paypal}\nMonto: ${formatearPrecio(monto)}\nConcepto: ${referencia}`;
    await Share.share({ message: texto });
  };

  return (
    <View style={styles.tarjeta}>
      <View style={styles.encabezado}>
        <Ionicons name="storefront" size={18} color={COLORS.primary} />
        <Text style={styles.nombreTienda}>{tienda.nombre}</Text>
      </View>

      {metodo === 'transferencia' ? (
        <>
          <Dato etiqueta="Banco" valor={tienda.banco} />
          <Dato etiqueta="Titular" valor={tienda.titular} />
          <Dato etiqueta="CLABE" valor={formatearClabe(tienda.clabe)} destacado />
        </>
      ) : (
        <Dato etiqueta="Correo PayPal" valor={tienda.paypal} destacado />
      )}
      <Dato etiqueta="Monto" valor={formatearPrecio(monto)} destacado />
      <Dato etiqueta="Concepto" valor={referencia} />

      <View style={styles.filaBotones}>
        <Pressable style={[styles.botonCompartir, copiado && styles.botonCopiado]} onPress={copiar}>
          <Ionicons name={copiado ? 'checkmark' : 'copy-outline'} size={16} color={copiado ? COLORS.white : COLORS.primary} />
          <Text style={[styles.textoCompartir, copiado && { color: COLORS.white }]}>
            {copiado ? '¡Copiado!' : metodo === 'transferencia' ? 'Copiar CLABE' : 'Copiar correo'}
          </Text>
        </Pressable>
        <Pressable style={styles.botonCompartir} onPress={compartir}>
          <Ionicons name="share-social-outline" size={16} color={COLORS.primary} />
          <Text style={styles.textoCompartir}>Compartir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 10,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  nombreTienda: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  dato: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  etiqueta: { fontSize: 13, color: COLORS.textMuted },
  valor: { flexShrink: 1, fontSize: 13, color: COLORS.text, fontWeight: '600', textAlign: 'right' },
  valorDestacado: { fontWeight: '800', color: COLORS.primaryDark },
  filaBotones: { flexDirection: 'row', gap: 8, marginTop: 8 },
  botonCopiado: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  botonCompartir: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  textoCompartir: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
});
