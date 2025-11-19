/**
 * Resume PDF Generator
 *
 * Generates PDF exports that visually match the ResumeDocument component.
 *
 * IMPORTANT: This file mirrors the layout and styling from
 * src/components/resume/ResumeDocument.tsx
 *
 * When updating resume styling, make changes in BOTH files to ensure
 * preview and export remain identical.
 */

import jsPDF from 'jspdf';
import type { ResumeData, Experience, Education, Project, Achievement } from '@/components/resume/ResumeDocument';

// Typography constants (matching ResumeDocument)
const FONT_SIZE = {
  NAME: 24,
  SECTION_HEADING: 12,
  BODY: 10.5,
  SMALL: 10,
  SUBSECTION: 11,
};

const LINE_HEIGHT = {
  NORMAL: 1.5,
  TIGHT: 1.3,
};

// Layout constants (matching 0.75in margins)
const MARGIN = {
  TOP: 20,
  RIGHT: 20,
  BOTTOM: 20,
  LEFT: 20,
};

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN.LEFT - MARGIN.RIGHT;

// Colors (matching ResumeDocument)
const COLORS = {
  BLACK: '#000000',
  DARK_GRAY: '#1F2937',
  GRAY: '#374151',
  MID_GRAY: '#4B5563',
  LIGHT_GRAY: '#6B7280',
  BLUE: '#2563EB',
};

/**
 * Parse description text into bullet points
 */
function parseDescription(description: string): string[] {
  if (!description) return [];

  const lines = description
    .split(/\n|•/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines;
}

/**
 * Format date range for experience/education
 */
function formatDateRange(startDate: string, endDate: string, current: boolean): string {
  if (current) return `${startDate} - Present`;
  return `${startDate} - ${endDate}`;
}

/**
 * Add text with automatic word wrapping
 */
function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

/**
 * Add a section heading with underline
 */
function addSectionHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZE.SECTION_HEADING);
  doc.setTextColor(COLORS.DARK_GRAY);
  doc.text(title.toUpperCase(), MARGIN.LEFT, y);

  // Add underline
  const headingWidth = doc.getTextWidth(title.toUpperCase());
  doc.setDrawColor(COLORS.MID_GRAY);
  doc.setLineWidth(0.4);
  doc.line(MARGIN.LEFT, y + 1, PAGE_WIDTH - MARGIN.RIGHT, y + 1);

  return y + 6; // Return Y position after heading
}

/**
 * Check if we need a new page and add one if necessary
 */
function checkPageBreak(doc: jsPDF, currentY: number, spaceNeeded: number): number {
  if (currentY + spaceNeeded > PAGE_HEIGHT - MARGIN.BOTTOM) {
    doc.addPage();
    return MARGIN.TOP;
  }
  return currentY;
}

/**
 * Generate PDF from resume data
 */
