import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LinkedInFrameProps {
  isOpen: boolean;
  onClose: () => void;
  jobUrl: string;
  onSelectJob?: (jobInfo: { title: string; company: string; description: string }) => void;
}

export function LinkedInFrame({ isOpen, onClose, jobUrl, onSelectJob }: LinkedInFrameProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Reset state when URL changes
  useEffect(() => {
    if (jobUrl) {
      setLoading(true);
      setLoadError(false);
    }
  }, [jobUrl]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setLoadError(true);
    
    // After a brief delay, automatically redirect to new tab since LinkedIn blocks iframe embedding
    setTimeout(() => {
      openInNewTab();
    }, 2000);
  };

  const openInNewTab = () => {
    window.open(jobUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle selecting a job from the iframe (placeholder for future integration)
  const handleSelectCurrentJob = () => {
    if (onSelectJob) {
      // In a real implementation, we would try to extract job details from the iframe
      // For now, we'll just use the URL to construct basic info
      const urlParts = jobUrl.split('/');
      const jobTitle = urlParts.includes('keywords') 
        ? decodeURIComponent(jobUrl.split('keywords=')[1]?.split('&')[0] || 'LinkedIn Job')
        : 'LinkedIn Job';
      
      onSelectJob({
        title: jobTitle,
        company: 'LinkedIn',
        description: 'To view the full job description, please click the "Open in LinkedIn" button.'
      });
      
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle className="text-xl">LinkedIn Job</DialogTitle>
              <DialogDescription>View job details and apply directly through LinkedIn</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openInNewTab} className="flex items-center gap-1">
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectCurrentJob} className="flex items-center gap-1">
                Select Job
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="relative flex-1 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full border-4 border-t-blue-500 animate-spin mb-4"></div>
                <p className="text-gray-500">Loading LinkedIn job page...</p>
              </div>
            </div>
          )}
          
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="max-w-md mx-auto">
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Unable to load LinkedIn content in the iframe. This might be due to LinkedIn's content security policy.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center">
                  <Button onClick={openInNewTab}>
                    Open in New Tab Instead
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={jobUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="LinkedIn Job"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}