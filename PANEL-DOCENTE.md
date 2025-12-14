# Funcionalidades del Panel Docente

## Acceso
- **Ruta**: Panel de Docentes (botón en esquina superior derecha)
- **Credenciales**: `academicxs` / `simulador`
- **Autenticación**: Local (sin backend), almacenado en localStorage

---

## Secciones del Panel

### 1. 📋 **Lista de Casos**
**Descripción**: Gestión completa del banco de casos generados

**Funcionalidades**:
- ✅ Visualizar todos los casos en tabla
- ✅ **Búsqueda por título**: Campo de búsqueda en tiempo real
- ✅ **Filtrar por tema**: Dropdown dinámico con temas únicos
- ✅ **Filtrar por dificultad**: Dropdown dinámico (básico/intermedio/avanzado)
- ✅ **Ver rating de cada caso**: Mostrado con ⭐ estrellas
- ✅ **Fecha de creación**: Formateada a formato local (es-CL)

**Acciones por caso**:
- ✏️ **Editar**: Abre formulario completo
- 🗑️ **Eliminar**: Elimina el caso del banco

**Exportación de casos**:
- 📥 **JSON**: Descarga casos filtrados en JSON
- 📥 **CSV**: Descarga casos filtrados en CSV (Excel compatible)
- 📄 **PDF Resumen**: Tabla de casos en PDF con metadatos
- 📄 **PDF Detallado**: Cada caso en página separada con contenido completo

---

### 2. 📚 **Colecciones**
**Descripción**: Agrupar casos en colecciones temáticas para estudiantes

**Funcionalidades** (Implementadas):
- ✅ Ver todas las colecciones creadas
- ✅ Crear nueva colección (nombre + descripción)
- ✅ Ver casos dentro de una colección
- ✅ Agregar casos existentes a una colección
- ✅ Remover casos de una colección
- ✅ Eliminar colecciones

**Casos de uso**:
- Agrupar casos por unidad temática
- Preparar conjuntos de casos para evaluaciones
- Crear itinerarios de aprendizaje

---

### 3. ✍️ **Respuestas de Estudiantes**
**Descripción**: Ver y evaluar las respuestas de estudiantes a casos

**Funcionalidades** (Implementadas):
- ✅ Filtrar sesiones por estudiante
- ✅ Filtrar sesiones por caso
- ✅ Ver lista de todas las sesiones (attempts)
- ✅ Seleccionar una sesión para ver detalles
- ✅ Ver respuestas por pregunta
- ✅ Agregar feedback a cada respuesta
- ✅ Asignar puntuación/score a respuestas
- ✅ Guardar evaluaciones

**Métricas visibles**:
- Nombre del estudiante
- Caso completado
- Tiempo de duración
- Puntuación total
- Respuestas correctas/incorrectas

---

### 4. 📊 **Estadísticas**
**Descripción**: Vista general de métricas del sistema

**Métricas mostradas**:
- 📈 Total de casos en el banco
- 🆕 Casos creados en últimos 7 días
- ⭐ Rating promedio de todos los casos

**Análisis**:
- **Por Tema**: Distribución de casos por temática (barra horizontal)
- **Por Dificultad**: Distribución por nivel de dificultad (barra horizontal)

---

## Panel de Edición de Casos

Cuando se abre "Editar", permite:
- ✏️ Cambiar **título**
- ✏️ Modificar **descripción** (textarea)
- ✏️ Cambiar **tema/eje**
- ✏️ Cambiar **dificultad** (básico/intermedio/avanzado)
- ✏️ Asignar **rating** (0-5 estrellas)
- ✏️ Agregar **notas del docente** (observaciones privadas)

---

## Estado de Implementación

### ✅ Completamente Funcional:
1. Lista de casos con filtros y búsqueda
2. Exportación (JSON, CSV, PDF)
3. Edición de casos
4. Eliminación de casos
5. Colecciones de casos
6. Estadísticas generales
7. Visualización de respuestas de estudiantes

### ⚠️ Parcialmente Funcional (requiere endpoints backend):
- Feedback y puntuación de respuestas (endpoints `/api/answers` en desarrollo)
- Estadísticas detalladas por estudiante

### ❌ No Implementado:
- Generación de reportes adicionales
- Exportación de calificaciones

---

## Notas de Uso

1. **Filtros son combinables**: Puedes usar tema + dificultad + búsqueda simultáneamente
2. **Los datos persisten**: Se guardan en la base de datos del backend
3. **Todas las exportaciones respetan filtros**: Si filtras y exportas, solo exporta los filtrados
4. **Las estadísticas son en tiempo real**: Se actualizan al cargar el panel

---

## Estructura Técnica

```javascript
// Estado del panel
const [view, setView] = useState('list') // 'list'|'edit'|'stats'|'collections'|'answers'
const [cases, setCases] = useState([])
const [collections, setCollections] = useState([])
const [statistics, setStatistics] = useState(null)
const [sessions, setSessions] = useState([]) // Respuestas de estudiantes
```

## Endpoints Utilizados

- `GET /api/cases?limit=200&status=active` - Listar casos
- `GET /api/admin/statistics` - Estadísticas
- `GET /api/collections` - Listar colecciones
- `GET /api/students` - Listar estudiantes
- `GET /api/answers` - Listar sesiones/respuestas
- `POST /api/cases/:id` - Actualizar caso
- `DELETE /api/cases/:id` - Eliminar caso
- `POST /api/collections` - Crear colección
- `POST /api/collections/:id/cases` - Agregar caso a colección
- `DELETE /api/collections/:id/cases/:case_id` - Remover caso

