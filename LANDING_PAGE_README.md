# 🎨 Landing Page - SimTS

## Descripción

Se ha desarrollado una landing page profesional inspirada en el sitio web oficial de la **Universidad de Aysén** (uaysen.cl). Esta página sirve como portal de acceso para estudiantes, académicos y público general.

## Características Principales

### 1. **Navegación Principal**
- Barra de navegación fija en la parte superior
- Color corporativo: Verde oscuro (#1a472a) - según paleta UAysén
- Enlaces a secciones principales con desplazamiento suave
- Branding con logo de Trabajo Social

### 2. **Secciones del Landing Page**

#### 🏠 Hero Section (Inicio)
- Imagen de portada con gradiente profesional
- Título principal con descripción
- Dos botones de acceso:
  - 👨‍🎓 **Acceso Estudiantes** - Lleva a la aplicación principal
  - 👨‍🏫 **Acceso Académicos** - Lleva a la aplicación con acceso docente
- Animaciones hover en los botones

#### 🎯 Sección de Utilidad
- 6 tarjetas informativas con iconos:
  1. Aprendizaje Práctico
  2. Generación Inteligente (IA)
  3. Retroalimentación Inmediata
  4. Seguimiento de Progreso
  5. Entorno Seguro
  6. Preparación Profesional
- Diseño responsive con grid dinámico
- Efectos hover con elevación visual

#### 📖 Guía de Uso
- Dividida en dos columnas:
  - **Estudiantes**: 7 pasos para usar la plataforma
  - **Académicos/Docentes**: 7 pasos para revisar respuestas
- Código de colores diferenciado (verde para estudiantes, azul para docentes)
- Listas numeradas con instrucciones claras

#### 🔧 Sección de Tecnología
- 4 categorías de tecnología:
  1. Backend (Python, FastAPI, SQLite, OpenAI)
  2. Frontend (React, Vite, JavaScript, Responsive Design)
  3. Deployment (Vercel, Render, CI/CD)
  4. Seguridad (Autenticación, Protección, GDPR)
- Panel informativo con características técnicas
- Diseño de tarjetas con checkmarks

#### 📧 Sección de Contacto
- **Formulario de Contacto:**
  - Campo nombre
  - Campo correo electrónico
  - Selector de asunto
  - Área de texto para mensaje
  - Botón de envío con efectos hover

- **Información de Contacto:**
  - Email: trabajo.social@uaysen.cl
  - Teléfono: +56 9 3933 2051
  - Ubicación: Casa Central, Coyhaique
  - Horario: Lunes a Viernes, 09:00-17:00 hrs

#### 🔗 Footer (Pie de Página)
- **Atribución especial:**
  > "Esta aplicación fue desarrollada por el Departamento de Trabajo Social de la Universidad de Aysén"

- **Secciones del footer:**
  - Descripción de SimTS
  - Enlaces rápidos
  - Sitios de interés
  - Información corporativa
  - Redes sociales (Facebook, Instagram, YouTube, X/Twitter)
  - Copyright y enlaces de transparencia

## Diseño Visual

### Paleta de Colores
- **Verde Corporativo (Primario):** #1a472a
- **Verde Secundario:** #2d6b45
- **Azul (Académicos):** #2196F3
- **Verde (Estudiantes):** #4CAF50
- **Rojo (Alertas):** #f44336
- **Gris (Texto):** #666666

### Tipografía
- Fuente: Sistema (Arial, Helvetica, sans-serif)
- Tamaños responsive
- Buen contraste para accesibilidad

### Responsividad
- Grid layouts que se adaptan a móvil/tablet/desktop
- Imágenes optimizadas
- Navegación colapsable en móvil (futuro)
- Botones y elementos táctiles dimensionados para toque

## Integración con la Aplicación

### Routing
```
/          → Landing Page (Landing.jsx)
/app       → Aplicación Principal (App.jsx)
```

### Navegación
- Botón "Ir a Inicio" disponible en el header de la aplicación
- Ambos accesos (Estudiantes y Académicos) llevan a `/app`
- La autenticación se realiza dentro de la aplicación

### Dependencias Añadidas
```json
{
  "react-router-dom": "^6.x.x"
}
```

## Archivos Modificados/Creados

### Nuevos
- `frontend/src/Landing.jsx` (850 líneas)
  - Componente principal del landing page
  - Todas las secciones descritas arriba
  - Estilos inline (futuro: migrar a CSS modules)

### Modificados
- `frontend/src/main.jsx`
  - Integración de BrowserRouter
  - Rutas para Landing y App

- `frontend/src/App.jsx`
  - Hook useNavigate
  - Botón de retorno a inicio
  - Estilos mejorados en header

## Características Futuras

- [ ] Hamburger menu para dispositivos móviles
- [ ] Animaciones suaves con Framer Motion
- [ ] Integración de testimonios de estudiantes
- [ ] Sección de noticias/blog
- [ ] Galería de casos de éxito
- [ ] Dark mode
- [ ] Multi-idioma (Español/Inglés)
- [ ] Validación del formulario de contacto
- [ ] Integración con email backend
- [ ] SEO optimización (meta tags, open graph)

## Testing

La landing page ha sido verificada:
- ✅ Build exitoso (sin errores)
- ✅ Componentes renderizados correctamente
- ✅ Routing funcionando
- ✅ Estilos responsive
- ✅ Enlaces internos y externos funcionando
- ✅ Accessibility básico

## Deployment

Al desplegar en Vercel:
1. La landing page será la página inicial
2. URL raíz (`/`) mostrará la landing page
3. URL (`/app`) mostrará la aplicación principal
4. El router manejará toda la navegación

## Créditos

Landing page diseñada como portal institucional para:
- **Universidad de Aysén**
- **Departamento de Trabajo Social**
- **Carrera de Trabajo Social**

Inspirada en: https://uaysen.cl/inicio
