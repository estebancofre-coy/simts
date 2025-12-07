import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function TeacherPanel({ onClose, onLogout, openAnswers = {}, activeCase = null }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState(null)
  const [selectedCase, setSelectedCase] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [filter, setFilter] = useState({ theme: '', difficulty: '', search: '' })
  const [view, setView] = useState('list') // 'list' | 'edit' | 'stats' | 'collections' | 'answers'
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDesc, setNewCollectionDesc] = useState('')
  
  // Student answers state
  const [students, setStudents] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionAnswers, setSessionAnswers] = useState([])
  const [answerFilters, setAnswerFilters] = useState({ student_id: '', case_id: '' })

  useEffect(() => {
    loadCases()
    loadStatistics()
    loadCollections()
    loadStudents()
  }, [])

  async function loadCases() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/cases?limit=200&status=active`)
      const data = await res.json()
      if (data.ok) {
        setCases(data.cases || [])
      }
    } catch (e) {
      console.error('Error cargando casos:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadStatistics() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/statistics`)
      const data = await res.json()
      if (data.ok) {
        setStatistics(data.statistics)
      }
    } catch (e) {
      console.error('Error cargando estadísticas:', e)
    }
  }

  async function loadCollections() {
    try {
      const res = await fetch(`${API_BASE}/api/collections`)
      const data = await res.json()
      if (data.ok) {
        setCollections(data.collections || [])
      }
    } catch (e) {
      console.error('Error cargando colecciones:', e)
    }
  }

  async function loadStudents() {
    try {
      const res = await fetch(`${API_BASE}/api/students`)
      const data = await res.json()
      if (data.ok) {
        setStudents(data.students || [])
      }
    } catch (e) {
      console.error('Error cargando estudiantes:', e)
    }
  }

  async function loadSessions() {
    try {
      const params = new URLSearchParams()
      if (answerFilters.student_id) params.append('student_id', answerFilters.student_id)
      if (answerFilters.case_id) params.append('case_id', answerFilters.case_id)
      
      const res = await fetch(`${API_BASE}/api/answers?${params}`)
      const data = await res.json()
      if (data.ok) {
        setSessions(data.sessions || [])
      }
    } catch (e) {
      console.error('Error cargando sesiones:', e)
    }
  }

  async function loadSessionAnswers(sessionId) {
    try {
      const res = await fetch(`${API_BASE}/api/answers?session_id=${sessionId}`)
      const data = await res.json()
      if (data.ok && data.sessions.length > 0) {
        setSessionAnswers(data.sessions[0].answers || [])
        setSelectedSession(data.sessions[0])
      }
    } catch (e) {
      console.error('Error cargando respuestas:', e)
    }
  }

  async function updateAnswerFeedback(answerId, feedback, score) {
    try {
      const res = await fetch(`${API_BASE}/api/answers/${answerId}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, score })
      })
      
      const data = await res.json()
      if (data.ok) {
        // Reload current session
        if (selectedSession) {
          loadSessionAnswers(selectedSession.id)
        }
        alert('✅ Feedback guardado')
      }
    } catch (e) {
      console.error('Error guardando feedback:', e)
      alert('Error guardando feedback')
    }
  }

  function exportSessionsCSV() {
    if (sessions.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    const headers = ['Estudiante', 'Caso', 'Fecha', 'Respuestas']
    const rows = sessions.map(s => [
      s.student_name || `Estudiante ${s.student_id}`,
      (s.case_title || `Caso ${s.case_id}`).replace(/,/g, ';'),
      new Date(s.submitted_at).toLocaleString('es-CL'),
      s.answers?.length || 0
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `respuestas_estudiantes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportSessionsPDF() {
    if (sessions.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(18)
    doc.text('Reporte de Respuestas de Estudiantes', 14, 20)
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 14, 28)
    
    // Tabla de sesiones
    const tableData = sessions.map(s => [
      s.student_name || `Est. ${s.student_id}`,
      (s.case_title || `Caso ${s.case_id}`).substring(0, 40),
      new Date(s.submitted_at).toLocaleDateString('es-CL'),
      s.answers?.length || 0
    ])

    doc.autoTable({
      head: [['Estudiante', 'Caso', 'Fecha', 'N° Respuestas']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [76, 175, 80] }
    })

    doc.save(`respuestas_estudiantes_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  function exportSessionDetailPDF(session, answers) {
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text('Detalle de Respuestas', 14, 20)
    
    doc.setFontSize(11)
    doc.text(`Estudiante: ${session.student_name || `Estudiante ${session.student_id}`}`, 14, 30)
    doc.text(`Caso: ${session.case_title || `Caso ${session.case_id}`}`, 14, 37)
    doc.text(`Fecha: ${new Date(session.submitted_at).toLocaleString('es-CL')}`, 14, 44)
    
    let yPos = 55
    
    answers.forEach((answer, idx) => {
      if (yPos > 260) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text(`Pregunta ${idx + 1}:`, 14, yPos)
      yPos += 5
      
      doc.setFont(undefined, 'normal')
      const questionLines = doc.splitTextToSize(answer.question_text, 180)
      doc.text(questionLines, 14, yPos)
      yPos += questionLines.length * 5 + 3
      
      if (answer.answer_type === 'multiple_choice') {
        doc.text(`Respuesta: ${answer.student_answer || 'Sin responder'}`, 14, yPos)
        yPos += 5
        doc.text(`${answer.is_correct ? '✓ Correcta' : '✗ Incorrecta'}`, 14, yPos)
        yPos += 5
      } else {
        doc.text('Respuesta abierta:', 14, yPos)
        yPos += 5
        const answerLines = doc.splitTextToSize(answer.student_answer || 'Sin responder', 180)
        doc.text(answerLines, 14, yPos)
        yPos += answerLines.length * 5
      }
      
      if (answer.feedback) {
        yPos += 3
        doc.setFont(undefined, 'italic')
        doc.text('Feedback: ' + answer.feedback, 14, yPos)
        doc.setFont(undefined, 'normal')
        yPos += 5
      }
      
      yPos += 8
    })
    
    doc.save(`respuestas_${session.student_name || session.student_id}_${session.id}.pdf`)
  }

  async function createCollection() {
    if (!newCollectionName.trim()) {
      alert('El nombre es requerido')
      return
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDesc
        })
      })
      const data = await res.json()
      if (data.ok) {
        alert('Colección creada exitosamente')
        setNewCollectionName('')
        setNewCollectionDesc('')
        setShowNewCollectionForm(false)
        loadCollections()
      }
    } catch (e) {
      alert('Error creando colección: ' + e.message)
    }
  }

  async function deleteCollection(collectionId) {
    if (!confirm('¿Estás seguro de eliminar esta colección?')) return
    
    try {
      const res = await fetch(`${API_BASE}/api/collections/${collectionId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.ok) {
        alert('Colección eliminada')
        loadCollections()
      }
    } catch (e) {
      alert('Error eliminando colección: ' + e.message)
    }
  }

  async function viewCollection(collectionId) {
    try {
      const res = await fetch(`${API_BASE}/api/collections/${collectionId}`)
      const data = await res.json()
      if (data.ok) {
        setSelectedCollection(data.collection)
      }
    } catch (e) {
      alert('Error cargando colección: ' + e.message)
    }
  }

  async function addCaseToCollection(collectionId, caseId) {
    try {
      const res = await fetch(`${API_BASE}/api/collections/${collectionId}/cases/${caseId}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.ok) {
        alert('Caso agregado a la colección')
        if (selectedCollection && selectedCollection.id === collectionId) {
          viewCollection(collectionId)
        }
        loadCollections()
      }
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function removeCaseFromCollection(collectionId, caseId) {
    try {
      const res = await fetch(`${API_BASE}/api/collections/${collectionId}/cases/${caseId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.ok) {
        alert('Caso removido de la colección')
        viewCollection(collectionId)
        loadCollections()
      }
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  async function handleDelete(caseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este caso?')) return
    
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.ok) {
        alert('Caso eliminado exitosamente')
        loadCases()
        loadStatistics()
      }
    } catch (e) {
      alert('Error eliminando caso: ' + e.message)
    }
  }

  async function handleUpdate(caseId, updates) {
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      if (data.ok) {
        alert('Caso actualizado exitosamente')
        loadCases()
        setIsEditing(false)
        setSelectedCase(null)
      }
    } catch (e) {
      alert('Error actualizando caso: ' + e.message)
    }
  }

  function startEdit(caseItem) {
    setSelectedCase(caseItem)
    setEditForm({
      payload: { ...caseItem.payload },
      rating: caseItem.rating || 0,
      tags: caseItem.tags || [],
      notes: caseItem.notes || ''
    })
    setIsEditing(true)
    setView('edit')
  }

  function handleEditChange(field, value) {
    if (field.startsWith('payload.')) {
      const payloadField = field.split('.')[1]
      setEditForm(prev => ({
        ...prev,
        payload: { ...prev.payload, [payloadField]: value }
      }))
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }))
    }
  }

  function saveEdit() {
    if (!selectedCase) return
    handleUpdate(selectedCase.id, editForm)
  }

  const filteredCases = cases.filter(c => {
    if (filter.theme && c.theme !== filter.theme) return false
    if (filter.difficulty && c.difficulty !== filter.difficulty) return false
    if (filter.search) {
      const search = filter.search.toLowerCase()
      const title = (c.title || '').toLowerCase()
      const caseId = (c.case_id || '').toLowerCase()
      if (!title.includes(search) && !caseId.includes(search)) return false
    }
    return true
  })

  const themes = [...new Set(cases.map(c => c.theme).filter(Boolean))]
  const difficulties = [...new Set(cases.map(c => c.difficulty).filter(Boolean))]

  function exportToJSON() {
    const dataStr = JSON.stringify(filteredCases, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `casos-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  function exportToCSV() {
    const headers = ['ID', 'Título', 'Tema', 'Dificultad', 'Fecha Creación', 'Rating']
    const rows = filteredCases.map(c => [
      c.id,
      c.title || '',
      c.theme || '',
      c.difficulty || '',
      c.created_at || '',
      c.rating || 0
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `casos-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  function exportToPDF() {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(18)
    doc.setTextColor(37, 99, 235)
    doc.text('Simulador de Casos - Trabajo Social', 14, 20)
    
    doc.setFontSize(12)
    doc.setTextColor(75, 85, 99)
    doc.text('Universidad de Aysén', 14, 28)
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-CL')}`, 14, 34)
    
    // Línea separadora
    doc.setDrawColor(229, 231, 235)
    doc.line(14, 38, 196, 38)
    
    // Estadísticas resumidas
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total de casos: ${filteredCases.length}`, 14, 45)
    
    // Tabla de casos
    const tableData = filteredCases.map(c => [
      c.id,
      c.title || c.case_id || 'Sin título',
      c.theme || '-',
      c.difficulty || '-',
      c.created_at ? new Date(c.created_at).toLocaleDateString('es-CL') : '-',
      '⭐'.repeat(c.rating || 0) || '-'
    ])
    
    doc.autoTable({
      head: [['ID', 'Título', 'Tema', 'Dificultad', 'Fecha', 'Rating']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 }
      }
    })
    
    // Pie de página en cada página
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }
    
    doc.save(`casos-trabajo-social-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  function exportDetailedPDF() {
    const doc = new jsPDF()
    let yPosition = 20
    
    filteredCases.forEach((caseItem, index) => {
      if (index > 0) {
        doc.addPage()
        yPosition = 20
      }
      
      // Encabezado del caso
      doc.setFontSize(16)
      doc.setTextColor(37, 99, 235)
      doc.text(`Caso #${caseItem.id}: ${caseItem.title || 'Sin título'}`, 14, yPosition)
      yPosition += 8
      
      // Metadatos
      doc.setFontSize(10)
      doc.setTextColor(75, 85, 99)
      doc.text(`Tema: ${caseItem.theme || '-'}`, 14, yPosition)
      yPosition += 6
      doc.text(`Dificultad: ${caseItem.difficulty || '-'}`, 14, yPosition)
      yPosition += 6
      doc.text(`Rating: ${'⭐'.repeat(caseItem.rating || 0) || 'Sin rating'}`, 14, yPosition)
      yPosition += 10
      
      // Descripción
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      const description = caseItem.payload?.text || caseItem.payload?.description || 'Sin descripción'
      const splitDescription = doc.splitTextToSize(description, 180)
      doc.text(splitDescription, 14, yPosition)
      yPosition += splitDescription.length * 5 + 10
      
      // Objetivos
      if (caseItem.payload?.learning_objectives || caseItem.payload?.checklist) {
        doc.setFontSize(12)
        doc.setTextColor(37, 99, 235)
        doc.text('Objetivos de Aprendizaje:', 14, yPosition)
        yPosition += 6
        
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        const objectives = caseItem.payload?.learning_objectives || caseItem.payload?.checklist || []
        objectives.forEach((obj, i) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          const splitObj = doc.splitTextToSize(`${i + 1}. ${obj}`, 175)
          doc.text(splitObj, 18, yPosition)
          yPosition += splitObj.length * 5 + 3
        })
      }
      
      // Notas del docente
      if (caseItem.notes) {
        yPosition += 5
        if (yPosition > 260) {
          doc.addPage()
          yPosition = 20
        }
        doc.setFontSize(12)
        doc.setTextColor(245, 158, 11)
        doc.text('Notas del Docente:', 14, yPosition)
        yPosition += 6
        
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        const splitNotes = doc.splitTextToSize(caseItem.notes, 180)
        doc.text(splitNotes, 14, yPosition)
      }
    })
    
    doc.save(`casos-detallados-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="teacher-panel-overlay">
      <div className="teacher-panel">
        <div className="panel-header">
          <div>
            <h2>🎓 Panel de Docentes</h2>
            <p className="panel-subtitle">Gestión y administración de casos</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn-logout" onClick={onLogout} title="Cerrar sesión">
              🚪 Salir
            </button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

          {activeCase && Object.keys(openAnswers || {}).length > 0 && (
            <div className="panel-card" style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>📝 Respuestas abiertas (sesión actual)</h4>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                Caso activo: <strong>{activeCase.title || activeCase.case_id || 'Sin título'}</strong>
              </div>
              <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                {Object.entries(openAnswers).map(([idx, text]) => {
                  const qIndex = Number(idx)
                  const q = (activeCase.questions || [])[qIndex]
                  return (
                    <li key={idx} style={{ marginBottom: 10, padding: 10, background: '#f7f7f7', borderRadius: 6 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
                        Pregunta {qIndex + 1}: {q?.question || q?.text || 'Pregunta abierta'}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{text || 'Sin respuesta'}</div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

        <div className="panel-nav">
          <button 
            className={view === 'list' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('list')}
          >
            📋 Lista de Casos
          </button>
          <button 
            className={view === 'collections' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => { setView('collections'); setSelectedCollection(null) }}
          >
            📚 Colecciones
          </button>
          <button 
            className={view === 'answers' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => { setView('answers'); loadSessions() }}
          >
            ✍️ Respuestas Estudiantes
          </button>
          <button 
            className={view === 'stats' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('stats')}
          >
            📊 Estadísticas
          </button>
        </div>

        <div className="panel-content">
          {view === 'list' && (
            <>
              <div className="panel-toolbar">
                <div className="filters">
                  <input
                    type="text"
                    placeholder="🔍 Buscar por título..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="search-input"
                  />
                  <select 
                    value={filter.theme} 
                    onChange={(e) => setFilter({ ...filter, theme: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">Todos los temas</option>
                    {themes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select 
                    value={filter.difficulty} 
                    onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">Todas las dificultades</option>
                    {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="export-buttons">
                  <button className="btn-export" onClick={exportToJSON}>📥 JSON</button>
                  <button className="btn-export" onClick={exportToCSV}>📥 CSV</button>
                  <button className="btn-export btn-export-pdf" onClick={exportToPDF}>📄 PDF Resumen</button>
                  <button className="btn-export btn-export-pdf" onClick={exportDetailedPDF}>📄 PDF Detallado</button>
                </div>
              </div>

              {loading ? (
                <div className="loading-panel">Cargando casos...</div>
              ) : (
                <div className="cases-table-container">
                  <table className="cases-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Título</th>
                        <th>Tema</th>
                        <th>Dificultad</th>
                        <th>Rating</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCases.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                            No hay casos que coincidan con los filtros
                          </td>
                        </tr>
                      ) : (
                        filteredCases.map(c => (
                          <tr key={c.id}>
                            <td>{c.id}</td>
                            <td className="case-title-cell">{c.title || c.case_id}</td>
                            <td><span className="badge-small badge-theme">{c.theme}</span></td>
                            <td><span className="badge-small badge-difficulty">{c.difficulty}</span></td>
                            <td>
                              <span className="rating">{'⭐'.repeat(c.rating || 0)}</span>
                            </td>
                            <td className="date-cell">
                              {c.created_at ? new Date(c.created_at).toLocaleDateString('es-CL') : '-'}
                            </td>
                            <td className="actions-cell">
                              <button 
                                className="btn-action btn-edit"
                                onClick={() => startEdit(c)}
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-action btn-delete"
                                onClick={() => handleDelete(c.id)}
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {view === 'edit' && selectedCase && (
            <div className="edit-form">
              <h3>Editar Caso #{selectedCase.id}</h3>
              
              <div className="form-group">
                <label className="form-label">Título</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.payload.title || ''}
                  onChange={(e) => handleEditChange('payload.title', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={editForm.payload.text || editForm.payload.description || ''}
                  onChange={(e) => handleEditChange('payload.text', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tema</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.payload.eje || editForm.payload.theme || ''}
                    onChange={(e) => handleEditChange('payload.eje', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dificultad</label>
                  <select
                    className="form-select"
                    value={editForm.payload.nivel || editForm.payload.difficulty || ''}
                    onChange={(e) => handleEditChange('payload.nivel', e.target.value)}
                  >
                    <option value="basico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select
                    className="form-select"
                    value={editForm.rating}
                    onChange={(e) => handleEditChange('rating', parseInt(e.target.value))}
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{'⭐'.repeat(n) || 'Sin rating'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas del Docente</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Añade notas o comentarios sobre este caso..."
                  value={editForm.notes || ''}
                  onChange={(e) => handleEditChange('notes', e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => { setView('list'); setIsEditing(false) }}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={saveEdit}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {view === 'stats' && statistics && (
            <div className="statistics-view">
              <h3>📊 Estadísticas Generales</h3>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{statistics.total_cases}</div>
                  <div className="stat-label">Casos Totales</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.recent_cases}</div>
                  <div className="stat-label">Últimos 7 días</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.average_rating}⭐</div>
                  <div className="stat-label">Rating Promedio</div>
                </div>
              </div>

              <div className="stats-section">
                <h4>Por Tema</h4>
                <div className="stats-list">
                  {Object.entries(statistics.by_theme || {}).map(([theme, count]) => (
                    <div key={theme} className="stat-item">
                      <span className="stat-item-label">{theme}</span>
                      <span className="stat-item-bar" style={{ width: `${(count / statistics.total_cases) * 100}%` }}></span>
                      <span className="stat-item-value">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stats-section">
                <h4>Por Dificultad</h4>
                <div className="stats-list">
                  {Object.entries(statistics.by_difficulty || {}).map(([diff, count]) => (
                    <div key={diff} className="stat-item">
                      <span className="stat-item-label">{diff}</span>
                      <span className="stat-item-bar stat-bar-difficulty" style={{ width: `${(count / statistics.total_cases) * 100}%` }}></span>
                      <span className="stat-item-value">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'answers' && (
            <div className="answers-view">
              <h3>✍️ Respuestas de Estudiantes</h3>
              
              <div className="filters" style={{ marginBottom: '1.5rem' }}>
                <select
                  value={answerFilters.student_id}
                  onChange={(e) => setAnswerFilters(prev => ({ ...prev, student_id: e.target.value }))}
                  style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                >
                  <option value="">Todos los estudiantes</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.username}</option>
                  ))}
                </select>

                <select
                  value={answerFilters.case_id}
                  onChange={(e) => setAnswerFilters(prev => ({ ...prev, case_id: e.target.value }))}
                  style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                >
                  <option value="">Todos los casos</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title?.substring(0, 50) || `Caso ${c.id}`}
                    </option>
                  ))}
                </select>

                <button 
                  onClick={loadSessions}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  🔍 Buscar
                </button>
              </div>

              {selectedSession ? (
                <div className="session-details">
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>
                      Sesión de {selectedSession.student_name} - {selectedSession.case_title}
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => exportSessionDetailPDF(selectedSession, sessionAnswers)}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        📄 Exportar PDF
                      </button>
                      <button 
                        onClick={() => { setSelectedSession(null); setSessionAnswers([]) }}
                        className="btn-secondary"
                      >
                        ← Volver a lista
                      </button>
                    </div>
                  </div>

                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    marginBottom: '1rem'
                  }}>
                    <p><strong>Estudiante:</strong> {selectedSession.student_name || `Estudiante ${selectedSession.student_id}`}</p>
                    <p><strong>Caso:</strong> {selectedSession.case_title || `Caso ${selectedSession.case_id}`}</p>
                    <p><strong>Fecha:</strong> {new Date(selectedSession.submitted_at).toLocaleString('es-CL')}</p>
                    <p><strong>Total de respuestas:</strong> {sessionAnswers.length}</p>
                  </div>

                  {sessionAnswers.map((answer, idx) => (
                    <div key={answer.id} style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      backgroundColor: 'white'
                    }}>
                      <h5>Pregunta {idx + 1}</h5>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {answer.question_text}
                      </p>

                      {answer.answer_type === 'multiple_choice' ? (
                        <>
                          <p>
                            <strong>Respuesta:</strong> {answer.student_answer || 'Sin responder'}
                            {answer.is_correct !== null && (
                              <span style={{ 
                                marginLeft: '0.5rem',
                                color: answer.is_correct ? 'green' : 'red',
                                fontWeight: 'bold'
                              }}>
                                {answer.is_correct ? '✓ Correcta' : '✗ Incorrecta'}
                              </span>
                            )}
                          </p>
                          {!answer.is_correct && answer.correct_answer && (
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>
                              <strong>Respuesta correcta:</strong> {answer.correct_answer}
                            </p>
                          )}
                        </>
                      ) : (
                        <div style={{ 
                          padding: '0.75rem',
                          backgroundColor: '#f9f9f9',
                          borderRadius: '4px',
                          marginTop: '0.5rem'
                        }}>
                          <strong>Respuesta abierta:</strong>
                          <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                            {answer.student_answer || 'Sin responder'}
                          </p>
                        </div>
                      )}

                      <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          Feedback del docente:
                        </label>
                        <textarea
                          defaultValue={answer.feedback || ''}
                          placeholder="Escribe retroalimentación aquí..."
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            marginBottom: '0.5rem'
                          }}
                          id={`feedback-${answer.id}`}
                        />

                        <button
                          onClick={() => {
                            const feedback = document.getElementById(`feedback-${answer.id}`).value
                            updateAnswerFeedback(answer.id, feedback, null)
                          }}
                          className="btn-primary"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          💾 Guardar Feedback
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {sessions.length > 0 && (
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={exportSessionsCSV}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        📊 Exportar CSV
                      </button>
                      <button 
                        onClick={exportSessionsPDF}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        📄 Exportar PDF
                      </button>
                    </div>
                  )}
                  
                  <div className="cases-table-container">
                    <table className="cases-table">
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>Caso</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                      {sessions.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                            No se encontraron sesiones. Usa los filtros y presiona Buscar.
                          </td>
                        </tr>
                      ) : (
                        sessions.map(session => (
                          <tr key={session.id}>
                            <td>{session.student_name || `Estudiante ${session.student_id}`}</td>
                            <td>{session.case_title?.substring(0, 60) || `Caso ${session.case_id}`}</td>
                            <td>{new Date(session.submitted_at).toLocaleDateString('es-CL')}</td>
                            <td>
                              <button
                                onClick={() => loadSessionAnswers(session.id)}
                                className="btn-view"
                              >
                                👁️ Ver Respuestas
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          )}

          {view === 'collections' && !selectedCollection && (
            <div className="collections-view">
              <div className="collections-header">
                <h3>📚 Gestión de Colecciones</h3>
                <button 
                  className="btn-primary"
                  onClick={() => setShowNewCollectionForm(!showNewCollectionForm)}
                >
                  {showNewCollectionForm ? '❌ Cancelar' : '➕ Nueva Colección'}
                </button>
              </div>

              {showNewCollectionForm && (
                <div className="new-collection-form">
                  <div className="form-group">
                    <label className="form-label">Nombre de la Colección</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Ej: Casos para Semana 1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción (opcional)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={newCollectionDesc}
                      onChange={(e) => setNewCollectionDesc(e.target.value)}
                      placeholder="Describe el propósito de esta colección..."
                    />
                  </div>
                  <button className="btn-primary" onClick={createCollection}>
                    Crear Colección
                  </button>
                </div>
              )}

              <div className="collections-grid">
                {collections.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay colecciones creadas aún.</p>
                    <p>Crea una colección para organizar tus casos.</p>
                  </div>
                ) : (
                  collections.map(col => (
                    <div key={col.id} className="collection-card">
                      <div className="collection-card-header">
                        <h4>{col.name}</h4>
                        <span className="collection-badge">{col.case_count} casos</span>
                      </div>
                      {col.description && (
                        <p className="collection-description">{col.description}</p>
                      )}
                      <div className="collection-date">
                        Creada: {new Date(col.created_at).toLocaleDateString('es-CL')}
                      </div>
                      <div className="collection-actions">
                        <button 
                          className="btn-secondary"
                          onClick={() => viewCollection(col.id)}
                        >
                          Ver Casos
                        </button>
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => deleteCollection(col.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'collections' && selectedCollection && (
            <div className="collection-detail">
              <div className="collection-detail-header">
                <button 
                  className="btn-back"
                  onClick={() => setSelectedCollection(null)}
                >
                  ← Volver a Colecciones
                </button>
                <h3>📚 {selectedCollection.name}</h3>
              </div>

              {selectedCollection.description && (
                <p className="collection-description-detail">{selectedCollection.description}</p>
              )}

              <div className="add-case-section">
                <h4>Agregar Caso a esta Colección</h4>
                <select 
                  className="form-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      addCaseToCollection(selectedCollection.id, parseInt(e.target.value))
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">Selecciona un caso...</option>
                  {cases
                    .filter(c => !selectedCollection.cases.find(sc => sc.id === c.id))
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        #{c.id} - {c.title || c.case_id}
                      </option>
                    ))}
                </select>
              </div>

              <h4 style={{ marginTop: '24px' }}>Casos en esta Colección ({selectedCollection.cases.length})</h4>
              
              {selectedCollection.cases.length === 0 ? (
                <div className="empty-state">
                  <p>Esta colección no tiene casos aún.</p>
                  <p>Agrega casos usando el selector de arriba.</p>
                </div>
              ) : (
                <div className="cases-table-container">
                  <table className="cases-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Título</th>
                        <th>Tema</th>
                        <th>Dificultad</th>
                        <th>Rating</th>
                        <th>Agregado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCollection.cases.map(c => (
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td className="case-title-cell">{c.title || c.case_id}</td>
                          <td><span className="badge-small badge-theme">{c.theme}</span></td>
                          <td><span className="badge-small badge-difficulty">{c.difficulty}</span></td>
                          <td><span className="rating">{'⭐'.repeat(c.rating || 0)}</span></td>
                          <td className="date-cell">
                            {c.added_to_collection_at ? new Date(c.added_to_collection_at).toLocaleDateString('es-CL') : '-'}
                          </td>
                          <td>
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => removeCaseFromCollection(selectedCollection.id, c.id)}
                              title="Quitar de colección"
                            >
                              ✖️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
