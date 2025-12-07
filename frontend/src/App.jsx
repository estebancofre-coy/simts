import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TeacherPanel from './TeacherPanel'
import LoginModal from './LoginModal'
import StudentLoginModal from './StudentLoginModal'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Componente para preguntas interactivas
function QuestionsList({ questions, openAnswers, onOpenAnswerChange }) {
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
        const isOpenEnded = !q.options || q.options.length === 0

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
            
            {!isOpenEnded && (
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
            )}

            {isOpenEnded && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Respuesta del estudiante</label>
                <textarea
                  value={openAnswers?.[qIndex] || ''}
                  onChange={(e) => onOpenAnswerChange?.(qIndex, e.target.value)}
                  rows={4}
                  placeholder="Escribe tu respuesta aquí..."
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
                />
              </div>
            )}

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
  { value: '', label: 'Sin especificar (IA decide)' },
  { value: 'primera_infancia', label: 'Primera Infancia (0-5 años)' },
  { value: 'niñez', label: 'Niñez (6-12 años)' },
  { value: 'adolescencia', label: 'Adolescencia (13-17 años)' },
  { value: 'adultez', label: 'Adultez (18-64 años)' },
  { value: 'adulto_mayor', label: 'Adulto Mayor (65+ años)' }
]

const CONTEXTS = [
  { value: '', label: 'Sin especificar (IA decide)' },
  { value: 'urbano', label: 'Urbano (Coyhaique, Puerto Aysén)' },
  { value: 'rural', label: 'Rural (comunas alejadas)' },
  { value: 'rural_extremo', label: 'Rural Extremo (máximo aislamiento)' }
]

const FOCUS_AREAS = [
  { value: '', label: 'Sin especificar (IA decide)' },
  { value: 'derechos_humanos', label: 'Derechos Humanos' },
  { value: 'enfoque_genero', label: 'Enfoque de Género' },
  { value: 'determinantes_sociales', label: 'Determinantes Sociales' },
  { value: 'comunitario', label: 'Comunitario/Territorial' },
  { value: 'sistemico_familiar', label: 'Sistémico Familiar' }
]

const COMPETENCIES = [
  { value: '', label: 'Sin especificar (IA decide)' },
  { value: 'diagnostico_social', label: 'Diagnóstico Social' },
  { value: 'diseño_intervencion', label: 'Diseño de Intervención' },
  { value: 'articulacion_redes', label: 'Articulación de Redes' },
  { value: 'entrevista_vinculacion', label: 'Entrevista y Vinculación' },
  { value: 'evaluacion', label: 'Evaluación de Resultados' }
]

const CASE_LENGTHS = [
  { value: 'corto', label: 'Corto (4 párrafos)' },
  { value: 'medio', label: 'Medio (5 párrafos)' },
  { value: 'extenso', label: 'Extenso (6 párrafos)' }
]

