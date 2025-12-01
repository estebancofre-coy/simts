# Panel de Docentes - Guía de Uso

## 🎓 Descripción General

El Panel de Docentes es una herramienta completa de gestión y administración para los casos generados en el Simulador de Trabajo Social. Permite a los docentes revisar, editar, evaluar y exportar casos educativos.

## 🚀 Acceso al Panel

### Cambio de Rol

En la esquina inferior izquierda de la aplicación hay un botón que permite cambiar entre:
- **👨‍🎓 Estudiante**: Vista normal de generación de casos
- **🎓 Docente**: Vista con acceso al panel administrativo

Cuando estás en modo docente, aparece un botón flotante verde en la esquina inferior derecha: **"🎓 Panel Docente"**

## 📋 Funcionalidades Principales

### 1. Lista de Casos

**Vista principal con tabla completa de todos los casos generados:**

- **Columnas:**
  - ID único del caso
  - Título del caso
  - Tema/eje temático
  - Nivel de dificultad
  - Rating (0-5 estrellas)
  - Fecha de creación
  - Acciones (editar/eliminar)

- **Filtros disponibles:**
  - 🔍 Búsqueda por texto (título/ID)
  - Filtro por tema
  - Filtro por dificultad

- **Exportación:**
  - 📥 **JSON**: Exporta casos con estructura completa
  - 📥 **CSV**: Exporta tabla resumen (Excel compatible)

### 2. Edición de Casos

**Cada caso puede ser editado haciendo clic en el botón ✏️:**

**Campos editables:**
- ✏️ Título del caso
- 📝 Descripción completa
- 🏷️ Tema/eje temático
- 📊 Nivel de dificultad (básico/intermedio/avanzado)
- ⭐ Rating (0-5 estrellas)
- 📌 Notas del docente (comentarios privados)

**Los cambios se guardan en la base de datos y se reflejan inmediatamente.**

### 3. Eliminación de Casos

- Botón 🗑️ en cada fila
- Confirmación requerida antes de eliminar
- **Soft delete**: Los casos se marcan como "deleted" pero no se borran físicamente
- Pueden ser restaurados desde la base de datos si es necesario

### 4. Estadísticas

**Vista de análisis con métricas clave:**

#### Tarjetas de Resumen:
- **Total de Casos**: Número total de casos activos
- **Últimos 7 días**: Casos generados recientemente
- **Rating Promedio**: Calificación media de los casos

#### Gráficos de Distribución:
- **Por Tema**: Barra horizontal mostrando cantidad por eje temático
- **Por Dificultad**: Distribución por nivel (básico/intermedio/avanzado)

## 🗄️ Base de Datos Extendida

### Nuevos Campos en la Tabla `cases`:

```sql
- updated_at: Fecha de última modificación
- status: Estado del caso ('active' | 'deleted')
- rating: Calificación del caso (0-5)
- tags: Etiquetas personalizadas (JSON array)
- notes: Notas del docente (texto libre)
```

## 🔌 API Endpoints Disponibles

### Lectura:
- `GET /api/cases` - Lista todos los casos (con filtros opcionales)
- `GET /api/cases/{id}` - Obtiene un caso específico
- `GET /api/admin/statistics` - Estadísticas agregadas

### Escritura:
- `POST /api/cases` - Crea un nuevo caso
- `PUT /api/cases/{id}` - Actualiza un caso existente
- `DELETE /api/cases/{id}` - Elimina un caso (soft delete)

### Parámetros de Filtro:
- `theme`: Filtrar por tema
- `difficulty`: Filtrar por dificultad
- `status`: Filtrar por estado ('active' | 'deleted')
- `limit`: Número máximo de resultados (default: 50)

## 💡 Casos de Uso Comunes

### 1. Revisar Casos Generados Automáticamente
1. Acceder al panel docente
2. Revisar la lista completa
3. Evaluar calidad con el sistema de rating
4. Agregar notas para uso futuro

### 2. Curar Contenido para una Clase
1. Filtrar por tema específico
2. Seleccionar casos de calidad (rating alto)
3. Exportar a JSON/CSV
4. Compartir con estudiantes

### 3. Editar Casos con Errores
1. Identificar caso problemático
2. Hacer clic en ✏️ Editar
3. Corregir descripción o preguntas
4. Guardar cambios

### 4. Análisis de Contenido Generado
1. Ir a vista de Estadísticas
2. Revisar distribución por temas
3. Identificar gaps en cobertura
4. Generar más casos en áreas necesarias

## 🎨 Características de UX

- **Diseño Modal**: Panel aparece como overlay sin perder contexto
- **Navegación por Pestañas**: Cambio rápido entre lista y estadísticas
- **Tabla Responsive**: Se adapta a diferentes tamaños de pantalla
- **Búsqueda en Tiempo Real**: Filtrado instantáneo sin recargar
- **Confirmaciones**: Alertas antes de acciones destructivas
- **Feedback Visual**: Mensajes de éxito/error claros

## 🔒 Seguridad y Privacidad

### Modelo de Seguridad Actual:
- **Autenticación basada en localStorage** (simple para entorno académico)
- Cambio de rol manual en interfaz
- Sin información sensible de estudiantes

### Para Producción (Futuras Mejoras):
- Implementar autenticación con JWT
- Roles de usuario en backend
- Permisos granulares por endpoint
- Auditoría de cambios

## 📊 Métricas y Analytics

El sistema rastrea automáticamente:
- Número total de casos generados
- Distribución por tema y dificultad
- Tendencias temporales (casos recientes)
- Ratings promedio

**Posibles extensiones futuras:**
- Casos más populares (más vistos)
- Tiempo promedio de resolución
- Tasa de éxito en preguntas interactivas

## 🚀 Próximas Funcionalidades Planeadas

1. **Sistema de Colecciones**
   - Agrupar casos en "paquetes" temáticos
   - Asignar colecciones a cursos específicos

2. **Compartir entre Docentes**
   - Biblioteca común de casos
   - Sistema de "favoritos" compartidos

3. **Versiones de Casos**
   - Historial de cambios
   - Rollback a versiones anteriores

4. **Generación Asistida**
   - Sugerencias de IA para mejorar casos
   - Validación automática de calidad

5. **Integración con LMS**
   - Exportar a Moodle/Canvas
   - Sincronización con calificaciones

## 📞 Soporte

Para problemas o sugerencias:
- Revisar logs del backend: `backend/uvicorn.log`
- Consola del navegador (F12) para errores frontend
- GitHub Issues: [tu-repo]/issues

## 🎯 Mejores Prácticas

1. **Revisar casos regularmente**: Evalúa la calidad con ratings
2. **Documentar con notas**: Agrega contexto para uso futuro
3. **Exportar backups**: Descarga JSON periódicamente
4. **Filtrar inteligentemente**: Usa combinaciones de filtros
5. **Limpiar contenido**: Elimina casos de baja calidad

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2025  
**Desarrollado para**: Universidad de Aysén - Carrera de Trabajo Social
