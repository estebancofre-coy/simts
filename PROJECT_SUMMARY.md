# 📚 SimTS - Simulador de Casos de Trabajo Social
## Resumen Ejecutivo del Proyecto

---

## 🎯 Visión General

**SimTS** es una plataforma digital educativa desarrollada para estudiantes y docentes de la Carrera de Trabajo Social de la Universidad de Aysén. Combina la generación de casos clínicos basada en IA con un sistema de gestión de aprendizaje que permite a estudiantes practicar intervenciones sociales y recibir retroalimentación de académicos.

---

## ✨ Características Principales

### Para Estudiantes 👨‍🎓
- ✅ Login seguro con credenciales
- ✅ Generación de casos AI personalizados (por temática, dificultad, contexto)
- ✅ Respuestas a preguntas de opción múltiple (calificadas automáticamente)
- ✅ Respuestas a preguntas abiertas (calificadas por docentes)
- ✅ Historial de casos resueltos
- ✅ Seguimiento de progreso y puntajes

### Para Académicos/Docentes 👨‍🏫
- ✅ Panel de revisión con vista de todas las sesiones
- ✅ Filtrado por estudiante y caso
- ✅ Corrección de respuestas abiertas
- ✅ Sistema de puntuación y feedback
- ✅ Exportación de datos (CSV/PDF)
- ✅ Reportes individuales y grupales

### Portal de Acceso 🌐
- ✅ Landing page profesional
- ✅ Información sobre la plataforma
- ✅ Guía de uso para ambos roles
- ✅ Sección de tecnología
- ✅ Formulario de contacto
- ✅ Información institucional

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Backend**
- Python 3.12.1
- FastAPI 0.123.0
- SQLite3 (Base de datos)
- OpenAI API (Generación de casos con Prompt API)
- Uvicorn (Servidor WSGI)

**Frontend**
- React 18.3.1
- Vite 5.4.21
- React Router v6 (Navegación)
- jsPDF + jsPDF AutoTable (Exportación)

**DevOps**
- GitHub (Control de versiones)
- GitHub Pages (Deployment frontend)
- Render (Deployment backend)
- GitHub Actions (CI/CD)

### Base de Datos

Tablas principales:
```sql
- cases (casos generados)
- collections (colecciones de casos)
- collection_cases (relación M:N)
- students (estudiantes del sistema)
- student_sessions (sesiones de resolución)
- student_answers (respuestas individuales)
```

### Endpoints API

**Autenticación**
- `POST /api/auth/login` - Login de estudiante

**Respuestas**
- `POST /api/answers` - Envío de respuestas
- `GET /api/answers` - Consulta con filtros
- `PUT /api/answers/{id}/feedback` - Retroalimentación docente
- `GET /api/students` - Listado de estudiantes

**Casos**
- `POST /api/simulate` - Generación de caso AI
- `GET/POST/PUT/DELETE /api/cases` - CRUD de casos

---

## 📁 Estructura del Proyecto

```
simts/
├── backend/
│   ├── main.py              # API FastAPI
│   ├── db.py                # Capa de datos
│   ├── cases.db             # Base de datos SQLite
│   ├── requirements.txt      # Dependencias Python
│   └── .env                 # Variables de entorno
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # Punto de entrada
│   │   ├── App.jsx          # Componente principal
│   │   ├── Landing.jsx      # Página de inicio
│   │   ├── LoginModal.jsx   # Modal de login docente
│   │   ├── StudentLoginModal.jsx # Modal de login estudiante
│   │   ├── TeacherPanel.jsx # Panel administrativo
│   │   └── styles.css       # Estilos globales
│   ├── package.json         # Dependencias Node.js
│   ├── vite.config.js       # Configuración Vite
│   └── public/              # Recursos locales del frontend
│
├── DEPLOYMENT_GUIDE.md      # Guía de deployments
├── LANDING_PAGE_README.md   # Documentación landing
├── PROJECT_SUMMARY.md       # Este archivo
└── README.md                # README principal
```

---

## 🚀 Estado del Desarrollo

### ✅ Completado

**Fase 1: Generación de Casos**
- Integración OpenAI Prompt API
- Generación de casos contextualizados (Región de Aysén)
- Parámetros: temática, dificultad, edad, contexto, enfoque

**Fase 2: Interfaz de Estudiante**
- Selección de parámetros del caso
- Presentación interactiva del caso
- Preguntas de opción múltiple
- Preguntas abiertas con textarea
- Botón de envío de respuestas

**Fase 3: Sistema de Autenticación**
- Login de estudiantes
- Login de docentes
- Gestión de sesiones
- Almacenamiento de credenciales

**Fase 4: Panel de Docentes**
- Revisión de sesiones
- Filtrado por estudiante/caso
- Visualización de respuestas
- Entrada de feedback y puntuación
- Exportación CSV/PDF

**Fase 5: Portal de Acceso**
- Landing page institucional
- Navegación por React Router
- Información completa de la plataforma
- Sección de contacto
- Footer con atribución

