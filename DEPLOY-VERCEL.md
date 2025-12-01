# 🚀 Guía de Deploy a Vercel - SimTS

Esta guía te ayudará a desplegar la aplicación SimTS (FastAPI backend + React frontend) en Vercel.

## 📋 Antes de Comenzar

### Requisitos Previos
- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Cuenta en [GitHub](https://github.com)
- ✅ API Key de OpenAI (`OPENAI_API_KEY`)
- ✅ Código en un repositorio Git

### Arquitectura de la Aplicación
```
simts/
├── backend/           # FastAPI (Python)
│   ├── main.py
│   ├── db.py
│   └── requirements.txt
├── frontend/          # React + Vite
│   ├── src/
│   ├── index.html
│   └── package.json
└── vercel.json       # Configuración de Vercel
```

---

## 🎯 Estrategia de Deploy

Vercel está optimizado para frontend estático. Para una aplicación full-stack necesitamos:

### **Opción 1: Frontend en Vercel + Backend Separado (Recomendado)**
- Frontend React → Vercel
- Backend FastAPI → [Render](https://render.com), [Railway](https://railway.app), o [Fly.io](https://fly.io)
- ✅ Ventaja: Mejor rendimiento, separación de responsabilidades
- ✅ Backend siempre activo, sin cold starts

### **Opción 2: Todo en Vercel usando Serverless Functions**
- Frontend React → Vercel
- Backend FastAPI → Vercel Serverless Functions (Python)
- ⚠️ Ventaja: Todo en un solo lugar
- ⚠️ Desventaja: Cold starts, límites de tiempo de ejecución (10s gratuito)

Esta guía cubre ambas opciones.

---

## 🌐 OPCIÓN 1: Frontend en Vercel + Backend en Render (Recomendado)

### Paso 1: Deploy del Backend en Render

#### 1.1 Crear cuenta en Render
Ve a https://render.com y crea una cuenta (puedes usar GitHub).

#### 1.2 Crear Web Service

1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio GitHub
3. Configura el servicio:
   - **Name**: `simts-backend`
   - **Region**: Elige el más cercano
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free (0$/mes)

#### 1.3 Configurar Variables de Entorno en Render

En la sección **Environment**:
```
OPENAI_API_KEY=sk-your-api-key-here
PORT=10000
```

#### 1.4 Deploy
Click en **"Create Web Service"**. Render desplegará tu backend y te dará una URL como:
```
https://simts-backend.onrender.com
```

Verifica que funcione:
```bash
curl https://simts-backend.onrender.com/api/health
```

### Paso 2: Deploy del Frontend en Vercel

#### 2.1 Crear `vercel.json`

Crea el archivo `vercel.json` en la raíz del proyecto:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": null,
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "cd frontend && npm install"
}
```

#### 2.2 Actualizar configuración de Vite

Edita `frontend/vite.config.js` para producción:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

#### 2.3 Deploy en Vercel

**Método 1: Usando el Dashboard (Más fácil)**

1. Ve a https://vercel.com/new
2. Importa tu repositorio GitHub
3. Configura el proyecto:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. En **Environment Variables**, agrega:
   ```
   VITE_API_URL=https://simts-backend.onrender.com
   ```

5. Click en **Deploy**

**Método 2: Usando CLI**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Seguir las instrucciones
# Cuando pregunte por variables de entorno:
# VITE_API_URL = https://simts-backend.onrender.com
```

#### 2.4 Configurar dominio (opcional)

En el dashboard de Vercel:
- Settings → Domains
- Agrega un dominio personalizado o usa el proporcionado por Vercel

---

## ⚡ OPCIÓN 2: Todo en Vercel (Serverless)

### Paso 1: Configurar Serverless Functions

#### 1.1 Crear estructura para API

```bash
mkdir -p api
```

#### 1.2 Crear `api/index.py`

```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import sys
import os

# Agregar backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app

# Exportar para Vercel
handler = app
```

#### 1.3 Crear `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```

#### 1.4 Crear `requirements.txt` en la raíz

```txt
fastapi
openai
python-dotenv
```

### Paso 2: Deploy

```bash
vercel

# Agregar variables de entorno
vercel env add OPENAI_API_KEY
# Pegar tu API key
```

⚠️ **Limitaciones de esta opción:**
- Timeout de 10 segundos en plan gratuito
- Cold starts pueden ser lentos
- No hay base de datos persistente (usar Vercel Postgres o externa)

---

## 🔒 Configuración de Variables de Entorno

### En Render (Backend)
```
OPENAI_API_KEY=sk-...
PORT=10000
SIMTS_DB_PATH=/opt/render/project/data/cases.db
```

### En Vercel (Frontend)
```
VITE_API_URL=https://simts-backend.onrender.com
```

---

## 🗄️ Base de Datos

### Opción 1: Usar Render Disk (Gratis)
Render proporciona almacenamiento persistente gratis.

En Render, ve a:
- Tu servicio → Settings → Disks
- Agrega un disco: `/opt/render/project/data`

### Opción 2: PostgreSQL en Neon (Gratis)
1. Crea una cuenta en [Neon](https://neon.tech)
2. Crea una base de datos PostgreSQL
3. Actualiza `db.py` para usar PostgreSQL en lugar de SQLite
4. Agrega `DATABASE_URL` a las variables de entorno

---

## ✅ Verificación Post-Deploy

### Backend (Render)
```bash
# Health check
curl https://simts-backend.onrender.com/api/health

# Documentación
curl https://simts-backend.onrender.com/docs
```

### Frontend (Vercel)
Abre tu navegador en la URL proporcionada por Vercel:
```
https://tu-proyecto.vercel.app
```

Deberías ver:
- 🟢 Indicador "● API Online" en la esquina superior derecha
- Interfaz de usuario funcionando
- Capacidad de generar casos

---

## 🔄 Actualizar el Deploy

### Backend (Render)
```bash
git add .
git commit -m "update: mejoras en backend"
git push origin main
```
Render automáticamente detecta los cambios y redespliega.

### Frontend (Vercel)
```bash
git add .
git commit -m "update: mejoras en frontend"
git push origin main
```
Vercel automáticamente detecta los cambios y redespliega.

---

## 🐛 Troubleshooting

### Error: "API Offline" en el frontend

**Causa**: El frontend no puede conectarse al backend.

**Solución**:
1. Verifica que `VITE_API_URL` esté configurada correctamente en Vercel
2. Verifica que el backend esté ejecutándose en Render
3. Revisa los logs en Render

### Error: CORS en producción

**Causa**: El backend no permite requests desde el dominio de Vercel.

**Solución**: Agrega CORS en `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tu-proyecto.vercel.app",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Error: Cold start lento en Render

**Causa**: Plan gratuito de Render detiene el servicio después de 15 min de inactividad.

**Soluciones**:
1. Upgrade a plan pagado ($7/mes)
2. Usa un servicio de "keep-alive" como [UptimeRobot](https://uptimerobot.com)
3. Acepta el delay inicial

### Error: Database no persiste

**Causa**: El sistema de archivos de Render es efímero por defecto.

**Solución**: Agrega un disco persistente en Render (ver sección Base de Datos).

---

## 💰 Costos Estimados

### Plan Gratuito (Hobby)
- **Vercel Frontend**: $0/mes
- **Render Backend**: $0/mes (con cold starts)
- **OpenAI API**: Pago por uso (~$0.002 por request)

**Total**: ~$0-5/mes (dependiendo del uso de OpenAI)

### Plan Producción
- **Vercel Pro**: $20/mes (opcional)
- **Render Starter**: $7/mes (sin cold starts)
- **OpenAI API**: Pago por uso

**Total**: ~$27-50/mes

---

## 📊 Monitoreo

### Vercel
- Dashboard → Analytics: Ver tráfico, performance
- Dashboard → Logs: Ver errores del frontend
- Dashboard → Speed Insights: Métricas de velocidad

### Render
- Dashboard → Logs: Ver logs del backend en tiempo real
- Dashboard → Metrics: CPU, memoria, requests

### OpenAI
- Platform → Usage: Monitorear uso y costos de API

---

## 🔗 URLs Útiles

### Documentación
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html)

### Dashboards
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Render Dashboard](https://dashboard.render.com)
- [OpenAI Usage](https://platform.openai.com/usage)

---

## 🎓 Próximos Pasos

1. ✅ Configura un dominio personalizado
2. ✅ Agrega analytics (Google Analytics, Plausible)
3. ✅ Configura monitoreo de errores (Sentry)
4. ✅ Implementa CI/CD tests automáticos
5. ✅ Configura backups automáticos de la base de datos
6. ✅ Agrega rate limiting para prevenir abuso

---

## 📞 Soporte

¿Problemas con el deploy?

1. Revisa los logs en Vercel y Render
2. Ejecuta `./scripts/check_frontend.sh` localmente
3. Consulta [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Abre un issue en GitHub

---

**Última actualización**: Diciembre 2025
