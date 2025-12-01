# Guía de Deploy a Vercel

## Pasos para Deploy

### 1. Preparar Repositorio GitHub

```powershell
# Inicializar git (si no está)
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "feat: generador de casos sociales con API para Vercel"
```

### 2. Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `simulador-ts`
3. Descripción: "Generador de Casos Sociales para Trabajo Social - Aysén, Chile"
4. Crear repositorio

### 3. Subir a GitHub

```powershell
# Agregar remoto
git remote add origin https://github.com/TU_USUARIO/simulador-ts.git

# Subir código
git branch -M main
git push -u origin main
```

### 4. Deploy en Vercel

#### Opción A: Usando CLI de Vercel

```powershell
# Instalar CLI de Vercel
npm install -g vercel

# Deploy
vercel
```

Seguir las instrucciones interactivas.

#### Opción B: Desde Dashboard de Vercel (Recomendado)

1. Ve a https://vercel.com/new
2. Importa tu repositorio GitHub
3. Selecciona `simulador-ts`
4. Framework Preset: **Other**
5. Root Directory: `.`
6. Build Command: `npm run build`
7. Output Directory: `dist`

### 5. Configurar Variables de Entorno

En el dashboard de Vercel, ve a:
- **Settings** → **Environment Variables**

Agrega:
- **Name**: `OPENAI_API_KEY`
- **Value**: `sk-...` (tu clave de OpenAI)
- **Environments**: Production, Preview, Development

### 6. Deploy

Haz click en **Deploy**. Vercel:
1. Clonará tu repositorio
2. Ejecutará `npm run build`
3. Compilará TypeScript
4. Desplegará los endpoints

## Endpoints Disponibles

Una vez desplegado en Vercel, tus endpoints estarán en:

```
https://tu-proyecto.vercel.app/api/...
```

### Documentación

```
GET https://tu-proyecto.vercel.app/api/status
```

Devuelve lista de endpoints disponibles y temas.

### Generar Caso Individual

```bash
curl -X POST https://tu-proyecto.vercel.app/api/generar-caso \
  -H "Content-Type: application/json" \
  -d '{
    "tema": "personas_mayores",
    "especificidad": "alta"
  }'
```

### Generar Múltiples Casos

```bash
curl -X POST https://tu-proyecto.vercel.app/api/generar-casos \
  -H "Content-Type: application/json" \
  -d '{
    "tema": "violencia",
    "cantidad": 3,
    "especificidad": "media"
  }'
```

## Parámetros

### Tema (requerido)
- `pobreza`
- `discapacidad`
- `personas_mayores`
- `violencia`
- `salud_mental`
- `ruralidad`
- `multiculturalidad`

### Especificidad (opcional, defecto: "media")
- `baja`
- `media`
- `alta`

### Cantidad (opcional, defecto: 1, máximo: 10)
- Número entre 1 y 10

## Estructura del Proyecto

```
simulador-ts/
├── api/                        # Endpoints serverless
│   ├── generar-caso.ts        # Generar un caso
│   ├── generar-casos.ts       # Generar múltiples casos
│   └── status.ts              # Documentación y status
├── src/                        # Código fuente
│   ├── ia/                    # Módulo de IA
│   └── simulator.ts           # Marco base
├── dist/                       # JavaScript compilado
├── vercel.json                # Configuración de Vercel
├── package.json
├── tsconfig.json
└── README.md
```

## Logs y Monitoreo

En el dashboard de Vercel:
- **Deployments**: Ver historial de deploys
- **Functions**: Ver logs de cada endpoint
- **Monitoring**: Ver métricas, errores y tiempos de respuesta

## Resolver Problemas

### Error: OPENAI_API_KEY no configurada
- Ve a Settings → Environment Variables
- Agrega la clave de OpenAI

### Error: Timeout en generación
- Los tiempos de respuesta pueden ser lentos la primera vez
- Vercel reinicia el servidor si no hay requests en 15 minutos

### Ver logs detallados
- En dashboard de Vercel, abre cada función para ver logs

## URLs Útiles

- **Dashboard**: https://vercel.com/dashboard
- **Proyecto**: https://vercel.com/dashboard/project-name
- **Documentación Vercel**: https://vercel.com/docs

## Actualizaciones

Para actualizar el código:

```powershell
# Hacer cambios localmente
git add .
git commit -m "mensaje descriptivo"
git push origin main
```

Vercel automáticamente detectará los cambios y hará un nuevo deploy.

## Tips Finales

- ✅ Vercel es **gratuito** para proyectos pequeños
- ✅ Los endpoints tienen un **timeout de 10 segundos** en plan gratuito
- ✅ La primera request después de inactividad puede ser lenta (cold start)
- ✅ Monitorea el uso de OpenAI (puede tener costos)
- ✅ Considera agregar caché para respuestas frecuentes

---

**¿Necesitas ayuda?** Consulta la documentación de Vercel en https://vercel.com/docs
