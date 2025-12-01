# 🔧 Guía de Troubleshooting - SimTS

Esta guía te ayudará a resolver problemas comunes de accesibilidad y conectividad en la aplicación SimTS.

## 📋 Índice

1. [Verificación Rápida](#verificación-rápida)
2. [Problemas Comunes](#problemas-comunes)
3. [Herramientas de Diagnóstico](#herramientas-de-diagnóstico)
4. [Configuración de Acceso](#configuración-de-acceso)

---

## ✅ Verificación Rápida

### 1. Ejecutar Script de Diagnóstico

```bash
./scripts/check_frontend.sh
```

Este script verificará:
- ✓ Proceso de Vite ejecutándose
- ✓ Puerto 5173 escuchando
- ✓ Conectividad HTTP local
- ✓ Contenido HTML correcto
- ✓ Recursos de la aplicación
- ✓ Conectividad al backend

### 2. Verificar Estado de Servicios

**Frontend:**
```bash
ps aux | grep vite
netstat -tlnp | grep 5173
curl -I http://localhost:5173
```

**Backend:**
```bash
ps aux | grep uvicorn
netstat -tlnp | grep 8000
curl -I http://localhost:8000/docs
```

---

## 🔴 Problemas Comunes

### Problema 1: "No puedo acceder al frontend"

**Síntomas:**
- Página en blanco
- Error 404
- "Connection refused"
- "ERR_CONNECTION_REFUSED"

**Soluciones:**

1. **Verificar que el servidor esté ejecutándose:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Verificar el puerto:**
   ```bash
   netstat -tlnp | grep 5173
   ```
   Debe mostrar: `0.0.0.0:5173`

3. **Reiniciar el servidor:**
   ```bash
   ./scripts/stop.sh
   cd frontend && npm run dev
   ```

4. **Verificar port forwarding (en Codespaces/devcontainer):**
   - En VS Code, abre la pestaña "PORTS"
   - Verifica que el puerto 5173 esté forwardeado
   - La visibilidad debe ser "Public" o "Private" según tu configuración

### Problema 2: "El frontend carga pero no se conecta al backend"

**Síntomas:**
- Indicador de estado muestra "● API Offline" (rojo)
- Errores de CORS en la consola del navegador
- Fetch errors

**Soluciones:**

1. **Verificar que el backend esté ejecutándose:**
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Verificar health check:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   Debe retornar JSON con `"status": "healthy"`

3. **Verificar configuración de proxy en `vite.config.js`:**
   Debe contener:
   ```javascript
   proxy: {
     '/api': {
       target: 'http://localhost:8000',
       changeOrigin: true,
       secure: false
     }
   }
   ```

### Problema 3: "JavaScript no se carga"

**Síntomas:**
- Mensaje de "Cargando SimTS..." permanece visible
- Errores 404 para `/src/main.jsx`
- Console muestra errores de módulos

**Soluciones:**

1. **Verificar que los archivos existan:**
   ```bash
   ls -la frontend/src/main.jsx
   ls -la frontend/src/App.jsx
   ```

2. **Reinstalar dependencias:**
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   npm run dev
   ```

3. **Verificar permisos:**
   ```bash
   chmod -R u+r frontend/src/
   ```

### Problema 4: "Mensaje 'JavaScript es requerido'"

**Síntomas:**
- Aparece el mensaje amarillo de advertencia
- La aplicación no carga

**Causa:**
JavaScript está deshabilitado en el navegador

**Solución:**
1. Habilita JavaScript en la configuración del navegador
2. En Chrome: Settings → Privacy and security → Site Settings → JavaScript → Allowed
3. En Firefox: about:config → javascript.enabled → true

### Problema 5: "CORS errors"

**Síntomas:**
```
Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Soluciones:**

1. **Verificar configuración de CORS en `vite.config.js`:**
   ```javascript
   server: {
     cors: true,
     headers: {
       'Access-Control-Allow-Origin': '*'
     }
   }
   ```

2. **Usar el proxy en lugar de llamadas directas:**
   Las llamadas deben ser a `/api/...` no a `http://localhost:8000/api/...`

---

## 🛠️ Herramientas de Diagnóstico

### Script de Diagnóstico Completo

```bash
./scripts/check_frontend.sh
```

### Smoke Test

```bash
./scripts/smoke.sh
```

### Verificación Manual

**1. Verificar contenido HTML:**
```bash
curl http://localhost:5173 | grep "SimTS"
```

**2. Verificar API backend:**
```bash
curl http://localhost:8000/api/health
```

**3. Verificar procesos:**
```bash
ps aux | grep -E "(vite|uvicorn)" | grep -v grep
```

**4. Verificar logs:**

Frontend:
```bash
# Los logs aparecen en la terminal donde ejecutas npm run dev
```

Backend:
```bash
# Los logs aparecen en la terminal donde ejecutas uvicorn
```

---

## 🌐 Configuración de Acceso

### Acceso Local

Si estás trabajando localmente en tu máquina:

```
Frontend: http://localhost:5173
Backend:  http://localhost:8000/docs
```

### Acceso en Docker Compose

Si usas Docker Compose:

```bash
docker-compose up -d
```

Acceso:
```
Frontend: http://localhost:5173
Backend:  http://localhost:8000/docs
```

### Acceso en GitHub Codespaces

1. Cuando inicies el servidor, Codespaces automáticamente detectará el puerto 5173
2. Aparecerá una notificación "Your application running on port 5173 is available"
3. Click en "Open in Browser" o "Preview"
4. Alternativamente:
   - Ve a la pestaña "PORTS"
   - Encuentra el puerto 5173
   - Click en el ícono de "Open in Browser" (🌐)
   - La URL será algo como: `https://username-repo-xxxxx.githubpreview.dev`

**Configurar visibilidad del puerto:**
- En la pestaña "PORTS", click derecho en el puerto 5173
- Selecciona "Port Visibility" → "Public" (para compartir) o "Private" (solo tú)

### Acceso en VS Code Dev Containers

Similar a Codespaces:
1. Los puertos se forwarded automáticamente
2. Ve a la pestaña "PORTS"
3. Verifica que 5173 y 8000 estén listados
4. Accede a través de `http://localhost:5173`

---

## 🔍 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] El servidor de desarrollo está ejecutándose (`npm run dev`)
- [ ] El puerto 5173 está escuchando (`netstat -tlnp | grep 5173`)
- [ ] El backend está ejecutándose y responde (`curl http://localhost:8000/api/health`)
- [ ] JavaScript está habilitado en el navegador
- [ ] No hay errores en la consola del navegador (F12)
- [ ] El port forwarding está configurado (en entornos remotos)
- [ ] Los archivos `index.html` y `main.jsx` existen y tienen permisos de lectura
- [ ] Las dependencias están instaladas (`node_modules` existe)

---

## 📞 Obtener Ayuda

Si el problema persiste después de seguir esta guía:

1. **Ejecuta el diagnóstico completo:**
   ```bash
   ./scripts/check_frontend.sh > diagnostics.txt
   ```

2. **Captura los logs:**
   - Logs del frontend (terminal donde corre `npm run dev`)
   - Logs del backend (terminal donde corre `uvicorn`)
   - Errores de la consola del navegador (F12 → Console)

3. **Información del sistema:**
   ```bash
   node --version
   npm --version
   python --version
   ```

4. **Reporta el issue con:**
   - Descripción del problema
   - Pasos para reproducir
   - Archivo `diagnostics.txt`
   - Logs capturados
   - Versiones del sistema

---

## 📚 Recursos Adicionales

- [README.md](./README.md) - Documentación principal
- [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) - Guía de despliegue
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de FastAPI](https://fastapi.tiangolo.com/)

---

**Última actualización:** Diciembre 2025
