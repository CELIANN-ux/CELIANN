# Celiann

Este es el código fuente completo de tu prototipo, listo para convertirse en una página web de verdad con una dirección propia (por ejemplo `celiann.vercel.app`).

## Cómo publicarlo (sin usar la terminal)

### Paso 1: Sube estos archivos a GitHub

1. Crea una cuenta gratis en [github.com](https://github.com) si no tienes una.
2. Descarga e instala **GitHub Desktop** ([desktop.github.com](https://desktop.github.com)) — es una aplicación con botones, no una terminal.
3. Abre GitHub Desktop, entra con tu cuenta, y elige **"Add an Existing Repository from your Hard Drive"**, señalando la carpeta donde descomprimiste este proyecto.
4. Si te pregunta si quieres crear un repositorio ahí, di que sí.
5. Dale clic a **"Publish repository"** (puede ser público o privado, como prefieras).

### Paso 2: Conéctalo a Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta gratis, entrando con tu cuenta de GitHub (un solo clic).
2. Dale clic a **"Add New" → "Project"**.
3. Busca y selecciona el repositorio **celiann** que acabas de subir.
4. Vercel reconoce automáticamente que es un proyecto de Vite + React — no necesitas cambiar nada.
5. Dale clic a **"Deploy"** y espera un par de minutos.
6. Al terminar, te da una dirección como `celiann.vercel.app` que ya puedes abrir en cualquier navegador o compartir con quien quieras.

Cada vez que quieras actualizar la página, subes los cambios desde GitHub Desktop y Vercel la vuelve a publicar solo, automáticamente.

## Algo importante que debes saber

Ahora mismo, cada persona que entre a la página guarda su sesión y sus datos **en su propio navegador** (perfil, publicaciones que cree, seguidores). Eso significa que si tú publicas algo, otra persona que entre desde su celular no lo va a ver todavía — cada quien tiene su propia copia funcionando.

Para que sea una red social real donde todos vean lo mismo, el siguiente paso es conectarla a una base de datos compartida (un backend). Es un proyecto aparte, pero desde aquí ya tienes una página real, con una dirección propia, que puedes mostrarle a quien quieras mientras decides los siguientes pasos.

## Si prefieres hacerlo tú mismo con la terminal

```bash
npm install
npm run dev       # para probarlo en tu computadora
npm run build     # genera la versión final en la carpeta dist/
```
