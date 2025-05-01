import { jsPDF } from 'jspdf';

// For backward compatibility with existing code
declare global {
  interface Window {
    html2pdf: any;
  }
}

/**
 * Export the cover letter content as a PDF using pure jsPDF
 * This approach works directly with the letter data rather than DOM elements
 */
export function exportCoverLetterToPDF(): void {
  try {
    // Get direct reference to the global preview letter data
    // We need to use the window.coverLetter to access this data
    const previewLetterEl = document.getElementById("pdf-export-content");
    if (!previewLetterEl) {
      alert("❌ Could not find cover letter content. Please try again.");
      return;
    }
    
    // Extract text directly from the DOM structure
    const letterBodyElement = previewLetterEl.querySelector(".whitespace-pre-wrap");
    const letterBody = letterBodyElement?.textContent || "";
    
    // Get name and other details
    const fullNameElement = previewLetterEl.querySelector("h2");
    const fullName = fullNameElement?.textContent || "Your Name";
    
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
    
    // Set font
    doc.setFont("helvetica");
    doc.setFontSize(12);
    
    // Define margins (1 inch = 25.4mm)
    const margin = 25.4; 
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Calculate text width (accounting for margins)
    const textWidth = pageWidth - (margin * 2);
    
    // Add title at the top
    doc.setFontSize(16);
    doc.text(`Cover Letter: ${fullName}`, margin, margin);
    
    // Add a separator line
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 5, pageWidth - margin, margin + 5);
    
    // Reset font size for body
    doc.setFontSize(12);
    
    // Split text to fit within page width and respect line breaks
    const bodyLines = doc.splitTextToSize(letterBody, textWidth);
    
    // Add content with proper spacing
    doc.text(bodyLines, margin, margin + 15);
    
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