import { jsPDF } from "jspdf"

// For backward compatibility with existing code
declare global {
  interface Window {
    html2pdf: any
    linkedInProfile?: string | null
  }
}

/**
 * Export the cover letter content as a PDF using pure jsPDF
 * This approach works directly with the letter data rather than DOM elements
 */
export function exportCoverLetterToPDF(): void {
  try {
    // Get direct reference to the cover letter content element
    const previewLetterEl = document.getElementById("pdf-export-content")
    if (!previewLetterEl) {
      alert("❌ Could not find cover letter content. Please try again.")
      return
    }

          // Get the current HTML content
          const currentHTML = contactInfo.innerHTML

          // Replace LinkedIn text with a properly formatted hyperlink
          const updatedHTML = currentHTML.replace(
            /LinkedIn/g,
            `<a href="${window.linkedInProfile}" style="color:#0066cc !important; text-decoration:underline !important; font-weight:bold;">LinkedIn</a>`
          )

          // Update the contact info with the linked version
          contactInfo.innerHTML = updatedHTML
        } else if (email) {
          // Format as: Email | LinkedIn | Phone
          let newContent = email
          newContent += ` | <a href="${window.linkedInProfile}" style="color:#0066cc !important; text-decoration:underline !important; font-weight:bold;">LinkedIn</a>`
          if (phone) {
            newContent += ` | ${phone}`
          }
          contactInfo.innerHTML = newContent

            const updatedHTML = `${beforePipe}| <a href="${window.linkedInProfile}" style="color:#0066cc !important; text-decoration:underline !important; font-weight:bold;">LinkedIn</a> ${afterPipe}`
            contactInfo.innerHTML = updatedHTML
          } else {
            // Just append LinkedIn if no pipes
            const updatedHTML = `${currentHTML} | <a href="${window.linkedInProfile}" style="color:#0066cc !important; text-decoration:underline !important; font-weight:bold;">LinkedIn</a>`
            contactInfo.innerHTML = updatedHTML
          }
        }
      } else {

          newContactInfo.className = "contact-info text-neutral-700"
          newContactInfo.innerHTML = `<a href="${window.linkedInProfile}" style="color:#0066cc !important; text-decoration:underline !important; font-weight:bold;">LinkedIn</a>`

          // Insert after the header section
          headerSection.parentNode?.insertBefore(
            newContactInfo,
            headerSection.nextSibling
          )

        ) {
          // Replace all variations with the properly styled link
          let updatedHTML = bodyHTML

          // Replace {{LINKEDIN_URL}} placeholder
          updatedHTML = updatedHTML.replace(
            /\{\{LINKEDIN_URL\}\}/g,
            `<a href="${window.linkedInProfile}" style="color:#0066cc !important; text-decoration:underline !important; font-weight:bold;">LinkedIn</a>`
          )

          // Replace {{LinkedIn}} placeholder
          updatedHTML = updatedHTML.replace(
            /\{\{LinkedIn\}\}/g,
            `<a href="${window.linkedInProfile}" style="color:#0066cc !important; text-decoration:underline !important; font-weight:bold;">LinkedIn</a>`
          )

          // Replace "LinkedIn Profile" text
          updatedHTML = updatedHTML.replace(
            /LinkedIn Profile/g,
            `<a href="${window.linkedInProfile}" style="color:#0066cc !important; text-decoration:underline !important; font-weight:bold;">LinkedIn Profile</a>`
          )

          bodyContent.innerHTML = updatedHTML

        const senderName = nameElement?.textContent?.trim() || "Your Name"

        // Append closing to the letter body
        letterContent.innerHTML =
          letterContent.innerHTML +
          `
          <p>&nbsp;</p>
          <p>Sincerely,</p>
          <p>&nbsp;</p>
          <p>${senderName}</p>
        `
      }
    }

    // Apply consistent font styling to the clone before exporting
    const styleElement = document.createElement("style")
    styleElement.innerHTML = `
      * {
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
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
      a {
        color: #0066cc !important;
        text-decoration: underline !important;
      }
      
      a[href*="linkedin.com"] {
        color: #0077b5 !important; /* LinkedIn brand color */
        font-weight: bold !important;
        text-decoration: underline !important;
      }
    `
    clone.appendChild(styleElement)
    document.body.appendChild(clone)

    // Configure PDF export
    window
      .html2pdf()
      .set({
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
        document.body.removeChild(clone)
        alert("✅ Your cover letter has been downloaded.")
      })
      .catch((err: unknown) => {
        document.body.removeChild(clone)
        console.error("PDF export failed", err)
        alert("❌ Failed to export PDF. Please try again.")
      })
  } catch (error) {
    console.error("Error setting up PDF export:", error)
    alert("❌ Failed to prepare PDF. Please try again.")
  }
}
