# Guía de Firebase para el piloto

El piloto vive en `https://alefn05.github.io/Relevo/piloto/` y usa el proyecto de Firebase **relevo-95b06**, con el plan gratuito (Spark). La demo de entrevistas en `/Relevo/` no usa Firebase y no se ve afectada.

Haz estos pasos una sola vez en https://console.firebase.google.com, con la cuenta dueña del proyecto.

## 1. Inicio de sesión con Google

1. Entra a **Authentication**, pestaña **Método de acceso** (Sign-in method).
2. Activa **Google**, elige un correo de asistencia y guarda.
3. Ve a **Configuración**, sección **Dominios autorizados**, y confirma que estén `alefn05.github.io` y `localhost`. Si falta alguno, usa **Agregar dominio**.

## 2. Base de datos Firestore

1. Entra a **Firestore Database**. Si no existe, usa **Crear base de datos**, elige el modo de producción y la ubicación `southamerica-east1` (São Paulo) o `us-central1`. La ubicación no se puede cambiar después.
2. Las colecciones que usa el piloto se crean solas: `usuarios`, `publicaciones` (con la subcolección `fotos`), `pedidos` y `reclamos`.
3. Las colecciones del MVP anterior (`products`, `orders`, `reviews`, `sales`, `users`) quedan cerradas por las reglas nuevas. Puedes borrarlas cuando quieras.

## 3. Correos del equipo

Los correos que pueden usar el panel van en **dos lugares** que deben coincidir exactamente, en minúsculas:

- `firestore.rules`: en la función `admins()`.
- `piloto/config-piloto.js`: en `CORREOS_ADMIN`.

El primero es el que protege de verdad. El segundo solo muestra u oculta el panel en la página. Usa cuentas de Google con el correo verificado.

## 4. Publicar las reglas de seguridad

Primero se prueban con el emulador (paso 5). Después se publican de una de estas dos formas:

- **Con la consola:** en **Firestore Database**, pestaña **Reglas**, pega el contenido completo de `firestore.rules` y pulsa **Publicar**.
- **Con la terminal**, desde la carpeta del proyecto:

```bash
npx firebase login
```

```bash
npx firebase deploy --only firestore:rules --project relevo-95b06
```

## 5. Probar las reglas con el emulador

Necesitas Node.js 22 y Java 21 instalados. Desde la carpeta del proyecto:

```bash
npm install
```

```bash
npm run test:reglas
```

El emulador corre solo en tu computadora, con un proyecto de prueba (`demo-relevo`): no toca los datos reales.

## 6. Verificar el piloto

1. Abre `https://alefn05.github.io/Relevo/piloto/` e ingresa con Google con un correo del equipo. Debe aparecer **Equipo** en el menú.
2. Con otra cuenta, publica un material de prueba con 3 fotos.
3. Con la cuenta del equipo, apruébalo en el panel. Debe aparecer en Explorar con la marca Foto verificada.
4. Con una tercera cuenta, cómpralo escribiendo un número de operación y un monto de prueba. Confirma o rechaza el pago desde el panel.
5. Al terminar, borra los datos de prueba desde la consola de Firestore.

## Qué no se guarda en el repositorio

- La configuración web de Firebase (`apiKey`, `projectId` y similares) es pública por diseño: identifica el proyecto, no da permisos. Por eso está en `piloto/config-piloto.js`.
- No hay claves privadas, cuentas de servicio ni contraseñas en el repositorio, y no deben agregarse.

## Costos

Todo cabe en el plan gratuito para un piloto de 2 semanas: Firestore permite 1 GiB guardado, 50 000 lecturas y 20 000 escrituras al día. Las fotos se guardan reducidas dentro de Firestore (unos 60 a 150 KB cada una), así que no hace falta Cloud Storage ni el plan Blaze.
