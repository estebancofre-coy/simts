import { useState, useEffect } from 'react'

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
  'Reinserción social'
]

export default function App() {
  const [theme, setTheme] = useState(THEMES[0])
  const [difficulty, setDifficulty] = useState('basico')
  const [caseObj, setCaseObj] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  async function generateCase() {
    setLoading(true)
    setCaseObj(null)
    setResponseText('')
    const startTime = Date.now()
    
    try {
      const res = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true, theme, difficulty })
      })
      const data = await res.json()
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
      
      if (data.case) {
        setCaseObj(data.case)
        // Mostrar métricas en consola
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
      setResponseText('Error: ' + String(e))
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

  return (
    <>
      <HealthStatus />
      <div className="container layout">
        <div className="main">
        <h1>Simulador Casos - Trabajo Social (U. Aysén)</h1>

      <label>Temática</label>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        {THEMES.map((t) => (
          <option value={t} key={t}>{t}</option>
        ))}
      </select>

      <div style={{ marginTop: 8 }}>
        <label>Nivel de dificultad:</label>
        <label style={{ marginLeft: 8 }}>
          <input type="radio" name="difficulty" value="basico" checked={difficulty === 'basico'} onChange={() => setDifficulty('basico')} /> Básico
        </label>
        <label style={{ marginLeft: 8 }}>
          <input type="radio" name="difficulty" value="intermedio" checked={difficulty === 'intermedio'} onChange={() => setDifficulty('intermedio')} /> Intermedio
        </label>
        <label style={{ marginLeft: 8 }}>
          <input type="radio" name="difficulty" value="avanzado" checked={difficulty === 'avanzado'} onChange={() => setDifficulty('avanzado')} /> Avanzado
        </label>
      </div>

      <div className="controls" style={{ marginTop: 12 }}>
        <button onClick={generateCase} disabled={loading}>
          {loading ? 'Generando...' : 'Generar caso'}
        </button>
      </div>

      <h2>Casos generados</h2>
      {caseObj ? (
        <div className="case">
          <h3>{caseObj.title || caseObj.case_id || caseObj.eje || 'Caso generado'}</h3>
          {caseObj.meta && <p><strong>Ficha:</strong> {caseObj.meta}</p>}
          {caseObj.eje && <p><strong>Eje:</strong> {caseObj.eje}</p>}
          {caseObj.nivel && <p><strong>Nivel:</strong> {caseObj.nivel}</p>}
          <p>{caseObj.description || caseObj.text}</p>

          {/* Objetivos / checklist */}
          {(caseObj.learning_objectives || caseObj.checklist) && (
            <div>
              <strong>Objetivos / Checklist</strong>
              <ul>
                {(caseObj.learning_objectives || caseObj.checklist).map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}

          {/* Preguntas interactivas */}
          {caseObj.questions && <QuestionsList questions={caseObj.questions} />}
          
          {/* Fallback para formato antiguo */}
          {caseObj.suggested_questions && !caseObj.questions && (
            <div>
              <strong>Preguntas sugeridas</strong>
              <ul>
                {caseObj.suggested_questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          {caseObj.suggested_interventions && (
            <div>
              <strong>Intervenciones sugeridas</strong>
              <ul>
                {caseObj.suggested_interventions.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <pre className="response">{responseText}</pre>
      )}
      </div>

      <aside className="sidebar">
        <h2>Historial de casos</h2>
        <div style={{ marginBottom: 8 }}>
          <button onClick={fetchHistory} disabled={loadingHistory}>Actualizar</button>
        </div>
        {loadingHistory ? (
          <div>Cargando...</div>
        ) : (
          <ul className="history-list">
            {history.length === 0 && <li>No hay casos guardados</li>}
            {history.map((c) => (
              <li key={c.id} className="history-item">
                <div><strong>{c.title || c.case_id}</strong></div>
                <div style={{ fontSize: 12, color: '#666' }}>{c.theme || ''} — {c.difficulty || ''}</div>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => { setCaseObj(c.payload); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Cargar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
      </div>
    </>
  )
}
