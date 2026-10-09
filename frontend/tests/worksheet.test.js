import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CASE_LENGTHS, createWorksheetPdf, formatWorksheetHtml, formatWorksheetText, getStudentQuestions } from '../src/worksheet.js'

const caseData = {
  title: 'Caso de estudio',
  description: 'Relato completo\\nSegundo parrafo',
  eje: 'Familia',
  nivel: 'basico',
  meta: 'Ficha del caso',
  learning_objectives: ['Analizar el contexto'],
  questions: [{ question: 'Pregunta principal', justification: 'RESPUESTA_MODELO_SECRETA' }],
  suggested_questions: ['Pregunta principal', 'Pregunta sugerida', { text: 'Otra pregunta' }],
  suggested_interventions: ['INTERVENCION_MODELO_SECRETA'],
}

test('temporarily disables only the extended option', () => {
  assert.equal(CASE_LENGTHS.find(item => item.value === 'extenso').disabled, true)
  assert(CASE_LENGTHS.filter(item => item.value !== 'extenso').every(item => !item.disabled))
})

test('includes suggested questions once without model answers', () => {
  assert.deepEqual(getStudentQuestions(caseData), [
    { question: 'Pregunta principal' }, { question: 'Pregunta sugerida' }, { question: 'Otra pregunta' },
  ])
  assert.deepEqual(getStudentQuestions({ suggested_questions: ['Pregunta sin evaluacion'] }), [
    { question: 'Pregunta sin evaluacion' },
  ])
})

test('text and HTML include student answers and exclude automatic guidance', () => {
  const answers = { 0: 'Mi analisis', 1: '<script>alert("respuesta")</script>\nSegunda linea' }
  const text = formatWorksheetText(caseData, answers)
  const html = formatWorksheetHtml(caseData, answers)
  for (const output of [text, html]) {
    assert(output.includes('Mi analisis'))
    assert(output.includes('Pregunta sugerida'))
    assert(output.includes('Sin responder'))
    assert(output.includes('Segundo parrafo'))
    assert(!output.includes('RESPUESTA_MODELO_SECRETA'))
    assert(!output.includes('INTERVENCION_MODELO_SECRETA'))
  }
  assert(!html.includes('<script>'))
  assert(html.includes('&lt;script&gt;'))
  assert(html.includes('@media print'))
})

test('PDF includes the case, all questions and answers across multiple pages', () => {
  const answer = Array.from({ length: 700 }, (_, i) => `analisis${i}`).join(' ')
  const doc = createWorksheetPdf(caseData, { 0: answer, 1: 'Respuesta sugerida final' })
  const pdf = doc.output()
  assert(pdf.startsWith('%PDF-'))
  assert(doc.getNumberOfPages() > 1)
  for (const content of ['Caso de estudio', 'Relato completo', 'Pregunta principal',
    'Pregunta sugerida', 'Respuesta sugerida final', 'analisis0', 'analisis699', 'Sin responder']) {
    assert(pdf.includes(content), content)
  }
  assert(!pdf.includes('RESPUESTA_MODELO_SECRETA'))
  assert(!pdf.includes('INTERVENCION_MODELO_SECRETA'))
})
