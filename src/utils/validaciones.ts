// Validaciones de los formularios: alta de producto, registro de tienda y pago con tarjeta
// Cada funcion recibe los textos del formulario y regresa un objeto con un mensaje por campo con error
// Si el objeto queda vacio, el formulario es valido
import type { CategoriaId } from '@/types';

const REGEX_PRECIO = /^\d+(\.\d{1,2})?$/; // numero con maximo 2 decimales
const REGEX_ENTERO = /^\d+$/;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Quita todo lo que no sea numero (espacios, diagonales, guiones)
export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

// ===================== PRODUCTO =====================

export interface FormProducto {
  nombre: string;
  descripcion: string;
  precio: string; // los TextInput siempre manejan texto
  stock: string;
  categoria: CategoriaId | '';
  imagen: string | null;
}

export type ErroresProducto = Partial<Record<keyof FormProducto, string>>;

// Permite escribir el precio con coma o con punto
export function normalizarPrecio(texto: string): string {
  return texto.trim().replace(',', '.');
}

// minimoStock: 1 al dar de alta; 0 al editar (para poder marcarlo como agotado)
export function validarProducto(
  form: FormProducto,
  nombresExistentes: string[],
  minimoStock = 1
): ErroresProducto {
  const errores: ErroresProducto = {};

  const nombre = form.nombre.trim();
  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio';
  } else if (nombre.length < 3) {
    errores.nombre = 'Debe tener al menos 3 caracteres';
  } else if (nombre.length > 40) {
    errores.nombre = 'Máximo 40 caracteres';
  } else if (nombresExistentes.some((n) => n.toLowerCase() === nombre.toLowerCase())) {
    errores.nombre = 'Ya tienes un producto con ese nombre';
  }

  const descripcion = form.descripcion.trim();
  if (!descripcion) {
    errores.descripcion = 'Agrega una descripción';
  } else if (descripcion.length < 10) {
    errores.descripcion = 'Describe el producto con al menos 10 caracteres';
  } else if (descripcion.length > 200) {
    errores.descripcion = 'Máximo 200 caracteres';
  }

  const precio = normalizarPrecio(form.precio);
  if (!precio) {
    errores.precio = 'El precio es obligatorio';
  } else if (!REGEX_PRECIO.test(precio)) {
    errores.precio = 'Escribe un precio válido (ej. 25 o 25.50)';
  } else if (Number(precio) <= 0) {
    errores.precio = 'El precio debe ser mayor a 0';
  } else if (Number(precio) > 100000) {
    errores.precio = 'El precio máximo es $100,000';
  }

  const stock = form.stock.trim();
  if (!stock) {
    errores.stock = 'Indica cuántas piezas tienes';
  } else if (!REGEX_ENTERO.test(stock)) {
    errores.stock = 'Solo números enteros';
  } else if (Number(stock) < minimoStock || Number(stock) > 9999) {
    errores.stock = `Debe estar entre ${minimoStock} y 9999`;
  }

  if (!form.categoria) {
    errores.categoria = 'Selecciona una categoría';
  }

  if (!form.imagen) {
    errores.imagen = 'Agrega una foto del producto';
  }

  return errores;
}

// ===================== TIENDA (datos de cobro del proveedor) =====================

export interface FormTienda {
  nombre: string;
  titular: string;
  banco: string;
  clabe: string;
  paypal: string;
}

export type ErroresTienda = Partial<Record<keyof FormTienda, string>>;

