// Hook que regresa la hora actual y se actualiza cada cierto tiempo
// Sirve para que las cuentas regresivas de las ofertas avancen solas en pantalla
import { useEffect, useState } from 'react';

export function useAhora(cadaMs = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), cadaMs);
    return () => clearInterval(intervalo); // se limpia al salir de la pantalla
  }, [cadaMs]);
  return ahora;
}
