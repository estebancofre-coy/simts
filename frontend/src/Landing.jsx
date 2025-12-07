import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(null)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header/Navigation */}
      <header style={{
        backgroundColor: '#003d6b',
        color: 'white',
        padding: '1rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            📚 SimTS
          </div>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <a href="#inicio" style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}>Inicio</a>
            <a href="#utilidad" style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}>Utilidad</a>
            <a href="#guia" style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}>Guía</a>
            <a href="#tecnologia" style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}>Tecnología</a>
            <a href="#contacto" style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}>Contacto</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" style={{
        background: 'linear-gradient(135deg, #003d6b 0%, #005a9e 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <img 
            src="https://zlq2y2bbczxjflne.public.blob.vercel-storage.com/Logos%20Carreras.png"
            alt="Logo Trabajo Social"
            style={{ height: '120px', marginBottom: '2rem' }}
          />
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            SimTS - Simulador de Casos de Trabajo Social
          </h1>
          <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.95 }}>
            Plataforma de aprendizaje interactivo basada en IA para estudiantes y docentes de Trabajo Social
          </p>
          <p style={{ fontSize: '1rem', marginBottom: '3rem', opacity: 0.85 }}>
            Genera casos reales, resuelve dilemas éticos y recibe retroalimentación profesional
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/app')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#45a049'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 8px rgba(0,0,0,0.3)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#4CAF50'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)'
              }}
            >
              👨‍🎓 Acceso Estudiantes
            </button>
            <button
              onClick={() => navigate('/app')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                backgroundColor: '#005a9e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#003d6b'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 8px rgba(0,0,0,0.3)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#005a9e'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)'
              }}
            >
              👨‍🏫 Acceso Académicos
            </button>
          </div>
        </div>
      </section>

      {/* Utilidad Section */}
      <section id="utilidad" style={{
        padding: '4rem 2rem',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center', color: '#003d6b' }}>
            ¿Por Qué SimTS?
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              {
                icon: '🎯',
                title: 'Aprendizaje Práctico',
                desc: 'Casos reales y contextalizados de la Región de Aysén que simulan situaciones que enfrentarás como profesional'
              },
              {
                icon: '🤖',
                title: 'Generación Inteligente',
                desc: 'Casos generados por IA que se adaptan a tu nivel de dificultad y areas de interés'
              },
              {
                icon: '📊',
                title: 'Retroalimentación Inmediata',
                desc: 'Recibe calificaciones automáticas en respuestas de opción múltiple y comentarios de docentes en respuestas abiertas'
              },
              {
                icon: '📈',
                title: 'Seguimiento de Progreso',
                desc: 'Docentes pueden rastrear tu evolución y brindarte apoyo personalizado'
              },
              {
                icon: '🔐',
                title: 'Entorno Seguro',
                desc: 'Practica y comete errores sin consecuencias en un ambiente de aprendizaje seguro'
              },
              {
                icon: '💼',
                title: 'Preparación Profesional',
                desc: 'Desarrolla habilidades críticas para intervención social comunitaria y familiar'
              }
            ].map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ marginBottom: '0.5rem', color: '#003d6b' }}>{item.title}</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guía Section */}
      <section id="guia" style={{
        padding: '4rem 2rem',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center', color: '#003d6b' }}>
            Guía de Uso
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Estudiantes */}
            <div style={{
              backgroundColor: '#f0f7ff',
              padding: '2rem',
              borderRadius: '8px',
              border: '2px solid #4CAF50'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#003d6b' }}>
                👨‍🎓 Para Estudiantes
              </h3>
              <ol style={{ lineHeight: '2' }}>
                <li><strong>Inicia sesión</strong> con tus credenciales (usuario/contraseña proporcionados por tu docente)</li>
                <li><strong>Selecciona parámetros:</strong> temática, dificultad, contexto y duración del caso</li>
                <li><strong>Lee el caso</strong> cuidadosamente y analiza la situación</li>
                <li><strong>Responde las preguntas:</strong> opción múltiple (calificadas automáticamente) y abiertas (calificadas por docentes)</li>
                <li><strong>Envía tus respuestas</strong> cuando estés listo</li>
                <li><strong>Recibe retroalimentación</strong> inmediata y comentarios del docente</li>
                <li><strong>Revisa tu historial</strong> de casos resueltos y tu progreso</li>
              </ol>
            </div>

            {/* Académicos */}
            <div style={{
              backgroundColor: '#fff0f7',
              padding: '2rem',
              borderRadius: '8px',
              border: '2px solid #005a9e'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#003d6b' }}>
                👨‍🏫 Para Académicos/Docentes
              </h3>
              <ol style={{ lineHeight: '2' }}>
                <li><strong>Accede al panel docente</strong> con credenciales especiales</li>
                <li><strong>Visualiza todas las sesiones</strong> de estudiantes filtradas por alumno o caso</li>
                <li><strong>Revisa respuestas</strong> de opción múltiple (con respuesta correcta indicada)</li>
                <li><strong>Lee respuestas abiertas</strong> de los estudiantes</li>
                <li><strong>Proporciona retroalimentación:</strong> comentarios constructivos y puntaje (0-100)</li>
                <li><strong>Exporta datos</strong> en CSV para análisis longitudinal</li>
                <li><strong>Genera reportes PDF</strong> con desempeño individual o grupal</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Tecnología Section */}
      <section id="tecnologia" style={{
        padding: '4rem 2rem',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center', color: '#003d6b' }}>
            Tecnología & Infraestructura
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[
              {
                category: '🚀 Backend',
                items: ['Python 3.12', 'FastAPI', 'SQLite', 'OpenAI API (Casos IA)', 'RESTful Architecture']
              },
              {
                category: '⚛️ Frontend',
                items: ['React 18', 'Vite', 'Modern JavaScript', 'Responsive Design', 'PDF/CSV Export']
              },
              {
                category: '☁️ Deployment',
                items: ['Vercel (Frontend)', 'Render (Backend)', 'GitHub Actions', 'CI/CD Automation', 'Cloud Database']
              },
              {
                category: '🔒 Seguridad',
                items: ['Autenticación básica', 'Almacenamiento seguro', 'CORS Protection', 'Data validation', 'Privacy GDPR']
              }
            ].map((section, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#003d6b' }}>{section.category}</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{ 
                      marginBottom: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '4px',
                      color: '#666'
                    }}>
                      ✓ {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#003d6b' }}>🎨 Características Técnicas</h3>
            <ul style={{ lineHeight: '1.8', color: '#666' }}>
              <li><strong>Generación de Casos:</strong> Basada en OpenAI Prompt API con parámetros contextualizados para la Región de Aysén</li>
              <li><strong>Base de Datos:</strong> SQLite con tablas para estudiantes, casos, sesiones y respuestas</li>
              <li><strong>Autenticación:</strong> Sistema seguro de login por estudiante y docente</li>
              <li><strong>Exportación:</strong> CSV para análisis estadístico y PDF para reportes profesionales</li>
              <li><strong>Responsivo:</strong> Funciona en desktop, tablet y dispositivos móviles</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contacto Section */}
      <section id="contacto" style={{
        padding: '4rem 2rem',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center', color: '#003d6b' }}>
            Contacto & Soporte
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '2rem' }}>
            {/* Formulario */}
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#003d6b' }}>Envíanos un Mensaje</h3>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                <select
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option>Selecciona asunto...</option>
                  <option>Soporte técnico</option>
                  <option>Duda sobre el simulador</option>
                  <option>Retroalimentación</option>
                  <option>Otro</option>
                </select>
                <textarea
                  placeholder="Tu mensaje..."
                  rows={5}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontFamily: 'Arial, sans-serif'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#003d6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#005a9e'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#003d6b'
                  }}
                >
                  Enviar Mensaje
                </button>
              </form>
            </div>

            {/* Información de Contacto */}
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#003d6b' }}>Información de Contacto</h3>
              
              <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ marginBottom: '0.5rem', color: '#003d6b' }}>📧 Email</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  <a href="mailto:esteban.cofre@uaysen.cl" style={{ color: '#005a9e', textDecoration: 'none' }}>
                    esteban.cofre@uaysen.cl
                  </a>
                </p>
              </div>

              <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ marginBottom: '0.5rem', color: '#003d6b' }}>📞 Teléfono</h4>
                <p style={{ margin: 0, color: '#666' }}>+56 9 3933 2051</p>
              </div>

              <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ marginBottom: '0.5rem', color: '#003d6b' }}>📍 Ubicación</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  Bilbao 449<br/>
                  Coyhaique, Región de Aysén
                </p>
              </div>

              <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1.5rem', 
                borderRadius: '8px'
              }}>
                <h4 style={{ marginBottom: '0.5rem', color: '#003d6b' }}>🕒 Horario</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  Lunes a Viernes<br/>
                  09:00 - 17:00 hrs<br/>
                  <em style={{ fontSize: '0.9rem' }}>Hora de Chile (CLT)</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#003d6b',
        color: 'white',
        padding: '2rem',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>SimTS</h4>
              <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                Simulador de Casos de Trabajo Social para formación académica de calidad
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Enlaces Rápidos</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><a href="#" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Inicio</a></li>
                <li><a href="#utilidad" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Utilidad</a></li>
                <li><a href="#guia" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Guía</a></li>
                <li><a href="#tecnologia" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Tecnología</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Sitios de Interés</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><a href="https://uaysen.cl" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Universidad de Aysén</a></li>
                <li><a href="https://uaysen.cl/departamentos" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Departamentos</a></li>
                <li><a href="https://estudiantes.uaysen.cl" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Portal Estudiantes</a></li>
              </ul>
            </div>
          </div>

          <div style={{ 
            textAlign: 'center',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: '0.9rem'
          }}>
            <p style={{ margin: '0.5rem 0' }}>
              © 2025 Universidad de Aysén - Departamento de Trabajo Social
            </p>
            <p style={{ margin: '0.5rem 0', opacity: 0.8 }}>
              Esta aplicación fue desarrollada por el Departamento de Trabajo Social de la Universidad de Aysén
            </p>
            <p style={{ margin: '0.5rem 0', opacity: 0.7, fontSize: '0.85rem' }}>
              Todos los derechos reservados. 
              <a href="https://www.portaltransparencia.cl" target="_blank" rel="noopener noreferrer" style={{ color: 'white', marginLeft: '0.5rem' }}>
                Transparencia
              </a>
            </p>
          </div>

          {/* Redes Sociales */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1.5rem',
            marginTop: '1.5rem',
            fontSize: '1.5rem'
          }}>
            <a href="https://www.facebook.com/udeaysen" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8 }}>📘</a>
            <a href="https://www.instagram.com/universidad_de_aysen/" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8 }}>📷</a>
            <a href="https://www.youtube.com/UniversidaddeAysen" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8 }}>🎥</a>
            <a href="https://x.com/UdeAysen" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.8 }}>𝕏</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
