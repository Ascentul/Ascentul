import { useState } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Button 
} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Printer
} from 'lucide-react';
import ResumeTemplate from './ResumeTemplates';
import type { ResumeTemplateStyle } from './ResumeTemplates';
import { Loader2 } from 'lucide-react';
import { exportResumeToPDF } from '@/utils/exportPDF';
import { useToast } from '@/hooks/use-toast';

// Add html2pdf type for TypeScript
declare global {
  interface Window {
    html2pdf: any;
  }
}

interface ResumePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: any;
  onDownloadPDF: () => void;
}

export default function ResumePreview({ 
  open, 
  onOpenChange, 
  resume, 
  onDownloadPDF 
}: ResumePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [templateStyle, setTemplateStyle] = useState<ResumeTemplateStyle>('modern');
  const [zoomLevel, setZoomLevel] = useState(1);
  const { toast } = useToast();
  
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.1, 1.5));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.1, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    try {
      setIsLoading(true);
      
      // Create a unique ID for the template being displayed
      const templateId = `resume-preview-${Date.now()}`;
      
      // Get reference to the current template in the DOM
      const templateElement = document.querySelector('.resume-template');
      if (!templateElement) {
        toast({
          title: "Error",
          description: "Could not find resume template to export",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Clone the template to ensure we don't modify the displayed one
      const clonedTemplate = templateElement.cloneNode(true) as HTMLElement;
      clonedTemplate.id = templateId;
      
      // Create a special wrapper for PDF export
      const wrapper = document.createElement('div');
      wrapper.className = 'resume-pdf';
      
      // Make sure all styles are preserved for correct PDF rendering
      const style = document.createElement('style');
      style.textContent = `
        /* PDF container with specific dimensions and margins */
        .resume-pdf {
          width: 800px !important;
          margin: 0 auto !important;
          padding: 40px !important;
          font-family: 'Arial', sans-serif !important;
          font-size: 11pt !important;
          line-height: 1.5 !important;
          color: #000 !important;
          background-color: white !important;
          box-sizing: border-box !important;
        }
        
        /* Base template styles */
        #${templateId} {
          width: 100% !important;
          height: auto !important;
          background-color: white !important;
          color: black !important;
          font-family: Arial, sans-serif !important;
          box-sizing: border-box !important;
          transform: none !important;
          max-width: 100% !important;
          margin: 0 auto !important; /* Center the content */
          padding: 0 !important; /* No padding in the inner content */
          box-shadow: none !important;
          border: none !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          overflow: visible !important;
        }
        
        /* Ensure all elements are visible and preserve layout */
        .resume-pdf *, #${templateId} * {
          visibility: visible !important;
          color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          position: relative !important;
          overflow: visible !important;
        }
        
        /* Center all headings */
        .resume-pdf h1, .resume-pdf h2, .resume-pdf h3,
        #${templateId} h1, #${templateId} h2, #${templateId} h3 {
          text-align: center !important;
          margin-bottom: 12px !important;
          color: inherit !important;
        }
        
        /* Page break controls */
        .resume-pdf section, #${templateId} section {
          page-break-inside: avoid !important;
          margin-bottom: 20px !important;
        }
        
        /* Paragraph spacing */
        .resume-pdf p, #${templateId} p {
          margin: 0 0 12px !important;
        }
        
        /* Specific section styling */
        .resume-pdf .contact-info, #${templateId} .contact-info {
          text-align: center !important;
          margin-bottom: 20px !important;
        }
        
        /* Page break controls for sections */
        .resume-pdf .resume-header,
        .resume-pdf .contact-info,
        .resume-pdf .resume-section-header,
        #${templateId} .resume-header,
        #${templateId} .contact-info,
        #${templateId} .resume-section-header {
          page-break-after: avoid !important;
        }
        
        .resume-pdf .job-item,
        .resume-pdf .education-item,
        .resume-pdf .certification-item,
        .resume-pdf section, 
        .resume-pdf .section,
        #${templateId} .job-item,
        #${templateId} .education-item,
        #${templateId} .certification-item,
        #${templateId} section, 
        #${templateId} .section {
          margin-bottom: 16px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Print media query */
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .resume-pdf {
            margin: auto !important;
            page-break-after: always !important;
          }
        }
      `;
      
      // Create a wrapper for the template with proper centering and margins
      wrapper.appendChild(clonedTemplate);
      
      // Create a container to hold everything for PDF generation
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.appendChild(style);
      container.appendChild(wrapper);
      document.body.appendChild(container);
      
      // Use html2pdf for a more direct HTML-to-PDF conversion
      setTimeout(() => {
        try {
          const filename = `${resume?.name || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
          
          window.html2pdf()
            .set({
              // Set zero margins since we're handling them in CSS
              margin: 0,
              filename: filename,
              image: { type: 'jpeg', quality: 1.0 },
              html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 850, // Ensure enough width for content
                onclone: (clonedDoc: Document) => {
                  // Find the resume-pdf container in the cloned document
                  const resumePdfElements = clonedDoc.querySelectorAll('.resume-pdf');
                  resumePdfElements.forEach(container => {
                    const el = container as HTMLElement;
                    // Ensure the container is properly styled
                    el.style.width = '800px';
                    el.style.margin = '0 auto';
                    el.style.padding = '40px';
                    el.style.fontFamily = 'Arial, sans-serif';
                    el.style.fontSize = '11pt';
                    el.style.lineHeight = '1.5';
                    el.style.boxSizing = 'border-box';
                    
                    // Apply print-friendly styles to the template inside
                    const templateEl = el.querySelector(`#${templateId}`);
                    if (templateEl) {
                      (templateEl as HTMLElement).style.margin = '0 auto';
                      (templateEl as HTMLElement).style.width = '100%';
                      
                      // Center text elements
                      const headings = templateEl.querySelectorAll('h1, h2, h3');
                      headings.forEach(heading => {
                        (heading as HTMLElement).style.textAlign = 'center';
                        (heading as HTMLElement).style.marginBottom = '12px';
                      });
                      
                      // Ensure contact info is centered
                      const contactInfo = templateEl.querySelector('.contact-info');
                      if (contactInfo) {
                        (contactInfo as HTMLElement).style.textAlign = 'center';
                        (contactInfo as HTMLElement).style.marginBottom = '20px';
                      }
                    }
                  });
                }
              },
              jsPDF: { 
                unit: 'in', 
                format: 'letter', 
                orientation: 'portrait',
                compress: true
              },
              // Enable pagination with smart page breaks
              pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
                before: ['.page-break-before'],
                after: ['.page-break-after'],
                avoid: [
                  '.job-item', 
                  '.education-item', 
                  '.resume-section-header',
                  '.achievements',
                  'h1', 'h2', 'h3', 
                  'li'
                ]
              }
            })
            .from(wrapper)
            .save()
            .then(() => {
              // Success message
              toast({
                title: "Success",
                description: "Your resume has been downloaded as a PDF",
              });
              
              // Cleanup
              document.body.removeChild(container);
              setIsLoading(false);
            })
            .catch((err: any) => {
              console.error("PDF generation error:", err);
              toast({
                title: "Error",
                description: "PDF generation failed. Try again.",
                variant: "destructive"
              });
              document.body.removeChild(container);
              setIsLoading(false);
            });
        } catch (innerError) {
          console.error("Error in html2pdf process:", innerError);
          document.body.removeChild(container);
          setIsLoading(false);
        }
      }, 500); // Short delay to ensure DOM is ready
      
    } catch (error) {
      console.error("Error exporting resume to PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export resume. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-4 md:p-6">
        <DialogHeader className="pb-4 space-y-1">
          <DialogTitle className="text-xl font-semibold">
            {resume?.name || 'Resume Preview'}
          </DialogTitle>
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="flex space-x-2 items-center">
              <span className="text-sm font-medium mr-2">Template:</span>
              <Select
                value={templateStyle}
                onValueChange={(value) => setTemplateStyle(value as ResumeTemplateStyle)}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleZoomOut} 
                disabled={zoomLevel <= 0.5}
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetZoom}
                className="h-8"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">{Math.round(zoomLevel * 100)}%</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleZoomIn} 
                disabled={zoomLevel >= 1.5}
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
                className="h-8"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleDownload}
                disabled={isLoading}
                className="h-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="relative overflow-auto py-4 flex-1 max-h-[70vh]">
          {resume ? (
            <ResumeTemplate 
              resume={resume} 
              style={templateStyle}
              scale={zoomLevel}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-neutral-500">No resume data available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}