export async function generateResumePDF(data: ResumeData, filename: string = 'resume.pdf'): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPos = MARGIN.TOP;

  // ==================== HEADER ====================
  // Name (centered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZE.NAME);
  doc.setTextColor(COLORS.BLACK);
  const nameWidth = doc.getTextWidth(data.contactInfo.name);
  const nameX = (PAGE_WIDTH - nameWidth) / 2;
  doc.text(data.contactInfo.name, nameX, yPos);
  yPos += 8;

  // Contact info (centered)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZE.SMALL);
  doc.setTextColor(COLORS.LIGHT_GRAY);

  const contactParts = [
    data.contactInfo.location,
    data.contactInfo.phone,
    data.contactInfo.email,
    data.contactInfo.linkedin,
    data.contactInfo.website,
  ].filter(Boolean);

  const contactLine = contactParts.join(' • ');
  const contactWidth = doc.getTextWidth(contactLine);
  const contactX = (PAGE_WIDTH - contactWidth) / 2;
  doc.text(contactLine, contactX, yPos);
  yPos += 10;

  // ==================== SUMMARY ====================
  if (data.summary && data.summary.trim()) {
    yPos = checkPageBreak(doc, yPos, 20);
    yPos = addSectionHeading(doc, 'Professional Summary', yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE.BODY);
    doc.setTextColor(COLORS.BLACK);
    yPos = addWrappedText(doc, data.summary, MARGIN.LEFT, yPos, CONTENT_WIDTH, 5);
    yPos += 5;
  }

  // ==================== SKILLS ====================
  if (data.skills && data.skills.length > 0) {
    yPos = checkPageBreak(doc, yPos, 20);
    yPos = addSectionHeading(doc, 'Skills', yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE.BODY);
    doc.setTextColor(COLORS.BLACK);

    const skillsText = data.skills.join(', ');
    yPos = addWrappedText(doc, skillsText, MARGIN.LEFT, yPos, CONTENT_WIDTH, 5);
    yPos += 5;
  }

  // ==================== EXPERIENCE ====================
  if (data.experience && data.experience.length > 0) {
    yPos = checkPageBreak(doc, yPos, 30);
    yPos = addSectionHeading(doc, 'Experience', yPos);

    data.experience.forEach((exp, index) => {
      if (index > 0) yPos += 4;

      // Check if we need space for this entry (estimate ~30mm)
      yPos = checkPageBreak(doc, yPos, 30);

      // Company name and location
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZE.SUBSECTION);
      doc.setTextColor(COLORS.BLACK);
      doc.text(exp.company, MARGIN.LEFT, yPos);

      // Date range (right-aligned)
      const dateText = formatDateRange(exp.startDate, exp.endDate, exp.current);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONT_SIZE.SMALL);
      doc.setTextColor(COLORS.LIGHT_GRAY);
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, PAGE_WIDTH - MARGIN.RIGHT - dateWidth, yPos);

      yPos += 5;

      // Location (if provided)
      if (exp.location) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(COLORS.LIGHT_GRAY);
        doc.text(exp.location, MARGIN.LEFT, yPos);
        yPos += 4;
      }

      // Role (italic)
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(FONT_SIZE.BODY);
      doc.setTextColor(COLORS.GRAY);
      doc.text(exp.title, MARGIN.LEFT, yPos);
      yPos += 5;

      // Description bullets
      const bullets = parseDescription(exp.description);
      if (bullets.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.BODY);
        doc.setTextColor(COLORS.BLACK);

        bullets.forEach((bullet) => {
          yPos = checkPageBreak(doc, yPos, 10);

          // Bullet point
          doc.text('•', MARGIN.LEFT + 2, yPos);

          // Bullet text with wrapping
          const bulletLines = doc.splitTextToSize(bullet, CONTENT_WIDTH - 8);
          doc.text(bulletLines, MARGIN.LEFT + 6, yPos);
          yPos += bulletLines.length * 4.5;
        });
      }
    });

    yPos += 3;
  }

  // ==================== EDUCATION ====================
  if (data.education && data.education.length > 0) {
    yPos = checkPageBreak(doc, yPos, 25);
    yPos = addSectionHeading(doc, 'Education', yPos);

    data.education.forEach((edu, index) => {
      if (index > 0) yPos += 4;

      yPos = checkPageBreak(doc, yPos, 20);

      // School name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZE.SUBSECTION);
      doc.setTextColor(COLORS.BLACK);
      doc.text(edu.school, MARGIN.LEFT, yPos);

      // Dates (right-aligned)
      if (edu.startYear && edu.endYear) {
        const dateText = `${edu.startYear} - ${edu.endYear}`;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(COLORS.LIGHT_GRAY);
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, PAGE_WIDTH - MARGIN.RIGHT - dateWidth, yPos);
      }

      yPos += 5;

      // Degree and field
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONT_SIZE.BODY);
      doc.setTextColor(COLORS.BLACK);

      const degreeText = edu.degree && edu.field
        ? `${edu.degree} in ${edu.field}`
        : edu.degree || edu.field || '';

      if (degreeText) {
        doc.text(degreeText, MARGIN.LEFT, yPos);
        yPos += 4;
      }

      // Location
      if (edu.location) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(COLORS.LIGHT_GRAY);
        doc.text(edu.location, MARGIN.LEFT, yPos);
        yPos += 4;
      }

      // GPA and honors
      if (edu.gpa || edu.honors) {
        const extraInfo = [edu.gpa && `GPA: ${edu.gpa}`, edu.honors]
          .filter(Boolean)
          .join(' • ');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(COLORS.GRAY);
        doc.text(extraInfo, MARGIN.LEFT, yPos);
        yPos += 4;
      }
    });

    yPos += 3;
  }

  // ==================== PROJECTS ====================
  if (data.projects && data.projects.length > 0) {
    yPos = checkPageBreak(doc, yPos, 25);
    yPos = addSectionHeading(doc, 'Projects', yPos);

    data.projects.forEach((project, index) => {
      if (index > 0) yPos += 4;

      yPos = checkPageBreak(doc, yPos, 25);

      // Project name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZE.SUBSECTION);
      doc.setTextColor(COLORS.BLACK);
      doc.text(project.name, MARGIN.LEFT, yPos);

      // Role (italic, on same line)
      if (project.role) {
        const nameWidth = doc.getTextWidth(project.name);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(COLORS.GRAY);
        doc.text(`- ${project.role}`, MARGIN.LEFT + nameWidth + 2, yPos);
      }

      yPos += 5;

      // Technologies
      if (project.technologies) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(COLORS.LIGHT_GRAY);
        doc.text(`Technologies: ${project.technologies}`, MARGIN.LEFT, yPos);
        yPos += 4;
      }

      // URL
      if (project.url) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(COLORS.BLUE);
        doc.text(project.url, MARGIN.LEFT, yPos);
        yPos += 4;
      }

      // Description bullets
      const bullets = parseDescription(project.description);
      if (bullets.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.BODY);
        doc.setTextColor(COLORS.BLACK);

        bullets.forEach((bullet) => {
          yPos = checkPageBreak(doc, yPos, 10);

          doc.text('•', MARGIN.LEFT + 2, yPos);
          const bulletLines = doc.splitTextToSize(bullet, CONTENT_WIDTH - 8);
          doc.text(bulletLines, MARGIN.LEFT + 6, yPos);
          yPos += bulletLines.length * 4.5;
        });
      }
    });

    yPos += 3;
  }

  // ==================== ACHIEVEMENTS ====================
  if (data.achievements && data.achievements.length > 0) {
    yPos = checkPageBreak(doc, yPos, 25);
    yPos = addSectionHeading(doc, 'Achievements', yPos);

    data.achievements.forEach((achievement) => {
      yPos = checkPageBreak(doc, yPos, 15);

      // Bullet point
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONT_SIZE.BODY);
      doc.setTextColor(COLORS.BLACK);
      doc.text('•', MARGIN.LEFT + 2, yPos);

      // Title (bold)
      doc.setFont('helvetica', 'bold');
      const titleText = achievement.title;
      doc.text(titleText, MARGIN.LEFT + 6, yPos);

      // Date (if provided)
      if (achievement.date) {
        const titleWidth = doc.getTextWidth(titleText);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.LIGHT_GRAY);
        doc.text(`(${achievement.date})`, MARGIN.LEFT + 6 + titleWidth + 2, yPos);
      }

      yPos += 5;

      // Description
      if (achievement.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.BODY);
        doc.setTextColor(COLORS.BLACK);
        const descLines = doc.splitTextToSize(achievement.description, CONTENT_WIDTH - 8);
        doc.text(descLines, MARGIN.LEFT + 6, yPos);
        yPos += descLines.length * 4.5 + 2;
      }
    });
  }

  // Save the PDF
  doc.save(filename);
}
