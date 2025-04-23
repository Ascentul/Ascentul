import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface LinkedInFrameProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  jobTitle?: string;
  companyName?: string;
  onOpenAssistant?: () => void;
}

export function LinkedInFrame({ isOpen, onClose, url, jobTitle, companyName, onOpenAssistant }: LinkedInFrameProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset state when URL changes
  useEffect(() => {
    if (url) {
      setIframeLoaded(false);
      setIframeError(false);
    }
  }, [url]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    
    // Check if the iframe can actually display the content
    // LinkedIn and many sites block being embedded in iframes
    try {
      // This will throw an error if the iframe is blocked due to X-Frame-Options
      if (iframeRef.current?.contentWindow?.location.href) {
        setIframeError(false);
      }
    } catch (error) {
      console.log('LinkedIn iframe blocked:', error);
      setIframeError(true);
    }
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIframeError(true);
  };

  // Open URL in new tab
  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl">
                {jobTitle ? jobTitle : "LinkedIn Job Search"}
                {companyName && ` at ${companyName}`}
              </DialogTitle>
              <DialogDescription className="text-sm truncate">
                {url}
              </DialogDescription>
            </div>
            
            <div className="flex space-x-2">
              {onOpenAssistant && (
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenAssistant();
                  }}
                  size="sm"
                >
                  Open AI Assistant
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {iframeError ? (
          <div className="flex flex-col items-center justify-center p-8 flex-1">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                LinkedIn prevents embedding job listings directly in our app. Please open the job in a new tab.
              </AlertDescription>
            </Alert>
            <Button onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open LinkedIn Job Search
            </Button>
            {onOpenAssistant && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Want AI help with your application? Open our assistant while you browse.
                </p>
                <Button 
                  onClick={onOpenAssistant}
                  variant="outline"
                >
                  Open AI Assistant
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 relative min-h-[60vh] bg-muted overflow-hidden">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2">Loading LinkedIn...</span>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        )}
        
        <DialogFooter className="p-4 border-t flex justify-between">
          <div className="text-xs text-muted-foreground">
            Note: This is a LinkedIn job search. We don't track, scrape, or store data from LinkedIn.
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}