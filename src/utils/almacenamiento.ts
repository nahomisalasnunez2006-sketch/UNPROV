// API NUEVA: expo-sqlite (modulo kv-store)
// Por que: sin esto, todo lo que se registra (tiendas, productos, carrito, compras, envios)
// se borra al cerrar la app. Para que la app instalada sea funcional, los datos deben guardarse
// en el telefono. kv-store guarda pares clave/valor dentro de una base SQLite local
// (misma forma de uso que AsyncStorage, pero es un paquete oficial de Expo)
import Storage from 'expo-sqlite/kv-store';

const CLAVE = 'unprov:datos:v1';

// Lee los datos guardados; si no hay nada (primera vez) regresa null
export async function cargarDatos<T>(): Promise<T | null> {
  try {
    const texto = await Storage.getItem(CLAVE);
    return texto ? (JSON.parse(texto) as T) : null;
  } catch {
    return null;
  }
}

// Guarda todo el estado como texto JSON
export async function guardarDatos<T>(datos: T): Promise<void> {
  try {
    await Storage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // Si no se puede guardar, la app sigue funcionando en memoria
  }
}

// Borra todo (boton "Restablecer datos de demostracion")
export async function borrarDatos(): Promise<void> {
  try {
    await Storage.removeItem(CLAVE);
  } catch {
    // nada que hacer
  }
}
