// We don't need to import html2pdf.js as it's loaded globally via script tag
declare global {
  interface Window {
    html2pdf: any;
  }
}

/**
 * Export a specific element as a PDF
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

/**
 * Create and export a cover letter as PDF from the letter data
 * This approach renders directly from the letter object
 * @param coverLetter The cover letter data to export
 */
export function exportCoverLetterToPDF(coverLetter: any): void {
  try {
    // Create a wrapper for the PDF export with professional styling
    const wrapper = document.createElement('div');
    wrapper.id = 'pdf-export-wrapper';
    wrapper.className = 'pdf-body';
    
    // Get letter data
    const letter = coverLetter;
    
    // Generate filename
    const filename = `${letter.name?.replace(/\s+/g, '_') || 'Cover_Letter'}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Process body content
    let bodyContent = '';
    if (letter.content && letter.content.body) {
      bodyContent = letter.content.body
        .split('\n')
        .filter((para: string) => para.trim().length > 0)
        .map((para: string) => `<p style="margin-bottom: 12px;">${para}</p>`)
        .join('');
    } else {
      bodyContent = '<p style="margin-bottom: 12px;">No content available.</p>';
    }
    
    // Create professional letter content with proper formatting
    wrapper.innerHTML = `
      <div style="text-align: center; margin-bottom: 36px;">
        <h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 8px;">${letter.content?.header?.fullName || '[Your Name]'}</h1>
        <p style="margin-bottom: 12px;">${letter.content?.header?.date || new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <p style="margin-bottom: 4px;">Hiring Manager</p>
        <p style="margin-bottom: 4px;">${letter.content?.recipient?.company || 'Company Name'}</p>
      </div>
      
      <p style="margin-bottom: 24px;">Dear Hiring Manager,</p>
      
      <div style="margin-bottom: 24px; text-align: justify;">
        ${bodyContent}
      </div>
      
      <div style="margin-top: 36px;">
        <p style="margin-bottom: 24px;">${letter.content?.closing || 'Sincerely,'}</p>
        <p>${letter.content?.header?.fullName || '[Your Name]'}</p>
      </div>
    `;
    
    // Clone the wrapper to avoid layout issues
    const clone = wrapper.cloneNode(true) as HTMLElement;
    
    // Position off-screen (important for clean export)
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.display = "block";
    document.body.appendChild(clone);
    
    // Export the PDF with optimized settings
    window.html2pdf().set({
      margin: 0.5,
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
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