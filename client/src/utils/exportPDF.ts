// We don't need to import html2pdf.js as it's loaded globally via script tag
declare global {
  interface Window {
    html2pdf: any;
  }
}

export function exportCoverLetterToPDF(coverLetter: any): void {
  try {
    // Create a wrapper for the PDF export with professional styling
    const wrapper = document.createElement('div');
    wrapper.id = 'pdf-export-wrapper';
    wrapper.className = 'pdf-body';
    
    // Apply professional PDF styling
    wrapper.style.fontFamily = 'Arial, sans-serif';
    wrapper.style.fontSize = '12pt';
    wrapper.style.lineHeight = '1.6';
    wrapper.style.color = '#000';
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = '8.5in';
    wrapper.style.padding = '1.5in 1in';
    wrapper.style.backgroundColor = 'white';
    wrapper.style.boxSizing = 'border-box';
    
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
    document.body.appendChild(clone);
    
    // Export the PDF with optimized settings
    window.html2pdf().set({
      margin: [1, 1],
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
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