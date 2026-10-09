# Frontend en GitHub Pages

SimTS publica su frontend React/Vite como archivos estaticos en GitHub Pages.
No usa Vercel, funciones serverless ni almacenamiento Vercel Blob. React/Vite
siguen siendo herramientas de construccion; no requieren un servidor Node
en produccion. El logo se sirve desde el mismo sitio.

- Frontend: https://estebancofre-coy.github.io/simts/
- Backend actual: https://simts.onrender.com

GitHub Pages no ejecuta Python ni almacena casos. FastAPI, SQLite y las claves
de IA permanecen exclusivamente en el backend existente.

## Configuracion inicial

1. Publica el codigo fuente en `main`.
2. Con Git, Node.js y `gh` autenticado, ejecuta desde el repositorio:

   ```bash
   VITE_API_URL=https://simts.onrender.com bash scripts/deploy_pages.sh
   ```

3. El script instala con `npm ci`, ejecuta los tests, compila y publica solo
   `frontend/dist` en `gh-pages`. Usa un indice Git temporal, sin cambiar la
   rama de trabajo ni incluir archivos ajenos. Conserva la historia de
   `gh-pages` y no utiliza force push.
4. Configura automaticamente Pages en **Deploy from a branch**, rama
   **gh-pages**, carpeta **/(root)**. Espera el workflow
   **pages-build-deployment** y abre la URL del sitio.
   Debe mostrar el simulador y **API Online**.

Los cambios en `main` no recompilan automaticamente el frontend en este
modo: vuelve a ejecutar el script para publicar cada nueva version.

La URL del backend es publica y queda incluida en el JavaScript compilado.
Nunca configures `OPENAI_API_KEY`, `GEMINI_API_KEY` ni secretos en variables
`VITE_*`. Las claves solo se configuran en el servicio backend.

El build rechaza una URL ausente, no HTTPS o con credenciales/query/fragmento
para evitar publicar un frontend que intente llamar a la API en GitHub Pages.
Al cambiar `VITE_API_URL`, ejecuta nuevamente el workflow: la configuracion
se incorpora durante la compilacion; vuelve a ejecutar el script.

### Automatizacion opcional con Actions

La credencial usada para esta migracion no tiene permiso `workflow`, por lo
que GitHub no permite crear workflows con ella. El despliegue por rama
funciona con los permisos actuales y no depende de ese permiso.

Para automatizar cada push a `main`, autoriza una credencial con permiso
`workflow`, copia [el ejemplo](scripts/pages-workflow.yml.example) a
`.github/workflows/pages.yml` y publicalo. Configura **Settings > Pages >
Source: GitHub Actions** y la variable publica de Actions `VITE_API_URL`.
Entonces el workflow realizara las pruebas, el build y el despliegue.

## Rutas y recursos

El script establece `PAGES_BASE_PATH` con el nombre del repositorio
(`/simts/`). Para repositorios `*.github.io`, usa `/`. Vite aplica esa ruta
a los scripts, estilos y al logo local. No se necesita un proxy de Pages:
el navegador llama directamente al backend por HTTPS.

El frontend actual no usa rutas de navegador, por lo que no necesita reglas
de reescritura ni un servidor para manejar rutas SPA.

Los archivos generados no se versionan en `main`; se publican en `gh-pages`.
El archivo `.nojekyll` evita procesarlos como documentacion Jekyll.
El sitio anterior de documentacion deja de ser el frontend.

## Backend y CORS

El backend debe permitir el origen `https://estebancofre-coy.github.io`
(sin `/simts/`, los origenes no incluyen rutas). La configuracion actual de
FastAPI ya permite peticiones cross-origin. La migracion no cambia el
proveedor de IA, la base de datos ni los endpoints.

Comprueba la API:

```bash
curl -fsS https://simts.onrender.com/api/health
curl -i -X OPTIONS https://simts.onrender.com/api/simulate \
  -H 'Origin: https://estebancofre-coy.github.io' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

## Desarrollo y verificacion local

El servidor de desarrollo mantiene su proxy hacia `http://localhost:8000`.
Sin `VITE_API_URL`, `npm run dev` utiliza ese proxy.

```bash
cd frontend
npm ci
npm test
GITHUB_PAGES=true PAGES_BASE_PATH=/simts/ \
  VITE_API_URL=https://simts.onrender.com npm run build
npm run preview
```

En preview abre `http://localhost:5173/simts/`.

## Retirar Vercel

La configuracion de Vercel se elimina del repositorio y los recursos de
marca quedan locales. La homepage del repositorio debe apuntar a Pages.
Una integracion Git instalada en Vercel puede seguir compilando al recibir
pushes aunque no exista `vercel.json`: desconecta el repositorio desde
**Vercel > Project > Settings > Git** o elimina los proyectos antiguos desde
su dashboard cuando hayas verificado Pages. Esto requiere acceso a Vercel
y no modifica el backend.

## Diagnostico

- Sitio con README: Pages sigue apuntando a `main`, no a `gh-pages`.
- Pantalla vacia o recursos 404: revisa el job build y `PAGES_BASE_PATH`.
- API Offline: comprueba la URL del backend, CORS y disponibilidad del servicio.
- URL antigua tras cambiar variables: ejecuta nuevamente el script.
- Generacion falla: consulta el error visible y los logs del backend; Pages
  solo aloja el frontend y no genera casos.
