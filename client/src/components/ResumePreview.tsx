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
      
      // Make sure all styles are preserved for correct PDF rendering
      const style = document.createElement('style');
      style.textContent = `
        #${templateId} {
          width: 8.5in !important;
          height: auto !important;
          background-color: white !important;
          color: black !important;
          font-family: Arial, sans-serif !important;
          box-sizing: border-box !important;
          transform: none !important;
          max-width: 100% !important;
          padding: 0.5in !important;
          box-shadow: none !important;
          border: none !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        #${templateId} * {
          visibility: visible !important;
          color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          position: relative !important;
        }
        
        #${templateId} h1, #${templateId} h2, #${templateId} h3 {
          color: inherit !important;
          margin-top: 0.5em !important;
          margin-bottom: 0.5em !important;
        }
        
        #${templateId} section, #${templateId} .section {
          margin-bottom: 1em !important;
          page-break-inside: avoid !important;
        }
      `;
      
      // Create a container for the cloned template
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.appendChild(style);
      container.appendChild(clonedTemplate);
      document.body.appendChild(container);
      
      // Use html2pdf for a more direct HTML-to-PDF conversion
      setTimeout(() => {
        try {
          const filename = `${resume?.name || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
          
          window.html2pdf()
            .set({
              margin: [0.5, 0.5, 0.5, 0.5],
              filename: filename,
              image: { type: 'jpeg', quality: 1.0 },
              html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true,
                scrollX: 0,
                scrollY: 0,
              },
              jsPDF: { 
                unit: 'in', 
                format: 'letter', 
                orientation: 'portrait',
                compress: true
              }
            })
            .from(clonedTemplate)
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