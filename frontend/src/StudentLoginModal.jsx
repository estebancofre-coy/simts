import { useState, useEffect } from 'react'
import { getApiBaseUrl, apiPost } from './utils/api'
import { secureStorage, sanitizeInput, validateUsername, sessionManager } from './utils/auth'

// Validate API URL at startup
let API_BASE;
try {
  API_BASE = getApiBaseUrl();
} catch (error) {
  // Use fallback for development/compatibility
  API_BASE = import.meta.env.VITE_API_URL || 'https://simts.onrender.com';
  if (import.meta.env.MODE !== 'production') {
    console.warn('Using fallback API URL');
  }
}

export default function StudentLoginModal({ onLogin, onCancel }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const existingToken = secureStorage.get('studentToken');
    const existingData = secureStorage.get('studentData');
    
    if (existingToken && existingData) {
      // Auto-login if session exists
      sessionManager.start();
      onLogin(existingData);
    }
  }, [onLogin]);

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    
    // Validate inputs
    const cleanUsername = sanitizeInput(username.trim());
    if (!validateUsername(cleanUsername)) {
      setError('Formato de usuario inválido.');
      return;
    }
    
    if (password.length < 4) {
      setError('Contraseña inválida.');
      return;
    }

    setLoading(true)

    try {
      const data = await apiPost(
        `${API_BASE}/api/auth/login`,
        { username: cleanUsername, password },
        { timeout: 10000 } // 10 second timeout for login
      );

      if (!data.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      // Use secure storage for sensitive data
      secureStorage.set('studentAuth', true);
      secureStorage.set('studentData', data.student);
      secureStorage.set('studentToken', data.token);
      
      // Start session monitoring
      sessionManager.start();

      onLogin(data.student)
    } catch (err) {
      // Handle specific error cases
      if (err.status === 429) {
        setError('Demasiados intentos de inicio de sesión. Por favor, espera un momento.');
      } else if (err.status === 503) {
        setError('El servicio no está disponible temporalmente. Intenta nuevamente más tarde.');
      } else if (err.message.includes('timeout')) {
        setError('La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente.');
      } else {
        setError(err.message || 'Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>Iniciar Sesión - Estudiante</h2>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Usuario:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="estudiante1"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Contraseña:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="pass"
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#4CAF50',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Iniciando...' : 'Ingresar'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          backgroundColor: '#f0f7ff',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <strong>Cuenta de prueba:</strong><br />
          Usuario: <code>estudiante1</code><br />
          Contraseña: <code>pass</code>
        </div>
      </div>
    </div>
  )
}
