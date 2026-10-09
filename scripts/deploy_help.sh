#!/bin/bash
set -euo pipefail

cat <<'EOF'
SimTS - Frontend en GitHub Pages

1. Configura Settings > Pages > Source: GitHub Actions.
2. En Settings > Secrets and variables > Actions > Variables, agrega:
   VITE_API_URL=https://URL-PUBLICA-DEL-BACKEND
   Debe ser HTTPS. No agregues claves de IA: el frontend es publico.
3. Publica los cambios en main o ejecuta el workflow
   "Deploy frontend to GitHub Pages" desde Actions.
4. Abre la URL indicada por el job deploy y comprueba API Online.

Para este repositorio:
  Frontend: https://estebancofre-coy.github.io/simts/
  Backend:  https://simts.onrender.com

El workflow compila frontend/dist, publica sus archivos y resuelve la ruta
/simts/ de scripts, estilos y logo. No necesita Vercel ni Vercel Blob.
El backend y sus claves/persistencia siguen en su servicio actual.

Para desconectar el despliegue anterior, desactiva la integracion Git
del proyecto Vercel desde su dashboard antes de eliminarlo. No borres el
backend ni sus datos.

Documentacion: DEPLOY-GITHUB-PAGES.md
EOF
