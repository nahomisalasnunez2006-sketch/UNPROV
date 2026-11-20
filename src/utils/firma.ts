// Comparacion de firmas: decide si dos firmas se PARECEN (no tienen que ser identicas)
//
// Idea en 4 pasos:
// 1) Normalizar: cada firma se escala a un cuadro de 0 a 1, asi no importa si se firmo
//    mas grande, mas chica o en otra parte del recuadro
// 2) Rasterizar: el cuadro se divide en una cuadricula y se marcan las celdas
//    por donde paso el trazo, como si fuera una imagen pixelada (48 x 24)
// 3) Tolerancia: a cada firma se le "engorda" el trazo una celda hacia todos lados,
//    porque nadie firma exactamente igual dos veces
// 4) Comparar forma: que porcentaje del trazo de una cae sobre la otra (en ambos sentidos)
// 5) Comparar direccion: se cuenta hacia donde se mueve el dedo (8 direcciones, como una brujula);
//    una firma con lazos y una con zigzag tienen "brujulas" muy distintas
// 6) Comparar recorrido: las dos firmas se reparten en 64 puntos en el orden en que se dibujaron
//    y se mide la distancia promedio entre el punto 1 de una y el punto 1 de la otra, etc.
//    (es la idea del reconocedor de gestos "$1"). Es la medida que mas distingue personas
// 7) Comparar proporcion ancho/alto
// El puntaje final mezcla todos los resultados
import type { Punto } from '@/types';

const COLUMNAS = 48;
const FILAS = 24;
export const UMBRAL_FIRMA = 0.55; // 55 % o mas = se parecen (probado: misma persona 68-93 %, otra persona 6-42 %)

interface Caja {
  minX: number;
  minY: number;
  ancho: number;
  alto: number;
}

function caja(trazos: Punto[][]): Caja {
  const puntos = trazos.flat();
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, ancho: Math.max(1, Math.max(...xs) - minX), alto: Math.max(1, Math.max(...ys) - minY) };
}

// Pasos 1 y 2: normaliza y marca las celdas por donde pasa la firma
function rasterizar(trazos: Punto[][]): Set<number> {
  const { minX, minY, ancho, alto } = caja(trazos);
  const celdas = new Set<number>();
  const marcar = (x: number, y: number) => {
    const col = Math.min(COLUMNAS - 1, Math.floor(((x - minX) / ancho) * COLUMNAS));
    const fila = Math.min(FILAS - 1, Math.floor(((y - minY) / alto) * FILAS));
    celdas.add(fila * COLUMNAS + col);
  };

  trazos.forEach((trazo) => {
    if (trazo.length === 1) marcar(trazo[0].x, trazo[0].y);
    for (let i = 1; i < trazo.length; i++) {
      const a = trazo[i - 1];
      const b = trazo[i];
      // Se ponen puntos intermedios para no dejar huecos entre dos lecturas del dedo
      const pasos = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
      for (let p = 0; p <= pasos; p++) {
        marcar(a.x + ((b.x - a.x) * p) / pasos, a.y + ((b.y - a.y) * p) / pasos);
      }
    }
  });
  return celdas;
}

// Paso 3: agrega las 8 celdas vecinas de cada celda marcada
function engordar(celdas: Set<number>): Set<number> {
  const resultado = new Set<number>();
  celdas.forEach((c) => {
    const fila = Math.floor(c / COLUMNAS);
    const col = c % COLUMNAS;
    for (let df = -1; df <= 1; df++) {
      for (let dc = -1; dc <= 1; dc++) {
        const f = fila + df;
        const k = col + dc;
        if (f >= 0 && f < FILAS && k >= 0 && k < COLUMNAS) resultado.add(f * COLUMNAS + k);
      }
    }
  });
  return resultado;
}

// Que fraccion de "a" cae dentro de "b" (ya engordada)
function cobertura(a: Set<number>, bEngordada: Set<number>): number {
  if (a.size === 0) return 0;
  let dentro = 0;
  a.forEach((c) => {
    if (bEngordada.has(c)) dentro++;
  });
  return dentro / a.size;
}

