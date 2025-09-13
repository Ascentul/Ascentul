import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  applyUrl,
}: EmbeddedApplyFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFrameBlocked, setIsFrameBlocked] = useState(false);
  const [frameHeight, setFrameHeight] = useState(600);

  // Check if frame can be loaded or if it's blocked by the target site
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setIsFrameBlocked(false);

    const timeoutId = setTimeout(() => {
      // If loading takes too long, assume the frame is blocked
      if (isLoading) {
        setIsFrameBlocked(true);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isOpen, applyUrl]);

  // Handle iframe load success
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe load error
  const handleIframeError = () => {
    setIsLoading(false);
    setIsFrameBlocked(true);
  };

  // Handle opening the application in a new tab
  const openInNewTab = () => {
    window.open(applyUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Apply: {jobTitle}</DialogTitle>
          <DialogDescription>
            Complete your application for {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading application form...</p>
            </div>
          )}

          {isFrameBlocked ? (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
              <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Unable to load application form</h3>
              <p className="text-center text-muted-foreground mb-6 max-w-md">
                This website doesn't allow their application form to be embedded.
                You'll need to apply directly on their website.
              </p>
              <Button onClick={openInNewTab} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Apply on {companyName}'s website
              </Button>
            </div>
          ) : (
            <div className="px-6 min-h-[400px]">
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-700">
                  Some job sites may block embedding. If the form doesn't load, use the "Open Original" button below.
                </AlertDescription>
              </Alert>
              <iframe
                src={applyUrl}
                className="w-full border rounded-md"
                style={{ height: `${frameHeight}px`, minHeight: '400px' }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!isFrameBlocked && (
              <Button variant="outline" onClick={openInNewTab} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Original
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}