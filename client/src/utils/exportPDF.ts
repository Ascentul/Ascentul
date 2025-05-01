import html2pdf from 'html2pdf.js';

export function exportCoverLetterToPDF(coverLetter: any) {
  // Create a temporary div for PDF export with professional styling
  const container = document.createElement('div');
  container.id = 'coverLetterPreview';
  
  // Apply professional PDF styling
  container.style.width = '8.5in';
  container.style.minHeight = '11in';
  container.style.padding = '1in';
  container.style.fontFamily = 'Georgia, serif';
  container.style.fontSize = '12pt';
  container.style.lineHeight = '1.6';
  container.style.color = '#000';
  container.style.backgroundColor = 'white';
  container.style.boxSizing = 'border-box';
  
  // Get letter data
  const letter = coverLetter;
  
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
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 36px;">
      <h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 8px; font-family: Georgia, serif;">${letter.content?.header?.fullName || '[Your Name]'}</h1>
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
  
  // Position off-screen
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);
  
  // Generate filename
  const filename = `${letter.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Export the PDF
  html2pdf().set({
    margin: 0,
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
  })
  .from(container)
  .save()
  .then(() => {
    document.body.removeChild(container);
    alert("✅ Your cover letter has been downloaded.");
  })
  .catch((err) => {
    document.body.removeChild(container);
    console.error("PDF export failed", err);
    alert("❌ Failed to export PDF. Please try again.");
  });
}