// Paso 5: "brujula" de la firma. Para cada tramo se calcula su angulo, se acomoda en una de
// 8 direcciones y se suma su largo. El resultado se divide entre el total (porcentajes)
function brujula(trazos: Punto[][]): number[] {
  const { ancho, alto } = caja(trazos);
  const sectores = new Array(8).fill(0);
  trazos.forEach((trazo) => {
    for (let i = 1; i < trazo.length; i++) {
      // Se usan coordenadas normalizadas para que el tamano no cambie los angulos
      const dx = (trazo[i].x - trazo[i - 1].x) / ancho;
      const dy = (trazo[i].y - trazo[i - 1].y) / alto;
      const largo = Math.hypot(dx, dy);
      if (largo === 0) continue;
      const angulo = Math.atan2(dy, dx); // de -PI a PI
      const sector = Math.round(((angulo + Math.PI) / (2 * Math.PI)) * 8) % 8;
      sectores[sector] += largo;
    }
  });
  const total = sectores.reduce((a, b) => a + b, 0) || 1;
  return sectores.map((v) => v / total);
}

// Parecido entre dos brujulas: 1 - (diferencia total / 2), da un valor de 0 a 1
function parecidoBrujulas(a: number[], b: number[]): number {
  const diferencia = a.reduce((suma, v, i) => suma + Math.abs(v - b[i]), 0);
  return 1 - diferencia / 2;
}

// Paso 6: reparte el recorrido completo (todos los trazos en orden) en N puntos a la misma distancia
const PUNTOS_RECORRIDO = 64;

function recorridoNormalizado(trazos: Punto[][]): Punto[] {
  const { minX, minY, ancho, alto } = caja(trazos);
  const escala = Math.max(ancho, alto); // misma escala en X y Y para no deformar
  const camino = trazos.flat().map((p) => ({ x: (p.x - minX) / escala, y: (p.y - minY) / escala }));
  if (camino.length < 2) return camino;

  let largoTotal = 0;
  for (let i = 1; i < camino.length; i++) {
    largoTotal += Math.hypot(camino[i].x - camino[i - 1].x, camino[i].y - camino[i - 1].y);
  }
  const paso = largoTotal / (PUNTOS_RECORRIDO - 1);
  const resultado: Punto[] = [camino[0]];
  let acumulado = 0;
  let anterior = camino[0];
  for (let i = 1; i < camino.length && resultado.length < PUNTOS_RECORRIDO; i++) {
    let actual = camino[i];
    let d = Math.hypot(actual.x - anterior.x, actual.y - anterior.y);
    while (acumulado + d >= paso && d > 0 && resultado.length < PUNTOS_RECORRIDO) {
      const t = (paso - acumulado) / d;
      const nuevo = { x: anterior.x + t * (actual.x - anterior.x), y: anterior.y + t * (actual.y - anterior.y) };
      resultado.push(nuevo);
      anterior = nuevo;
      d = Math.hypot(actual.x - anterior.x, actual.y - anterior.y);
      acumulado = 0;
    }
    acumulado += d;
    anterior = actual;
  }
  while (resultado.length < PUNTOS_RECORRIDO) resultado.push(camino[camino.length - 1]);
  return resultado;
}

// Distancia promedio entre puntos correspondientes -> parecido de 0 a 1
// (una distancia de 0.25 o mas, un cuarto del tamano de la firma, ya cuenta como 0)
function parecidoRecorrido(a: Punto[][], b: Punto[][]): number {
  const ra = recorridoNormalizado(a);
  const rb = recorridoNormalizado(b);
  let suma = 0;
  for (let i = 0; i < PUNTOS_RECORRIDO; i++) suma += Math.hypot(ra[i].x - rb[i].x, ra[i].y - rb[i].y);
  const promedio = suma / PUNTOS_RECORRIDO;
  return Math.max(0, 1 - promedio / 0.25);
}

// Paso 7 y resultado: puntaje de 0 (nada que ver) a 1 (practicamente iguales)
export function parecidoFirmas(referencia: Punto[][], nueva: Punto[][]): number {
  if (referencia.flat().length < 2 || nueva.flat().length < 2) return 0;

  const a = rasterizar(referencia);
  const b = rasterizar(nueva);
  const forma = (cobertura(a, engordar(b)) + cobertura(b, engordar(a))) / 2;

  const ca = caja(referencia);
  const cb = caja(nueva);
  const proporcionA = ca.ancho / ca.alto;
  const proporcionB = cb.ancho / cb.alto;
  const proporcion = Math.min(proporcionA, proporcionB) / Math.max(proporcionA, proporcionB);

  const direccion = parecidoBrujulas(brujula(referencia), brujula(nueva));
  const recorrido = parecidoRecorrido(referencia, nueva);

  return 0.4 * recorrido + 0.3 * forma + 0.15 * direccion + 0.15 * proporcion;
}

export function firmasSeParecen(referencia: Punto[][], nueva: Punto[][]): boolean {
  return parecidoFirmas(referencia, nueva) >= UMBRAL_FIRMA;
}
