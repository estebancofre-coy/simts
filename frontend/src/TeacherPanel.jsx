import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function TeacherPanel({ onClose }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState(null)
  const [selectedCase, setSelectedCase] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [filter, setFilter] = useState({ theme: '', difficulty: '', search: '' })
  const [view, setView] = useState('list') // 'list' | 'edit' | 'stats'

  useEffect(() => {
    loadCases()
    loadStatistics()
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

  return (
    <div className="teacher-panel-overlay">
      <div className="teacher-panel">
        <div className="panel-header">
          <div>
            <h2>🎓 Panel de Docentes</h2>
            <p className="panel-subtitle">Gestión y administración de casos</p>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="panel-nav">
          <button 
            className={view === 'list' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('list')}
          >
            📋 Lista de Casos
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
        </div>
      </div>
    </div>
  )
}
