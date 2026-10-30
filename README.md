# Relevo

Plataforma web para que estudiantes universitarios de Lima compren y vendan materiales académicos de segunda mano. Esta versión funciona como servicio concierge: el equipo confirma los pagos de Yape y coordina las entregas a mano.

Sitio publicado: https://alefn05.github.io/Relevo/

## Fase actual: A (entrevistas)

Todo funciona en el navegador con datos de ejemplo claramente falsos. No hay servidor ni base de datos: lo que se hace en la demo se borra al recargar. El inicio de sesión se simula con usuarios de prueba.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `config.js` | Todas las constantes que el equipo puede cambiar |
| `logica.js` | Reglas de negocio sin interfaz: comisión, estados, permisos, código del día, CSV |
| `datos.js` | Datos de ejemplo en memoria (Fase A). En la Fase B se conecta Firebase aquí |
| `componentes.jsx` | Componentes base del manual: hilo, punto testigo, arco, esquinas, línea de tiempo |
| `pantallas.jsx` | Pantallas: inicio, explorar, material, pago, publicar, pedidos, panel, experimento, legales |
| `app.jsx` | Cabecera, rutas y pie |
| `estilos.css` | Identidad visual del manual como variables CSS |
| `tests/pruebas.html` | Pruebas de la lógica, corren en el navegador |
| `experimento/fotos/` | Dirección limpia para la prueba A/B de fotos |

No hay paso de compilación: React y Babel se cargan desde CDN con versiones fijas y el JSX se transforma en el navegador. Todas las rutas son relativas para que el sitio funcione dentro de `/Relevo/` en GitHub Pages. La navegación usa rutas con `#` (por ejemplo `#/pago/m1`), que no necesitan servidor.

## Configuración (`config.js`)

| Constante | Para qué sirve |
|---|---|
| `COMISION_VENDEDOR` | Comisión fija por venta completada que paga el vendedor (4.00) |
| `UMBRAL_AVISO` | Debajo de este precio, el formulario muestra qué porcentaje es la comisión (15.00) |
| `MODO_ENTREVISTA` | `true`: la pantalla de pago se muestra completa pero no crea pedidos ni pide número de operación. También se fuerza con `?entrevista=1` o `?entrevista=0` en la URL |
| `MODO_DATOS` | `'demo'` en la Fase A; `'firebase'` en la Fase B |
| `YAPE_TITULAR`, `YAPE_QR` | Titular que aparece en Yape y ruta de la imagen del QR |
| `WHATSAPP_EQUIPO` | Número del equipo con código de país, solo dígitos. Vacío: el botón avisa que falta configurarlo |
| `CORREOS_ADMIN` | Correos del equipo con acceso al panel (Fase B) |
| `DOMINIOS_INSTITUCIONALES` | Dominios de correo que verifican a un vendedor |
| `PUNTOS_ENTREGA` | Lugares públicos sugeridos por universidad |
| `CATEGORIAS` | Categorías y ángulos guiados de la foto verificada |

## Probar en local

Desde la carpeta que contiene el repositorio (para imitar la subcarpeta `/Relevo/` de Pages):

```bash
python3 -m http.server 8765
```

Luego abre `http://localhost:8765/Relevo/` (si la carpeta del repositorio se llama distinto, usa ese nombre o crea un enlace llamado `Relevo`). Las pruebas están en `http://localhost:8765/Relevo/tests/pruebas.html`.

Usuarios de prueba (pantalla Ingresar): comprador, vendedor con correo institucional, vendedora sin correo institucional y equipo.

Recorridos para probar:

- **Pago en modo entrevista:** Explorar, un material, Comprar, ingresar como comprador. Se ve todo el pago y el botón termina la demostración sin crear pedido.
- **Pago real simulado:** abre `http://localhost:8765/Relevo/?entrevista=0` y repite. Pide número de operación y crea el pedido en "Pago informado".
- **Comisión:** Publicar, escribe distintos precios. Con 4 o menos aparece el error; con menos de 15 aparece el porcentaje.
- **Foto verificada:** en Publicar, elige categoría y toma una foto por ángulo. En el celular se abre la cámara.
- **Pedidos:** Mis compras y Mis ventas, cada pedido con su línea de tiempo, entrega y reclamo.
- **Panel del equipo:** ingresa como equipo y abre Equipo. Aprueba publicaciones, confirma pagos, marca transferencias y exporta el CSV.
- **Experimento A/B:** `/Relevo/experimento/fotos/?orden=AB` o `?orden=BA`.

## Publicar

GitHub Pages sirve la rama `main` desde la raíz. Al fusionar `mvp-v2` en `main`, el sitio se actualiza solo.
