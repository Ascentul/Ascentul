'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useToast } from '@/hooks/use-toast'

interface ResumePreviewModalProps {
  open: boolean
  onClose: () => void
  resume: {
    _id: string
    title: string
    content: any
    source?: 'manual' | 'ai_generated' | 'ai_optimized' | 'pdf_upload'
  }
  userName?: string
  userEmail?: string
}

export function ResumePreviewModal({
  open,
  onClose,
  resume,
  userName,
  userEmail,
}: ResumePreviewModalProps) {
  const { toast } = useToast()

  const content = resume.content || {}
  // Support both data shapes: AI-generated (personalInfo/experience) and editor (contactInfo/experiences)
  const personalInfo = content.contactInfo || content.personalInfo || {}
  const summary = content.summary || ''
  const skills = Array.isArray(content.skills) ? content.skills : []
  const experience = Array.isArray(content.experiences)
    ? content.experiences
    : Array.isArray(content.experience)
      ? content.experience
      : []
  const education = Array.isArray(content.education) ? content.education : []

  const exportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
      const margin = 15
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

      // Header - Name and Contact
      const name = personalInfo.name || userName || 'Resume'
      const email = personalInfo.email || userEmail || ''
      const phone = personalInfo.phone || ''
      const location = personalInfo.location || ''
      const linkedin = personalInfo.linkedin || ''
      const github = personalInfo.github || ''

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text(name, margin, y)
      moveY(7)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const contactParts = [email, phone, location].filter(Boolean)
      if (contactParts.length) {
        doc.text(contactParts.join(' | '), margin, y)
        moveY(5)
      }

      const linkParts = [linkedin, github].filter(Boolean)
      if (linkParts.length) {
        doc.text(linkParts.join(' | '), margin, y)
        moveY(5)
      }

      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      moveY(6)

      // Summary
      if (summary) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('PROFESSIONAL SUMMARY', margin, y)
        moveY(6)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const wrapped = doc.splitTextToSize(summary, usableWidth) as string[]
        wrapped.forEach((line) => {
          if (y > pageHeight - margin) {
            doc.addPage()
            y = margin
          }
          doc.text(line, margin, y)
          y += 5
        })
        moveY(4)
      }

      // Skills
      if (skills.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('SKILLS', margin, y)
        moveY(6)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const skillsText = skills.join(' • ')
        const wrapped = doc.splitTextToSize(skillsText, usableWidth) as string[]
        wrapped.forEach((line) => {
          if (y > pageHeight - margin) {
            doc.addPage()
            y = margin
          }
          doc.text(line, margin, y)
          y += 5
        })
        moveY(4)
      }

      // Experience
      if (experience.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('EXPERIENCE', margin, y)
        moveY(6)

        experience.forEach((exp: any) => {
          if (y > pageHeight - margin - 20) {
            doc.addPage()
            y = margin
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          const title = exp.title || 'Position'
          doc.text(title, margin, y)
          moveY(5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const company = exp.company || ''
          const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' - ')
          const companyLine = [company, dates].filter(Boolean).join(' | ')
          if (companyLine) {
            doc.text(companyLine, margin, y)
            moveY(5)
          }

          if (exp.description) {
            const wrapped = doc.splitTextToSize(exp.description, usableWidth - 5) as string[]
            wrapped.forEach((line) => {
              if (y > pageHeight - margin) {
                doc.addPage()
                y = margin
              }
              doc.text(`• ${line}`, margin + 2, y)
              y += 5
            })
          }
          moveY(3)
        })
      }

      // Education
      if (education.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('EDUCATION', margin, y)
        moveY(6)

        education.forEach((edu: any) => {
          if (y > pageHeight - margin - 15) {
            doc.addPage()
            y = margin
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          const degree = edu.degree || 'Degree'
          doc.text(degree, margin, y)
          moveY(5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const school = edu.school || ''
          const gradYear = edu.graduationYear || ''
          const eduLine = [school, gradYear].filter(Boolean).join(' | ')
          if (eduLine) {
            doc.text(eduLine, margin, y)
            moveY(5)
          }
        })
      }

      // Fallback: Additional Content from uploaded resume
      const extractedText: string | undefined = typeof content.extractedText === 'string' ? content.extractedText : undefined
      if (extractedText && extractedText.trim().length > 0) {
        if (y > pageHeight - margin - 20) { doc.addPage(); y = margin }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('Additional Content (from uploaded resume)', margin, y)
        moveY(6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const wrapped = doc.splitTextToSize(extractedText, usableWidth) as string[]
        wrapped.forEach((line) => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin }
          doc.text(line, margin, y)
          y += 5
        })
        moveY(2)
      }

      const fileName = `${resume.title.replace(/\s+/g, '_')}.pdf`
      doc.save(fileName)
      toast({
        title: 'Exported',
        description: 'Resume PDF downloaded successfully',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF',
        variant: 'destructive',
      })
    }
  }

  const getSourceBadge = () => {
    switch (resume.source) {
      case 'ai_generated':
        return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">AI Generated</span>
      case 'ai_optimized':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">AI Optimized</span>
      case 'pdf_upload':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">PDF Upload</span>
      case 'manual':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Manual</span>
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>{resume.title}</DialogTitle>
              {getSourceBadge()}
            </div>
            <div className="flex gap-2">
              <Button onClick={exportPDF} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-white border rounded-lg">
          {/* Personal Info */}
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">{personalInfo.name || userName || 'Your Name'}</h2>
            <div className="text-sm text-muted-foreground mt-2 space-y-1">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
              {personalInfo.linkedin && (
                <div className="text-blue-600 hover:underline">
                  <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </div>
              )}
              {personalInfo.github && (
                <div className="text-blue-600 hover:underline">
                  <a href={personalInfo.github} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Professional Summary</h3>
              <p className="text-sm text-gray-700">{summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, idx: number) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Experience</h3>
              <div className="space-y-4">
                {experience.map((exp: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-semibold">{exp.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      {exp.company}
                      {exp.startDate && (
                        <span className="ml-2">
                          {exp.startDate} - {exp.endDate || 'Present'}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-sm mt-2 text-gray-700 whitespace-pre-line">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Education</h3>
              <div className="space-y-3">
                {education.map((edu: any, idx: number) => (
                  <div key={idx}>
                    <h4 className="font-semibold">{edu.degree}</h4>
                    <div className="text-sm text-muted-foreground">
                      {edu.school}
                      {edu.graduationYear && <span className="ml-2">{edu.graduationYear}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
