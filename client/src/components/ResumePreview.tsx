import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Download, ZoomIn, ZoomOut, X, Loader2, Printer } from 'lucide-react';
import { 
  ResumeTemplate, 
  ResumeContent, 
  TemplateType 
} from './ResumeTemplates';
import { motion } from 'framer-motion';

interface ResumePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: {
    id?: number;
    name: string;
    template: TemplateType;
    content: ResumeContent;
  } | null;
  onDownloadPDF: () => void;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({
  open,
  onOpenChange,
  resume,
  onDownloadPDF
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(0.9); // Initial scale for the resume preview
  
  // Simulate template loading (could remove this if performance is good)
  React.useEffect(() => {
    if (open && resume) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [open, resume]);

  // Handle zoom in/out
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 1.5));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  if (!resume) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col overflow-hidden bg-neutral-50">
        <DialogHeader className="p-4 px-6 bg-white border-b flex flex-row items-center justify-between">
          <div>
            <DialogTitle>{resume.name}</DialogTitle>
            <DialogDescription>
              {resume.template.charAt(0).toUpperCase() + resume.template.slice(1)} Template
            </DialogDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleZoomOut} 
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                defaultValue={[scale * 100]}
                max={150}
                min={50}
                step={5}
                className="w-24"
                value={[scale * 100]}
                onValueChange={(value) => setScale(value[0] / 100)}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleZoomIn} 
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadPDF}
              className="gap-1"
            >
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)} 
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-neutral-600">Preparing your preview...</p>
            </div>
          ) : (
            <motion.div 
              className="flex justify-center"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
            >
              <div className="bg-white shadow-md">
                <ResumeTemplate
                  content={resume.content}
                  templateType={resume.template}
                  scale={scale}
                />
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreview;