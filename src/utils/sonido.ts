// API NUEVA: expo-audio
// Por que: el usuario debe recibir una confirmacion inmediata de lo que hace, aunque no este
// viendo la pantalla (como el "ding" de las terminales bancarias). Todos los sonidos son
// archivos .wav propios en assets/sounds (se generaron para el proyecto, sin derechos de terceros)
//
// - pago:   pago aprobado / pago aceptado por la tienda / entrega confirmada
// - toque:  cualquier opcion que se presiona (pestanas, filtros, botones, menu)
// - exito:  algo se guardo bien (producto, tienda, oferta, agregar al carrito)
// - aviso:  cambio de etapa del envio, quitar algo
// - error:  formulario con errores, sin existencias, codigo o firma incorrectos
//
// Se crea UN reproductor por sonido para toda la app (createAudioPlayer) al abrirla,
// asi ya estan cargados cuando se necesitan y no dependen de la pantalla que los pide
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const ARCHIVOS = {
  pago: require('../../assets/sounds/pago-aprobado.wav'),
  toque: require('../../assets/sounds/toque.wav'),
  exito: require('../../assets/sounds/exito.wav'),
  aviso: require('../../assets/sounds/aviso.wav'),
  error: require('../../assets/sounds/error.wav'),
};

export type TipoSonido = keyof typeof ARCHIVOS;

// Volumen de cada sonido (el toque es suave para que no moleste)
const VOLUMEN: Record<TipoSonido, number> = { pago: 1, toque: 0.35, exito: 0.8, aviso: 0.8, error: 0.8 };

const reproductores: Partial<Record<TipoSonido, AudioPlayer>> = {};

// Se llama una vez al abrir la app (en app/_layout.tsx) para tener todo listo
export function precargarSonidos() {
  // En iPhone, sin esto no suena si el telefono esta en modo silencio
  setAudioModeAsync({ playsInSilentMode: true }).catch((e) => console.warn('[sonido] modo de audio:', e));
  (Object.keys(ARCHIVOS) as TipoSonido[]).forEach((tipo) => {
    try {
      if (!reproductores[tipo]) {
        const r = createAudioPlayer(ARCHIVOS[tipo]);
        r.volume = VOLUMEN[tipo];
        reproductores[tipo] = r;
      }
    } catch (e) {
      console.warn(`[sonido] no se pudo cargar "${tipo}":`, e);
    }
  });
}

// Reproduce un sonido desde el inicio
// IMPORTANTE: expo-audio deja el sonido "al final" cuando termina. seekTo(0) lo regresa al inicio,
// pero tarda un instante: si se llama a play() sin esperarlo, la segunda vez ya no suena.
// Por eso se usa "await" antes de play()
export async function sonar(tipo: TipoSonido) {
  try {
    if (!reproductores[tipo]) precargarSonidos();
    const r = reproductores[tipo];
    if (!r) return;
    r.pause();
    await r.seekTo(0);
    r.play();
  } catch (e) {
    console.warn(`[sonido] no se pudo reproducir "${tipo}":`, e);
  }
}

// Atajos que ya usaban las pantallas
export function precargarSonido() {
  precargarSonidos();
}

export function sonarPagoAprobado() {
  return sonar('pago');
}

export function useSonidoPagoAprobado() {
  return sonarPagoAprobado;
}
