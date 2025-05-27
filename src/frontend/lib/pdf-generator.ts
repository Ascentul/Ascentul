/**
 * Generate and download a PDF from an HTML element
 * @param elementId The ID of the HTML element to convert to PDF
 */
export function generatePDFFromElement(elementId: string): void {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with ID ${elementId} not found`)
    return
  }

  // Use window.print() to print the specific element
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    console.error("Failed to open print window")
    return
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body {
            font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
          @media print {
            body {
              width: 210mm;
              height: 297mm;
            }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()

  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

/**
 * Handle downloading a PDF by generating one from the specified element
 * @param elementId The ID of the HTML element to convert to PDF
 */
export function handleDownloadPDF(elementId: string): void {
  generatePDFFromElement(elementId)
}

/**
 * Handle saving a design using the global window function
 */
export function handleSaveDesign(): void {
  if (typeof window.saveDesignFunction === "function") {
    window.saveDesignFunction()
  } else {
    console.error("Save design function not available")
  }
}

/**
 * Handle exporting a design to PDF using the global window function
 */
export function handleExportToPDF(): void {
  if (typeof window.exportToPDFFunction === "function") {
    window.exportToPDFFunction()
  } else {
    console.error("Export to PDF function not available")
  }
}
