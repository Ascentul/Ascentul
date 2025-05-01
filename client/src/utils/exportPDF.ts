// We don't need to import html2pdf.js as it's loaded globally via script tag
// @ts-nocheck - Disable TypeScript checking for this file due to external library typings
declare global {
  interface Window {
    html2pdf: any;
  }
}

/**
 * Export the cover letter content as a PDF
 * This approach directly captures the rendered content for export
 */
export function exportCoverLetterToPDF(): void {
  // Find the PDF export content container
  const content = document.getElementById("pdf-export-content");

  if (!content || content.innerText.trim() === "") {
    alert("Cover letter content is empty.");
    return;
  }

  // Extract just the letter body text
  const bodyContent = content.querySelector(".whitespace-pre-wrap");
  
  if (!bodyContent || bodyContent.textContent.trim() === "") {
    alert("Letter body content is empty.");
    return;
  }
  
  // Create a plain text container for the PDF
  const container = document.createElement('div');
  container.style.position = "absolute";
  container.style.top = "-9999px";
  container.style.padding = "1in";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.fontSize = "12pt";
  container.style.lineHeight = "1.5";
  container.style.color = "#000";
  container.style.width = "8.5in";
  container.style.backgroundColor = "#fff";
  
  // Extract the plain text
  const letterBodyText = bodyContent.textContent || "";
  
  // Create a simple plain text container with just the letter body
  container.innerHTML = `
    <div style="white-space: pre-wrap; text-align: left;">
      ${letterBodyText}
    </div>
  `;
  
  document.body.appendChild(container);

  // Generate filename from date
  const filename = `cover-letter-body-${new Date().toISOString().split('T')[0]}.pdf`;

  console.log("Exporting letter body as PDF:", letterBodyText.substring(0, 100) + "...");

  // Configure PDF export options for plain text format
  window.html2pdf()
    .set({
      filename: filename,
      margin: 0.75,
      jsPDF: { 
        unit: "in", 
        format: "letter", 
        orientation: "portrait" 
      },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        allowTaint: true
      }
    })
    .from(container)
    .save()
    .then(() => {
      document.body.removeChild(container);
      alert("✅ Your letter body has been downloaded as PDF.");
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