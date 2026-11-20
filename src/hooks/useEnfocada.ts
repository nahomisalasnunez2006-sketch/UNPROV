// Hook que dice si la pantalla esta visible en este momento
// Se usa useFocusEffect de expo-router (y no el de @react-navigation/native),
// porque expo-router trae su propia navegacion interna
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useEnfocada(): boolean {
  const [enfocada, setEnfocada] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setEnfocada(true); // la pantalla se mostro
      return () => setEnfocada(false); // la pantalla se oculto
    }, [])
  );
  return enfocada;
}
