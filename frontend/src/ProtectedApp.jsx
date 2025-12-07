import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import App from './App'
import StudentLoginModal from './StudentLoginModal'
import LoginModal from './LoginModal'

export default function ProtectedApp() {
  const navigate = useNavigate()
  const [isStudentAuthenticated, setIsStudentAuthenticated] = useState(
    localStorage.getItem('studentAuth') === 'true'
  )
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(
    localStorage.getItem('teacherAuth') === 'true'
  )
  const [showStudentLogin, setShowStudentLogin] = useState(false)
  const [showTeacherLogin, setShowTeacherLogin] = useState(false)
  const [studentData, setStudentData] = useState(() => {
    const saved = localStorage.getItem('studentData')
    return saved ? JSON.parse(saved) : null
  })
  const [userType, setUserType] = useState(null) // 'student', 'teacher', or null

  useEffect(() => {
    // If not authenticated, show selection dialog
    if (!isStudentAuthenticated && !isTeacherAuthenticated) {
      // Show the dialog
    }
  }, [])

  const handleStudentLoginSuccess = (data) => {
    setStudentData(data)
    localStorage.setItem('studentAuth', 'true')
    localStorage.setItem('studentData', JSON.stringify(data))
    setIsStudentAuthenticated(true)
    setUserType('student')
    setShowStudentLogin(false)
  }

  const handleTeacherLoginSuccess = () => {
    localStorage.setItem('teacherAuth', 'true')
    setIsTeacherAuthenticated(true)
    setUserType('teacher')
    setShowTeacherLogin(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('studentAuth')
    localStorage.removeItem('studentData')
    localStorage.removeItem('teacherAuth')
    setIsStudentAuthenticated(false)
    setIsTeacherAuthenticated(false)
    setStudentData(null)
    setUserType(null)
    navigate('/')
  }

  // If no authentication, show login selection
  if (!isStudentAuthenticated && !isTeacherAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        gap: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ color: '#003d6b', marginBottom: '0.5rem' }}>SimTS</h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Selecciona tu tipo de acceso</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '800px',
          width: '90%'
        }}>
          {/* Acceso Estudiante */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              👨‍🎓
            </div>
            <h2 style={{ color: '#003d6b', marginBottom: '1rem' }}>Estudiante</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Accede a los casos de simulación y resuelve preguntas de evaluación
            </p>
            <button
              onClick={() => setShowStudentLogin(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#005a9e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                width: '100%',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#003d6b'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#005a9e'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Ingresar como Estudiante
            </button>
          </div>

          {/* Acceso Docente */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              👨‍🏫
            </div>
            <h2 style={{ color: '#003d6b', marginBottom: '1rem' }}>Docente</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Revisa respuestas de estudiantes y genera reportes de desempeño
            </p>
            <button
              onClick={() => setShowTeacherLogin(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#005a9e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                width: '100%',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#003d6b'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#005a9e'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Ingresar como Docente
            </button>
          </div>
        </div>

        {/* Botón de Retorno */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '2rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#003d6b',
            border: '2px solid #003d6b',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#003d6b'
            e.target.style.color = 'white'
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent'
            e.target.style.color = '#003d6b'
          }}
        >
          ← Volver al inicio
        </button>

        {/* Login Modals */}
        {showStudentLogin && (
          <StudentLoginModal
            onClose={() => setShowStudentLogin(false)}
            onLogin={handleStudentLoginSuccess}
          />
        )}

        {showTeacherLogin && (
          <LoginModal
            onClose={() => setShowTeacherLogin(false)}
            onLogin={handleTeacherLoginSuccess}
          />
        )}
      </div>
    )
  }

  // If authenticated, show the main app
  return <App onLogout={handleLogout} />
}