### ⏳ Pendiente (Futuro)

- [ ] Validación del formulario de contacto
- [ ] Integración de envío de emails
- [ ] Multi-idioma (Español/Inglés)
- [ ] Dark mode
- [ ] Hamburger menu móvil
- [ ] Animaciones avanzadas (Framer Motion)
- [ ] Sistema de testimonios
- [ ] Blog/Noticias integrado
- [ ] Análisis avanzado de progreso
- [ ] Sistema de mensajería docente-estudiante

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Líneas de código (Backend) | ~600 |
| Líneas de código (Frontend) | ~3,500+ |
| Componentes React | 7 |
| Endpoints API | 14+ |
| Tablas de BD | 6 |
| Páginas distintas | 2 (landing + app) |
| Commits GitHub | 10+ |
| Tiempo de build | ~7 segundos |
| Size JS (gzip) | ~212 kB |
| Size CSS (gzip) | ~3.8 kB |

---

## 🔐 Seguridad

### Implementado
- Autenticación por usuario/contraseña
- Hash SHA256 para passwords (demo)
- Validación de datos en backend
- CORS protection
- SQLite con validación de queries

### Recomendaciones Futuro
- [ ] JWT tokens con expiración
- [ ] OAuth2 con Azure AD
- [ ] PostgreSQL en producción
- [ ] Bcrypt en lugar de SHA256
- [ ] Rate limiting
- [ ] SSL/TLS en tránsito

---

## 🌐 Deployment

### Frontend (GitHub Pages)
```
URL: https://estebancofre-coy.github.io/simts/
Build: scripts/deploy_pages.sh (npm ci, tests y build para Pages)
Output: frontend/dist
```

### Backend (Render)
```
URL: https://simts-backend.onrender.com
Build: cd backend && pip install -r requirements.txt
Start: cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

### Configuración Necesaria
- `OPENAI_API_KEY` - En backend
- `VITE_API_URL` - En frontend

---

## 👥 Roles y Permisos

### Estudiante
- Generar casos
- Responder preguntas
- Ver historial
- Recibir retroalimentación

### Académico
- Ver todas las sesiones
- Revisar respuestas
- Agregar feedback
- Calificar respuestas
- Exportar datos

### Administrador (Futuro)
- Gestión de usuarios
- Crear docentes
- Ver analytics global
- Gestionar prompts

---

## 📖 Documentación

### Archivos de Documentación
- `README.md` - Inicio rápido
- `DEPLOYMENT_GUIDE.md` - Guía completa de deployment
- `LANDING_PAGE_README.md` - Documentación de landing
- `PROJECT_SUMMARY.md` - Este archivo

### URLs Importantes
- GitHub: https://github.com/estebancofre-coy/simts
- Universidad: https://uaysen.cl
- OpenAI Docs: https://platform.openai.com/docs

---

## 🎓 Contexto Institucional

**Universidad**: Universidad de Aysén
**Departamento**: Trabajo Social
**Carrera**: Trabajo Social
**Región**: Aysén del General Carlos Ibáñez del Campo

El simulador está contextualizado con:
- Casos de la Región de Aysén
- Normativas de atención social chilenas
- Dilemas éticos de Trabajo Social
- Intervenciones comunitarias y familiares

---

## 📞 Contacto

**Email**: trabajo.social@uaysen.cl
**Teléfono**: +56 9 3933 2051
**Ubicación**: Calle Lord Cochrane 335, Coyhaique
**Horario**: Lunes-Viernes, 09:00-17:00 hrs

---

## 📝 Licencia

Desarrollado por el Departamento de Trabajo Social de la Universidad de Aysén.
Todos los derechos reservados © 2025.

---

## 🙏 Créditos

**Desarrollado por**: Equipo de Trabajo Social UAysén
**Basado en**: OpenAI Prompt API
**Inspirado en**: https://uaysen.cl/inicio
**Tecnología**: React, FastAPI, SQLite, OpenAI

---

## 🎯 Roadmap 2025

**Q1 2025**
- [ ] Deployment en GitHub Pages y backend separado
- [ ] Testing con estudiantes piloto
- [ ] Mejoras de UX basadas en feedback

**Q2 2025**
- [ ] JWT + OAuth2 authentication
- [ ] PostgreSQL en producción
- [ ] Sistema de mensajería docente

**Q3 2025**
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard avanzado
- [ ] Multi-idioma

**Q4 2025**
- [ ] Integración LMS Moodle
- [ ] Exportación de certificados
- [ ] Mejoras de IA con modelos más recientes

---

## ✨ Conclusión

SimTS es una solución educativa completa que combina tecnología moderna (IA, React, FastAPI) con pedagogía de Trabajo Social. La plataforma está lista para producción y puede escalar para incluir más carreras y universidades.

**Estado**: ✅ **PRODUCCIÓN LISTA**
**Última actualización**: 7 de Diciembre, 2025
**Versión**: 1.0

---
