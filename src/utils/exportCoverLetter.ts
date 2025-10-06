import { jsPDF } from 'jspdf'

export type ExportableCoverLetter = {
  name?: string
  job_title?: string
  company_name?: string
  content?: string
  closing?: string
}

export function exportCoverLetterPDF({
  letter,
  userName,
  userEmail,
}: {
  letter: ExportableCoverLetter
  userName?: string
  userEmail?: string
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - margin * 2
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = margin

  const moveY = (amount: number) => {
    y += amount
    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(userName || 'Your Name', margin, y)
  moveY(6)
  if (userEmail) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(String(userEmail), margin, y)
    moveY(6)
  }

  // Divider
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  moveY(8)

  // Body
  const heading = `${letter.company_name ? `${letter.company_name} - ` : ''}${letter.job_title || ''}`.trim()
  if (heading) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(heading, margin, y)
    moveY(6)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const body = (letter.content || '').trim()
  const lines = doc.splitTextToSize(body || ' ', usableWidth) as string[]
  lines.forEach(line => {
    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += 5
  })
  moveY(4)

  const closing = (letter.closing || 'Sincerely,') + (userName ? `\n${userName}` : '')
  const closingLines = doc.splitTextToSize(closing, usableWidth) as string[]
  closingLines.forEach(line => {
    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += 5
  })

  const fileName = `${(letter.name || 'cover_letter').replace(/\s+/g, '_')}.pdf`
  doc.save(fileName)
}
