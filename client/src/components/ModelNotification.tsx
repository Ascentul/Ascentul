import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useModelNotifications } from '@/hooks/use-model-notifications';
import { Button } from '@/components/ui/button';
import { 
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

// Alert banner for model notifications
export function ModelNotificationAlert() {
  const { hasNewModels, newModels, clearNotifications } = useModelNotifications();
  
  if (!hasNewModels) {
    return null;
  }

  return (
    <Alert className="mb-4 border-primary/20 bg-primary/5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="flex items-center text-base">
            <Bell className="h-4 w-4 mr-2 text-primary" />
            New AI Models Available!
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            {newModels.length === 1 ? (
              <span>
                <span className="font-medium">{newModels[0].label}</span> is now available for use in AI-powered features.
              </span>
            ) : (
              <span>
                <span className="font-medium">{newModels.length} new AI models</span> are now available for use, including {newModels.map(m => m.label).join(', ')}.
              </span>
            )}
          </AlertDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearNotifications}
          className="h-7 px-2 text-xs"
        >
          Dismiss
        </Button>
      </div>
    </Alert>
  );
}

// Bell notification icon with counter
export function ModelNotificationIcon() {
  const { hasNewModels, newModels, clearNotifications } = useModelNotifications();
  const [open, setOpen] = useState(false);
  
  // When the popover closes, clear notifications
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && hasNewModels) {
      clearNotifications();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNewModels && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {newModels.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-2">
          <h4 className="font-medium">AI Model Updates</h4>
          {hasNewModels ? (
            <>
              <p className="text-sm text-muted-foreground">
                The following new AI models are now available:
              </p>
              <ul className="text-sm space-y-1 mt-2">
                {newModels.map(model => (
                  <li key={model.id} className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2" />
                    <span className="font-medium">{model.label}</span>
                  </li>
                ))}
              </ul>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => setOpen(false)}
              >
                Got it
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No new AI models available at this time. Check back later.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Container that renders the alert in the appropriate context
export function ModelNotificationContainer() {
  return <ModelNotificationAlert />;
}