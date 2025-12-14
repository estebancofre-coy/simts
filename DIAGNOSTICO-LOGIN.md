# Diagnóstico del Problema de Login

## Problema Reportado
Error "Failed to fetch" en los login

## Verificaciones Realizadas ✅

### 1. Backend está funcionando
```bash
curl https://simts.onrender.com/api/health
# ✅ Responde: {"status":"healthy"...}
```

### 2. Endpoint de login existe y funciona
```bash
curl -X POST https://simts.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
# ✅ Responde: {"detail":"Usuario o contraseña incorrectos"}
```

### 3. CORS configurado correctamente
```bash
# ✅ Headers de respuesta:
# access-control-allow-origin: https://simts-frontend.vercel.app
# access-control-allow-methods: POST, GET, ...
# access-control-allow-credentials: true
```

## Tipos de Login en la Aplicación

### Login de Docentes (LoginModal.jsx)
- **No usa fetch**: Credenciales hardcodeadas en frontend
- **Usuario**: `academicxs`
- **Contraseña**: `simulador`
- **Estado**: ✅ Debería funcionar siempre

### Login de Estudiantes (StudentLoginModal.jsx)
- **Usa fetch**: `${API_BASE}/api/auth/login`
- **Depende de**: Variable `VITE_API_URL`
- **Estado**: ⚠️ Puede fallar si la variable no está configurada en Vercel

## Causas Probables del Error

### 1. Variable de entorno no configurada en Vercel ⚠️
Si `VITE_API_URL` no está configurada en Vercel, el código usa:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || ''
```
Esto resulta en: `fetch('http://localhost/api/auth/login')` → ❌ Failed to fetch

### 2. Dominio de Vercel diferente
Si el dominio de Vercel no coincide con `https://simts-frontend.vercel.app`, 
podría haber problemas de CORS.

### 3. Backend en estado "sleeping" (Render free tier)
Render puede poner el servicio a dormir después de inactividad.
Primera petición puede tardar 30-60 segundos en despertar.

## Soluciones

### Solución 1: Verificar variables de entorno en Vercel ⭐
1. Ir a: https://vercel.com/dashboard
2. Seleccionar proyecto `simts-frontend`
3. Settings → Environment Variables
4. Verificar que existe: `VITE_API_URL = https://simts.onrender.com`
5. Si no existe o es incorrecta, agregarla/corregirla
6. **IMPORTANTE**: Hacer **Redeploy** después de cambiar variables

### Solución 2: Agregar fallback más robusto
Actualizar código para mostrar error más descriptivo si falta la URL.

### Solución 3: Verificar dominio de Vercel
1. Copiar el dominio exacto de tu deployment de Vercel
2. Si es diferente a `https://simts-frontend.vercel.app`, actualizar CORS en backend

## Cómo Probar

### Desde el navegador (DevTools):
1. Abrir la aplicación en Vercel
2. F12 → Console
3. Escribir: `console.log(import.meta.env.VITE_API_URL)`
4. Si muestra `undefined` o vacío → Problema de variable de entorno

### Desde el navegador (Network):
1. Intentar hacer login de estudiante
2. F12 → Network
3. Ver la petición a `/api/auth/login`
4. Si la URL es `localhost` o vacía → Problema de variable de entorno
5. Si la petición tarda mucho → Backend dormido (esperar)
6. Si muestra error CORS → Problema de dominio

## Comando Rápido de Diagnóstico

```bash
# Ver logs del backend en Render
# Ir a: https://dashboard.render.com → simts → Logs

# Probar login desde curl
curl -X POST https://simts.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://tu-dominio.vercel.app" \
  -d '{"username":"estudiante1","password":"password123"}'
```

## Siguiente Paso Recomendado

**Verificar la variable de entorno en Vercel primero** - es la causa más probable.
