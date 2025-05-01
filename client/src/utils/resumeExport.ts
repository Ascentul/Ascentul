import { toast } from "@/hooks/use-toast";
import { Resume } from "@/types/resume";

/**
 * Creates a PDF export of a resume using html2pdf
 * 
 * This function can be used in two ways:
 * 1. From a DOM element ID - for exports triggered from the Resume listing page
 * 2. From a DOM element - for exports triggered from the ResumePreview modal
 * 
 * @param sourceResume The resume data or DOM element to export
 * @param options Additional export options
 */
export function exportResumeToPDF(
  sourceResume: Resume | HTMLElement | string,
  options?: {
    filename?: string;
    showToast?: boolean;
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Set default options
      const filename = options?.filename || 
        (typeof sourceResume !== "string" && "name" in sourceResume) 
          ? `${sourceResume.name}_${new Date().toISOString().split("T")[0]}.pdf`
          : `Resume_${new Date().toISOString().split("T")[0]}.pdf`;
      
      const showToast = options?.showToast !== false;
      
      // Handle different input types
      let resumeElement: HTMLElement | null = null;
      
      if (typeof sourceResume === "string") {
        // If source is a string, assume it's an element ID
        resumeElement = document.getElementById(sourceResume);
        if (!resumeElement) {
          if (showToast) {
            toast({
              title: "Error",
              description: "Could not find resume element to export",
              variant: "destructive",
            });
          }
          resolve(false);
          return;
        }
      } else if (sourceResume instanceof HTMLElement) {
        // If source is already an HTMLElement
        resumeElement = sourceResume;
      } else if (typeof sourceResume === "object" && sourceResume !== null) {
        // If source is a Resume object, we need to find the resume preview
        resumeElement = document.querySelector(".resume-template");
        if (!resumeElement) {
          if (showToast) {
            toast({
              title: "Error",
              description: "Could not find resume template to export",
              variant: "destructive",
            });
          }
          resolve(false);
          return;
        }
      } else {
        if (showToast) {
          toast({
            title: "Error",
            description: "Invalid source for resume export",
            variant: "destructive",
          });
        }
        resolve(false);
        return;
      }
      
      // Create a container with special export styling class
      const exportContainer = document.createElement("div");
      exportContainer.className = "resume-export-container";
      
      // Clone the resume element - this ensures we don't modify the visible element
      const clonedElement = resumeElement.cloneNode(true) as HTMLElement;
      
      // Remove any transform or scale that might be applied
      clonedElement.style.transform = "none";
      clonedElement.style.scale = "1";
      
      // Add the cloned element to our export container
      exportContainer.appendChild(clonedElement);
      
      // Add the container to the DOM (required for html2canvas to work)
      document.body.appendChild(exportContainer);
      
      // Short delay to ensure DOM is ready before capturing
      setTimeout(() => {
        try {
          // Configure html2pdf for high-quality output
          window.html2pdf()
            .set({
              margin: 0, // No margins, handled in CSS
              filename: filename,
              image: { 
                type: "jpeg", 
                quality: 0.98 // High quality image
              },
              html2canvas: { 
                scale: 2, // Double resolution for sharp text
                useCORS: true, // Allow cross-origin images
                letterRendering: true, // Better text rendering
                scrollX: 0, // Prevent scroll offsets
                scrollY: 0,
                logging: false, // Disable console logs
                windowWidth: document.documentElement.clientWidth // Use full width
              },
              jsPDF: { 
                unit: "in", 
                format: "letter", // Standard US letter size
                orientation: "portrait",
                compress: true // Smaller file size
              },
              // Intelligently handle page breaks
              pagebreak: { 
                mode: ["avoid-all", "css", "legacy"],
                avoid: [
                  ".job-item", 
                  ".education-item", 
                  ".resume-section-header",
                  ".achievements",
                  "h1", "h2", "h3", 
                  "li"
                ]
              }
            })
            .from(clonedElement)
            .save()
            .then(() => {
              if (showToast) {
                // Success notification
                toast({
                  title: "Success",
                  description: "Your resume has been downloaded as a PDF",
                });
              }
              
              // Clean up the DOM
              document.body.removeChild(exportContainer);
              resolve(true);
            })
            .catch((err: any) => {
              console.error("PDF generation error:", err);
              if (showToast) {
                toast({
                  title: "Error",
                  description: "PDF generation failed. Try again.",
                  variant: "destructive"
                });
              }
              // Clean up even on error
              document.body.removeChild(exportContainer);
              resolve(false);
            });
        } catch (innerError) {
          console.error("Error in html2pdf process:", innerError);
          document.body.removeChild(exportContainer);
          resolve(false);
        }
      }, 100); // Ensure DOM is updated before capture
      
    } catch (error) {
      console.error("Error exporting resume to PDF:", error);
      if (options?.showToast !== false) {
        toast({
          title: "Error",
          description: "Failed to export resume. Please try again.",
          variant: "destructive"
        });
      }
      resolve(false);
    }
  });
}