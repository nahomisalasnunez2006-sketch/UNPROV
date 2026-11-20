// Imagenes de los productos de ejemplo (van DENTRO de la app, funcionan sin internet)
//
// Como agregarlas:
// 1) Guarda la foto en la carpeta  assets/productos/  con el nombre exacto de abajo
//    (puede ser .jpg o .png; si es .png cambia la extension en la linea)
// 2) Quita las dos diagonales // del inicio de SU linea
// 3) En la app: Menu -> Restablecer datos de demostracion
//
// OJO: si quitas las // de una linea pero la imagen no existe, la app no compila.
// Los productos sin imagen siguen mostrando el icono de su categoria.

export const IMAGENES_EJEMPLO: Record<string, number> = {
  p1: require('../../assets/productos/arroz.jpg'),
  p2: require('../../assets/productos/detergente.jpg'),
  p3: require('../../assets/productos/cloro.jpg'),
  p4: require('../../assets/productos/cables.jpg'),
  p5: require('../../assets/productos/frijol.jpg'),
  p6: require('../../assets/productos/aceite.jpg'),
  p7: require('../../assets/productos/papel.jpg'),
  p8: require('../../assets/productos/audifonos.jpg'),
};
