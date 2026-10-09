#!/bin/bash
set -euo pipefail

cat <<'EOF'
SimTS - Frontend en GitHub Pages

1. Publica los cambios de codigo en main.
2. Ejecuta:
   VITE_API_URL=https://simts.onrender.com bash scripts/deploy_pages.sh
3. El script prueba y compila React, publica solo los archivos estaticos en
   gh-pages y configura Pages para servir esa rama.
4. Espera el workflow pages-build-deployment y comprueba API Online.

No agregues claves de IA: el frontend y la URL del backend son publicos.

Para este repositorio:
  Frontend: https://estebancofre-coy.github.io/simts/
  Backend:  https://simts.onrender.com

El script compila frontend/dist, publica sus archivos y resuelve la ruta
/simts/ de scripts, estilos y logo. No necesita Vercel ni Vercel Blob.
El backend y sus claves/persistencia siguen en su servicio actual.

Para desconectar el despliegue anterior, desactiva la integracion Git
del proyecto Vercel desde su dashboard antes de eliminarlo. No borres el
backend ni sus datos.

Documentacion: DEPLOY-GITHUB-PAGES.md
Automatizacion opcional: scripts/pages-workflow.yml.example
EOF
