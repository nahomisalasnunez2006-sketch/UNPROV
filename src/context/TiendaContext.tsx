// Estado global de UNPROV: tiendas, productos, carrito, favoritos y compras
// Se usa Context + useState para que todas las pantallas compartan los mismos datos
// Regla de oro: nunca se modifica el estado directamente, siempre se crea un arreglo/objeto nuevo
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MI_TIENDA_ID, PRODUCTOS_INICIALES, TIENDAS_INICIALES } from '@/data/productosIniciales';
import { calcularEnvio, esperandoPago, generarCodigoEntrega, siguienteEtapa } from '@/utils/envio';
import { borrarDatos, cargarDatos, guardarDatos } from '@/utils/almacenamiento';
import { precioFinal } from '@/utils/precios';
import type {
  Compra,
  Direccion,
  Entrega,
  ItemCarrito,
  MetodoPago,
  NuevaTienda,
  NuevoProducto,
  PedidoTienda,
  Producto,
  Punto,
  Tienda,
} from '@/types';

// Renglon del carrito ya unido con su producto
export interface RenglonCarrito {
  producto: Producto;
  cantidad: number;
}

// Carrito separado por tienda (para el checkout)
export interface GrupoTienda {
  tienda: Tienda;
  renglones: RenglonCarrito[];
  subtotal: number;
  envio: number;
}

// Un pedido junto con la compra a la que pertenece
export interface PedidoConCompra {
  compra: Compra;
  pedido: PedidoTienda;
}

interface DatosPago {
  metodo: MetodoPago;
  ultimos4?: string;
}

// Lo que se guarda en el telefono
interface DatosGuardados {
  tiendas: Tienda[];
  productos: Producto[];
  carrito: ItemCarrito[];
  favoritos: string[];
  compras: Compra[];
}

interface TiendaContextValue {
  cargando: boolean;
  restablecerDatos: () => Promise<void>;
  tiendas: Tienda[];
  productos: Producto[];
  carrito: ItemCarrito[];
  favoritos: string[];
  compras: Compra[];
  miTienda: Tienda | undefined;
  totalArticulos: number;
  totalCarrito: number; // solo productos
  envioCarrito: number; // suma del envio de cada tienda
  totalAPagar: number; // productos + envio
  pedidosRecibidos: PedidoConCompra[]; // ventas de mi tienda
  obtenerTienda: (id: string) => Tienda | undefined;
  guardarMiTienda: (datos: NuevaTienda) => void;
  esMio: (producto: Producto) => boolean;
  obtenerProducto: (id: string) => Producto | undefined;
  agregarProducto: (datos: NuevoProducto) => void;
  actualizarProducto: (id: string, datos: NuevoProducto) => void;
  ponerOferta: (id: string, descuento: number, dias: number) => void;
  quitarOferta: (id: string) => void;
  eliminarProducto: (id: string) => void;
  cantidadEnCarrito: (id: string) => number;
  carritoPorTienda: () => GrupoTienda[];
  agregarAlCarrito: (id: string, cantidad?: number) => boolean;
  cambiarCantidad: (id: string, cambio: number) => void;
  quitarDelCarrito: (id: string) => void;
  comprar: (pago: DatosPago, direccion: Direccion, firmaReferencia: Punto[][]) => Compra | null;
  obtenerPedido: (pedidoId: string) => PedidoConCompra | undefined;
  confirmarPagoRecibido: (pedidoId: string) => void;
  avanzarEnvio: (pedidoId: string) => void;
  confirmarEntrega: (pedidoId: string, entrega: Omit<Entrega, 'fecha'>) => void;
  esFavorito: (id: string) => boolean;
  alternarFavorito: (id: string) => void;
}

const TiendaContext = createContext<TiendaContextValue | null>(null);

