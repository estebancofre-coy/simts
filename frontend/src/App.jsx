import { useEffect, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function QuestionsList({ questions, openAnswers, onOpenAnswerChange }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Preguntas de evaluacion</h3>
      {questions.map((q, qIndex) => (
        <div
          key={qIndex}
          style={{
            marginBottom: 24,
            padding: 16,
            border: '1px solid #ddd',
            borderRadius: 8,
            backgroundColor: '#f9f9f9'
          }}
        >
          <div style={{ marginBottom: 12, fontWeight: 'bold', fontSize: 16 }}>
            {qIndex + 1}. {q.question || q.text}
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
              Analisis / respuesta abierta
            </label>
            <textarea
              value={openAnswers?.[qIndex] || ''}
              onChange={(e) => onOpenAnswerChange?.(qIndex, e.target.value)}
              rows={4}
              placeholder="Escribe aqui tu analisis del caso..."
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
            />
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: 6,
              fontSize: 14
            }}
          >
            <strong>Guia docente:</strong> {q.justification || q.explanation || 'No disponible'}
          </div>
        </div>
      ))}
    </div>
  )
}

function HealthStatus() {
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' })
        setBackendStatus(res.ok ? 'online' : 'offline')
      } catch {
        setBackendStatus('offline')
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 30000)
    return () => clearInterval(interval)
  }, [])

  const statusColor = backendStatus === 'online' ? '#4caf50' : backendStatus === 'offline' ? '#f44336' : '#ff9800'
  const statusText = backendStatus === 'online' ? '● API Online' : backendStatus === 'offline' ? '● API Offline' : '● Verificando...'

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        padding: '6px 12px',
        background: statusColor,
        color: 'white',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
        zIndex: 1000
      }}
    >
      {statusText}
    </div>
  )
}

const THEMES = [
  'Familia y dinamicas familiares',
  'Infancia y adolescencia',
  'Salud mental',
  'Violencia intrafamiliar',
  'Adulto mayor',
  'Migracion y multiculturalidad',
  'Reinsercion social',
  'Discapacidad e inclusion',
  'Pobreza y vulnerabilidad social',
  'Adicciones'
]

const AGE_GROUPS = [
  { value: '', label: 'Sin especificar (IA decide)' },
  { value: 'primera_infancia', label: 'Primera Infancia (0-5 anos)' },
  { value: 'ninez', label: 'Ninez (6-12 anos)' },
  { value: 'adolescencia', label: 'Adolescencia (13-17 anos)' },
  { value: 'adultez', label: 'Adultez (18-64 anos)' },
  { value: 'adulto_mayor', label: 'Adulto Mayor (65+ anos)' }
]

const CONTEXTS = [
  { value: '', label: 'Sin especificar (IA decide)' },
  { value: 'urbano', label: 'Urbano (Coyhaique, Puerto Aysen)' },
  { value: 'rural', label: 'Rural (comunas alejadas)' },
  { value: 'rural_extremo', label: 'Rural Extremo (maximo aislamiento)' }
]

const FOCUS_AREAS = [
  { value: '', label: 'Sin especificar (IA decide)' },
  { value: 'derechos_humanos', label: 'Derechos Humanos' },
  { value: 'enfoque_genero', label: 'Enfoque de Genero' },
  { value: 'determinantes_sociales', label: 'Determinantes Sociales' },
  { value: 'comunitario', label: 'Comunitario/Territorial' },
  { value: 'sistemico_familiar', label: 'Sistemico Familiar' }
]

const COMPETENCIES = [
  { value: '', label: 'Sin especificar (IA decide)' },
  { value: 'diagnostico_social', label: 'Diagnostico Social' },
  { value: 'diseno_intervencion', label: 'Diseno de Intervencion' },
  { value: 'articulacion_redes', label: 'Articulacion de Redes' },
  { value: 'entrevista_vinculacion', label: 'Entrevista y Vinculacion' },
  { value: 'evaluacion', label: 'Evaluacion de Resultados' }
]

const CASE_LENGTHS = [
  { value: 'corto', label: 'Corto (4 parrafos)' },
  { value: 'medio', label: 'Medio (5 parrafos)' },
  { value: 'extenso', label: 'Extenso (6 parrafos)' }
]

