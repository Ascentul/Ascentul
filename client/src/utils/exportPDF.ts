import { jsPDF } from 'jspdf';

// For backward compatibility with existing code
declare global {
  interface Window {
    html2pdf: any;
    linkedInProfile?: string | null;
  }
}

/**
 * Export the cover letter content as a PDF using pure jsPDF
 * This approach works directly with the letter data rather than DOM elements
 */
export function exportCoverLetterToPDF(): void {
  try {
    // Get direct reference to the cover letter content element
    const previewLetterEl = document.getElementById("pdf-export-content");
    if (!previewLetterEl) {
      alert("❌ Could not find cover letter content. Please try again.");
      return;
    }
    
    console.log("Exporting cover letter to PDF from preview element...");
    
    // Get all required details from the new unified DOM structure
    // Find the header container within the preview element
    const headerContainer = previewLetterEl.querySelector(".text-base.font-normal.text-neutral-900");
    
    // Declare variables to hold our extracted data
    let fullName = "Your Name";
    let jobTitle = "";
    let contactInfo = "";
    let date = new Date().toLocaleDateString();
    let companyName = "";
    
    if (!headerContainer) {
      console.log("Using legacy selectors - unified header container not found");
      // Fallback to old selectors for compatibility
      const fullNameElement = previewLetterEl.querySelector("h2, p.font-semibold");
      fullName = fullNameElement?.textContent?.trim() || "Your Name";
      
      const jobTitleElement = previewLetterEl.querySelector(".text-base.font-normal.mt-1");
      jobTitle = jobTitleElement?.textContent?.trim() || "";
      
      const contactInfoElement = previewLetterEl.querySelector("p.text-neutral-700, div.text-base.font-normal.mt-4");
      contactInfo = contactInfoElement?.textContent?.trim() || "";
      
      // Date from any element with date format
      const dateContainer = Array.from(previewLetterEl.querySelectorAll("div, p")).find(el => {
        const text = el.textContent?.trim() || "";
        return (text.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || text.match(/\w+ \d{1,2}, \d{4}/));
      });
      date = dateContainer?.textContent?.trim() || new Date().toLocaleDateString();
      
      // Get company name - check multiple possible selectors
      const companyElement = previewLetterEl.querySelector(".mt-1.mb-6.text-base.font-normal p") || 
                            previewLetterEl.querySelector(".mb-6.text-base.font-normal p") || 
                            previewLetterEl.querySelector(".mt-4.mb-6.text-base.font-normal p");
      companyName = companyElement?.textContent?.trim() || "";
    } else {
      console.log("Using new unified header structure for PDF export");
      // Get all paragraph elements in the header container
      const paragraphs = headerContainer.querySelectorAll("p");
      
      // Extract full name (first paragraph with font-semibold class)
      const fullNameElement = headerContainer.querySelector("p.font-semibold");
      fullName = fullNameElement?.textContent?.trim() || "Your Name";
      
      // Get job title (second paragraph)
      jobTitle = paragraphs[1]?.textContent?.trim() || "";
      
      // Get contact info from the third paragraph (with email, LinkedIn, phone)
      const contactInfoElement = paragraphs[2];
      contactInfo = contactInfoElement?.textContent?.trim() || "";
      
      // Get date from the fourth paragraph
      date = paragraphs[3]?.textContent?.trim() || new Date().toLocaleDateString();
      
      // Get company name from the fifth paragraph
      companyName = paragraphs[4]?.textContent?.trim() || "";
    }
    
    // Get body content
    const letterBodyElement = previewLetterEl.querySelector(".whitespace-pre-wrap.text-base.font-normal");
    let letterBody = letterBodyElement?.textContent || "";
    
    // Clean any remaining placeholders from the text
    letterBody = letterBody
      .replace(/\[Your Address\]|\[Address\]/g, "")
      .replace(/\[Your Location\]|\[Location\]/g, "")
      .replace(/\[City, State\]|City, State/g, "")
      .replace(/\[Your Name\]/g, fullName)
      .replace(/\[Name\]/g, fullName);
    
    // Basic validation
    if (!letterBody || letterBody.trim() === "") {
      console.error("Letter body is empty");
      alert("❌ Letter body is empty. Cannot export.");
      return;
    }

    console.log("Creating PDF with text content:", letterBody.substring(0, 100) + "...");
    
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    // Set consistent font family and base size
    const baseFontFamily = "helvetica";
    const baseFontSize = 11; // Standard size for all text
    
    doc.setFont(baseFontFamily);
    doc.setFontSize(baseFontSize);
    
    // Define margins (1 inch = 25.4mm)
    const margin = 25.4; 
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Calculate text width (accounting for margins)
    const textWidth = pageWidth - (margin * 2);
    
    // Current Y position for content
    let yPosition = margin;
    
    // Add name at the top - slight emphasis with bold only
    doc.setFont(baseFontFamily, "bold");
    doc.text(fullName, margin, yPosition);
    yPosition += 7;
    
    // Add job title if present
    if (jobTitle) {
      doc.setFont(baseFontFamily, "normal");
      doc.text(jobTitle, margin, yPosition);
      yPosition += 8; // Increased spacing between job title and contact info
    }
    
    // Add contact info (Email | LinkedIn | Phone) on a single line
    if (contactInfo) {
      doc.setFont(baseFontFamily, "normal");
      
      // Format as a single clean line with LinkedIn as a hyperlink if available
      if (window.linkedInProfile) {
        // Split the contact info by separator
        const contactParts = contactInfo.split('|').map(part => part.trim());
        let currentX = margin;
        
        // Process each part, formatting LinkedIn as a hyperlink
        for (let i = 0; i < contactParts.length; i++) {
          const part = contactParts[i];
          
          // Check if this part is LinkedIn
          if (part.toLowerCase().includes('linkedin')) {
            // Add LinkedIn as a hyperlinked text in blue
            doc.setTextColor(0, 102, 204); // Professional blue color (#0066cc)
            doc.text('LinkedIn', currentX, yPosition);
            
            // Calculate text width for positioning and link area
            const linkWidth = doc.getTextWidth('LinkedIn');
            
            // Add clickable link
            doc.link(
              currentX,
              yPosition - 4, // Slightly above text
              linkWidth,
              5, // Height of clickable area
              { url: window.linkedInProfile }
            );
            
            // Reset text color
            doc.setTextColor(0, 0, 0);
            
            // Move position after the text
            currentX += linkWidth;
          } else {
            // For non-LinkedIn parts, just add normal text
            doc.text(part, currentX, yPosition);
            currentX += doc.getTextWidth(part);
          }
          
          // Add separator if not the last part
          if (i < contactParts.length - 1) {
            doc.text(' | ', currentX, yPosition);
            currentX += doc.getTextWidth(' | ');
          }
        }
        
        // Add spacing after contact line
        yPosition += 8;
      } else {
        // Without LinkedIn URL, just use the regular contact info line
        doc.text(contactInfo, margin, yPosition);
        yPosition += 8;
      }
    }
    
    // Add date and company name on separate lines with consistent body text spacing
    doc.setFont(baseFontFamily, "normal");
    
    // Add date on its own line
    doc.text(date, margin, yPosition);
    yPosition += 6; // Space between date and company (matches body line spacing)
    
    // Add company name on its own line (if provided)
    if (companyName) {
      doc.text(companyName, margin, yPosition);
      yPosition += 6; // Space after company name
    }
    
    // Add extra space before greeting for visual separation
    yPosition += 2;
    
    // Add greeting with consistent font
    doc.setFont(baseFontFamily, "normal");
    doc.text("Dear Hiring Manager,", margin, yPosition);
    yPosition += 10;
    
    // Ensure body text uses the same font
    
    // Split text to fit within page width and respect line breaks
    const bodyLines = doc.splitTextToSize(letterBody, textWidth);
    
    // Add content with proper spacing
    doc.text(bodyLines, margin, yPosition);
    
    // Generate a filename
    const filename = `cover-letter-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(filename);
    
    // Show success message
    alert("✅ Your cover letter has been downloaded successfully.");
    console.log("PDF export successful");
    
  } catch (error) {
    console.error("Error creating PDF:", error);
    alert("❌ Failed to export PDF. An unexpected error occurred.");
  }
}

/**
 * Export a resume as a PDF using jsPDF
 * This function extracts relevant data from the resume template DOM element
 * and creates a well-formatted PDF document
 * 
 * @param elementId The ID of the element containing the resume to export
 * @param resumeName The name of the resume to use in the PDF title and filename
 */
export function exportResumeToPDF(elementId: string, resumeName: string = "Resume"): void {
  try {
    console.log(`Exporting resume with ID: ${elementId}, name: ${resumeName}`);
    
    // Get the element containing the resume data
    const resumeElement = document.getElementById(elementId);
    if (!resumeElement) {
      alert("❌ Could not find resume content. Please try again.");
      console.error(`Element with ID ${elementId} not found`);
      return;
    }
    
    // Extract sections from the resume template
    const nameElement = resumeElement.querySelector("h1, h2") || resumeElement.querySelector(".resume-name");
    const fullName = nameElement?.textContent?.trim() || resumeName || "Resume";
    
    // Extract contact information (may be in different formats depending on template)
    const contactInfo = resumeElement.querySelector(".contact-info, .personal-info")?.textContent?.trim() || "";
    
    // Extract sections (summary, experience, education, skills)
    const summary = resumeElement.querySelector(".summary-section, .professional-summary")?.textContent?.trim() || "";
    
    // Try to find the skills section which might be represented as tags or plain text
    let skills = "";
    const skillsSection = resumeElement.querySelector(".skills-section");
    if (skillsSection) {
      // Look for individual skill tags first
      const skillTags = Array.from(skillsSection.querySelectorAll(".skill-tag, .skill"));
      if (skillTags.length > 0) {
        skills = skillTags.map(tag => tag.textContent?.trim()).filter(Boolean).join(", ");
      } else {
        // Fall back to full text content of the skills section
        skills = skillsSection.textContent?.trim() || "";
      }
    }
    
    // Get experience items (may be multiple)
    const experienceItems: string[] = [];
    resumeElement.querySelectorAll(".experience-item, .work-item").forEach(item => {
      experienceItems.push(item.textContent?.trim() || "");
    });
    
    // Get education items (may be multiple)
    const educationItems: string[] = [];
    resumeElement.querySelectorAll(".education-item, .edu-item").forEach(item => {
      educationItems.push(item.textContent?.trim() || "");
    });
    
    console.log("Creating PDF with resume data:", { 
      name: fullName, 
      contactSummary: contactInfo.substring(0, 30) + "...",
      sections: {
        summary: summary ? "Present" : "Not found",
        skills: skills ? "Present" : "Not found",
        experience: `${experienceItems.length} items`,
        education: `${educationItems.length} items`
      }
    });
    
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    // Set consistent font family and base size
    const baseFontFamily = "helvetica";
    const baseFontSize = 11; // Standard size for all text
    const sectionHeaderSize = 12; // Size for section headers
    
    doc.setFont(baseFontFamily);
    doc.setFontSize(baseFontSize);
    
    // Define margins (1 inch = 25.4mm)
    const margin = 20; 
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Calculate text width (accounting for margins)
    const textWidth = pageWidth - (margin * 2);
    
    // Add title/name at the top
    doc.setFont(baseFontFamily, "bold");
    doc.setFontSize(14); // Slightly larger only for the main heading
    doc.text(fullName, pageWidth / 2, margin, { align: 'center' });
    
    // Add contact info
    let currentY = margin + 8;
    if (contactInfo) {
      doc.setFont(baseFontFamily, "normal");
      doc.setFontSize(baseFontSize);
      doc.text(contactInfo, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }
    
    // Add a separator line
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;
    
    // Add summary if available
    if (summary) {
      doc.setFont(baseFontFamily, "bold");
      doc.setFontSize(sectionHeaderSize);
      doc.text("Professional Summary", margin, currentY);
      currentY += 6;
      
      doc.setFont(baseFontFamily, "normal");
      doc.setFontSize(baseFontSize);
      const summaryLines = doc.splitTextToSize(summary, textWidth);
      doc.text(summaryLines, margin, currentY);
      currentY += doc.getTextDimensions(summaryLines).h + 5;
    }
    
    // Add skills if available
    if (skills) {
      doc.setFont(baseFontFamily, "bold");
      doc.setFontSize(sectionHeaderSize);
      doc.text("Skills", margin, currentY);
      currentY += 6;
      
      doc.setFont(baseFontFamily, "normal");
      doc.setFontSize(baseFontSize);
      const skillsLines = doc.splitTextToSize(skills, textWidth);
      doc.text(skillsLines, margin, currentY);
      currentY += doc.getTextDimensions(skillsLines).h + 5;
    }
    
    // Add experience section if available
    if (experienceItems.length > 0) {
      doc.setFont(baseFontFamily, "bold");
      doc.setFontSize(sectionHeaderSize);
      doc.text("Experience", margin, currentY);
      currentY += 6;
      
      doc.setFont(baseFontFamily, "normal");
      doc.setFontSize(baseFontSize);
      
      for (const item of experienceItems) {
        // Check if we need to add a new page
        if (currentY > pageHeight - 25) {
          doc.addPage();
          currentY = margin;
        }
        
        const itemLines = doc.splitTextToSize(item, textWidth);
        doc.text(itemLines, margin, currentY);
        currentY += doc.getTextDimensions(itemLines).h + 5;
      }
    }
    
    // Add education section if available
    if (educationItems.length > 0) {
      // Check if we need to add a new page
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.setFont(baseFontFamily, "bold");
      doc.setFontSize(sectionHeaderSize);
      doc.text("Education", margin, currentY);
      currentY += 6;
      
      doc.setFont(baseFontFamily, "normal");
      doc.setFontSize(baseFontSize);
      
      for (const item of educationItems) {
        // Check if we need to add a new page
        if (currentY > pageHeight - 25) {
          doc.addPage();
          currentY = margin;
        }
        
        const itemLines = doc.splitTextToSize(item, textWidth);
        doc.text(itemLines, margin, currentY);
        currentY += doc.getTextDimensions(itemLines).h + 5;
      }
    }
    
    // Generate a clean filename
    const cleanName = resumeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `resume_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(filename);
    
    // Show success message
    alert("✅ Your resume has been downloaded successfully.");
    console.log("Resume PDF export successful");
    
  } catch (error) {
    console.error("Error creating resume PDF:", error);
    alert("❌ Failed to export resume as PDF. An unexpected error occurred.");
  }
}

