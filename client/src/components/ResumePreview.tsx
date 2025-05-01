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
      
      // Get reference to the current template in the DOM
      const resumePreviewElement = document.querySelector('.resume-template');
      if (!resumePreviewElement) {
        toast({
          title: "Error",
          description: "Could not find resume template to export",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Create a container with special export styling class
      const exportContainer = document.createElement('div');
      exportContainer.className = 'resume-export-container';
      
      // Clone the resume preview - this ensures we don't modify the visible element
      const clonedPreview = resumePreviewElement.cloneNode(true) as HTMLElement;
      
      // Remove any transform or scale that might be applied from the zoom controls
      clonedPreview.style.transform = 'none';
      clonedPreview.style.scale = '1';
      
      // Generate the filename
      const filename = `${resume?.name || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Add the cloned preview to our export container
      exportContainer.appendChild(clonedPreview);
      
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
                type: 'jpeg', 
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
                unit: 'in', 
                format: 'letter', // Standard US letter size
                orientation: 'portrait',
                compress: true // Smaller file size
              },
              // Intelligently handle page breaks
              pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
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
            .from(clonedPreview)
            .save()
            .then(() => {
              // Success notification
              toast({
                title: "Success",
                description: "Your resume has been downloaded as a PDF",
              });
              
              // Clean up the DOM
              document.body.removeChild(exportContainer);
              setIsLoading(false);
            })
            .catch((err: any) => {
              console.error("PDF generation error:", err);
              toast({
                title: "Error",
                description: "PDF generation failed. Try again.",
                variant: "destructive"
              });
              // Clean up even on error
              document.body.removeChild(exportContainer);
              setIsLoading(false);
            });
        } catch (innerError) {
          console.error("Error in html2pdf process:", innerError);
          document.body.removeChild(exportContainer);
          setIsLoading(false);
        }
      }, 100); // Ensure DOM is updated before capture
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