export default function App() {
  const [theme, setTheme] = useState(THEMES[0])
  const [difficulty, setDifficulty] = useState('basico')
  const [ageGroup, setAgeGroup] = useState('')
  const [context, setContext] = useState('')
  const [focusArea, setFocusArea] = useState('')
  const [competency, setCompetency] = useState('')
  const [caseLength, setCaseLength] = useState('medio')

  const [caseObj, setCaseObj] = useState(null)
  const [caseDbId, setCaseDbId] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)

  const [existingCases, setExistingCases] = useState([])
  const [showExistingCases, setShowExistingCases] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [openAnswers, setOpenAnswers] = useState({})
  const [showCaseOverlay, setShowCaseOverlay] = useState(false)

  async function loadExistingCases() {
    try {
      const res = await fetch(`${API_BASE}/api/cases?limit=100&status=active`)
      const data = await res.json()
      if (data.ok && data.cases) setExistingCases(data.cases)
    } catch (e) {
      console.error('Error cargando casos:', e)
    }
  }

  async function selectExistingCase(caseId) {
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}`)
      const data = await res.json()
      if (data.ok && data.case) {
        setCaseObj(data.case)
        setCaseDbId(caseId)
        setResponseText('')
        setShowExistingCases(false)
        setShowCaseOverlay(true)
      }
    } catch (e) {
      console.error('Error cargando caso:', e)
      alert('Error al cargar el caso')
    }
  }

  async function generateCase() {
    setLoading(true)
    setCaseObj(null)
    setCaseDbId(null)
    setOpenAnswers({})
    setResponseText('Generando caso... Esto puede tomar entre 30-60 segundos.')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      const res = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generate: true,
          theme,
          difficulty,
          age_group: ageGroup || undefined,
          context: context || undefined,
          focus_area: focusArea || undefined,
          competency: competency || undefined,
          case_length: caseLength
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${errorText}`)
      }

      const data = await res.json()
      if (data.case) {
        setCaseObj(data.case)
        setShowCaseOverlay(true)
        if (data.saved?.id) setCaseDbId(data.saved.id)
        setResponseText('')
      } else if (data.text) {
        setResponseText(data.text)
      } else {
        setResponseText(JSON.stringify(data.raw_response || data, null, 2))
      }

      if (data.saved) fetchHistory()
    } catch (e) {
      if (e.name === 'AbortError') {
        setResponseText('Error: la peticion tardo demasiado (mas de 2 minutos).')
      } else if (e.message.includes('Failed to fetch')) {
        setResponseText(`Error de conexion con backend: ${e.message}`)
      } else {
        setResponseText(`Error al generar caso:\n\n${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch(`${API_BASE}/api/cases`)
      const data = await res.json()
      if (data.ok) setHistory(data.cases || [])
    } catch (e) {
      console.error('Error cargando historial', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  function handleOpenAnswerChange(index, text) {
    setOpenAnswers((prev) => ({ ...prev, [index]: text }))
  }

  function formatCaseAsText(caseData) {
    if (!caseData) return ''
    const lines = []
    lines.push(`CASO: ${caseData.title || caseData.case_id || 'Caso generado'}`)
    lines.push(`Eje: ${caseData.eje || 'No especificado'} | Nivel: ${caseData.nivel || 'No especificado'}`)
    lines.push('')

    if (caseData.meta) {
      lines.push('FICHA')
      lines.push(caseData.meta)
      lines.push('')
    }

    lines.push('RELATO')
    lines.push((caseData.description || caseData.text || '').replace(/\\n/g, '\n'))
    lines.push('')

    const objectives = caseData.learning_objectives || caseData.checklist || []
    if (objectives.length > 0) {
      lines.push('OBJETIVOS DE APRENDIZAJE')
      objectives.forEach((obj, idx) => lines.push(`${idx + 1}. ${obj}`))
      lines.push('')
    }

    const questions = caseData.questions || []
    if (questions.length > 0) {
      lines.push('PREGUNTAS ABIERTAS')
      questions.forEach((q, idx) => {
        lines.push(`${idx + 1}. ${q.question || q.text || ''}`)
        if (q.justification || q.explanation) {
          lines.push(`   Guia docente: ${q.justification || q.explanation}`)
        }
      })
      lines.push('')
    }

    const interventions = caseData.suggested_interventions || []
    if (interventions.length > 0) {
      lines.push('INTERVENCIONES SUGERIDAS')
      interventions.forEach((it, idx) => lines.push(`${idx + 1}. ${it}`))
    }

    return lines.join('\n')
  }

  function escapeHtml(text) {
    return String(text || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  function formatCaseAsHtml(caseData) {
    const title = caseData?.title || caseData?.case_id || 'Caso generado'
    const objectives = caseData?.learning_objectives || caseData?.checklist || []
    const questions = caseData?.questions || []
    const interventions = caseData?.suggested_interventions || []

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Source Sans 3', Arial, sans-serif; margin: 32px; color: #182536; line-height: 1.6; }
    .card { border: 1px solid #d5dde7; border-radius: 12px; overflow: hidden; }
    .head { background: #1f3a56; color: #fff; padding: 18px 22px; }
    .head h1 { margin: 0 0 6px; font-size: 24px; }
    .meta { opacity: .95; font-size: 14px; }
    .section { padding: 18px 22px; border-top: 1px solid #e2e8f0; }
    h2 { margin: 0 0 10px; font-size: 18px; color: #1f3a56; }
    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 8px; }
    .question { margin-bottom: 14px; }
    .guide { color: #4b5563; font-size: 14px; margin-top: 4px; }
    .study { margin: 18px 0 0; padding: 12px; border: 1px solid #b8c4d2; border-radius: 8px; background: #f7f9fc; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Eje: ${escapeHtml(caseData?.eje || 'No especificado')} | Nivel: ${escapeHtml(caseData?.nivel || 'No especificado')}</div>
    </div>
    <div class="section">
      <h2>Ficha</h2>
      <p>${escapeHtml(caseData?.meta || 'Sin ficha disponible')}</p>
    </div>
    <div class="section">
      <h2>Relato del caso</h2>
      <p>${escapeHtml((caseData?.description || caseData?.text || '').replace(/\\n/g, '\n')).replaceAll('\n', '<br/>')}</p>
    </div>
    ${objectives.length ? `<div class="section"><h2>Objetivos de aprendizaje</h2><ul>${objectives.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul></div>` : ''}
    ${questions.length ? `<div class="section"><h2>Preguntas abiertas</h2>${questions.map((q, idx) => `<div class="question"><strong>${idx + 1}. ${escapeHtml(q.question || q.text || '')}</strong><div class="guide">Guia docente: ${escapeHtml(q.justification || q.explanation || 'No disponible')}</div></div>`).join('')}</div>` : ''}
    ${interventions.length ? `<div class="section"><h2>Intervenciones sugeridas</h2><ul>${interventions.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul></div>` : ''}
  </div>
  <div class="study">Material pedagogico: las respuestas se trabajan localmente y no se envian al servidor.</div>
</body>
</html>`
  }

  async function copyCaseOutput() {
    if (!caseObj) return
    try {
      await navigator.clipboard.writeText(formatCaseAsText(caseObj))
      alert('Salida del caso copiada al portapapeles.')
    } catch {
      alert('No se pudo copiar automaticamente. Intenta nuevamente.')
    }
  }

  function downloadCaseHtml() {
    if (!caseObj) return
    const html = formatCaseAsHtml(caseObj)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(caseObj.title || caseObj.case_id || 'caso').replace(/[^a-zA-Z0-9-_]+/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <HealthStatus />

      <header className="app-header">
        <div className="header-content">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="https://zlq2y2bbczxjflne.public.blob.vercel-storage.com/Logos%20Carreras.png"
              alt="Logo Trabajo Social"
              className="header-logo"
            />
            <div className="header-text">
              <h1>Simulador de Casos</h1>
              <p className="header-subtitle">Carrera de Trabajo Social - Universidad de Aysen</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#666',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                marginRight: '0.5rem'
              }}
            >
              Ir arriba
            </button>
            <span className="header-pill">Modo pedagogico activo</span>
          </div>
        </div>
      </header>

      <section className="study-intro">
        <div className="study-intro-content">
          <div>
            <p className="study-kicker">Uso pedagogico</p>
            <h2 className="study-title">Este simulador es material de estudio y apoyo docente</h2>
            <p className="study-description">
              Los casos se generan para analisis, discusion en clases y practica de razonamiento profesional.
              Las respuestas que escribas son de trabajo local y no se envian al servidor.
            </p>
          </div>
          <div className="study-points">
            <div className="study-point">Casos contextualizados con objetivos de aprendizaje</div>
            <div className="study-point">Preguntas abiertas para analisis critico</div>
            <div className="study-point">Util para trabajo individual o grupal en aula</div>
          </div>
        </div>
      </section>

      <div className="container layout">
        <div className="main">
          <div className="config-panel">
            <h2 className="section-title">Configuracion del Caso</h2>

            {showExistingCases && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px solid #17a2b8' }}>
                <h4 style={{ marginTop: 0, color: '#003d6b' }}>Casos disponibles</h4>
                {existingCases.length === 0 ? (
                  <p style={{ color: '#666' }}>No hay casos disponibles</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                    {existingCases.slice(0, 20).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectExistingCase(c.id)}
                        style={{ padding: '1rem', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                      >
                        <strong style={{ color: '#003d6b', display: 'block', marginBottom: '0.5rem' }}>
                          {c.title?.substring(0, 50) || `Caso ${c.id}`}
                        </strong>
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>{c.theme} • {c.difficulty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tematica</label>
              <select className="form-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                {THEMES.map((t) => (
                  <option value={t} key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nivel de dificultad</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="difficulty" value="basico" checked={difficulty === 'basico'} onChange={() => setDifficulty('basico')} />
                  <span>Basico</span>
                </label>
                <label className="radio-label">
                  <input type="radio" name="difficulty" value="intermedio" checked={difficulty === 'intermedio'} onChange={() => setDifficulty('intermedio')} />
                  <span>Intermedio</span>
                </label>
                <label className="radio-label">
                  <input type="radio" name="difficulty" value="avanzado" checked={difficulty === 'avanzado'} onChange={() => setDifficulty('avanzado')} />
                  <span>Avanzado</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Grupo Etario (opcional)</label>
              <select className="form-select" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                {AGE_GROUPS.map((g) => (
                  <option value={g.value} key={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contexto Territorial (opcional)</label>
              <select className="form-select" value={context} onChange={(e) => setContext(e.target.value)}>
                {CONTEXTS.map((c) => (
                  <option value={c.value} key={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Enfoque Principal (opcional)</label>
              <select className="form-select" value={focusArea} onChange={(e) => setFocusArea(e.target.value)}>
                {FOCUS_AREAS.map((f) => (
                  <option value={f.value} key={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Competencia Objetivo (opcional)</label>
              <select className="form-select" value={competency} onChange={(e) => setCompetency(e.target.value)}>
                {COMPETENCIES.map((c) => (
                  <option value={c.value} key={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Extension del Caso</label>
              <select className="form-select" value={caseLength} onChange={(e) => setCaseLength(e.target.value)}>
                {CASE_LENGTHS.map((l) => (
                  <option value={l.value} key={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="config-actions-sticky">
              <p className="config-actions-hint">Cuando termines de configurar, genera el caso directamente desde aqui.</p>
              <div className="config-actions-row">
                <button className="btn-primary" onClick={generateCase} disabled={loading}>
                  {loading ? 'Generando...' : 'Generar Caso Nuevo'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowExistingCases(!showExistingCases)
                    if (!showExistingCases && existingCases.length === 0) loadExistingCases()
                  }}
                >
                  Seleccionar Caso Existente
                </button>
              </div>
            </div>
          </div>

          <div className="results-section">
            <div className="results-header">
              <h2 className="section-title">Caso Generado</h2>
              {caseObj && (
                <div className="results-actions">
                  <button className="btn-secondary" onClick={() => setShowCaseOverlay(true)}>Vista enfocada</button>
                  <button className="btn-secondary" onClick={copyCaseOutput}>Copiar salida</button>
                  <button className="btn-secondary" onClick={downloadCaseHtml}>Descargar HTML</button>
                </div>
              )}
            </div>

            {caseObj ? (
              <div className="case">
                <div className="case-header">
                  <h3 className="case-title">{caseObj.title || caseObj.case_id || caseObj.eje || 'Caso generado'}</h3>
                  <div className="case-meta">
                    {caseObj.eje && <span className="badge badge-theme">{caseObj.eje}</span>}
                    {caseObj.nivel && <span className="badge badge-level">{caseObj.nivel}</span>}
                    {caseObj.grupoEtario && <span className="badge badge-info">{caseObj.grupoEtario}</span>}
                    {caseObj.tipoTerritorio && <span className="badge badge-info">{caseObj.tipoTerritorio}</span>}
                  </div>
                </div>

                {caseObj.meta && <div className="case-info"><strong>Ficha:</strong> {caseObj.meta}</div>}

                <div className="case-description">
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                    {(caseObj.description || caseObj.text)?.replace(/\\n/g, '\n')}
                  </div>
                </div>

                {(caseObj.learning_objectives || caseObj.checklist) && (
                  <div className="case-section">
                    <h4 className="case-section-title">Objetivos de Aprendizaje</h4>
                    <ul className="objectives-list">
                      {(caseObj.learning_objectives || caseObj.checklist).map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}

                {caseObj.questions && (
                  <>
                    <div data-questions-list>
                      <QuestionsList questions={caseObj.questions} openAnswers={openAnswers} onOpenAnswerChange={handleOpenAnswerChange} />
                    </div>
                    <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: '#eef7ff', border: '1px solid #b6d8ff', color: '#003d6b' }}>
                      Este simulador funciona como material de estudio y apoyo docente. Las respuestas se trabajan localmente y no se envian al servidor.
                    </div>
                  </>
                )}

                {caseObj.suggested_interventions && (
                  <div className="case-section">
                    <h4 className="case-section-title">Intervenciones Sugeridas</h4>
                    <ul className="interventions-list">
                      {caseObj.suggested_interventions.map((it, i) => <li key={i}>{it}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                {responseText ? <pre className="response">{responseText}</pre> : <p className="empty-message">Configura los parametros y genera un caso para comenzar</p>}
              </div>
            )}
          </div>
        </div>

        <aside className="sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Historial</h2>
            <button className="btn-secondary" onClick={fetchHistory} disabled={loadingHistory}>
              {loadingHistory ? '...' : 'Actualizar'}
            </button>
          </div>
          {loadingHistory ? (
            <div className="loading-state">Cargando...</div>
          ) : (
            <ul className="history-list">
              {history.length === 0 && <li className="empty-history">No hay casos guardados</li>}
              {history.map((c) => (
                <li key={c.id} className="history-item">
                  <div className="history-title">{c.title || c.case_id}</div>
                  <div className="history-meta">
                    {c.theme && <span className="history-tag">{c.theme}</span>}
                    {c.difficulty && <span className="history-tag">{c.difficulty}</span>}
                  </div>
                  <button
                    className="btn-load"
                    onClick={() => {
                      setCaseObj(c.payload)
                      setCaseDbId(c.id)
                      setShowCaseOverlay(true)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    Ver caso
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {showCaseOverlay && caseObj && (
        <div className="case-overlay-backdrop" onClick={() => setShowCaseOverlay(false)}>
          <div className="case-overlay-panel" onClick={(e) => e.stopPropagation()}>
            <div className="case-overlay-toolbar">
              <div>
                <strong>Vista docente enfocada</strong>
                <div className="case-overlay-subtitle">Visualizacion completa del caso para trabajo pedagogico</div>
              </div>
              <div className="case-overlay-actions">
                <button className="btn-secondary" onClick={copyCaseOutput}>Copiar</button>
                <button className="btn-secondary" onClick={downloadCaseHtml}>HTML</button>
                <button className="btn-secondary" onClick={() => setShowCaseOverlay(false)}>Cerrar</button>
              </div>
            </div>

            <div className="case-overlay-content">
              <div className="case">
                <div className="case-header">
                  <h3 className="case-title">{caseObj.title || caseObj.case_id || caseObj.eje || 'Caso generado'}</h3>
                  <div className="case-meta">
                    {caseObj.eje && <span className="badge badge-theme">{caseObj.eje}</span>}
                    {caseObj.nivel && <span className="badge badge-level">{caseObj.nivel}</span>}
                  </div>
                </div>
                {caseObj.meta && <div className="case-info"><strong>Ficha:</strong> {caseObj.meta}</div>}
                <div className="case-description">
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{(caseObj.description || caseObj.text)?.replace(/\\n/g, '\n')}</div>
                </div>
                {(caseObj.learning_objectives || caseObj.checklist) && (
                  <div className="case-section">
                    <h4 className="case-section-title">Objetivos de Aprendizaje</h4>
                    <ul className="objectives-list">
                      {(caseObj.learning_objectives || caseObj.checklist).map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}
                {caseObj.questions && (
                  <div className="case-section">
                    <QuestionsList questions={caseObj.questions} openAnswers={openAnswers} onOpenAnswerChange={handleOpenAnswerChange} />
                  </div>
                )}
                {caseObj.suggested_interventions && (
                  <div className="case-section">
                    <h4 className="case-section-title">Intervenciones Sugeridas</h4>
                    <ul className="interventions-list">
                      {caseObj.suggested_interventions.map((it, i) => <li key={i}>{it}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
