// Checkout: direccion de entrega + resumen por tienda con envio + metodo de pago
// APIs nuevas usadas aqui: expo-location, expo-local-authentication, expo-haptics,
// expo-notifications, expo-print y expo-sharing (ver el porque de cada una en su funcion)
// - Tarjeta: formulario validado y pago SIMULADO (no se cobra nada)
// - Transferencia / PayPal: el pedido queda pendiente y se muestran los datos de cada tienda
// - Contra entrega: se paga en efectivo y queda pagado cuando el proveedor confirma la entrega
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTienda } from '@/context/TiendaContext';
import { COLORS, METODOS_PAGO, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { formatearPrecio, referenciaCompra, textoArticulos } from '@/utils/formato';
import { esperandoPago, faltaParaEnvioGratis } from '@/utils/envio';
import { precioFinal } from '@/utils/precios';
import {
  formatearNumeroTarjeta,
  formatearVencimiento,
  soloDigitos,
  validarDireccion,
  validarTarjeta,
  type ErroresDireccion,
  type ErroresTarjeta,
  type FormDireccion,
  type FormTarjeta,
} from '@/utils/validaciones';
import FormField, { inputStyles } from '@/components/FormField';
import PaymentOption from '@/components/PaymentOption';
import DatosPagoTienda from '@/components/DatosPagoTienda';
import ResumenTotales from '@/components/ResumenTotales';
import TiendaAvatar from '@/components/TiendaAvatar';
import EmptyState from '@/components/EmptyState';
import { vibrarError, vibrarExito, vibrarPagoAprobado, vibrarToque, conToque, vibrarSeleccion } from '@/utils/feedback';
import SignaturePad, { totalPuntos } from '@/components/SignaturePad';
import { notificar } from '@/utils/notificaciones';
import { compartirComprobante } from '@/utils/comprobante';
import type { Compra, MetodoPago, Punto } from '@/types';

const TARJETA_INICIAL: FormTarjeta = { titular: '', numero: '', vencimiento: '', cvv: '' };
const TIEMPO_PROCESANDO = 2500; // milisegundos que dura la simulacion del banco

// Titulo de cada bloque con numero (1, 2, 3)
function Paso({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <View style={styles.paso}>
      <View style={styles.numeroPaso}>
        <Text style={styles.textoNumeroPaso}>{numero}</Text>
      </View>
      <Text style={styles.tituloPaso}>{titulo}</Text>
    </View>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { carritoPorTienda, totalCarrito, envioCarrito, totalAPagar, totalArticulos, comprar, compras, obtenerTienda } =
    useTienda();

  // Si ya compro antes, se reutiliza la ultima direccion
  const ultima = compras[0]?.direccion;
  const [direccion, setDireccion] = useState<FormDireccion>({
    nombre: ultima?.nombre ?? '',
    telefono: ultima?.telefono ?? '',
    calle: ultima?.calle ?? '',
    colonia: ultima?.colonia ?? '',
    cp: ultima?.cp ?? '',
  });
  const [erroresDir, setErroresDir] = useState<ErroresDireccion>({});
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [tarjeta, setTarjeta] = useState<FormTarjeta>(TARJETA_INICIAL);
  const [erroresTarjeta, setErroresTarjeta] = useState<ErroresTarjeta>({});
  const [procesando, setProcesando] = useState(false);
  const [compraHecha, setCompraHecha] = useState<Compra | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  // Firma de verificacion: se guarda con la compra y se compara al entregar
  const [firma, setFirma] = useState<Punto[][]>([]);
  const [errorFirma, setErrorFirma] = useState<string | undefined>(undefined);
  const [dibujando, setDibujando] = useState(false);

  // Guardamos el temporizador para cancelarlo si el usuario sale de la pantalla
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const grupos = carritoPorTienda();
  // PayPal solo se puede usar si TODAS las tiendas del carrito tienen correo PayPal
  const paypalDisponible = grupos.every((g) => g.tienda.paypal !== '');

  const cambiarDireccion = (campo: keyof FormDireccion, valor: string) => {
    setDireccion((anterior) => ({ ...anterior, [campo]: valor }));
    if (erroresDir[campo]) setErroresDir((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  const cambiarTarjeta = (campo: keyof FormTarjeta, valor: string) => {
    setTarjeta((anterior) => ({ ...anterior, [campo]: valor }));
    if (erroresTarjeta[campo]) setErroresTarjeta((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  // API NUEVA: expo-location
  // Por que: escribir la direccion a mano es lento y con errores; con el GPS
  // se obtienen coordenadas y reverseGeocodeAsync las convierte en calle, colonia y C.P.
  const usarUbicacion = async () => {
    vibrarSeleccion();
    setBuscandoUbicacion(true);
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso denegado', 'Activa la ubicación para llenar tu dirección automáticamente.');
        return;
      }
      const posicion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [lugar] = await Location.reverseGeocodeAsync({
        latitude: posicion.coords.latitude,
        longitude: posicion.coords.longitude,
      });
      if (!lugar) {
        Alert.alert('Sin resultados', 'No encontramos una dirección para tu ubicación. Escríbela a mano.');
        return;
      }
      // Solo se reemplazan los campos que el GPS si pudo resolver
      const calle = [lugar.street ?? lugar.name, lugar.streetNumber].filter(Boolean).join(' ');
      setDireccion((anterior) => ({
        ...anterior,
        calle: calle || anterior.calle,
        colonia: lugar.district ?? lugar.subregion ?? anterior.colonia,
        cp: lugar.postalCode ?? anterior.cp,
      }));
      setErroresDir((anterior) => ({ ...anterior, calle: undefined, colonia: undefined, cp: undefined }));
      vibrarToque();
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Revisa que el GPS esté encendido.');
    } finally {
      setBuscandoUbicacion(false);
    }
  };

  // API NUEVA: expo-local-authentication
  // Por que: un pago con tarjeta debe confirmarlo el dueno del telefono (huella o rostro),
  // igual que en las apps de bancos. Si el telefono no tiene biometria, se continua sin ella
  const confirmarIdentidad = async (): Promise<boolean> => {
    try {
      const tieneSensor = await LocalAuthentication.hasHardwareAsync();
      const tieneHuella = await LocalAuthentication.isEnrolledAsync();
      if (!tieneSensor || !tieneHuella) return true;
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirma tu pago de ${formatearPrecio(totalAPagar)}`,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar PIN',
      });
      return resultado.success;
    } catch {
      return true;
    }
  };

  // Avisa con una notificacion que se registro el pedido (al tocarla abre el seguimiento)
  const avisarCompra = (compra: Compra | null) => {
    if (!compra) return;
    const n = compra.pedidos.length;
    const porConfirmar = compra.metodo === 'transferencia' || compra.metodo === 'paypal';
    notificar(
      compra.metodo === 'tarjeta' ? '¡Pago aprobado!' : porConfirmar ? 'Pago pendiente' : '¡Pedido registrado!',
      porConfirmar
        ? `Realiza tu pago de ${formatearPrecio(compra.total)}. Te avisaremos cuando la tienda lo confirme.`
        : `${n} ${n === 1 ? 'pedido' : 'pedidos'} por ${formatearPrecio(compra.total)}. Te avisaremos cada vez que avance tu envío.`,
      compra.pedidos[0]?.id
    );
  };

  // Llena el formulario con una tarjeta de prueba que pasa el algoritmo de Luhn
  const usarTarjetaPrueba = () => {
    const anio = String((new Date().getFullYear() + 2) % 100).padStart(2, '0');
    setTarjeta({ titular: direccion.nombre.trim().toUpperCase() || 'CLIENTE UNPROV', numero: '4242 4242 4242 4242', vencimiento: `12/${anio}`, cvv: '123' });
    setErroresTarjeta({});
    vibrarToque();
  };

  const confirmar = async () => {
    if (!metodo) return;

    // 1) La direccion se valida con cualquier metodo de pago
    const nuevosErroresDir = validarDireccion(direccion);
    setErroresDir(nuevosErroresDir);
    // 2) La tarjeta solo si se eligio tarjeta
    const nuevosErroresTarjeta = metodo === 'tarjeta' ? validarTarjeta(tarjeta) : {};
    setErroresTarjeta(nuevosErroresTarjeta);
    // 3) La firma de verificacion es obligatoria (se compara con la del dia de la entrega)
    const nuevoErrorFirma = totalPuntos(firma) < 20 ? 'Firma en el recuadro para poder verificar tu entrega' : undefined;
    setErrorFirma(nuevoErrorFirma);
    if (
      Object.keys(nuevosErroresDir).length > 0 ||
      Object.keys(nuevosErroresTarjeta).length > 0 ||
      nuevoErrorFirma
    ) {
      vibrarError();
      return;
    }

    const datosEntrega = {
      nombre: direccion.nombre.trim(),
      telefono: soloDigitos(direccion.telefono),
      calle: direccion.calle.trim(),
      colonia: direccion.colonia.trim(),
      cp: direccion.cp.trim(),
    };

    if (metodo === 'tarjeta') {
      // 4) Huella o rostro antes de cobrar
      const autorizado = await confirmarIdentidad();
      if (!autorizado) {
        vibrarError();
        Alert.alert('Pago cancelado', 'No se pudo confirmar tu identidad.');
        return;
      }
      // 5) Simulacion: "Procesando..." unos segundos como si respondiera el banco
      setProcesando(true);
      temporizador.current = setTimeout(() => {
        const compra = comprar(
          { metodo: 'tarjeta', ultimos4: soloDigitos(tarjeta.numero).slice(-4) },
          datosEntrega,
          firma
        );
        setProcesando(false);
        setTarjeta(TARJETA_INICIAL); // los datos de la tarjeta no se guardan
        setCompraHecha(compra);
        vibrarPagoAprobado(); // vibracion fuerte + sonido de campanita
        avisarCompra(compra);
      }, TIEMPO_PROCESANDO);
      return;
    }

    const compra = comprar({ metodo }, datosEntrega, firma);
    setCompraHecha(compra);
    vibrarExito();
    avisarCompra(compra);
  };

  const descargarComprobante = async (compra: Compra) => {
    vibrarSeleccion();
    setGenerandoPdf(true);
    const resultado = await compartirComprobante(compra);
    setGenerandoPdf(false);
    if (!resultado.ok) Alert.alert('No se pudo generar el PDF', resultado.error);
  };

  const estiloDir = (campo: keyof FormDireccion) => [inputStyles.input, !!erroresDir[campo] && inputStyles.inputError];
  const estiloTarjeta = (campo: keyof FormTarjeta) => [
    inputStyles.input,
    !!erroresTarjeta[campo] && inputStyles.inputError,
  ];

  // ==================== 1) Pantalla de confirmacion ====================
  if (compraHecha) {
    const pagado = compraHecha.metodo === 'tarjeta';
    const referencia = referenciaCompra(compraHecha.id);
    const textoPrincipal =
      compraHecha.metodo === 'tarjeta'
        ? `Se cobró ${formatearPrecio(compraHecha.total)} a tu tarjeta •••• ${compraHecha.ultimos4}`
        : compraHecha.metodo === 'efectivo'
          ? `Paga ${formatearPrecio(compraHecha.total)} en efectivo cuando recibas tus pedidos.`
          : 'Tu pago queda PENDIENTE. Paga a cada tienda con los datos de abajo; cuando la tienda confirme que lo recibió verás el seguimiento, tu código y tu comprobante.';

    return (
      <ScrollView contentContainerStyle={styles.contenido}>
        <Stack.Screen options={{ title: 'Pedido confirmado', headerBackVisible: false, gestureEnabled: false }} />
        <View style={styles.exito}>
          <View style={[styles.circuloExito, !pagado && { backgroundColor: COLORS.warningLight }]}>
            <Ionicons name={pagado ? 'checkmark' : 'time-outline'} size={44} color={pagado ? COLORS.accent : COLORS.warning} />
          </View>
          <Text style={styles.tituloExito}>
            {pagado ? '¡Pago aprobado!' : compraHecha.metodo === 'efectivo' ? '¡Pedido registrado!' : 'Pago pendiente'}
          </Text>
          <Text style={styles.textoExito}>{textoPrincipal}</Text>
          <Text style={styles.referencia}>Pedido {referencia}</Text>
        </View>

        {compraHecha.pedidos.map((pedido) => {
          const tienda = obtenerTienda(pedido.tiendaId);
          const porConfirmar = esperandoPago(pedido);
          return (
            <View key={pedido.id} style={styles.tarjeta}>
              <View style={styles.filaTienda}>
                <TiendaAvatar nombre={pedido.nombreTienda} tamano={34} />
                <Text style={styles.nombreTienda}>{pedido.nombreTienda}</Text>
                <Text style={styles.subtotal}>{formatearPrecio(pedido.subtotal + pedido.envio)}</Text>
              </View>
              {pedido.items.map((i) => (
                <Text key={i.productoId} style={styles.itemResumen}>
                  {i.cantidad} × {i.nombre}
                </Text>
              ))}
              {porConfirmar && tienda && (pedido.metodo === 'transferencia' || pedido.metodo === 'paypal') ? (
                <>
                  <DatosPagoTienda
                    tienda={tienda}
                    monto={pedido.subtotal + pedido.envio}
                    metodo={pedido.metodo}
                    referencia={referencia}
                  />
                  <View style={styles.esperaConfirmacion}>
                    <Ionicons name="hourglass-outline" size={16} color={COLORS.warning} />
                    <Text style={styles.textoEspera}>Esperando que {pedido.nombreTienda} confirme tu pago</Text>
                  </View>
                </>
              ) : (
                <Pressable
                  style={styles.botonSeguimiento}
                  onPress={conToque(() => router.push({ pathname: '/pedido/[id]', params: { id: pedido.id } }))}
                >
                  <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.textoSeguimiento}>Ver seguimiento y código</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {/* El comprobante (con codigo) solo existe cuando el pago esta aceptado o es contra entrega */}
        {compraHecha.pedidos.some((p) => !esperandoPago(p)) && (
          <Pressable
            style={styles.botonPdf}
            onPress={() => descargarComprobante(compraHecha)}
            disabled={generandoPdf}
          >
            {generandoPdf ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                <Text style={styles.textoPdf}>Descargar comprobante con código (PDF)</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable style={styles.botonPrincipal} onPress={conToque(() => router.replace('/mis-compras'))}>
          <Text style={styles.textoBotonPrincipal}>Ver mis compras</Text>
        </Pressable>
        <Pressable style={styles.botonSecundario} onPress={conToque(() => router.navigate('/'))}>
          <Text style={styles.textoSecundario}>Seguir comprando</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ==================== 2) Carrito vacio ====================
  if (grupos.length === 0) {
    return (
      <EmptyState
        icono="cart-outline"
        titulo="No hay nada que pagar"
        mensaje="Tu carrito está vacío"
        accion={{ label: 'Ir al catálogo', onPress: () => router.navigate('/') }}
      />
    );
  }

  // ==================== 3) Formulario de pago ====================
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!dibujando} // mientras firma, la pantalla no se mueve
      >
        {/* ---------- Paso 1: direccion ---------- */}
        <Paso numero={1} titulo="¿A dónde lo enviamos?" />
        <View style={styles.tarjeta}>
          <Pressable style={styles.botonUbicacion} onPress={usarUbicacion} disabled={buscandoUbicacion}>
            {buscandoUbicacion ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="locate" size={18} color={COLORS.primary} />
                <Text style={styles.textoUbicacion}>Usar mi ubicación actual</Text>
              </>
            )}
          </Pressable>
          <FormField label="Nombre de quien recibe" requerido error={erroresDir.nombre}>
            <TextInput
              style={estiloDir('nombre')}
              value={direccion.nombre}
              onChangeText={(t) => cambiarDireccion('nombre', t)}
              placeholder="Nombre completo"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
            />
          </FormField>
          <FormField label="Teléfono" requerido error={erroresDir.telefono}>
            <TextInput
              style={estiloDir('telefono')}
              value={direccion.telefono}
              onChangeText={(t) => cambiarDireccion('telefono', soloDigitos(t))}
              placeholder="10 dígitos"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </FormField>
          <FormField label="Calle y número" requerido error={erroresDir.calle}>
            <TextInput
              style={estiloDir('calle')}
              value={direccion.calle}
              onChangeText={(t) => cambiarDireccion('calle', t)}
              placeholder="Ej. Av. Universidad 1234"
              placeholderTextColor={COLORS.textMuted}
            />
          </FormField>
          <View style={styles.filaCampos}>
            <View style={{ flex: 2 }}>
              <FormField label="Colonia" requerido error={erroresDir.colonia}>
                <TextInput
                  style={estiloDir('colonia')}
                  value={direccion.colonia}
                  onChangeText={(t) => cambiarDireccion('colonia', t)}
                  placeholder="Colonia"
                  placeholderTextColor={COLORS.textMuted}
                />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="C.P." requerido error={erroresDir.cp}>
                <TextInput
                  style={estiloDir('cp')}
                  value={direccion.cp}
                  onChangeText={(t) => cambiarDireccion('cp', soloDigitos(t))}
                  placeholder="64000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </FormField>
            </View>
          </View>
        </View>

        {/* ---------- Paso 2: resumen por tienda con envio ---------- */}
        <Paso numero={2} titulo={`Tus pedidos (${textoArticulos(totalArticulos)})`} />
        {grupos.map((g) => {
          const falta = faltaParaEnvioGratis(g.subtotal);
          return (
            <View key={g.tienda.id} style={styles.tarjeta}>
              <View style={styles.filaTienda}>
                <TiendaAvatar nombre={g.tienda.nombre} tamano={34} />
                <Text style={styles.nombreTienda}>{g.tienda.nombre}</Text>
              </View>
              {g.renglones.map((r) => (
                <View key={r.producto.id} style={styles.filaItem}>
                  <Text style={styles.itemResumen} numberOfLines={1}>
                    {r.cantidad} × {r.producto.nombre}
                  </Text>
                  <Text style={styles.itemPrecio}>{formatearPrecio(precioFinal(r.producto) * r.cantidad)}</Text>
                </View>
              ))}
              <View style={styles.filaItem}>
                <Text style={styles.itemResumen}>Envío de esta tienda</Text>
                <Text style={[styles.itemPrecio, g.envio === 0 && { color: COLORS.accent }]}>
                  {g.envio === 0 ? 'GRATIS' : formatearPrecio(g.envio)}
                </Text>
              </View>
              {falta > 0 && (
                <Text style={styles.pista}>
                  Agrega {formatearPrecio(falta)} más de esta tienda y tu envío es gratis
                </Text>
              )}
            </View>
          );
        })}

        {/* ---------- Paso 3: firma de verificacion ---------- */}
        <Paso numero={3} titulo="Tu firma de verificación" />
        <View style={styles.tarjeta}>
          <Text style={styles.textoFirma}>
            Al recibir tu pedido firmarás otra vez y la compararemos con esta. No tiene que ser idéntica, solo
            parecida. También puedes usar tu código de entrega.
          </Text>
          <View style={{ marginTop: 10 }}>
            <SignaturePad
              trazos={firma}
              onCambiar={(t) => {
                setFirma(t);
                if (errorFirma) setErrorFirma(undefined);
              }}
              onDibujando={setDibujando}
              conError={!!errorFirma}
              alto={170}
            />
          </View>
          {errorFirma && <Text style={styles.errorFirma}>{errorFirma}</Text>}
        </View>

        {/* ---------- Paso 4: metodo de pago ---------- */}
        <Paso numero={4} titulo="¿Cómo quieres pagar?" />
        {METODOS_PAGO.map((m) => {
          const deshabilitado = m.id === 'paypal' && !paypalDisponible;
          return (
            <PaymentOption
              key={m.id}
              icono={m.icon}
              titulo={m.label}
              descripcion={deshabilitado ? 'Alguna tienda de tu carrito no acepta PayPal' : m.descripcion}
              seleccionado={metodo === m.id}
              deshabilitado={deshabilitado}
              onPress={() => setMetodo(m.id)}
            />
          );
        })}

        {metodo === 'tarjeta' && (
          <View style={styles.bloqueTarjeta}>
            <View style={styles.avisoDemo}>
              <Ionicons name="information-circle" size={18} color={COLORS.warning} />
              <Text style={styles.textoDemo}>
                Pago de demostración: no se realiza ningún cargo. Prueba con 4242 4242 4242 4242.
              </Text>
            </View>

            {/* Vista previa de la tarjeta */}
            <View style={styles.tarjetaVisual}>
              <View style={styles.filaEntre}>
                <View style={styles.chip} />
                <Ionicons name="wifi" size={22} color="rgba(255,255,255,0.7)" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              <Text style={styles.numeroVisual}>{tarjeta.numero || '•••• •••• •••• ••••'}</Text>
              <View style={styles.filaEntre}>
                <View>
                  <Text style={styles.etiquetaVisual}>TITULAR</Text>
                  <Text style={styles.textoVisual}>{tarjeta.titular.toUpperCase() || 'NOMBRE APELLIDO'}</Text>
                </View>
                <View>
                  <Text style={styles.etiquetaVisual}>VENCE</Text>
                  <Text style={styles.textoVisual}>{tarjeta.vencimiento || 'MM/AA'}</Text>
                </View>
              </View>
            </View>

            <FormField label="Nombre en la tarjeta" requerido error={erroresTarjeta.titular}>
              <TextInput
                style={estiloTarjeta('titular')}
                value={tarjeta.titular}
                onChangeText={(t) => cambiarTarjeta('titular', t)}
                placeholder="Como aparece en la tarjeta"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                maxLength={40}
              />
            </FormField>
            <Pressable style={styles.botonPrueba} onPress={usarTarjetaPrueba}>
              <Ionicons name="flash-outline" size={16} color={COLORS.primary} />
              <Text style={styles.textoPrueba}>Usar tarjeta de prueba</Text>
            </Pressable>

            <FormField
              label="Número de tarjeta"
              requerido
              error={erroresTarjeta.numero}
              ayuda="Se revisa con el algoritmo de Luhn, el mismo que usan los bancos para detectar números mal escritos"
            >
              <TextInput
                style={estiloTarjeta('numero')}
                value={tarjeta.numero}
                onChangeText={(t) => cambiarTarjeta('numero', formatearNumeroTarjeta(t))}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={19}
              />
            </FormField>
            <View style={styles.filaCampos}>
              <View style={{ flex: 1 }}>
                <FormField label="Vencimiento" requerido error={erroresTarjeta.vencimiento}>
                  <TextInput
                    style={estiloTarjeta('vencimiento')}
                    value={tarjeta.vencimiento}
                    onChangeText={(t) => cambiarTarjeta('vencimiento', formatearVencimiento(t))}
                    placeholder="MM/AA"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="CVV" requerido error={erroresTarjeta.cvv}>
                  <TextInput
                    style={estiloTarjeta('cvv')}
                    value={tarjeta.cvv}
                    onChangeText={(t) => cambiarTarjeta('cvv', soloDigitos(t))}
                    placeholder="123"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </FormField>
              </View>
            </View>
          </View>
        )}

        {metodo && metodo !== 'tarjeta' && (
          <View style={styles.avisoInfo}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primaryDark} />
            <Text style={styles.textoInfo}>
              {metodo === 'efectivo'
                ? 'Pagas al repartidor de cada tienda. El pedido queda pagado cuando confirmes la entrega con tu código o tu firma.'
                : `Al confirmar te mostraremos ${metodo === 'transferencia' ? 'la CLABE' : 'el correo PayPal'} de cada tienda y cuánto pagarle a cada una.`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ---------- Totales y boton fijo abajo ---------- */}
      <View style={styles.pie}>
        <ResumenTotales
          subtotal={totalCarrito}
          envio={envioCarrito}
          etiquetaEnvio={`Envío (${grupos.length} ${grupos.length === 1 ? 'tienda' : 'tiendas'})`}
          grande
        />
        <Pressable
          style={[styles.botonPrincipal, !metodo && styles.botonDeshabilitado]}
          onPress={confirmar}
          disabled={!metodo || procesando}
        >
          <Ionicons name={metodo === 'tarjeta' ? 'lock-closed' : 'checkmark-circle'} size={18} color={COLORS.white} />
          <Text style={styles.textoBotonPrincipal}>
            {!metodo
              ? 'Elige un método de pago'
              : metodo === 'tarjeta'
                ? `Pagar ${formatearPrecio(totalAPagar)}`
                : 'Confirmar pedido'}
          </Text>
        </Pressable>
      </View>

      {/* Capa de "Procesando pago" */}
      {procesando && (
        <View style={styles.capaProcesando}>
          <View style={styles.cajaProcesando}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.tituloProcesando}>Procesando pago…</Text>
            <Text style={styles.textoProcesando}>Conectando con tu banco</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACING, paddingBottom: 32 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 2 },
  numeroPaso: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoNumeroPaso: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  tituloPaso: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  tarjeta: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    padding: 14,
    marginTop: 10,
    ...SHADOW,
  },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filaTienda: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  nombreTienda: { flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.text },
  subtotal: { fontSize: 15, fontWeight: '800', color: COLORS.primaryDark },
  filaItem: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  itemResumen: { flex: 1, fontSize: 13, color: COLORS.textMuted },
  itemPrecio: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  pista: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 8,
    backgroundColor: COLORS.accentLight,
    padding: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  filaCampos: { flexDirection: 'row', gap: 12 },
  bloqueTarjeta: { marginTop: 14 },
  avisoDemo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 12,
  },
  textoDemo: { flex: 1, fontSize: 12, color: COLORS.warning, fontWeight: '600' },
  tarjetaVisual: {
    backgroundColor: COLORS.dark,
    borderRadius: RADIUS + 2,
    padding: 20,
    marginTop: 14,
    gap: 18,
    ...SHADOW,
  },
  chip: { width: 40, height: 30, borderRadius: 6, backgroundColor: '#E8C26A' },
  numeroVisual: { color: COLORS.white, fontSize: 21, fontWeight: '700', letterSpacing: 2 },
  etiquetaVisual: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  textoVisual: { color: COLORS.white, fontSize: 13, fontWeight: '700', marginTop: 2 },
  avisoInfo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  textoInfo: { flex: 1, fontSize: 13, color: COLORS.primaryDark },
  pie: { backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING },
  botonPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS,
    marginTop: 12,
  },
  botonDeshabilitado: { backgroundColor: COLORS.textMuted },
  textoBotonPrincipal: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  botonSecundario: { alignItems: 'center', paddingVertical: 14 },
  textoSecundario: { color: COLORS.primary, fontWeight: '700' },
  botonSeguimiento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  textoSeguimiento: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  textoFirma: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  errorFirma: { color: COLORS.danger, fontSize: 13, marginTop: 6 },
  botonPrueba: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  textoPrueba: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  esperaConfirmacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.warningLight,
  },
  textoEspera: { flex: 1, color: COLORS.warning, fontWeight: '700', fontSize: 12 },
  botonUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  textoUbicacion: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  botonPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  textoPdf: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  exito: { alignItems: 'center', paddingVertical: 16 },
  circuloExito: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloExito: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 14 },
  textoExito: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  referencia: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark, marginTop: 10 },
  capaProcesando: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 27, 51, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cajaProcesando: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS + 4,
    paddingVertical: 28,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  tituloProcesando: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginTop: 14 },
  textoProcesando: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
});
