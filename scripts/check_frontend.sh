#!/bin/bash

# Script de diagnóstico de accesibilidad del frontend
# Verifica que el frontend de SimTS sea accesible

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:8000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SimTS - Diagnóstico de Accesibilidad${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. Verificar si el proceso de Vite está corriendo
echo -e "${YELLOW}[1/6]${NC} Verificando proceso de Vite..."
if pgrep -f "vite.*5173" > /dev/null; then
    echo -e "${GREEN}✓${NC} Proceso de Vite encontrado"
    VITE_PID=$(pgrep -f "vite.*5173" | head -1)
    echo "      PID: $VITE_PID"
else
    echo -e "${RED}✗${NC} Proceso de Vite NO encontrado"
    echo -e "${YELLOW}  Sugerencia:${NC} Ejecutar 'cd frontend && npm run dev'"
    exit 1
fi

# 2. Verificar que el puerto 5173 está escuchando
echo -e "\n${YELLOW}[2/6]${NC} Verificando puerto 5173..."
if netstat -tlnp 2>/dev/null | grep -q ":5173"; then
    LISTEN_ADDR=$(netstat -tlnp 2>/dev/null | grep ":5173" | awk '{print $4}')
    echo -e "${GREEN}✓${NC} Puerto 5173 está escuchando en: $LISTEN_ADDR"
else
    echo -e "${RED}✗${NC} Puerto 5173 NO está escuchando"
    exit 1
fi

# 3. Verificar conectividad local HTTP
echo -e "\n${YELLOW}[3/6]${NC} Probando conectividad HTTP local..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Frontend responde correctamente (HTTP $HTTP_CODE)"
else
    echo -e "${RED}✗${NC} Frontend no responde adecuadamente (HTTP $HTTP_CODE)"
    exit 1
fi

# 4. Verificar contenido del index.html
echo -e "\n${YELLOW}[4/6]${NC} Verificando contenido HTML..."
CONTENT=$(curl -s "$FRONTEND_URL" 2>/dev/null)
if echo "$CONTENT" | grep -q "SimTS"; then
    echo -e "${GREEN}✓${NC} Contenido HTML contiene 'SimTS'"
else
    echo -e "${YELLOW}!${NC} Advertencia: Contenido HTML no contiene 'SimTS'"
fi

if echo "$CONTENT" | grep -q "/src/main.jsx"; then
    echo -e "${GREEN}✓${NC} Script de entrada React encontrado"
else
    echo -e "${RED}✗${NC} Script de entrada React NO encontrado"
fi

# 5. Verificar acceso a recursos estáticos
echo -e "\n${YELLOW}[5/6]${NC} Verificando recursos de la aplicación..."
if [ -f "/workspaces/simts/frontend/index.html" ]; then
    PERMS=$(ls -l /workspaces/simts/frontend/index.html | awk '{print $1}')
    echo -e "${GREEN}✓${NC} index.html existe (permisos: $PERMS)"
else
    echo -e "${RED}✗${NC} index.html NO encontrado"
fi

if [ -f "/workspaces/simts/frontend/src/main.jsx" ]; then
    echo -e "${GREEN}✓${NC} main.jsx existe"
else
    echo -e "${RED}✗${NC} main.jsx NO encontrado"
fi

# 6. Verificar conectividad al backend
echo -e "\n${YELLOW}[6/6]${NC} Verificando conectividad al backend..."
BACKEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/docs" 2>/dev/null || echo "000")
if [ "$BACKEND_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Backend responde correctamente (HTTP $BACKEND_CODE)"
else
    echo -e "${YELLOW}!${NC} Advertencia: Backend no responde (HTTP $BACKEND_CODE)"
    echo "      El frontend puede funcionar con funcionalidad limitada"
fi

# Resumen final
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Diagnóstico completado exitosamente${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "El frontend está accesible en: ${GREEN}$FRONTEND_URL${NC}"
echo -e "Para acceder desde fuera del contenedor, verifica:"
echo -e "  1. Port forwarding está configurado (puerto 5173)"
echo -e "  2. Firewall permite conexiones al puerto 5173"
echo -e "  3. En Codespaces/devcontainer: usa la URL proporcionada por el IDE\n"

echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  - Ver logs: ${YELLOW}cd frontend && npm run dev${NC}"
echo -e "  - Reiniciar: ${YELLOW}./scripts/stop.sh && cd frontend && npm run dev${NC}"
echo -e "  - Smoke test: ${YELLOW}./scripts/smoke.sh${NC}\n"

exit 0
