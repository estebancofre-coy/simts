import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(null)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header/Navigation */}
      <header style={{
        backgroundColor: 'white',
        color: '#003d6b',
        padding: '1rem 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src="https://zlq2y2bbczxjflne.public.blob.vercel-storage.com/Logos%20Carreras.png"
              alt="Logo Trabajo Social Universidad de Aysén"
              style={{ height: '50px' }}
            />
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#003d6b', lineHeight: '1.2' }}>
                SimTS
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>
                Universidad de Aysén
              </div>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            <a href="#inicio" style={{ color: '#003d6b', textDecoration: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' }}>Inicio</a>
            <a href="#beneficios" style={{ color: '#003d6b', textDecoration: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' }}>Beneficios</a>
            <a href="#workflow" style={{ color: '#003d6b', textDecoration: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' }}>¿Cómo funciona?</a>
            <a href="#contacto" style={{ color: '#003d6b', textDecoration: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' }}>Contacto</a>
            <button
              onClick={() => navigate('/app')}
              style={{
                padding: '0.6rem 1.5rem',
                backgroundColor: '#005a9e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#003d6b'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#005a9e'
              }}
            >
              Iniciar Sesión
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section - Clean & Professional */}
      <section id="inicio" style={{
        backgroundColor: '#f8fafb',
        padding: '5rem 2rem 4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            marginBottom: '1.5rem', 
            fontWeight: '700',
            color: '#1a1a1a',
            lineHeight: '1.2',
            letterSpacing: '-0.5px'
          }}>
            Simulador de Casos de Trabajo Social Basado en IA
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem', 
            marginBottom: '3rem',
            color: '#4a5568',
            lineHeight: '1.7',
            maxWidth: '750px',
            margin: '0 auto 3rem auto'
          }}>
            Desarrolla competencias profesionales mediante casos interactivos contextualizados en la Región de Aysén. 
            Aprende con retroalimentación inmediata y seguimiento personalizado.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/app')}
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1rem',
                backgroundColor: '#005a9e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0,90,158,0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#003d6b'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 16px rgba(0,90,158,0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#005a9e'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(0,90,158,0.3)'
              }}
            >
              Comenzar Ahora
            </button>
            <button
              onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1rem',
                backgroundColor: 'white',
                color: '#005a9e',
                border: '2px solid #005a9e',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f0f7ff'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'white'
              }}
            >
              Más Información
            </button>
          </div>
        </div>
      </section>

      {/* Beneficios Section - Simplified */}
      <section id="beneficios" style={{
        padding: '5rem 2rem',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1rem', 
              color: '#1a1a1a',
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}>
              ¿Por Qué Usar SimTS?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#4a5568',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: '1.7'
            }}>
              Una plataforma diseñada para estudiantes y docentes que buscan excelencia en formación profesional
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            {[
              {
                title: 'Casos Contextualizados',
                desc: 'Situaciones reales de la Región de Aysén generadas por IA que reflejan los desafíos únicos del territorio patagónico.',
              },
              {
                title: 'Retroalimentación Inteligente',
                desc: 'Evaluación automática de respuestas y comentarios personalizados de docentes para acelerar tu aprendizaje.',
              },
              {
                title: 'Seguimiento de Progreso',
                desc: 'Panel completo para docentes con métricas de desempeño, exportación de datos y análisis del aprendizaje.',
              }
            ].map((item, idx) => (
              <div key={idx} style={{
                textAlign: 'center',
                padding: '2rem 1.5rem'
              }}>
                <h3 style={{ 
                  marginBottom: '1rem', 
                  color: '#003d6b', 
                  fontSize: '1.4rem', 
                  fontWeight: '700'
                }}>
                  {item.title}
                </h3>
                <p style={{ 
                  color: '#4a5568', 
                  lineHeight: '1.7', 
                  fontSize: '1rem' 
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" style={{
        padding: '5rem 2rem',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1rem', 
              color: '#1a1a1a',
              fontWeight: '700'
            }}>
              ¿Cómo funciona SimTS?
            </h2>
            <p style={{ 
              fontSize: '1.1rem',
              color: '#4a5568',
              lineHeight: '1.7',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Un proceso simple y estructurado para simular casos clínicos interactivos
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {[
              {
                step: '1',
                title: 'Selección del Caso',
                description: 'El estudiante accede y selecciona un caso clínico de la biblioteca disponible',
                color: '#003d6b'
              },
              {
                step: '2',
                title: 'Interacción Guiada',
                description: 'Realiza preguntas al paciente virtual y analiza los síntomas presentados',
                color: '#005a9e'
              },
              {
                step: '3',
                title: 'Toma de Decisiones',
                description: 'Solicita exámenes, interpreta resultados y desarrolla un diagnóstico',
                color: '#0077cc'
              },
              {
                step: '4',
                title: 'Retroalimentación IA',
                description: 'Recibe feedback inteligente sobre tu razonamiento clínico y decisiones',
                color: '#00a0e3'
              }
            ].map((item, index) => (
              <div key={index} style={{
                backgroundColor: '#f8fafb',
                padding: '2rem',
                borderRadius: '12px',
                position: 'relative',
                transition: 'transform 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem'
                }}>
                  {item.step}
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  marginBottom: '0.75rem',
                  color: '#1a1a1a',
                  fontWeight: '600'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#4a5568',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Visual Flow Indicator */}
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f8fafb',
            borderRadius: '12px',
            border: '2px solid #003d6b'
          }}>
            <p style={{
              fontSize: '1.1rem',
              color: '#003d6b',
              fontWeight: '600',
              margin: 0
            }}>
              💡 Resultado: Mejora continua del razonamiento clínico y toma de decisiones basada en evidencia
            </p>
          </div>
        </div>
      </section>

      {/* Contacto Section - Simplified */}
      <section id="contacto" style={{
        padding: '5rem 2rem',
        backgroundColor: '#f8fafb'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem', 
            color: '#1a1a1a',
            fontWeight: '700'
          }}>
            Contáctanos
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '3rem',
            color: '#4a5568',
            lineHeight: '1.7'
          }}>
            ¿Tienes preguntas sobre SimTS? Nuestro equipo está aquí para ayudarte.
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '2rem',
            marginBottom: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📧</div>
              <h4 style={{ marginBottom: '0.5rem', color: '#003d6b', fontWeight: '600' }}>Email</h4>
              <a href="mailto:esteban.cofre@uaysen.cl" style={{ color: '#005a9e', textDecoration: 'none', fontWeight: '500' }}>
                esteban.cofre@uaysen.cl
              </a>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📍</div>
              <h4 style={{ marginBottom: '0.5rem', color: '#003d6b', fontWeight: '600' }}>Ubicación</h4>
              <p style={{ margin: 0, color: '#4a5568' }}>
                Bilbao 449<br/>
                Coyhaique, Región de Aysén
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📞</div>
              <h4 style={{ marginBottom: '0.5rem', color: '#003d6b', fontWeight: '600' }}>Teléfono</h4>
              <p style={{ margin: 0, color: '#4a5568' }}>+56 9 3933 2051</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Simplified */}
      <footer style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '2.5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <img 
              src="https://zlq2y2bbczxjflne.public.blob.vercel-storage.com/Logos%20Carreras.png"
              alt="Logo Universidad de Aysén"
              style={{ height: '40px', marginBottom: '1rem', filter: 'brightness(0) invert(1)' }}
            />
          </div>
          
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1.5rem' }}>
            © 2025 Universidad de Aysén - Departamento de Trabajo Social
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem'
          }}>
            <a href="https://uaysen.cl" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.7, textDecoration: 'none', fontSize: '0.85rem' }}>
              Universidad de Aysén
            </a>
            <a href="#contacto" style={{ color: 'white', opacity: 0.7, textDecoration: 'none', fontSize: '0.85rem' }}>
              Contacto
            </a>
            <a href="https://www.portaltransparencia.cl" target="_blank" rel="noopener noreferrer" style={{ color: 'white', opacity: 0.7, textDecoration: 'none', fontSize: '0.85rem' }}>
              Transparencia
            </a>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem',
            opacity: 0.6
          }}>
            <a href="https://www.facebook.com/udeaysen" target="_blank" rel="noopener noreferrer" style={{ color: 'white', fontSize: '1.2rem', transition: 'opacity 0.3s' }} onMouseOver={(e) => e.target.style.opacity = '1'} onMouseOut={(e) => e.target.style.opacity = '0.6'}>f</a>
            <a href="https://www.instagram.com/universidad_de_aysen/" target="_blank" rel="noopener noreferrer" style={{ color: 'white', fontSize: '1.2rem', transition: 'opacity 0.3s' }} onMouseOver={(e) => e.target.style.opacity = '1'} onMouseOut={(e) => e.target.style.opacity = '0.6'}>ig</a>
            <a href="https://www.youtube.com/UniversidaddeAysen" target="_blank" rel="noopener noreferrer" style={{ color: 'white', fontSize: '1.2rem', transition: 'opacity 0.3s' }} onMouseOver={(e) => e.target.style.opacity = '1'} onMouseOut={(e) => e.target.style.opacity = '0.6'}>yt</a>
            <a href="https://x.com/UdeAysen" target="_blank" rel="noopener noreferrer" style={{ color: 'white', fontSize: '1.2rem', transition: 'opacity 0.3s' }} onMouseOver={(e) => e.target.style.opacity = '1'} onMouseOut={(e) => e.target.style.opacity = '0.6'}>𝕏</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
