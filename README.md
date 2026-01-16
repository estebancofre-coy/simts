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

## 🔒 Seguridad

**IMPORTANTE**: Este proyecto implementa medidas de seguridad críticas. Antes de desplegar en producción:

1. **Cambiar JWT Secret Key**: 
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   Y configurar en `backend/.env` como `JWT_SECRET_KEY`

2. **Configurar CORS**: Establecer `ALLOWED_ORIGINS` con dominios específicos
   ```bash
   ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
   ```

3. **Ver [SECURITY.md](./SECURITY.md)** para la política completa de seguridad

Características de seguridad implementadas:
- ✅ Passwords hasheados con bcrypt
- ✅ Autenticación JWT con expiración
- ✅ Rate limiting (5 intentos/min en login)
- ✅ CORS configurado por entorno
- ✅ Validación de inputs con Pydantic
- ✅ Monitoreo con Prometheus
- ✅ Índices de base de datos
- ✅ Tests de seguridad automatizados

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

**✅ IMPLEMENTADO:** El sistema ahora incluye las siguientes características de seguridad:

1. **Passwords Hasheados con bcrypt**: Todas las contraseñas se almacenan hasheadas con bcrypt
2. **JWT Authentication**: Sistema de tokens JWT con expiración de 30 minutos
3. **Rate Limiting**: Protección contra ataques de fuerza bruta (5 intentos/min en login)
4. **CORS Configurado**: Orígenes permitidos configurables via variable de entorno
5. **Validación de Inputs**: Validadores Pydantic para username y password
6. **Monitoreo**: Métricas de Prometheus expuestas en `/metrics`
7. **Índices de Base de Datos**: Mejor performance y protección contra DoS

Ver [SECURITY.md](./SECURITY.md) para más detalles.

### Variables de Entorno de Seguridad

Crea un archivo `backend/.env` basado en `backend/.env.example`:

```bash
# Generar JWT secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Configurar en backend/.env
JWT_SECRET_KEY=tu_clave_secreta_generada
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
OPENAI_API_KEY=tu_api_key_de_openai
```

### Registrar Nuevos Estudiantes

**Con bcrypt (Recomendado):**

```python
import sys
sys.path.append('backend')
import db

# Crear estudiante con password hasheado
student = db.create_student(
    db_path='backend/cases.db',
    username='juan.perez',
    password='password_seguro_123',  # Será hasheado automáticamente
    name='Juan Pérez',
    email='juan.perez@universidad.cl'
)
print(f"Estudiante creado con ID: {student['id']}")
```

**O usando el script de migración:**

```bash
cd backend
python scripts/migrate_passwords.py cases.db
```

### Testing de Autenticación

```bash
# Ejecutar tests
cd backend
pytest tests/test_auth.py -v
pytest tests/test_api.py -v

# Test de login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "estudiante1", "password": "pass"}'

# Respuesta incluye JWT token
# {"ok": true, "student": {...}, "token": "eyJ..."}
```

### Próximas Mejoras

Se planea implementar:
- Panel de administración en la interfaz web
- Registro de estudiantes con auto-aprobación o moderación
- Importación masiva desde CSV/Excel
- Integración con sistemas institucionales (LDAP, OAuth)
- Gestión de roles y permisos

