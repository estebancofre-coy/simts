import { jsPDF } from 'jspdf'

export const CASE_LENGTHS = [
  { value: 'corto', label: 'Corto (300-500 palabras)' },
  { value: 'medio', label: 'Medio (600-900 palabras)' },
  { value: 'extenso', label: 'Extenso (temporalmente no disponible)', disabled: true }
]

export function getStudentQuestions(caseData) {
  const questions = []
  const seen = new Set()
  for (const item of [...(caseData?.questions || []), ...(caseData?.suggested_questions || [])]) {
    const text = typeof item === 'string' ? item : item?.question || item?.text
    if (typeof text !== 'string' || !text.trim()) continue
    const question = text.trim()
    if (seen.has(question)) continue
    seen.add(question)
    questions.push({ question })
  }
  return questions
}

export function formatWorksheetText(caseData, answers = {}) {
  const lines = [
    `CASO: ${caseData.title || caseData.case_id || 'Caso generado'}`,
    `Eje: ${caseData.eje || 'No especificado'} | Nivel: ${caseData.nivel || 'No especificado'}`,
    '',
  ]
  if (caseData.meta) lines.push('FICHA', caseData.meta, '')
  lines.push('RELATO', (caseData.description || caseData.text || '').replace(/\\n/g, '\n'), '')
  const objectives = caseData.learning_objectives || caseData.checklist || []
  if (objectives.length) {
    lines.push('OBJETIVOS DE APRENDIZAJE', ...objectives.map((text, i) => `${i + 1}. ${text}`), '')
  }
  lines.push('PREGUNTAS Y MIS RESPUESTAS')
  getStudentQuestions(caseData).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.question}`, `Respuesta: ${answers[index]?.trim() || 'Sin responder'}`, '')
  })
  lines.push('Trabajo estudiantil. Las dudas se abordan con el docente.')
  return lines.join('\n')
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function formatWorksheetHtml(caseData, answers = {}) {
  const title = escapeHtml(caseData.title || caseData.case_id || 'Caso generado')
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #182536; line-height: 1.6; }
    h1 { font-size: 24px; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; }
    @page { size: A4; margin: 20mm; }
    @media print { body { margin: 0; } h1 { break-after: avoid; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <pre>${escapeHtml(formatWorksheetText(caseData, answers))}</pre>
</body>
</html>`
}

export function createWorksheetPdf(caseData, answers = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 20
  const lineHeight = 6
  const pageHeight = doc.internal.pageSize.getHeight()
  const width = doc.internal.pageSize.getWidth() - margin * 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  let y = margin
  for (const paragraph of formatWorksheetText(caseData, answers).split('\n')) {
    const lines = paragraph ? doc.splitTextToSize(paragraph, width) : ['']
    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    }
  }
  const totalPages = doc.getNumberOfPages()
  doc.setFontSize(9)
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page)
    doc.text(`Pagina ${page} de ${totalPages}`, margin, pageHeight - 10)
  }
  return doc
}
