import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { chromium } from 'playwright';
import { generatePDFFileName } from '@/lib/pdf/fileName';
import { buildContactParts, renderContactLink } from '@/lib/pdf/contactRenderer';
import type { ContactLink } from '@/lib/pdf/contactRenderer';
import { buildPageConfig } from '@/lib/pdf/pageConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for PDF generation

interface ExportResumeRequest {
  resumeId: Id<"builder_resumes">;
  format: 'pdf';
  templateSlug?: string;
  clickableLinks?: boolean; // Phase 8: Optional toggle for contact link hyperlinks
}

/**
 * Generate HTML for resume rendering
 * This creates a complete HTML document with styling that matches the resume builder
 */
function generateResumeHTML(resume: any, blocks: any[], template: any, theme: any, clickableLinks = false): string {
  // Build page configuration using extracted utility
  const pageConfig = buildPageConfig(template);
  const { pageSize, dimensions: pageDimensions, margins } = pageConfig;

  // Theme colors and fonts
  const primaryColor = theme?.colors?.primary || '#1a1a1a';
  const textColor = theme?.colors?.text || '#333333';
  const accentColor = theme?.colors?.accent || '#0066cc';
  const headingFont = theme?.fonts?.heading || 'Georgia, serif';
  const bodyFont = theme?.fonts?.body || 'Arial, sans-serif';
  const headingSize = theme?.fontSizes?.heading || 14;
  const bodySize = theme?.fontSizes?.body || 11;

  // Generate block HTML
  const blocksHTML = blocks
    .sort((a, b) => a.order - b.order)
    .map(block => renderBlock(block, { primaryColor, textColor, accentColor, headingFont, bodyFont, headingSize, bodySize }, clickableLinks))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resume.title || 'Resume'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: ${pageDimensions.width} ${pageDimensions.height};
      margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
    }

    body {
      font-family: ${bodyFont};
      font-size: ${bodySize}pt;
      line-height: 1.5;
      color: ${textColor};
      width: ${pageDimensions.width};
      min-height: ${pageDimensions.height};
    }

    h1, h2, h3 {
      font-family: ${headingFont};
      color: ${primaryColor};
      font-weight: bold;
    }

    h1 {
      font-size: ${headingSize + 4}pt;
      margin-bottom: 0.3em;
    }

    h2 {
      font-size: ${headingSize}pt;
      margin-top: 1em;
      margin-bottom: 0.5em;
      padding-bottom: 0.2em;
      border-bottom: 2px solid ${accentColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h3 {
      font-size: ${bodySize + 1}pt;
      margin-bottom: 0.3em;
    }

    p {
      margin-bottom: 0.8em;
    }

    a {
      color: ${accentColor};
      text-decoration: none;
    }

    ul {
      margin-left: 1.2em;
      margin-bottom: 0.8em;
    }

    li {
      margin-bottom: 0.3em;
    }

    .resume-block {
      margin-bottom: 1.5em;
      page-break-inside: avoid;
    }

    .header-block {
      text-align: center;
      margin-bottom: 2em;
    }

    .header-name {
      font-size: ${headingSize + 6}pt;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 0.2em;
    }

    .header-title {
      font-size: ${bodySize + 2}pt;
      color: ${accentColor};
      margin-bottom: 0.5em;
    }

    .header-contact {
      font-size: ${bodySize - 1}pt;
      color: ${textColor};
    }

    .header-links {
      margin-top: 0.3em;
    }

    .experience-item, .education-item, .project-item {
      margin-bottom: 1.2em;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.2em;
    }

    .item-title {
      font-weight: bold;
      font-size: ${bodySize + 1}pt;
    }

    .item-date {
      font-size: ${bodySize - 1}pt;
      color: #666;
      font-style: italic;
    }

    .item-subtitle {
      color: #555;
      margin-bottom: 0.4em;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5em;
      margin-bottom: 0.8em;
    }

    .skill-category {
      margin-bottom: 0.4em;
    }

    .skill-label {
      font-weight: bold;
      margin-right: 0.3em;
    }

    .skill-items {
      display: inline;
    }
  </style>
</head>
<body>
  ${blocksHTML}
</body>
</html>`;
}

/**
 * Render individual block to HTML
 */
function renderBlock(block: any, styles: any, clickableLinks = false): string {
  const { type, data } = block;
  const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_UI === 'true';

  switch (type) {
    case 'header':
      // Phase 8: Contact validation and optional clickable links
      const contactParts = buildContactParts(data.contact, { clickableLinks });

      // Debug warning for missing contact fields
      const email = data.contact?.email || '';
      const phone = data.contact?.phone || '';
      const location = data.contact?.location || '';
      if (debugEnabled && (!email || !phone || !location)) {
        console.warn(`[PDF Export] Header block missing contact fields: email=${!!email}, phone=${!!phone}, location=${!!location}`);
      }

      return `<div class="resume-block header-block">
        <div class="header-name">${escapeHTML(data.fullName || '')}</div>
        ${data.title ? `<div class="header-title">${escapeHTML(data.title)}</div>` : ''}
        <div class="header-contact">
          ${contactParts.length > 0 ? contactParts.join(' • ') : ''}
        </div>
        ${data.contact?.links && data.contact.links.length > 0 ? `
          <div class="header-links">
            ${data.contact.links.map((link: ContactLink) =>
              renderContactLink(link, { clickableLinks })
            ).join(' • ')}
          </div>
        ` : ''}
      </div>`;

    case 'summary':
      return `<div class="resume-block">
        <h2>Professional Summary</h2>
        <p>${escapeHTML(data.text || '')}</p>
      </div>`;

    case 'experience':
      if (!data.items || data.items.length === 0) return '';
      return `<div class="resume-block">
        <h2>Experience</h2>
        ${data.items.map((item: any) => `
          <div class="experience-item">
            <div class="item-header">
              <div class="item-title">${escapeHTML(item.role || '')}</div>
              <div class="item-date">${escapeHTML(item.start || '')} – ${escapeHTML(item.end || '')}</div>
            </div>
            <div class="item-subtitle">
              ${escapeHTML(item.company || '')}${item.location ? ' • ' + escapeHTML(item.location) : ''}
            </div>
            ${item.bullets && item.bullets.length > 0 ? `
              <ul>
                ${item.bullets.map((bullet: string) => `<li>${escapeHTML(bullet)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>`;

    case 'education':
      if (!data.items || data.items.length === 0) return '';
      return `<div class="resume-block">
        <h2>Education</h2>
        ${data.items.map((item: any) => `
          <div class="education-item">
            <div class="item-header">
              <div class="item-title">${escapeHTML(item.degree || '')}</div>
              <div class="item-date">${escapeHTML(item.graduationDate || '')}</div>
            </div>
            <div class="item-subtitle">${escapeHTML(item.school || '')}</div>
            ${item.details ? `<p>${escapeHTML(item.details)}</p>` : ''}
          </div>
        `).join('')}
      </div>`;

    case 'skills':
      if (!data.primary && !data.secondary) return '';
      return `<div class="resume-block">
        <h2>Skills</h2>
        <div class="skills-grid">
          ${data.primary && data.primary.length > 0 ? `
            <div class="skill-category">
              <span class="skill-label">Primary:</span>
              <span class="skill-items">${data.primary.map((skill: string) => escapeHTML(skill)).join(', ')}</span>
            </div>
          ` : ''}
          ${data.secondary && data.secondary.length > 0 ? `
            <div class="skill-category">
              <span class="skill-label">Secondary:</span>
              <span class="skill-items">${data.secondary.map((skill: string) => escapeHTML(skill)).join(', ')}</span>
            </div>
          ` : ''}
        </div>
      </div>`;

    case 'projects':
      if (!data.items || data.items.length === 0) return '';
      return `<div class="resume-block">
        <h2>Projects</h2>
        ${data.items.map((item: any) => `
          <div class="project-item">
            <h3>${escapeHTML(item.name || '')}</h3>
            ${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}
            ${item.bullets && item.bullets.length > 0 ? `
              <ul>
                ${item.bullets.map((bullet: string) => `<li>${escapeHTML(bullet)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>`;

    case 'custom':
      return `<div class="resume-block">
        <h2>${escapeHTML(data.heading || 'Additional Information')}</h2>
        ${data.bullets && data.bullets.length > 0 ? `
          <ul>
            ${data.bullets.map((bullet: string) => `<li>${escapeHTML(bullet)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>`;

    default:
      return '';
  }
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/**
 * Export resume to PDF using Playwright
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ExportResumeRequest = await req.json();
    const { resumeId, format, clickableLinks = false } = body;

    if (!resumeId || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId and format' },
        { status: 400 }
      );
    }

    if (format !== 'pdf') {
      return NextResponse.json({ error: 'Only PDF format is supported' }, { status: 400 });
    }

    // Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // Get resume with blocks
    const resumeData = await client.query(api.builder_resumes_v2.get, {
      id: resumeId,
      clerkId: userId,
    });

    if (!resumeData) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Get template
    const template = await client.query(api.builder_templates_v2.getBySlug, {
      slug: resumeData.templateSlug,
    });

    // Get theme if specified
    let theme = null;
    if (resumeData.themeId) {
      theme = await client.query(api.builder_themes_v2.get, {
        id: resumeData.themeId,
      });
    }

    // Get blocks for this resume
    const blocks = await client.query(api.builder_blocks.list, {
      resumeId,
      clerkId: userId,
    });

    // Phase 8: Extract full name from header block for file naming
    const headerBlock = blocks.find((b: any) => b.type === 'header');
    const fullName = headerBlock?.data?.fullName || resumeData.title || 'Resume';
    const templateSlug = resumeData.templateSlug || 'template';

    // Generate HTML with clickable links option
    const html = generateResumeHTML(resumeData, blocks, template, theme, clickableLinks);

    // Launch Playwright browser
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Set content and wait for any fonts/images to load
      await page.setContent(html, { waitUntil: 'networkidle' });

      // Generate PDF with proper page size
      const pageSize = template?.pageSize || 'Letter';
      const pdfBuffer = await page.pdf({
        format: pageSize === 'A4' ? 'A4' : 'Letter',
        printBackground: true,
        preferCSSPageSize: true,
      });

      await page.close();

      // Generate upload URL from Convex
      const uploadUrl = await client.mutation(api.builder_exports_v2.generateUploadUrl, {});

      // Upload PDF to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: pdfBuffer,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF to storage');
      }

      const { storageId } = await uploadResponse.json();

      // Create export record in Convex
      const exportRecord = await client.mutation(api.builder_exports_v2.createWithStorage, {
        resumeId,
        format: 'pdf',
        storageId,
      });

      // Phase 8: Generate file name in format FullName-Template-YYYYMMDD.pdf
      const fileName = generatePDFFileName(fullName, templateSlug);

      return NextResponse.json({
        success: true,
        exportId: exportRecord.id,
        url: exportRecord.url,
        format: 'pdf',
        fileName, // Phase 8: Include generated file name
        message: 'Resume exported to PDF successfully',
      });
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    // Phase 8: Gate debug logging behind DEBUG_UI flag
    // Always log errors for production debugging
    console.error('[PDF Export] Error:', error.message);
    
    // Log full stack trace only in debug mode
    if (process.env.NEXT_PUBLIC_DEBUG_UI === 'true') {
      console.error('[PDF Export] Stack trace:', error.stack);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to export resume' },
      { status: 500 }
    );
  }
}
