// We don't need to import html2pdf.js as it's loaded globally via script tag
// @ts-nocheck - Disable TypeScript checking for this file due to external library typings
declare global {
  interface Window {
    html2pdf: any;
  }
}

/**
 * Export the cover letter content as a PDF
 * This approach directly creates and formats the content for export
 */
export function exportCoverLetterToPDF(): void {
  // Create a container with all the content directly
  const container = document.createElement('div');
  container.style.padding = "1in";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.fontSize = "12pt";
  container.style.lineHeight = "1.6";
  container.style.color = "#000";
  container.style.backgroundColor = "#fff";
  container.style.width = "8.5in";
  container.style.minHeight = "11in";
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  
  // Get source content
  const source = document.getElementById("pdf-export-content");
  
  if (!source) {
    alert("❌ Could not find cover letter content.");
    return;
  }

  // Extract the plain text from the elements
  const fullName = source.querySelector("h2")?.textContent || "Your Name";
  const contactInfo = Array.from(source.querySelectorAll('.text-sm span'))
    .map(span => span.textContent)
    .filter(text => text && text.trim().length > 0)
    .join(' | ');
  const date = source.querySelector('.text-neutral-500')?.textContent || new Date().toLocaleDateString();
  
  // For recipient and body content
  const recipientLines = Array.from(source.querySelectorAll('.space-y-1 p')).map(p => p.textContent);
  const greeting = source.querySelector("p:not(.text-sm):not(.text-xs):not(.text-neutral-500)")?.textContent || "Dear Hiring Manager,";
  
  // Get the body content
  const bodyText = source.querySelector('.whitespace-pre-wrap')?.textContent || "";
  
  // Get the closing
  const closingElements = Array.from(source.querySelectorAll('.space-y-4 p'));
  const closing = closingElements[0]?.textContent || "Sincerely,";
  const signature = closingElements[1]?.textContent || fullName;
  
  // Format the content as plain HTML
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 18pt; font-weight: bold; margin-bottom: 8px;">${fullName}</div>
      <div style="margin-bottom: 4px;">${contactInfo}</div>
      <div>${date}</div>
    </div>
    
    <div style="margin-bottom: 24px;">
      ${recipientLines.map(line => `<div>${line || ''}</div>`).join('')}
    </div>
    
    <div style="margin-bottom: 16px;">${greeting}</div>
    
    <div style="text-align: justify; margin-bottom: 24px; white-space: pre-wrap">
      ${bodyText}
    </div>
    
    <div style="margin-top: 24px;">
      <div style="margin-bottom: 48px;">${closing}</div>
      <div>${signature}</div>
    </div>
  `;
  
  // Append to body temporarily
  document.body.appendChild(container);
  
  // Export as PDF
  console.log("Exporting PDF with content:", container.innerText);
  
  window.html2pdf()
    .set({
      margin: 0,
      filename: "cover-letter.pdf",
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: true,
        letterRendering: true 
      },
      jsPDF: { 
        unit: "in", 
        format: "letter", 
        orientation: "portrait" 
      }
    })
    .from(container)
    .save()
    .then(() => {
      document.body.removeChild(container);
      alert("✅ Your cover letter has been downloaded.");
    })
    .catch((err: any) => {
      console.error("PDF export failed", err);
      document.body.removeChild(container);
      alert("❌ Failed to export PDF. Please try again.");
    });
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