export function TiendaProvider({ children }: { children: ReactNode }) {
  const [tiendas, setTiendas] = useState<Tienda[]>(TIENDAS_INICIALES);
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIALES);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);

  // ---------- Persistencia (expo-sqlite/kv-store) ----------
  // 1) Al abrir la app se leen los datos guardados (si existen)
  useEffect(() => {
    cargarDatos<DatosGuardados>().then((guardado) => {
      if (guardado) {
        setTiendas(guardado.tiendas);
        setProductos(guardado.productos);
        setCarrito(guardado.carrito);
        setFavoritos(guardado.favoritos);
        setCompras(guardado.compras);
      }
      setCargando(false);
    });
  }, []);

  // 2) Cada vez que algo cambia se guarda (pero no antes de terminar de cargar,
  //    para no sobrescribir lo guardado con los datos de ejemplo)
  useEffect(() => {
    if (cargando) return;
    guardarDatos<DatosGuardados>({ tiendas, productos, carrito, favoritos, compras });
  }, [cargando, tiendas, productos, carrito, favoritos, compras]);

  // Vuelve a los datos de ejemplo (util antes de presentar)
  const restablecerDatos = async () => {
    await borrarDatos();
    setTiendas(TIENDAS_INICIALES);
    setProductos(PRODUCTOS_INICIALES);
    setCarrito([]);
    setFavoritos([]);
    setCompras([]);
  };

  // ---------- Tiendas ----------
  const obtenerTienda = (id: string) => tiendas.find((t) => t.id === id);
  const miTienda = obtenerTienda(MI_TIENDA_ID);

  // Si la tienda del usuario no existe se agrega; si ya existe se actualiza
  const guardarMiTienda = (datos: NuevaTienda) => {
    setTiendas((anteriores) => {
      const existe = anteriores.some((t) => t.id === MI_TIENDA_ID);
      if (existe) {
        return anteriores.map((t) => (t.id === MI_TIENDA_ID ? { ...t, ...datos } : t));
      }
      return [...anteriores, { ...datos, id: MI_TIENDA_ID }];
    });
  };

  const esMio = (producto: Producto) => producto.tiendaId === MI_TIENDA_ID;

  // ---------- Valores derivados (se calculan, no se guardan en el estado) ----------
  const obtenerProducto = (id: string) => productos.find((p) => p.id === id);

  const totalArticulos = carrito.reduce((suma, item) => suma + item.cantidad, 0);

  const totalCarrito = carrito.reduce((suma, item) => {
    const producto = obtenerProducto(item.productoId);
    return producto ? suma + precioFinal(producto) * item.cantidad : suma;
  }, 0);

  const cantidadEnCarrito = (id: string) =>
    carrito.find((item) => item.productoId === id)?.cantidad ?? 0;

  // Agrupa el carrito por tienda: una tienda = un pedido
  // Aqui si se usa push porque "grupos" es un arreglo nuevo y local, no es parte del estado
  const carritoPorTienda = (): GrupoTienda[] => {
    const grupos: GrupoTienda[] = [];
    carrito.forEach((item) => {
      const producto = obtenerProducto(item.productoId);
      const tienda = producto ? obtenerTienda(producto.tiendaId) : undefined;
      if (!producto || !tienda) return;

      const renglon = { producto, cantidad: item.cantidad };
      const grupo = grupos.find((g) => g.tienda.id === tienda.id);
      if (grupo) {
        grupo.renglones.push(renglon);
        grupo.subtotal += precioFinal(producto) * item.cantidad;
      } else {
        grupos.push({ tienda, renglones: [renglon], subtotal: precioFinal(producto) * item.cantidad, envio: 0 });
      }
    });
    // El envio se calcula al final, cuando ya se conoce el subtotal de cada tienda
    return grupos.map((g) => ({ ...g, envio: calcularEnvio(g.subtotal) }));
  };

  const envioCarrito = carritoPorTienda().reduce((suma, g) => suma + g.envio, 0);
  const totalAPagar = totalCarrito + envioCarrito;

  // ---------- Productos ----------
  // AGREGAR: el producto nuevo queda ligado a la tienda del usuario
  const agregarProducto = (datos: NuevoProducto) => {
    const nuevo: Producto = { ...datos, id: Date.now().toString(), tiendaId: MI_TIENDA_ID, vendidos: 0 };
    setProductos((anteriores) => [nuevo, ...anteriores]);
  };

  // EDITAR: el proveedor cambia datos de SU producto (nombre, precio, existencias, foto...)
  // Se conservan id, tienda, oferta y piezas vendidas. Si bajan las existencias, el carrito
  // se ajusta para que nadie tenga mas piezas de las que hay
  const actualizarProducto = (id: string, datos: NuevoProducto) => {
    setProductos((anteriores) =>
      anteriores.map((p) => (p.id === id && p.tiendaId === MI_TIENDA_ID ? { ...p, ...datos } : p))
    );
    setCarrito((anteriores) =>
      anteriores
        .map((item) => (item.productoId === id ? { ...item, cantidad: Math.min(item.cantidad, datos.stock) } : item))
        .filter((item) => item.cantidad > 0)
    );
  };

  // OFERTAS (solo para productos de mi tienda): descuento en % durante N dias
  const ponerOferta = (id: string, descuento: number, dias: number) => {
    const hasta = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
    setProductos((anteriores) =>
      anteriores.map((p) => (p.id === id && p.tiendaId === MI_TIENDA_ID ? { ...p, oferta: { descuento, hasta } } : p))
    );
  };

  // Para quitar una propiedad sin mutar: se separa con destructuring y se regresa "el resto"
  const quitarOferta = (id: string) => {
    setProductos((anteriores) =>
      anteriores.map((p) => {
        if (p.id !== id) return p;
        const { oferta: _quitada, ...resto } = p;
        return resto;
      })
    );
  };

  // ELIMINAR: tambien se quita del carrito y de favoritos para no dejar referencias rotas
  const eliminarProducto = (id: string) => {
    setProductos((anteriores) => anteriores.filter((p) => p.id !== id));
    setCarrito((anteriores) => anteriores.filter((item) => item.productoId !== id));
    setFavoritos((anteriores) => anteriores.filter((favId) => favId !== id));
  };

  // ---------- Carrito ----------
  // Regresa false si no hay stock suficiente, asi la pantalla puede avisar al usuario
  const agregarAlCarrito = (id: string, cantidad = 1) => {
    const producto = obtenerProducto(id);
    if (!producto || cantidadEnCarrito(id) + cantidad > producto.stock) {
      return false;
    }
    setCarrito((anteriores) => {
      const yaEsta = anteriores.some((item) => item.productoId === id);
      if (yaEsta) {
        return anteriores.map((item) =>
          item.productoId === id ? { ...item, cantidad: item.cantidad + cantidad } : item
        );
      }
      return [...anteriores, { productoId: id, cantidad }];
    });
    return true;
  };

  // cambio = +1 o -1 (boton - 1 + del wireframe)
  const cambiarCantidad = (id: string, cambio: number) => {
    const producto = obtenerProducto(id);
    if (!producto) return;
    const nuevaCantidad = cantidadEnCarrito(id) + cambio;
    if (nuevaCantidad > producto.stock) return;

    if (nuevaCantidad <= 0) {
      quitarDelCarrito(id);
      return;
    }
    setCarrito((anteriores) =>
      anteriores.map((item) => (item.productoId === id ? { ...item, cantidad: nuevaCantidad } : item))
    );
  };

  const quitarDelCarrito = (id: string) => {
    setCarrito((anteriores) => anteriores.filter((item) => item.productoId !== id));
  };

  // COMPRAR: crea un pedido por tienda (cada uno con su envio y su codigo de entrega),
  // descuenta stock y vacia el carrito
  // - Tarjeta: pagado y confirmado de inmediato
  // - Efectivo: confirmado de inmediato, se paga al entregar
  // - Transferencia / PayPal: queda esperando que el PROVEEDOR confirme que le llego el pago
  const comprar = (pago: DatosPago, direccion: Direccion, firmaReferencia: Punto[][]) => {
    const grupos = carritoPorTienda();
    if (grupos.length === 0) return null;

    const compraId = Date.now().toString();
    const ahora = new Date().toISOString();
    const estado = pago.metodo === 'tarjeta' ? 'pagado' : 'pendiente';
    const requiereConfirmacion = pago.metodo === 'transferencia' || pago.metodo === 'paypal';

    const pedidos: PedidoTienda[] = grupos.map((g) => ({
      id: `${compraId}-${g.tienda.id}`,
      tiendaId: g.tienda.id,
      nombreTienda: g.tienda.nombre,
      items: g.renglones.map((r) => ({
        productoId: r.producto.id,
        nombre: r.producto.nombre,
        precio: precioFinal(r.producto), // se guarda el precio CON descuento que se pago
        cantidad: r.cantidad,
      })),
      subtotal: g.subtotal,
      envio: g.envio,
      metodo: pago.metodo,
      estado,
      envioEstado: 'confirmado',
      // Si espera pago, el historial empieza vacio: la etapa "confirmado" se agrega
      // cuando el proveedor confirma que recibio el dinero
      historial: requiereConfirmacion ? [] : [{ estado: 'confirmado', fecha: ahora }],
      codigoEntrega: generarCodigoEntrega(),
    }));

    const compra: Compra = {
      id: compraId,
      fecha: ahora,
      metodo: pago.metodo,
      ultimos4: pago.ultimos4,
      direccion,
      firmaReferencia,
      pedidos,
      subtotal: totalCarrito,
      envio: envioCarrito,
      total: totalAPagar,
    };

    setCompras((anteriores) => [compra, ...anteriores]);
    setProductos((anteriores) =>
      anteriores.map((p) => {
        const comprado = carrito.find((item) => item.productoId === p.id);
        return comprado
          ? { ...p, stock: p.stock - comprado.cantidad, vendidos: (p.vendidos ?? 0) + comprado.cantidad }
          : p;
      })
    );
    setCarrito([]);
    return compra;
  };

  // ---------- Pedidos y seguimiento ----------
  const obtenerPedido = (pedidoId: string): PedidoConCompra | undefined => {
    for (const compra of compras) {
      const pedido = compra.pedidos.find((p) => p.id === pedidoId);
      if (pedido) return { compra, pedido };
    }
    return undefined;
  };

  // Ventas de mi tienda: todos los pedidos de todas las compras que son para mi
  const pedidosRecibidos: PedidoConCompra[] = compras.flatMap((compra) =>
    compra.pedidos.filter((p) => p.tiendaId === MI_TIENDA_ID).map((pedido) => ({ compra, pedido }))
  );

  // Funcion auxiliar: cambia UN pedido dentro de la lista de compras sin mutar nada
  // (copia la compra, copia su arreglo de pedidos y reemplaza solo el pedido indicado)
  const actualizarPedido = (pedidoId: string, cambio: (pedido: PedidoTienda) => PedidoTienda) => {
    setCompras((anteriores) =>
      anteriores.map((c) =>
        c.pedidos.some((p) => p.id === pedidoId)
          ? { ...c, pedidos: c.pedidos.map((p) => (p.id === pedidoId ? cambio(p) : p)) }
          : c
      )
    );
  };

  // El PROVEEDOR confirma que si le llego la transferencia o el pago por PayPal:
  // el pago pasa a "pagado" y el pedido queda confirmado (inicia el seguimiento)
  const confirmarPagoRecibido = (pedidoId: string) => {
    const fecha = new Date().toISOString();
    actualizarPedido(pedidoId, (p) =>
      esperandoPago(p)
        ? {
            ...p,
            estado: 'pagado',
            pagoConfirmado: fecha,
            historial: [{ estado: 'confirmado', fecha }],
          }
        : p
    );
  };

  // El proveedor pasa el pedido a la siguiente etapa (preparado -> enviado -> en reparto)
  // La ultima etapa (entregado) solo se alcanza con confirmarEntrega
  const avanzarEnvio = (pedidoId: string) => {
    actualizarPedido(pedidoId, (p) => {
      if (esperandoPago(p)) return p; // no se envia nada que no se ha pagado
      const siguiente = siguienteEtapa(p.envioEstado);
      if (!siguiente || siguiente.id === 'entregado') return p;
      return {
        ...p,
        envioEstado: siguiente.id,
        historial: [...p.historial, { estado: siguiente.id, fecha: new Date().toISOString() }],
      };
    });
  };

  // Entrega confirmada con codigo o firma: queda entregado Y pagado
  // (en pago contra entrega, transferencia o PayPal el proveedor confirma el cobro al entregar)
  const confirmarEntrega = (pedidoId: string, entrega: Omit<Entrega, 'fecha'>) => {
    const fecha = new Date().toISOString();
    actualizarPedido(pedidoId, (p) => ({
      ...p,
      envioEstado: 'entregado',
      estado: 'pagado',
      entrega: { ...entrega, fecha },
      historial: [...p.historial, { estado: 'entregado', fecha }],
    }));
  };

  // ---------- Favoritos (Wish List) ----------
  const esFavorito = (id: string) => favoritos.includes(id);

  const alternarFavorito = (id: string) => {
    setFavoritos((anteriores) =>
      anteriores.includes(id) ? anteriores.filter((favId) => favId !== id) : [...anteriores, id]
    );
  };

  return (
    <TiendaContext.Provider
      value={{
        cargando,
        restablecerDatos,
        tiendas,
        productos,
        carrito,
        favoritos,
        compras,
        miTienda,
        totalArticulos,
        totalCarrito,
        envioCarrito,
        totalAPagar,
        pedidosRecibidos,
        obtenerTienda,
        guardarMiTienda,
        esMio,
        obtenerProducto,
        agregarProducto,
        actualizarProducto,
        ponerOferta,
        quitarOferta,
        eliminarProducto,
        cantidadEnCarrito,
        carritoPorTienda,
        agregarAlCarrito,
        cambiarCantidad,
        quitarDelCarrito,
        comprar,
        obtenerPedido,
        confirmarPagoRecibido,
        avanzarEnvio,
        confirmarEntrega,
        esFavorito,
        alternarFavorito,
      }}
    >
      {children}
    </TiendaContext.Provider>
  );
}

// Hook para usar el contexto en cualquier pantalla con una sola linea
export function useTienda() {
  const contexto = useContext(TiendaContext);
  if (!contexto) {
    throw new Error('useTienda debe usarse dentro de TiendaProvider');
  }
  return contexto;
}
