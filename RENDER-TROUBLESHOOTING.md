# 🆘 Troubleshooting - Problemas con Render

> El frontend ahora se aloja en GitHub Pages, no en Vercel. Las alternativas
> Vercel de este documento son historicas y no forman parte del despliegue
> actual. Consulta [la guia actual](DEPLOY-GITHUB-PAGES.md); conserva el backend
> existente y su persistencia.

## Problema Reportado
"Tuve problemas conectando a Render, falló"

---

## ✅ Alternativas a Render (Más Fáciles)

Si Render te está dando problemas, aquí hay alternativas más simples:

### **Opción A: Railway.app (Recomendado como alternativa)** 🚂

Railway es más simple que Render y tiene mejor integración con GitHub.

**Pasos:**
1. Ve a https://railway.app
2. Click en "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway a acceder a GitHub
5. Selecciona el repositorio `estebancofre-coy/simts`
6. Railway detectará automáticamente que es Python
7. Configura:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
8. En "Variables":
   - Agrega `OPENAI_API_KEY=sk-...`
9. Click "Deploy"

Railway te dará una URL como: `https://simts-backend.railway.app`

**Ventajas:**
- ✅ $5 gratis cada mes
- ✅ Más fácil de configurar
- ✅ Mejor UI
- ✅ Deploy más rápido

---

### **Opción B: Fly.io** 🪰

**Pasos:**
1. Instala Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login:
   ```bash
   flyctl auth login
   ```

3. Desde el directorio backend:
   ```bash
   cd backend
   flyctl launch
   ```

4. Configurar:
   - Name: `simts-backend`
   - Region: Elige el más cercano
   - Database: No

5. Agregar variables de entorno:
   ```bash
   flyctl secrets set OPENAI_API_KEY=sk-...
   ```

6. Deploy:
   ```bash
   flyctl deploy
   ```

---

### **Opción C: Vercel Serverless (Todo en un lugar)** ⚡

Si prefieres tener todo en Vercel sin backend separado:

1. Crea carpeta `api/` en la raíz
2. Esta alternativa historica ya no se usa; consulta [GitHub Pages](DEPLOY-GITHUB-PAGES.md).

**Ventaja:** Todo en un solo lugar
**Desventaja:** Timeout de 10 segundos

---

## 🔍 Diagnóstico de Problemas con Render

Si aún quieres usar Render, aquí está cómo resolver problemas específicos:

### Error 1: "Failed to connect repository"

**Síntomas:**
- No puedes ver tu repositorio en la lista
- Error al intentar conectar

**Solución:**
```bash
# 1. Asegúrate de que el código esté en GitHub
git add .
git commit -m "fix: preparar para deploy"
git push origin main

# 2. Ve a GitHub.com → Settings → Applications
# 3. Busca "Render" y revoca acceso
# 4. Ve a Render.com nuevamente y autoriza de nuevo
# 5. Ahora deberías ver el repositorio
```

### Error 2: "Build failed"

**Síntomas:**
- El deploy inicia pero falla durante el build
- Logs muestran errores de Python o dependencias

**Solución - Crear archivo `render.yaml`:**

Crea `render.yaml` en la raíz del proyecto:

```yaml
services:
  - type: web
    name: simts-backend
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r backend/requirements.txt
    startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: PYTHON_VERSION
        value: 3.11.0
```

Luego:
```bash
git add render.yaml
git commit -m "feat: add render config"
git push origin main
```

En Render, selecciona "New → Blueprint" y elige tu repositorio.

### Error 3: "Start command failed"

**Síntomas:**
- Build exitoso pero el servicio no inicia
- Logs muestran error al ejecutar uvicorn

**Solución:**

Verifica que en Render Dashboard tengas:
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Root Directory**: `backend`

Si usas "Advanced", asegúrate de:
- **Working Directory**: `backend`
- **Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Error 4: "Application error / 503"

**Síntomas:**
- Deploy exitoso pero la URL muestra error
- El servicio se detiene inmediatamente

**Solución:**

1. Revisa los logs en Render Dashboard
2. Probablemente falta la variable de entorno:
   ```
   Settings → Environment → Add Environment Variable
   Key: OPENAI_API_KEY
   Value: sk-...
   ```
3. Guarda y espera a que redeploy automáticamente

### Error 5: "CORS errors" después del deploy

**Síntomas:**
- Backend funciona (puedes acceder a `/docs`)
- Frontend muestra "API Offline"
- Errores de CORS en la consola del navegador

**Solución:**

Agrega CORS middleware a `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Simulador Trabajo Social - Backend")

# Agregar CORS DESPUÉS de crear app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica https://estebancofre-coy.github.io
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📋 Checklist Antes de Deploy en Render

- [ ] Código está en GitHub (`git push origin main`)
- [ ] `backend/requirements.txt` existe y tiene todas las dependencias
- [ ] `backend/runtime.txt` tiene `python-3.11.0`
- [ ] `backend/Procfile` tiene `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Tienes tu `OPENAI_API_KEY` lista
- [ ] El repositorio es público O has dado permisos a Render

---

## 🎯 Recomendación

Basado en tu situación, te recomiendo:

**1. Prueba Railway primero** (más fácil)
   - Ve a https://railway.app
   - Es más amigable que Render
   - Mejor integración con GitHub

**2. Si Railway también falla, usa Vercel Serverless**
   - Todo en un solo lugar
   - Esta alternativa historica ya no se usa; consulta [GitHub Pages](DEPLOY-GITHUB-PAGES.md).

**3. Si necesitas ayuda específica con Render**
   - Comparte el error exacto que ves
   - Comparte los logs de Render
   - Podemos diagnosticar juntos

---

## 💬 ¿Qué Error Específico Viste?

Para ayudarte mejor, necesito saber:

1. **¿En qué paso fallaste?**
   - [ ] No podías conectar el repositorio
   - [ ] El build falló
   - [ ] El deploy falló
   - [ ] El servicio no inicia
   - [ ] Otro: ___________

2. **¿Qué mensaje de error viste?**
   - Copia y pega el error exacto

3. **¿Llegaste a ver logs?**
   - Si sí, compártelos

---

## 🚀 Siguiente Paso Recomendado

```bash
# Prueba Railway (más simple)
# 1. Ve a https://railway.app
# 2. "Start a New Project" → "Deploy from GitHub"
# 3. Selecciona tu repo
# 4. Railway lo configurará automáticamente
# 5. Solo agrega OPENAI_API_KEY en Variables
```

¿Quieres que te ayude a configurar Railway en su lugar?
