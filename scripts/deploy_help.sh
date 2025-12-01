#!/bin/bash

# Script de ayuda para deploy en Vercel
# Este script guía al usuario a través del proceso de deploy

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SimTS - Asistente de Deploy${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Función para preguntar sí/no
ask_yes_no() {
    while true; do
        read -p "$1 (s/n): " yn
        case $yn in
            [Ss]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Por favor responde s (sí) o n (no).";;
        esac
    done
}

echo -e "${YELLOW}Este script te ayudará a preparar tu proyecto para deploy en Vercel.${NC}\n"

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo -e "${RED}Error: No se encuentra la estructura del proyecto.${NC}"
    echo "Asegúrate de ejecutar este script desde la raíz del proyecto simts."
    exit 1
fi

echo -e "${GREEN}✓${NC} Estructura del proyecto verificada\n"

# 2. Verificar configuración de Git
echo -e "${BLUE}[1/5]${NC} Verificando configuración de Git..."
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}!${NC} Git no está inicializado."
    if ask_yes_no "¿Deseas inicializar Git ahora?"; then
        git init
        echo -e "${GREEN}✓${NC} Git inicializado"
    else
        echo -e "${RED}Git es necesario para deploy en Vercel.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Git ya está inicializado"
fi

# Verificar remote
if ! git remote | grep -q origin; then
    echo -e "${YELLOW}!${NC} No hay remote 'origin' configurado."
    echo "Para continuar, necesitas un repositorio en GitHub."
    echo "1. Crea un repositorio en https://github.com/new"
    echo "2. Luego ejecuta:"
    echo "   git remote add origin https://github.com/TU_USUARIO/simts.git"
    echo "   git add ."
    echo "   git commit -m 'feat: preparar para deploy'"
    echo "   git push -u origin main"
else
    echo -e "${GREEN}✓${NC} Remote 'origin' configurado"
fi
echo ""

# 3. Verificar archivos de configuración
echo -e "${BLUE}[2/5]${NC} Verificando archivos de configuración..."

if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓${NC} vercel.json existe"
else
    echo -e "${YELLOW}!${NC} vercel.json no encontrado (es normal, se creó recientemente)"
fi

if [ -f "backend/Procfile" ]; then
    echo -e "${GREEN}✓${NC} backend/Procfile existe (para Render)"
else
    echo -e "${YELLOW}!${NC} backend/Procfile no encontrado"
fi
echo ""

# 4. Verificar variables de entorno
echo -e "${BLUE}[3/5]${NC} Verificando variables de entorno..."

if [ -f "backend/.env" ]; then
    if grep -q "OPENAI_API_KEY" backend/.env; then
        echo -e "${GREEN}✓${NC} OPENAI_API_KEY configurada localmente"
    else
        echo -e "${YELLOW}!${NC} OPENAI_API_KEY no encontrada en backend/.env"
    fi
else
    echo -e "${YELLOW}!${NC} Archivo backend/.env no encontrado"
fi

echo -e "\n${YELLOW}Importante:${NC} Recuerda configurar las siguientes variables de entorno en producción:"
echo "  Render (Backend):"
echo "    - OPENAI_API_KEY=sk-..."
echo "    - PORT=10000"
echo ""
echo "  Vercel (Frontend):"
echo "    - VITE_API_URL=https://tu-backend.onrender.com"
echo ""

# 5. Verificar que el proyecto compile
echo -e "${BLUE}[4/5]${NC} Verificando que el frontend compile..."

if [ -d "frontend" ]; then
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}!${NC} Instalando dependencias..."
        npm install
    fi
    
    echo "Intentando build del frontend..."
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend compila correctamente"
        echo -e "${GREEN}✓${NC} Build generado en frontend/dist/"
    else
        echo -e "${RED}✗${NC} Error al compilar el frontend"
        echo "Ejecuta 'cd frontend && npm run build' para ver los errores"
    fi
    cd ..
else
    echo -e "${YELLOW}!${NC} Directorio frontend no encontrado"
fi
echo ""

# 6. Próximos pasos
echo -e "${BLUE}[5/5]${NC} Próximos pasos para deploy\n"

echo -e "${GREEN}Opción 1: Frontend en Vercel + Backend en Render (Recomendado)${NC}"
echo "  1. Deploy del Backend en Render:"
echo "     a. Ve a https://render.com/new"
echo "     b. Conecta tu repositorio GitHub"
echo "     c. Selecciona 'Web Service'"
echo "     d. Root Directory: 'backend'"
echo "     e. Build Command: 'pip install -r requirements.txt'"
echo "     f. Start Command: 'uvicorn main:app --host 0.0.0.0 --port \$PORT'"
echo "     g. Agrega variables de entorno (OPENAI_API_KEY)"
echo ""
echo "  2. Deploy del Frontend en Vercel:"
echo "     a. Ve a https://vercel.com/new"
echo "     b. Importa tu repositorio GitHub"
echo "     c. Framework: Vite"
echo "     d. Root Directory: 'frontend'"
echo "     e. Build Command: 'npm run build'"
echo "     f. Output Directory: 'dist'"
echo "     g. Agrega variable: VITE_API_URL (URL de Render del paso 1)"
echo ""

echo -e "${YELLOW}Opción 2: Todo en Vercel (Serverless)${NC}"
echo "  - Más complejo, requiere configuración adicional"
echo "  - Ver DEPLOY-VERCEL.md para detalles"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Documentación completa: DEPLOY-VERCEL.md${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Mostrar comandos útiles
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  Ver guía completa:"
echo "    cat DEPLOY-VERCEL.md | less"
echo ""
echo "  Instalar Vercel CLI:"
echo "    npm install -g vercel"
echo ""
echo "  Deploy con Vercel CLI:"
echo "    cd frontend && vercel"
echo ""
echo "  Commit y push a GitHub:"
echo "    git add ."
echo "    git commit -m 'ready for deploy'"
echo "    git push origin main"
echo ""

exit 0
