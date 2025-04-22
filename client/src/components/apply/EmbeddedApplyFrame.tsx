import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';

interface EmbeddedApplyFrameProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  applyUrl: string;
}

export function EmbeddedApplyFrame({ 
  isOpen, 
  onClose, 
  jobTitle, 
  companyName, 
  applyUrl 
}: EmbeddedApplyFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  
  useEffect(() => {
    // Reset states when opening/closing
    if (isOpen) {
      setIsLoading(true);
      setIframeError(false);
    }
  }, [isOpen]);
  
  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] h-[90vh] w-full p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Apply to {jobTitle}</DialogTitle>
          <DialogDescription>
            {companyName} • Click continue to view the application form
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative h-full p-6 pt-2 pb-16 flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p>Loading application form...</p>
              </div>
            </div>
          )}
          
          {iframeError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <svg className="h-12 w-12 text-muted-foreground mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Unable to load the application form</h3>
              <p className="text-muted-foreground mb-6">
                This website may not allow embedding. You can still apply by visiting the original job posting.
              </p>
              <a 
                href={applyUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Application in New Tab
                </Button>
              </a>
            </div>
          ) : (
            <>
              <div className="flex-1 border rounded overflow-hidden">
                <iframe 
                  src={applyUrl}
                  className="w-full h-full border-0" 
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                  referrerPolicy="no-referrer"
                  title={`Application for ${jobTitle} at ${companyName}`}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Applying for: {jobTitle}
                </p>
                <div className="flex gap-2">
                  <a 
                    href={applyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open in new tab
                  </a>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}