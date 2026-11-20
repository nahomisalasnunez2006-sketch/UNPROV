// Retroalimentacion: VIBRACION + SONIDO en cada accion del usuario
//
// API NUEVA: expo-haptics
// Por que: la vibracion basica (Vibration) solo sabe "vibrar X milisegundos"
// expo-haptics usa el motor haptico del telefono y tiene patrones con significado:
// exito, error, aviso y toques suaves, como en las apps de bancos
//
// Cada funcion vibra Y reproduce su sonido (expo-audio, ver utils/sonido.ts),
// asi todas las opciones de la app que ya vibraban tambien suenan
import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { sonar } from './sonido';

// Se envuelve en try/catch porque algunos telefonos no tienen motor haptico
async function seguro(accion: () => Promise<void>) {
  try {
    await accion();
  } catch {
    // Si el telefono no lo soporta, simplemente no vibra
  }
}

// Producto publicado, tienda guardada, oferta publicada, entrega confirmada
export function vibrarExito() {
  sonar('exito');
  return seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Formulario con errores, codigo incorrecto, sin existencias, huella rechazada
export function vibrarError() {
  sonar('error');
  return seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

// Cambio de etapa del envio, quitar o eliminar algo
export function vibrarAviso() {
  sonar('aviso');
  return seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

// Toque: agregar al carrito, copiar, favoritos, botones
export function vibrarToque() {
  sonar('toque');
  return seguro(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

// Seleccion: cambiar de pestana, elegir un filtro, una opcion o una cantidad
// (es el toque mas suave, como el de las ruedas para elegir fecha)
export function vibrarSeleccion() {
  sonar('toque');
  return seguro(() => Haptics.selectionAsync());
}

// Pago aprobado: aqui SI queremos que se sienta y se oiga fuerte en cualquier telefono
// En algunos Android la vibracion haptica es muy suave (o el usuario la tiene apagada),
// asi que se combina con Vibration (motor de vibracion normal): dos pulsos largos
export function vibrarPagoAprobado() {
  sonar('pago');
  Vibration.vibrate([0, 250, 120, 250]);
  return seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Envuelve cualquier accion para que primero haga toque (sonido + vibracion suave)
// Uso: onPress={conToque(() => router.push('/algo'))}
export function conToque(accion: () => void) {
  return () => {
    vibrarSeleccion();
    accion();
  };
}