/**
 * Export a specific element as a PDF
 * Legacy function maintained for backward compatibility
 * @param elementId The ID of the element to export
 * @param filename Optional custom filename
 */
export function exportElementToPDF(elementId: string, filename: string = "cover-letter.pdf"): void {
  try {
    const target = document.getElementById(elementId);
    
    if (!target || target.innerText.trim() === "") {
      alert("❌ No content to export. Please generate a cover letter first.");
      return;
    }
    
    // Clone the element to avoid disturbing the page layout
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.display = "block"; // Ensure visibility for rendering
    
    // Apply consistent font styling to the clone before exporting
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      * {
        font-family: 'Helvetica', Arial, sans-serif !important;
        font-size: 11pt !important;
        line-height: 1.4 !important;
        color: rgb(0, 0, 0) !important;
      }
      h1, h2, h3, .name {
        font-size: 12pt !important;
        font-weight: normal !important;
      }
      .header-container, .contact-info {
        font-size: 11pt !important;
      }
    `;
    clone.appendChild(styleElement);
    document.body.appendChild(clone);
    
    // Configure PDF export
    window.html2pdf().set({
      margin: 0.5,
      filename: filename,
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true 
      },
      jsPDF: { 
        unit: "in", 
        format: "letter", 
        orientation: "portrait"
      }
    })
    .from(clone)
    .save()
    .then(() => {
      document.body.removeChild(clone);
      alert("✅ Your cover letter has been downloaded.");
    })
    .catch((err: unknown) => {
      document.body.removeChild(clone);
      console.error("PDF export failed", err);
      alert("❌ Failed to export PDF. Please try again.");
    });
  } catch (error) {
    console.error("Error setting up PDF export:", error);
    alert("❌ Failed to prepare PDF. Please try again.");
  }
}