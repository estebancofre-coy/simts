# simts

Simulador de casos de Trabajo Social — backend (FastAPI) + frontend (React/Vite).

## Quickstart (desarrollo)

Requisitos: Python 3.11+, Node 18+, bash. Configura tu `OPENAI_API_KEY` en `backend/.env` si vas a generar casos reales.

```bash
# 1) Prueba rápida end-to-end (levanta servicios y verifica)
bash scripts/smoke.sh

# 2) Abrir manualmente
"$BROWSER" http://localhost:5173
"$BROWSER" http://localhost:8000/docs

# 3) Detener servicios
bash scripts/stop.sh
```

## Arranque manual (alternativa)

```bash
# Backend
cd backend
pip install -r requirements.txt
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > uvicorn.log 2>&1 & echo $! > uvicorn.pid
cd ..

# Frontend
cd frontend
npm install
nohup npm run dev -- --host 0.0.0.0 > ../frontend.log 2>&1 & echo $! > ../frontend.pid
cd ..

# Verificar
curl -I http://localhost:5173
curl -I http://localhost:8000/docs
```

## Notas
- En desarrollo, accede a la UI por `http://localhost:5173` (Vite sirve `index.html`).
- La API corre en `http://localhost:8000` y el frontend proxyea `/api/*` en dev.
- Logs útiles: `backend/uvicorn.log` y `frontend.log` (en raíz).

## 🔧 Troubleshooting

Si tienes problemas de accesibilidad o conectividad:

```bash
# Ejecutar diagnóstico completo
./scripts/check_frontend.sh

# Verificar estado de servicios
ps aux | grep -E "(vite|uvicorn)" | grep -v grep
netstat -tlnp | grep -E "(5173|8000)"
```

**Problemas comunes:**
- **Frontend no accesible**: Verifica que el servidor Vite esté ejecutándose con `npm run dev`
- **Backend no responde**: Verifica el health check con `curl http://localhost:8000/api/health`
- **JavaScript no carga**: Asegúrate que JavaScript esté habilitado en el navegador
- **CORS errors**: Las llamadas al API deben usar `/api/...` (proxy) no `http://localhost:8000/api/...`

