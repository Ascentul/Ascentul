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
      const selectedTemplate = 'modern' // Use modern template with color by default
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

      // Apply template-specific styling for headers
      const applyTemplateStyle = () => {
        if (selectedTemplate === "modern") {
          doc.setTextColor(12, 41, 171) // Primary blue
        } else if (selectedTemplate === "classic") {
          doc.setTextColor(0, 0, 0)
        } else {
          doc.setTextColor(60, 60, 60)
        }
      }

      // Header - Name and Contact
      const name = personalInfo.name || userName || 'Resume'
      const email = personalInfo.email || userEmail || ''
      const phone = personalInfo.phone || ''
      const location = personalInfo.location || ''
      const linkedin = personalInfo.linkedin || ''
      const github = personalInfo.github || ''
      const website = personalInfo.website || ''

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      applyTemplateStyle()
      doc.text(name, margin, y)
      doc.setTextColor(0, 0, 0) // Reset to black for contact info
      moveY(7)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const contactParts = [email, phone, location].filter(Boolean)
      if (contactParts.length) {
        doc.text(contactParts.join(' | '), margin, y)
        moveY(5)
      }

      // Only include social links that have actual non-empty values
      const linkParts = [linkedin, github, website]
        .filter((link) => link && typeof link === 'string' && link.trim().length > 0)
      if (linkParts.length) {
        doc.text(linkParts.join(' | '), margin, y)
        moveY(5)
      }

      doc.setLineWidth(0.5)
      doc.setDrawColor(12, 41, 171) // Blue divider line
      doc.line(margin, y, pageWidth - margin, y)
      moveY(6)

      // Summary
      if (summary) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        applyTemplateStyle()
        doc.text('PROFESSIONAL SUMMARY', margin, y)
        doc.setTextColor(0, 0, 0)
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
        applyTemplateStyle()
        doc.text('SKILLS', margin, y)
        doc.setTextColor(0, 0, 0)
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
        applyTemplateStyle()
        doc.text('EXPERIENCE', margin, y)
        doc.setTextColor(0, 0, 0)
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
          const location = exp.location || ''
          const companyLine = [company, location].filter(Boolean).join(' • ')
          if (companyLine) {
            doc.text(companyLine, margin, y)
            moveY(5)
          }

          const dates = exp.current ? `${exp.startDate} - Present` : `${exp.startDate} - ${exp.endDate}`
          if (exp.startDate || exp.endDate) {
            doc.text(dates, margin, y)
            moveY(5)
          }

          if (exp.description) {
            // Split by newlines to preserve user's bullet structure
            const lines = exp.description.split('\n').filter((line: string) => line.trim())

            lines.forEach((line: string) => {
              const trimmedLine = line.trim()

              // Check if line starts with a bullet marker
              const bulletMatch = trimmedLine.match(/^([•\-\*]|\d+[\.\)])\s*/)
              const hasBullet = !!bulletMatch
              const bulletText = hasBullet ? bulletMatch[0] : '• '
              const textWithoutBullet = hasBullet ? trimmedLine.substring(bulletMatch[0].length) : trimmedLine

              // Wrap the text (without bullet)
              const wrappedLines = doc.splitTextToSize(textWithoutBullet, usableWidth - 8) as string[]

              wrappedLines.forEach((wrappedLine, idx) => {
                if (y > pageHeight - margin) { doc.addPage(); y = margin }

                if (idx === 0) {
                  // First line gets the bullet
                  doc.text(`${bulletText}${wrappedLine}`, margin + 2, y)
                } else {
                  // Continuation lines are indented without bullet
                  doc.text(wrappedLine, margin + 6, y)
                }
                y += 5
              })
            })
          }
          moveY(3)
        })
      }

      // Projects
      const projects: any[] = Array.isArray(content.projects) ? content.projects : []
      if (projects.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        applyTemplateStyle()
        doc.text('PROJECTS', margin, y)
        doc.setTextColor(0, 0, 0)
        moveY(6)

        projects.forEach((proj: any) => {
          if (y > pageHeight - margin - 15) { doc.addPage(); y = margin }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.text(proj.name || 'Project', margin, y)
          moveY(5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          if (proj.role) {
            doc.text(proj.role, margin, y)
            moveY(5)
          }

          if (proj.technologies) {
            doc.text(`Technologies: ${proj.technologies}`, margin, y)
            moveY(5)
          }

          if (proj.description) {
            // Split by newlines to preserve user's structure
            const lines = proj.description.split('\n').filter((line: string) => line.trim())

            lines.forEach((line: string) => {
              const trimmedLine = line.trim()

              // Check if line starts with a bullet marker
              const bulletMatch = trimmedLine.match(/^([•\-\*]|\d+[\.\)])\s*/)
              const hasBullet = !!bulletMatch

              if (hasBullet) {
                // Has bullet - extract and preserve it
                const bulletText = bulletMatch[0]
                const textWithoutBullet = trimmedLine.substring(bulletMatch[0].length)
                const wrappedLines = doc.splitTextToSize(textWithoutBullet, usableWidth - 8) as string[]

                wrappedLines.forEach((wrappedLine, idx) => {
                  if (y > pageHeight - margin) { doc.addPage(); y = margin }

                  if (idx === 0) {
                    doc.text(`${bulletText}${wrappedLine}`, margin + 2, y)
                  } else {
                    doc.text(wrappedLine, margin + 6, y)
                  }
                  y += 5
                })
              } else {
                // No bullet - just wrap the text normally
                const wrappedLines = doc.splitTextToSize(trimmedLine, usableWidth - 5) as string[]
                wrappedLines.forEach((wrappedLine) => {
                  if (y > pageHeight - margin) { doc.addPage(); y = margin }
                  doc.text(wrappedLine, margin + 2, y)
                  y += 5
                })
              }
            })
          }
          moveY(3)
        })
      }

      // Education
      if (education.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        applyTemplateStyle()
        doc.text('EDUCATION', margin, y)
        doc.setTextColor(0, 0, 0)
        moveY(6)

        education.forEach((edu: any) => {
          if (y > pageHeight - margin - 15) {
            doc.addPage()
            y = margin
          }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          const degreeText = [edu.degree, edu.field].filter(Boolean).join(' in ')
          doc.text(degreeText || 'Degree', margin, y)
          moveY(5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const school = edu.school || ''
          const location = edu.location || ''
          const schoolLine = [school, location].filter(Boolean).join(' • ')
          if (schoolLine) {
            doc.text(schoolLine, margin, y)
            moveY(5)
          }

          const eduMeta = [
            edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : edu.graduationYear ? `Class of ${edu.graduationYear}` : edu.endYear,
            edu.gpa ? `GPA: ${edu.gpa}` : null,
            edu.honors
          ].filter(Boolean).join(' • ')

          if (eduMeta) {
            doc.text(eduMeta, margin, y)
            moveY(5)
          }
          moveY(2)
        })
      }

      // Achievements
      const achievements: any[] = Array.isArray(content.achievements) ? content.achievements : []
      if (achievements.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        applyTemplateStyle()
        doc.text('ACHIEVEMENTS', margin, y)
        doc.setTextColor(0, 0, 0)
        moveY(6)

        achievements.forEach((ach: any) => {
          if (y > pageHeight - margin - 10) { doc.addPage(); y = margin }

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          const achTitle = (ach.title || ach.name || 'Achievement') + (ach.date ? ` (${ach.date})` : '')
          doc.text(achTitle, margin, y)
          moveY(5)

          if (ach.description) {
            doc.setFont('helvetica', 'normal')
            // Split by newlines to preserve user's structure
            const lines = ach.description.split('\n').filter((line: string) => line.trim())

            lines.forEach((line: string) => {
              const trimmedLine = line.trim()

              // Check if line starts with a bullet marker
              const bulletMatch = trimmedLine.match(/^([•\-\*]|\d+[\.\)])\s*/)
              const hasBullet = !!bulletMatch

              if (hasBullet) {
                // Has bullet - extract and preserve it
                const bulletText = bulletMatch[0]
                const textWithoutBullet = trimmedLine.substring(bulletMatch[0].length)
                const wrappedLines = doc.splitTextToSize(textWithoutBullet, usableWidth - 8) as string[]

                wrappedLines.forEach((wrappedLine, idx) => {
                  if (y > pageHeight - margin) { doc.addPage(); y = margin }

                  if (idx === 0) {
                    doc.text(`${bulletText}${wrappedLine}`, margin + 2, y)
                  } else {
                    doc.text(wrappedLine, margin + 6, y)
                  }
                  y += 5
                })
              } else {
                // No bullet - just wrap the text normally
                const wrappedLines = doc.splitTextToSize(trimmedLine, usableWidth - 5) as string[]
                wrappedLines.forEach((wrappedLine) => {
                  if (y > pageHeight - margin) { doc.addPage(); y = margin }
                  doc.text(wrappedLine, margin + 2, y)
                  y += 5
                })
              }
            })
          }
          moveY(2)
        })
      }

      // Fallback: Additional Content from uploaded resume
      const extractedText: string | undefined = typeof content.extractedText === 'string' ? content.extractedText : undefined
      if (extractedText && extractedText.trim().length > 0) {
        if (y > pageHeight - margin - 20) { doc.addPage(); y = margin }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        applyTemplateStyle()
        doc.text('Additional Content (from uploaded resume)', margin, y)
        doc.setTextColor(0, 0, 0)
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
              {personalInfo.website && (
                <div className="text-blue-600 hover:underline">
                  <a href={personalInfo.website} target="_blank" rel="noopener noreferrer">
                    Website
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

          {/* Projects */}
          {Array.isArray(content.projects) && content.projects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Projects</h3>
              <div className="space-y-4">
                {content.projects.map((proj: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-green-500 pl-4">
                    <h4 className="font-semibold">{proj.title}</h4>
                    {proj.description && (
                      <p className="text-sm mt-2 text-gray-700 whitespace-pre-line">{proj.description}</p>
                    )}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {proj.technologies.map((tech: string, techIdx: number) => (
                          <span key={techIdx} className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements & Awards */}
          {Array.isArray(content.achievements) && content.achievements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Achievements & Awards</h3>
              <div className="space-y-3">
                {content.achievements.map((ach: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-purple-500 pl-4">
                    <h4 className="font-semibold">{ach.title}</h4>
                    {ach.description && (
                      <p className="text-sm mt-1 text-gray-700">{ach.description}</p>
                    )}
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
