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

**⚠️ IMPORTANTE:** En producción, las contraseñas deben estar hasheadas. Actualmente el sistema usa contraseñas en texto plano para desarrollo.

**Para producción, implementar:**
1. Hash de contraseñas con bcrypt o similar
2. Sistema de registro con validación de email
3. Recuperación de contraseñas
4. Panel administrativo para gestión de usuarios

### Próximas Mejoras

Se planea implementar:
- Panel de administración en la interfaz web
- Registro de estudiantes con auto-aprobación o moderación
- Importación masiva desde CSV/Excel
- Integración con sistemas institucionales (LDAP, OAuth)
- Gestión de roles y permisos