export default function App({ onLogout, isTeacherAuthenticated: propIsTeacherAuthenticated, isStudentAuthenticated: propIsStudentAuthenticated, studentData: propStudentData }) {
  const navigate = useNavigate()
  
  // Determinar el tipo de usuario actual
  const isTeacher = propIsTeacherAuthenticated || localStorage.getItem('teacherAuth') === 'true'
  const isStudent = propIsStudentAuthenticated || localStorage.getItem('studentAuth') === 'true'
  
  // Debug
  console.log('App render - isTeacher:', isTeacher, 'isStudent:', isStudent)
  console.log('Props:', { propIsTeacherAuthenticated, propIsStudentAuthenticated })
  
  const [theme, setTheme] = useState(THEMES[0])
  const [difficulty, setDifficulty] = useState('basico')
  const [ageGroup, setAgeGroup] = useState('')
  const [context, setContext] = useState('')
  const [focusArea, setFocusArea] = useState('')
  const [competency, setCompetency] = useState('')
  const [caseLength, setCaseLength] = useState('medio')
  const [caseObj, setCaseObj] = useState(null)
  const [caseDbId, setCaseDbId] = useState(null) // ID del caso en la base de datos
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [openAnswers, setOpenAnswers] = useState({})
  const [showTeacherPanel, setShowTeacherPanel] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(isTeacher)
  
  // Student authentication state
  const [showStudentLogin, setShowStudentLogin] = useState(false)
  const [isStudentAuthenticated, setIsStudentAuthenticated] = useState(isStudent)
  const [studentData, setStudentData] = useState(
    propStudentData || (() => {
      const saved = localStorage.getItem('studentData')
      return saved ? JSON.parse(saved) : null
    })()
  )
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [submittedAnswers, setSubmittedAnswers] = useState(false)
  const [activeTab, setActiveTab] = useState('generate') // 'generate' or 'feedback'
  const [myFeedback, setMyFeedback] = useState([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  async function loadMyFeedback() {
    if (!isStudentAuthenticated || !studentData) return
    
    setLoadingFeedback(true)
    try {
      const res = await fetch(`${API_BASE}/api/answers?student_id=${studentData.id}`)
      const data = await res.json()
      if (data.ok) {
        setMyFeedback(data.sessions || [])
      }
    } catch (e) {
      console.error('Error cargando feedback:', e)
    } finally {
      setLoadingFeedback(false)
    }
  }

  async function generateCase() {
    setLoading(true)
    setCaseObj(null)
    setCaseDbId(null)
    setOpenAnswers({})
    setResponseText('⏳ Generando caso... Esto puede tomar entre 30-60 segundos.')
    const startTime = Date.now()
    
    try {
      console.log('🚀 Iniciando generación de caso:', { 
        theme, 
        difficulty, 
        ageGroup, 
        context, 
        focusArea,
        competency,
        caseLength 
      })
      console.log('📡 Endpoint:', `${API_BASE}/api/simulate`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutos de timeout
      
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
      
      console.log('📥 Respuesta recibida, status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${errorText}`)
      }
      
      const data = await res.json()
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
      
      if (data.case) {
        setCaseObj(data.case)
        // Guardar el ID del caso en la DB si fue guardado exitosamente
        if (data.saved && data.saved.id) {
          setCaseDbId(data.saved.id)
          console.log('💾 Caso guardado en DB con ID:', data.saved.id)
        }
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
      let url = `${API_BASE}/api/cases`
      // Filtrar por el estudiante logueado
      if (studentData?.id) {
        url += `?created_by=${studentData.id}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setHistory(data.cases || [])
      }
    } catch (e) {
      console.error('Error cargando historial', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Auto-abrir panel de docentes si ya está autenticado
  useEffect(() => {
    if (isTeacher && !isStudent) {
      setShowTeacherPanel(true)
    }
  }, [isTeacher, isStudent])

  // Sincronizar con props de ProtectedApp
  useEffect(() => {
    if (propIsTeacherAuthenticated) {
      setIsAuthenticated(true)
      setShowTeacherPanel(true)
    }
    if (propIsStudentAuthenticated && propStudentData) {
      setIsStudentAuthenticated(true)
      setStudentData(propStudentData)
    }
  }, [propIsTeacherAuthenticated, propIsStudentAuthenticated, propStudentData])

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

  function handleStudentLogin(student) {
    setIsStudentAuthenticated(true)
    setStudentData(student)
    setShowStudentLogin(false)
  }

  function handleStudentLogout() {
    setIsStudentAuthenticated(false)
    setStudentData(null)
    setCurrentSessionId(null)
    setSubmittedAnswers(false)
    localStorage.removeItem('studentAuth')
    localStorage.removeItem('studentData')
    localStorage.removeItem('studentToken')
  }

  async function submitAnswers() {
    if (!isStudentAuthenticated || !caseObj) {
      alert('Debes iniciar sesión y generar un caso antes de enviar respuestas')
      return
    }

    if (!caseDbId) {
      alert('⚠️ Error: El caso no se guardó correctamente en la base de datos. Por favor, genera un nuevo caso.')
      console.error('caseDbId is null - case was not saved to database')
      return
    }

    // Preparar array de respuestas en el formato que espera el backend
    const answers = caseObj.questions.map((q, idx) => {
      const isOpenEnded = !q.options || q.options.length === 0
      
      if (isOpenEnded) {
        // Pregunta abierta
        return {
          question_index: idx,
          open_answer: openAnswers[idx] || '',
          selected_option: null
        }
      } else {
        // Pregunta de opción múltiple
        const checkedInput = document.querySelector(`input[name="q${idx}"]:checked`)
        const selectedIndex = checkedInput ? parseInt(checkedInput.value) : null
        
        return {
          question_index: idx,
          selected_option: selectedIndex,
          open_answer: null
        }
      }
    })

    console.log('📤 Enviando respuestas:', { case_id: caseDbId, answers })

    try {
      const token = localStorage.getItem('studentToken')
      const response = await fetch(`${API_BASE}/api/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          case_id: caseDbId,
          answers: answers
        })
      })

      const data = await response.json()
      console.log('📥 Respuesta del servidor:', data)

      if (!response.ok || !data.ok) {
        throw new Error(data.error || data.detail || 'Error al enviar respuestas')
      }

      setCurrentSessionId(data.session_id)
      setSubmittedAnswers(true)

      alert(`✅ Respuestas enviadas correctamente!\n\nTus respuestas han sido registradas y están disponibles para revisión del docente.\n\nSesión ID: ${data.session_id}`)
    } catch (err) {
      console.error('Error enviando respuestas:', err)
      alert('Error al enviar respuestas: ' + err.message)
    }
  }

  function attemptOpenPanel() {
    if (isAuthenticated) {
      setShowTeacherPanel(true)
    } else {
      setShowLogin(true)
    }
  }

  function handleOpenAnswerChange(index, text) {
    setOpenAnswers(prev => ({ ...prev, [index]: text }))
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
      {showStudentLogin && (
        <StudentLoginModal
          onLogin={handleStudentLogin}
          onCancel={() => setShowStudentLogin(false)}
        />
      )}
      
      {/* Si es docente autenticado, mostrar solo el panel docente */}
      {isTeacher && !isStudent ? (
        <TeacherPanel 
          onClose={() => {}}
          onLogout={handleLogout}
          openAnswers={{}}
          activeCase={null}
        />
      ) : (
        /* Interfaz de estudiante */
        <>
      <header className="app-header">
        <div className="header-content">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/')}>
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => onLogout && onLogout()}
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
              ← Ir a Inicio
            </button>
            {isStudentAuthenticated ? (
              <>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                  👤 {studentData?.name || studentData?.username}
                </span>
                <button 
                  onClick={handleStudentLogout}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowStudentLogin(true)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Iniciar Sesión Estudiante
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs de navegación para estudiantes */}
      {isStudentAuthenticated && (
        <div style={{
          backgroundColor: 'white',
          borderBottom: '2px solid #e0e0e0',
          padding: '0 2rem'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            gap: '2rem'
          }}>
            <button
              onClick={() => setActiveTab('generate')}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'none',
                color: activeTab === 'generate' ? '#003d6b' : '#666',
                borderBottom: activeTab === 'generate' ? '3px solid #003d6b' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === 'generate' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              📝 Generar Casos
            </button>
            <button
              onClick={() => {
                setActiveTab('feedback')
                loadMyFeedback()
              }}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'none',
                color: activeTab === 'feedback' ? '#003d6b' : '#666',
                borderBottom: activeTab === 'feedback' ? '3px solid #003d6b' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === 'feedback' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              💬 Mi Feedback
            </button>
          </div>
        </div>
      )}

      <div className="container layout">
        <div className="main">

      {activeTab === 'generate' ? (
        <>
      <div className="config-panel">
        <h2 className="section-title">Configuración del Caso</h2>
        
        <div className="form-group">\n
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
            <label className="radio-label" title="Casos simples con situaciones directas y respuestas claras. Ideal para familiarizarse con la metodología.">
              <input type="radio" name="difficulty" value="basico" checked={difficulty === 'basico'} onChange={() => setDifficulty('basico')} />
              <span>Básico ℹ️</span>
            </label>
            <label className="radio-label" title="Casos con mayor complejidad, variables múltiples y situaciones que requieren análisis más profundo.">
              <input type="radio" name="difficulty" value="intermedio" checked={difficulty === 'intermedio'} onChange={() => setDifficulty('intermedio')} />
              <span>Intermedio ℹ️</span>
            </label>
            <label className="radio-label" title="Casos complejos con múltiples actores, factores de riesgo entrelazados y dilemas éticos. Requiere pensamiento crítico avanzado.">
              <input type="radio" name="difficulty" value="avanzado" checked={difficulty === 'avanzado'} onChange={() => setDifficulty('avanzado')} />
              <span>Avanzado ℹ️</span>
            </label>
          </div>
        </div>

        {/* NUEVOS SELECTORES AGREGADOS */}
        <div className="form-group">
          <label className="form-label">
            Grupo Etario
            <span style={{fontSize: '0.85em', color: '#666', marginLeft: 6}}>(opcional)</span>
          </label>
          <select className="form-select" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
            {AGE_GROUPS.map((g) => (
              <option value={g.value} key={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Contexto Territorial
            <span style={{fontSize: '0.85em', color: '#666', marginLeft: 6}}>(opcional)</span>
          </label>
          <select className="form-select" value={context} onChange={(e) => setContext(e.target.value)}>
            {CONTEXTS.map((c) => (
              <option value={c.value} key={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Enfoque Principal
            <span style={{fontSize: '0.85em', color: '#666', marginLeft: 6}}>(opcional)</span>
          </label>
          <select className="form-select" value={focusArea} onChange={(e) => setFocusArea(e.target.value)}>
            {FOCUS_AREAS.map((f) => (
              <option value={f.value} key={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Competencia Objetivo
            <span style={{fontSize: '0.85em', color: '#666', marginLeft: 6}}>(opcional)</span>
          </label>
          <select className="form-select" value={competency} onChange={(e) => setCompetency(e.target.value)}>
            {COMPETENCIES.map((comp) => (
              <option value={comp.value} key={comp.value}>{comp.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Extensión del Caso</label>
          <select className="form-select" value={caseLength} onChange={(e) => setCaseLength(e.target.value)}>
            {CASE_LENGTHS.map((l) => (
              <option value={l.value} key={l.value}>{l.label}</option>
            ))}
          </select>
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
                {caseObj.grupoEtario && <span className="badge badge-info">{caseObj.grupoEtario}</span>}
                {caseObj.tipoTerritorio && <span className="badge badge-info">{caseObj.tipoTerritorio}</span>}
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
          {caseObj.questions && (
            <>
              <div data-questions-list>
                <QuestionsList 
                  questions={caseObj.questions}
                  openAnswers={openAnswers}
                  onOpenAnswerChange={handleOpenAnswerChange}
                />
              </div>
              
              {isStudentAuthenticated && !submittedAnswers && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <button
                    onClick={submitAnswers}
                    style={{
                      padding: '1rem 2rem',
                      fontSize: '1.1rem',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    📤 Enviar Respuestas
                  </button>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    Asegúrate de responder todas las preguntas antes de enviar
                  </p>
                </div>
              )}

              {submittedAnswers && currentSessionId && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#e8f5e9',
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#2e7d32' }}>
                    ✅ Respuestas enviadas correctamente
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>
                    Sesión ID: {currentSessionId}
                  </p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    Tu docente podrá revisar y calificar tus respuestas
                  </p>
                </div>
              )}
            </>
          )}
          
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
      </> 
      ) : (
        /* Vista de Feedback del Estudiante */
        <div style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#003d6b' }}>💬 Mi Feedback de Casos Resueltos</h2>
          
          {loadingFeedback ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              Cargando feedback...
            </div>
          ) : myFeedback.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📭 No tienes casos resueltos aún</p>
              <p>Resuelve algunos casos y vuelve aquí para ver el feedback de tu docente</p>
              <button 
                onClick={() => setActiveTab('generate')}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#003d6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Ir a Generar Casos
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {myFeedback.map((session) => (
                <div key={session.session_id} style={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <div>
                      <h3 style={{ color: '#003d6b', marginBottom: '0.5rem' }}>
                        {session.case_title || `Caso ${session.case_id}`}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                        📅 {new Date(session.submitted_at).toLocaleDateString('es-CL', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {session.answers?.length || 0} respuestas
                    </span>
                  </div>

                  {session.answers && session.answers.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {session.answers.map((answer, idx) => (
                        <div key={answer.id} style={{
                          padding: '1rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px',
                          borderLeft: answer.feedback ? '4px solid #4caf50' : '4px solid #e0e0e0'
                        }}>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong style={{ color: '#333' }}>Pregunta {idx + 1}:</strong>
                            <p style={{ margin: '0.5rem 0', color: '#555' }}>{answer.question_text}</p>
                          </div>

                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#666' }}>Tu respuesta:</strong>
                            <p style={{ 
                              margin: '0.5rem 0', 
                              color: '#333',
                              backgroundColor: 'white',
                              padding: '0.75rem',
                              borderRadius: '4px'
                            }}>
                              {answer.student_answer || 'Sin respuesta'}
                              {answer.answer_type === 'multiple_choice' && answer.is_correct !== null && (
                                <span style={{ 
                                  marginLeft: '0.75rem',
                                  fontWeight: 'bold',
                                  color: answer.is_correct ? '#4caf50' : '#f44336'
                                }}>
                                  {answer.is_correct ? '✓ Correcta' : '✗ Incorrecta'}
                                </span>
                              )}
                            </p>
                          </div>

                          {answer.feedback ? (
                            <div style={{
                              marginTop: '1rem',
                              padding: '1rem',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              border: '1px solid #4caf50'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{ fontSize: '1.2rem' }}>👨‍🏫</span>
                                <strong style={{ color: '#4caf50' }}>Feedback del Docente:</strong>
                              </div>
                              <p style={{ 
                                margin: 0, 
                                color: '#333',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {answer.feedback}
                              </p>
                            </div>
                          ) : (
                            <div style={{
                              marginTop: '1rem',
                              padding: '0.75rem',
                              backgroundColor: '#fff3cd',
                              borderRadius: '4px',
                              border: '1px solid #ffc107',
                              fontSize: '0.9rem',
                              color: '#856404'
                            }}>
                              ⏳ Esperando feedback del docente
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No hay respuestas registradas para esta sesión</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      <aside className="sidebar">\n
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
                  onClick={() => { 
                    setCaseObj(c.payload); 
                    setCaseDbId(c.id); // Guardar el ID de la DB
                    setSubmittedAnswers(false); // Reset del estado de envío
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
      
      {/* Botón flotante para acceso docente */}
      {!isAuthenticated && (
        <button 
          className="btn-teacher-access"
          onClick={attemptOpenPanel}
          title="Acceso panel de docentes"
        >
          🎓 Panel Docente
        </button>
      )}
      </>
      )}
    </>
  )
}