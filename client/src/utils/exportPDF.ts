// We don't need to import html2pdf.js as it's loaded globally via script tag
declare global {
  interface Window {
    html2pdf: any;
  }
}

/**
 * Export the cover letter content as a PDF
 * This simpler approach uses a visible element with ID "pdf-export-content"
 */
export function exportCoverLetterToPDF(): void {
  const source = document.getElementById("pdf-export-content");

  if (!source || source.innerText.trim() === "") {
    alert("❌ No cover letter content found to export.");
    return;
  }

  // Clone for export to avoid layout bugs
  const exportNode = source.cloneNode(true) as HTMLElement;
  exportNode.style.position = "absolute";
  exportNode.style.top = "-9999px";
  exportNode.style.left = "0";
  exportNode.style.display = "block";

  // Apply specific styles for the export
  exportNode.style.padding = "1in";
  exportNode.style.fontFamily = "Arial, sans-serif";
  exportNode.style.fontSize = "12pt";
  exportNode.style.lineHeight = "1.6";
  exportNode.style.color = "#000";

  document.body.appendChild(exportNode);

  window.html2pdf()
    .set({
      margin: 0,
      filename: "cover-letter.pdf",
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .from(exportNode)
    .save()
    .then(() => {
      document.body.removeChild(exportNode);
      alert("✅ Your cover letter has been downloaded.");
    })
    .catch((err) => {
      console.error("PDF export failed", err);
      document.body.removeChild(exportNode);
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