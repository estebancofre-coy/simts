import { useState, useEffect } from 'react'
import TeacherPanel from './TeacherPanel'
import LoginModal from './LoginModal'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Componente para preguntas interactivas
function QuestionsList({ questions }) {
  const [selectedAnswers, setSelectedAnswers] = useState({})

  const handleSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }))
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Preguntas de evaluación</h3>
      {questions.map((q, qIndex) => {
        const selected = selectedAnswers[qIndex]
        const isAnswered = selected !== undefined
        const correctIndex = q.correct_index !== undefined ? q.correct_index : q.correctIndex

        return (
          <div key={qIndex} style={{ 
            marginBottom: 24, 
            padding: 16, 
            border: '1px solid #ddd', 
            borderRadius: 8,
            backgroundColor: '#f9f9f9'
          }}>
            <div style={{ marginBottom: 12, fontWeight: 'bold', fontSize: 16 }}>
              {qIndex + 1}. {q.question || q.text}
            </div>
            
            <div style={{ marginLeft: 12 }}>
              {(q.options || []).map((opt, oIndex) => {
                const isCorrect = oIndex === correctIndex
                const isSelected = selected === oIndex
                let bgColor = '#fff'
                let borderColor = '#ccc'
                let color = '#000'
                
                if (isAnswered) {
                  if (isSelected) {
                    if (isCorrect) {
                      bgColor = '#d4edda'
                      borderColor = '#28a745'
                      color = '#155724'
                    } else {
                      bgColor = '#f8d7da'
                      borderColor = '#dc3545'
                      color = '#721c24'
                    }
                  } else if (isCorrect) {
                    bgColor = '#d1ecf1'
                    borderColor = '#17a2b8'
                    color = '#0c5460'
                  }
                }

                return (
                  <div
                    key={oIndex}
                    onClick={() => !isAnswered && handleSelect(qIndex, oIndex)}
                    style={{
                      padding: '10px 14px',
                      marginBottom: 8,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 6,
                      backgroundColor: bgColor,
                      color: color,
                      cursor: isAnswered ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: isCorrect && isAnswered ? 'bold' : 'normal'
                    }}
                  >
                    <span style={{ marginRight: 8 }}>
                      {String.fromCharCode(65 + oIndex)})
                    </span>
                    {opt}
                    {isAnswered && isCorrect && ' ✓'}
                    {isAnswered && isSelected && !isCorrect && ' ✗'}
                  </div>
                )
              })}
            </div>

            {isAnswered && (
              <div style={{ 
                marginTop: 12, 
                padding: 12, 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: 6,
                fontSize: 14
              }}>
                <strong>Justificación:</strong> {q.justification || q.explanation || 'No disponible'}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Health check component
function HealthStatus() {
  const [backendStatus, setBackendStatus] = useState('checking')
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log('Checking backend at:', `${API_BASE}/api/health`)
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' })
        console.log('Backend response status:', res.status)
        if (res.ok) {
          setBackendStatus('online')
        } else {
          setBackendStatus('offline')
        }
      } catch (e) {
        console.error('Backend check error:', e)
        setBackendStatus('offline')
      }
    }
    checkBackend()
    const interval = setInterval(checkBackend, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  const statusColor = backendStatus === 'online' ? '#4caf50' : backendStatus === 'offline' ? '#f44336' : '#ff9800'
  const statusText = backendStatus === 'online' ? '● API Online' : backendStatus === 'offline' ? '● API Offline' : '● Verificando...'
  
  return (
    <div style={{ 
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
    }}>
      {statusText}
    </div>
  )
}

const THEMES = [
  'Familia y dinámicas familiares',
  'Infancia y adolescencia',
  'Salud mental',
  'Violencia intrafamiliar',
  'Adulto mayor',
  'Migración y multiculturalidad',
  'Reinserción social',
  'Discapacidad e inclusión',
  'Pobreza y vulnerabilidad social',
  'Adicciones'
]

const AGE_GROUPS = [
  { value: '', label: 'Sin especificar' },
  { value: 'niñez', label: 'Niñez (0-12 años)' },
  { value: 'adolescencia', label: 'Adolescencia (13-17 años)' },
  { value: 'adulto', label: 'Adulto (18-64 años)' },
  { value: 'adulto_mayor', label: 'Adulto Mayor (65+ años)' }
]

const CONTEXTS = [
  { value: '', label: 'Sin especificar' },
  { value: 'urbano', label: 'Urbano' },
  { value: 'rural', label: 'Rural' },
  { value: 'institucional', label: 'Institucional' }
]

const FOCUS_AREAS = [
  { value: '', label: 'Sin especificar' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'intervencion', label: 'Intervención' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'completo', label: 'Proceso completo' }
]

const CASE_LENGTHS = [
  { value: 'corto', label: 'Corto (2-3 párrafos)' },
  { value: 'medio', label: 'Medio (3-4 párrafos)' },
  { value: 'extenso', label: 'Extenso (5-6 párrafos)' }
]

export default function App() {
  const [theme, setTheme] = useState(THEMES[0])
  const [difficulty, setDifficulty] = useState('basico')
  const [ageGroup, setAgeGroup] = useState('')
  const [context, setContext] = useState('')
  const [focusArea, setFocusArea] = useState('')
  const [caseLength, setCaseLength] = useState('medio')
  const [caseObj, setCaseObj] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showTeacherPanel, setShowTeacherPanel] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('teacherAuth') === 'true'
  )

  async function generateCase() {
    setLoading(true)
    setCaseObj(null)
    setResponseText('⏳ Generando caso... Esto puede tomar entre 30-60 segundos.')
    const startTime = Date.now()
    
    try {
      console.log('🚀 Iniciando generación de caso:', { theme, difficulty })
      console.log('📡 Endpoint:', `${API_BASE}/api/simulate`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutos de timeout
      
      const res = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true, theme, difficulty }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('📥 Respuesta recibida, status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${errorText}`)
      }
      
      const data = await res.json()
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
      
      if (data.case) {
        setCaseObj(data.case)
        setResponseText('')
        // Mostrar métricas en consola
        console.log('✅ Caso generado exitosamente')
        console.log('📊 Métricas de generación:')
        console.log(`  ⏱️  Tiempo total: ${totalTime}s`)
        if (data.metrics) {
          console.log(`  🤖 API OpenAI: ${data.metrics.api_time}s`)
          console.log(`  ⚙️  Procesamiento: ${data.metrics.processing_time}s`)
        }
      } else if (data.text) {
        setResponseText(data.text)
      } else {
        setResponseText(JSON.stringify(data.raw_response || data, null, 2))
      }
      // If backend returned saved metadata, refresh history
      if (data.saved) fetchHistory()
    } catch (e) {
      console.error('❌ Error en generación:', e)
      if (e.name === 'AbortError') {
        setResponseText('⚠️ Error: La petición tardó demasiado (más de 2 minutos). \n\nPosibles causas:\n- El backend está procesando demasiado lento\n- Problemas de conexión con OpenAI\n- El servidor está sobrecargado\n\nIntenta de nuevo o contacta al administrador.')
      } else if (e.message.includes('Failed to fetch')) {
        setResponseText(`⚠️ Error de conexión: No se pudo conectar con el backend.\n\nVerifica que:\n- El backend esté ejecutándose (indicador en la esquina superior derecha)\n- Tu conexión a internet esté activa\n- Los puertos 5173 y 8000 estén accesibles\n\nError técnico: ${e.message}`)
      } else {
        setResponseText(`❌ Error al generar caso:\n\n${e.message}\n\nSi el problema persiste, verifica:\n- La configuración de OPENAI_API_KEY en el backend\n- Los logs del servidor backend\n- Que no haya problemas de cuota en la API de OpenAI`)
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

  function handleLoginSuccess() {
    setIsAuthenticated(true)
    localStorage.setItem('teacherAuth', 'true')
    setShowLogin(false)
    setShowTeacherPanel(true)
  }

  function handleLogout() {
    setIsAuthenticated(false)
    localStorage.removeItem('teacherAuth')
    setShowTeacherPanel(false)
  }

  function attemptOpenPanel() {
    if (isAuthenticated) {
      setShowTeacherPanel(true)
    } else {
      setShowLogin(true)
    }
  }

  return (
    <>
      <HealthStatus />
      {showLogin && (
        <LoginModal 
          onLogin={handleLoginSuccess}
          onCancel={() => setShowLogin(false)}
        />
      )}
      {showTeacherPanel && isAuthenticated && (
        <TeacherPanel 
          onClose={() => setShowTeacherPanel(false)}
          onLogout={handleLogout}
        />
      )}
      <header className="app-header">
        <div className="header-content">
          <img 
            src="https://zlq2y2bbczxjflne.public.blob.vercel-storage.com/Logos%20Carreras.png" 
            alt="Logo Trabajo Social" 
            className="header-logo"
          />
          <div className="header-text">
            <h1>Simulador de Casos </h1>
            <p className="header-subtitle">Carrera de Trabajo Social - Universidad de Aysén</p>
          </div>
        </div>
      </header>
      <div className="container layout">
        <div className="main">

      <div className="config-panel">
        <h2 className="section-title">Configuración del Caso</h2>
        
        <div className="form-group">
          <label className="form-label">Temática</label>
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
              <span>Básico</span>
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

        <button className="btn-primary" onClick={generateCase} disabled={loading}>
          {loading ? '⏳ Generando...' : '✨ Generar Caso Nuevo'}
        </button>
      </div>

      <div className="results-section">
        <h2 className="section-title">Caso Generado</h2>
        {caseObj ? (
          <div className="case">
            <div className="case-header">
              <h3 className="case-title">{caseObj.title || caseObj.case_id || caseObj.eje || 'Caso generado'}</h3>
              <div className="case-meta">
                {caseObj.eje && <span className="badge badge-theme">{caseObj.eje}</span>}
                {caseObj.nivel && <span className="badge badge-level">{caseObj.nivel}</span>}
              </div>
            </div>
            
            {caseObj.meta && (
              <div className="case-info">
                <strong>📋 Ficha:</strong> {caseObj.meta}
              </div>
            )}
            
            <div className="case-description">
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {caseObj.description || caseObj.text}
              </div>
            </div>

          {/* Objetivos / checklist */}
          {(caseObj.learning_objectives || caseObj.checklist) && (
            <div className="case-section">
              <h4 className="case-section-title">🎯 Objetivos de Aprendizaje</h4>
              <ul className="objectives-list">
                {(caseObj.learning_objectives || caseObj.checklist).map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}

          {/* Preguntas interactivas */}
          {caseObj.questions && <QuestionsList questions={caseObj.questions} />}
          
          {/* Fallback para formato antiguo */}
          {caseObj.suggested_questions && !caseObj.questions && (
            <div className="case-section">
              <h4 className="case-section-title">❓ Preguntas para Reflexionar</h4>
              <ul className="questions-list">
                {caseObj.suggested_questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          {caseObj.suggested_interventions && (
            <div className="case-section">
              <h4 className="case-section-title">💡 Intervenciones Sugeridas</h4>
              <ul className="interventions-list">
                {caseObj.suggested_interventions.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </div>
          )}
        </div>
        ) : (
          <div className="empty-state">
            {responseText ? (
              <pre className="response">{responseText}</pre>
            ) : (
              <p className="empty-message">👆 Configura los parámetros y genera un caso para comenzar</p>
            )}
          </div>
        )}
      </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">📚 Historial</h2>
          <button className="btn-secondary" onClick={fetchHistory} disabled={loadingHistory}>
            {loadingHistory ? '⏳' : '🔄'}
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
                  onClick={() => { setCaseObj(c.payload); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                >
                  Ver caso
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      </div>
      
      {/* Botón flotante para acceso docente */}
      <button 
        className="btn-teacher-access"
        onClick={attemptOpenPanel}
        title="Acceso panel de docentes"
      >
        🎓 Panel Docente
      </button>
    </>
  )
}