Para más detalles, consulta [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 🌐 Acceso en Entornos Remotos

**GitHub Codespaces / VS Code Dev Containers:**
1. Los puertos se forwarded automáticamente
2. Ve a la pestaña "PORTS" en VS Code
3. Verifica que 5173 y 8000 estén listados
4. Click en "Open in Browser" (🌐) junto al puerto 5173
5. El indicador "● API Online/Offline" en la esquina superior derecha muestra el estado del backend

## 🚀 Deploy en Producción

Para desplegar la aplicación en producción, consulta la guía completa:

```bash
# Ver guía interactiva
./scripts/deploy_help.sh

# Leer documentación completa
cat DEPLOY-VERCEL.md
```

**Opciones recomendadas:**
- **Frontend**: Vercel (gratuito, automático desde GitHub)
- **Backend**: Render (gratuito con cold starts, $7/mes sin cold starts)

**Pasos rápidos:**
1. Push tu código a GitHub
2. Deploy backend en [Render](https://render.com)
3. Deploy frontend en [Vercel](https://vercel.com)
4. Configura variables de entorno (OPENAI_API_KEY, VITE_API_URL)

Ver [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) para instrucciones paso a paso.

## 👥 Gestión de Estudiantes

### Agregar Estudiantes Manualmente

Los estudiantes se almacenan en la base de datos SQLite (`backend/simts.db`). Para agregar nuevos estudiantes:

**Opción 1: Usando SQLite directamente**

```bash
# Acceder a la base de datos
cd backend
sqlite3 simts.db

# Insertar un nuevo estudiante
INSERT INTO students (username, name, email, password, created_at)
VALUES ('juan.perez', 'Juan Pérez', 'juan.perez@universidad.cl', 'password123', datetime('now'));

# Verificar
SELECT id, username, name, email FROM students;

# Salir
.quit
```

**Opción 2: Usando Python**

```python
import sqlite3
from datetime import datetime

conn = sqlite3.connect('backend/simts.db')
cursor = conn.cursor()

# Insertar estudiante
cursor.execute('''
    INSERT INTO students (username, name, email, password, created_at)
    VALUES (?, ?, ?, ?, ?)
''', ('maria.lopez', 'María López', 'maria.lopez@universidad.cl', 'password123', datetime.now().isoformat()))

conn.commit()
print(f"Estudiante agregado con ID: {cursor.lastrowid}")
conn.close()
```

**Opción 3: Script de importación masiva**

```bash
# Crear archivo CSV con estudiantes
cat > estudiantes.csv << EOF
username,name,email,password
carlos.rodriguez,Carlos Rodríguez,carlos.rodriguez@universidad.cl,pass123
ana.martinez,Ana Martínez,ana.martinez@universidad.cl,pass123
EOF

# Importar con script Python
python3 backend/scripts/import_students.py estudiantes.csv
```

### Estructura de la Tabla Students

```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    password TEXT,
    created_at TEXT,
    metadata TEXT  -- JSON con información adicional
);
```

### Consideraciones de Seguridad

**✅ IMPLEMENTADO:** El sistema ahora usa bcrypt para hash seguro de contraseñas.

**Características de seguridad implementadas:**
1. ✅ Hash de contraseñas con bcrypt
2. ✅ Rate limiting en endpoints críticos
3. ✅ Validación de entradas con Pydantic
4. ✅ Headers de seguridad (CSP, X-Frame-Options, etc.)
5. ✅ Sanitización de respuestas de OpenAI
6. ✅ Almacenamiento seguro en frontend (localStorage encriptado)
7. ✅ Auto-logout por inactividad (30 minutos)

Ver [SECURITY.md](./SECURITY.md) para más detalles.

### Próximas Mejoras

Se planea implementar:
- Panel de administración en la interfaz web
- Registro de estudiantes con auto-aprobación o moderación
- Importación masiva desde CSV/Excel
- Integración con sistemas institucionales (LDAP, OAuth)
- Gestión de roles y permisos

---

## 🔐 Seguridad en Producción

SimTS implementa múltiples capas de seguridad para uso en producción:

### Variables de Entorno Requeridas

**Backend (.env):**
```bash
OPENAI_API_KEY=your_api_key_here
ALLOWED_ORIGINS=https://yourdomain.com
SIMTS_DB_PATH=./cases.db
ENVIRONMENT=production
LOG_LEVEL=INFO
```

**Frontend (.env):**
```bash
VITE_API_URL=https://your-backend-url.com
```

Ver `.env.example` en cada directorio para más detalles.

### Características de Seguridad

#### Backend
- **Bcrypt Password Hashing:** Contraseñas hasheadas con bcrypt (salt rounds: 12)
- **Rate Limiting:** 
  - Login: 5 intentos/minuto por IP
  - Simulate: 10 requests/minuto por IP
- **Input Validation:** Validación con Pydantic en todos los endpoints
- **Security Headers:** CSP, X-Frame-Options, HSTS, X-Content-Type-Options
- **CORS Policy:** Allowlist configurable (no usar * en producción)
- **SQL Injection Prevention:** Queries parametrizadas
- **OpenAI Response Sanitization:** Prevención de inyección de código

#### Frontend
- **Secure Storage:** LocalStorage encriptado para datos sensibles
- **Session Management:** Auto-logout después de 30 minutos de inactividad
- **Input Sanitization:** Validación y sanitización de entradas
- **Request Timeout:** 30 segundos por defecto
- **Retry Logic:** Reintento automático con exponential backoff
- **Error Handling:** Manejo específico de errores 429 (rate limit) y 503 (unavailable)

### Procedimiento de Backup de Base de Datos

```bash
# Backup manual
cp backend/cases.db backend/cases.db.backup.$(date +%Y%m%d_%H%M%S)

# Backup automático (agregar a crontab)
0 2 * * * /path/to/simts/scripts/backup_db.sh

# Restaurar backup
cp backend/cases.db.backup.YYYYMMDD_HHMMSS backend/cases.db
```

### Troubleshooting de Errores Comunes

#### Error: "VITE_API_URL no configurada"
**Solución:** Crear archivo `.env` en `frontend/` con:
```bash
VITE_API_URL=http://localhost:8000  # o tu URL de producción
```

#### Error: "Rate limit exceeded"
**Causa:** Demasiadas solicitudes en poco tiempo
**Solución:** Esperar 60 segundos o contactar al administrador para ajustar límites

#### Error: "bcrypt not available"
**Solución:** Instalar bcrypt:
```bash
cd backend
pip install bcrypt
```

#### Error: Database locked
**Causa:** Múltiples procesos accediendo a SQLite simultáneamente
**Solución:** 
- Usar un solo proceso de backend
- Considerar migrar a PostgreSQL para alto tráfico

#### Error: "CORS policy blocked"
**Solución:** Verificar que ALLOWED_ORIGINS incluya el dominio del frontend:
```bash
# En backend/.env
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### Monitoreo y Logging

El sistema incluye logging estructurado y métricas:

```python
# Ver logs
tail -f backend/uvicorn.log

# Logs incluyen:
# - Timestamp
# - Nivel (INFO, WARNING, ERROR)
# - Endpoint
# - Código de respuesta
# - Tiempo de respuesta
```

**Endpoint de health check:**
```bash
curl http://localhost:8000/api/health
```

Responde con estado de:
- Base de datos
- OpenAI API
- Espacio en disco
- Métricas (uptime, total requests, error rate)

### Testing

```bash
# Backend tests
cd backend
pytest --cov --cov-report=term

# Security scan
pip install bandit
bandit -r . -ll

# Frontend tests
cd frontend
npm test
npm run build

# Security audit
npm audit
```

### CI/CD

El proyecto incluye GitHub Actions para:
- ✅ Tests automáticos (backend y frontend)
- ✅ Security scans (bandit, npm audit)
- ✅ Code quality checks
- ✅ Integration tests
- ✅ Coverage reports

Ver `.github/workflows/ci.yml` para detalles.

---

