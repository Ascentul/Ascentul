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
import { exportResumeToPDF } from '@/utils/resumeExport';
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
  const [templateStyle, setTemplateStyle] = useState<ResumeTemplateStyle>('professional');
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
  
  const handleDownload = async () => {
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
      
      // Generate the filename
      const filename = `${resume?.name || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Use our centralized export utility
      const success = await exportResumeToPDF(
        resumePreviewElement as HTMLElement, 
        { 
          filename,
          showToast: false // We'll handle toasts ourselves for better loading state
        }
      );
      
      if (success) {
        toast({
          title: "Success",
          description: "Your resume has been downloaded as a PDF",
        });
      } else {
        toast({
          title: "Error",
          description: "PDF generation failed. Try again.",
          variant: "destructive"
        });
      }
      
      setIsLoading(false);
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