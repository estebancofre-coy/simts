import { useState } from 'react'

export default function LoginModal({ onLogin, onCancel }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    
    // Credenciales fijas
    if (username === 'academicxs' && password === 'simulador') {
      onLogin()
    } else {
      setError('❌ Usuario o contraseña incorrectos')
      setPassword('')
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h2>🎓 Acceso Docentes</h2>
          <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <div className="login-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Ingresar
            </button>
          </div>
        </form>

        <div className="login-hint">
          <small>💡 Acceso exclusivo para docentes</small>
        </div>
      </div>
    </div>
  )
}
