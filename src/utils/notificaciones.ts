// API NUEVA: expo-notifications (notificaciones LOCALES)
// Por que: el cliente necesita enterarse cuando su pedido cambia de etapa
// (preparado, enviado, salio a entrega, entregado) aunque no tenga abierta esa pantalla
// Se usan notificaciones locales porque no requieren servidor y funcionan en Expo Go y en el APK
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Como se muestran las notificaciones cuando la app esta abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permitido = false;

// Se llama una vez al abrir la app: crea el canal de Android y pide permiso
export async function configurarNotificaciones() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pedidos', {
        name: 'Pedidos y envíos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 120, 200],
        lightColor: '#208AEF',
      });
    }
    const actual = await Notifications.getPermissionsAsync();
    const final = actual.granted ? actual : await Notifications.requestPermissionsAsync();
    permitido = final.granted;
  } catch {
    permitido = false;
  }
}

// Muestra una notificacion inmediata (trigger: null)
// data.pedidoId sirve para abrir el seguimiento al tocarla
export async function notificar(titulo: string, cuerpo: string, pedidoId?: string) {
  if (!permitido) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: cuerpo,
        data: pedidoId ? { pedidoId } : {},
      },
      // En Android se manda al canal "pedidos"; sin fecha = se muestra de inmediato
      trigger: Platform.OS === 'android' ? { channelId: 'pedidos' } : null,
    });
  } catch {
    // Si falla la notificacion, la app sigue funcionando normal
  }
}