// La CLABE tiene 18 digitos y el ultimo es un digito verificador
// Se multiplica cada digito por 3, 7, 1, 3, 7, 1... y se suma el ultimo digito de cada producto
// El verificador es lo que le falta a esa suma para llegar a la siguiente decena
export function esClabeValida(clabe: string): boolean {
  if (!/^\d{18}$/.test(clabe)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) {
    suma += (Number(clabe[i]) * pesos[i % 3]) % 10;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(clabe[17]);
}

export function validarTienda(form: FormTienda, nombresOcupados: string[]): ErroresTienda {
  const errores: ErroresTienda = {};

  const nombre = form.nombre.trim();
  if (!nombre) {
    errores.nombre = 'El nombre de la tienda es obligatorio';
  } else if (nombre.length < 3 || nombre.length > 30) {
    errores.nombre = 'Entre 3 y 30 caracteres';
  } else if (nombresOcupados.some((n) => n.toLowerCase() === nombre.toLowerCase())) {
    errores.nombre = 'Ya existe una tienda con ese nombre';
  }

  const titular = form.titular.trim();
  if (!titular) {
    errores.titular = 'Escribe el nombre del titular de la cuenta';
  } else if (titular.length < 5) {
    errores.titular = 'Escribe el nombre completo';
  }

  if (!form.banco) {
    errores.banco = 'Selecciona tu banco';
  }

  const clabe = soloDigitos(form.clabe);
  if (!clabe) {
    errores.clabe = 'La CLABE es obligatoria para recibir transferencias';
  } else if (clabe.length !== 18) {
    errores.clabe = `La CLABE tiene 18 dígitos (llevas ${clabe.length})`;
  } else if (!esClabeValida(clabe)) {
    errores.clabe = 'CLABE inválida: revisa los números';
  }

  // PayPal es opcional, pero si lo escriben debe ser un correo valido
  const paypal = form.paypal.trim();
  if (paypal && !REGEX_CORREO.test(paypal)) {
    errores.paypal = 'Escribe un correo válido (ej. ventas@mitienda.com)';
  }

  return errores;
}

// ===================== TARJETA (pago simulado) =====================

export interface FormTarjeta {
  titular: string;
  numero: string;
  vencimiento: string; // MM/AA
  cvv: string;
}

export type ErroresTarjeta = Partial<Record<keyof FormTarjeta, string>>;

// Algoritmo de Luhn: el que usan los bancos para saber si un numero de tarjeta es coherente
// Desde la derecha, se duplica un digito si y otro no; si el doble pasa de 9 se le resta 9
// Si la suma total es multiplo de 10, el numero es valido
export function pasaLuhn(numero: string): boolean {
  let suma = 0;
  const digitos = numero.split('').reverse();
  digitos.forEach((d, i) => {
    let valor = Number(d);
    if (i % 2 === 1) {
      valor *= 2;
      if (valor > 9) valor -= 9;
    }
    suma += valor;
  });
  return suma % 10 === 0;
}

// "4242424242424242" -> "4242 4242 4242 4242"
export function formatearNumeroTarjeta(texto: string): string {
  return soloDigitos(texto).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

// "1228" -> "12/28"
export function formatearVencimiento(texto: string): string {
  const d = soloDigitos(texto).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function validarTarjeta(form: FormTarjeta): ErroresTarjeta {
  const errores: ErroresTarjeta = {};

  if (form.titular.trim().length < 5) {
    errores.titular = 'Escribe el nombre como aparece en la tarjeta';
  }

  const numero = soloDigitos(form.numero);
  if (numero.length !== 16) {
    errores.numero = 'El número debe tener 16 dígitos';
  } else if (!pasaLuhn(numero)) {
    errores.numero = 'Número de tarjeta inválido';
  }

  const venc = soloDigitos(form.vencimiento);
  if (venc.length !== 4) {
    errores.vencimiento = 'Usa el formato MM/AA';
  } else {
    const mes = Number(venc.slice(0, 2));
    const anio = 2000 + Number(venc.slice(2));
    const hoy = new Date();
    // La tarjeta vale hasta el ultimo dia de su mes de vencimiento
    const vencida = anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1);
    if (mes < 1 || mes > 12) {
      errores.vencimiento = 'Mes inválido';
    } else if (vencida) {
      errores.vencimiento = 'La tarjeta está vencida';
    }
  }

  if (!/^\d{3,4}$/.test(form.cvv)) {
    errores.cvv = '3 o 4 dígitos';
  }

  return errores;
}

// ===================== DIRECCION DE ENTREGA =====================

export interface FormDireccion {
  nombre: string;
  telefono: string;
  calle: string;
  colonia: string;
  cp: string;
}

export type ErroresDireccion = Partial<Record<keyof FormDireccion, string>>;

export function validarDireccion(form: FormDireccion): ErroresDireccion {
  const errores: ErroresDireccion = {};

  if (form.nombre.trim().length < 5) {
    errores.nombre = 'Escribe el nombre completo de quien recibe';
  }
  if (soloDigitos(form.telefono).length !== 10) {
    errores.telefono = 'El teléfono debe tener 10 dígitos';
  }
  if (form.calle.trim().length < 5) {
    errores.calle = 'Escribe calle y número';
  } else if (!/\d/.test(form.calle)) {
    errores.calle = 'Incluye el número exterior';
  }
  if (form.colonia.trim().length < 3) {
    errores.colonia = 'Escribe la colonia';
  }
  if (!/^\d{5}$/.test(form.cp.trim())) {
    errores.cp = 'El código postal tiene 5 dígitos';
  }

  return errores;
}

// ===================== CONFIRMACION DE ENTREGA =====================

// Revisa el codigo que dicta el cliente contra el del pedido
export function validarCodigoEntrega(escrito: string, correcto: string): string | undefined {
  if (!/^\d{4}$/.test(escrito)) return 'El código tiene 4 dígitos';
  if (escrito !== correcto) return 'Código incorrecto, pídeselo de nuevo al cliente';
  return undefined;
}

// ===================== OFERTA =====================

// Valida el porcentaje de descuento que pone el proveedor
export function validarDescuento(texto: string): string | undefined {
  const limpio = texto.trim();
  if (!limpio) return 'Escribe el porcentaje de descuento';
  if (!/^\d+$/.test(limpio)) return 'Solo números enteros, sin el signo %';
  const n = Number(limpio);
  if (n < 5) return 'El descuento mínimo es 5 %';
  if (n > 80) return 'El descuento máximo es 80 %';
  return undefined;
}
