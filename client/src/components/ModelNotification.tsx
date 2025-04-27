import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clearModelNotifications } from '@/lib/models-notifications';
import { useLocation } from 'wouter';

interface ModelNotificationProps {
  modelNames: string[];
  onDismiss: () => void;
  className?: string;
}

export function ModelNotification({ 
  modelNames, 
  onDismiss,
  className 
}: ModelNotificationProps) {
  const [, navigate] = useLocation();
  
  // Format model names for display
  const formattedModels = modelNames.join(', ');
  
  // Handle AI Coach navigation
  const handleNavigateToAICoach = () => {
    navigate('/ai-coach');
    onDismiss();
  };
  
  // If there are no model names, don't render anything
  if (!modelNames.length) return null;
  
  return (
    <div className={cn(
      "relative w-full bg-gradient-to-r from-blue-50 via-primary/5 to-blue-50 border-b border-primary/20 py-3 px-4 flex items-center justify-between",
      className
    )}>
      <div className="flex items-center space-x-2 flex-grow">
        <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-grow">
          <p className="text-sm font-medium">
            ✨ New AI {modelNames.length > 1 ? 'Models' : 'Model'} Available: <span className="text-primary font-semibold">{formattedModels}</span>
            {' '}— faster, smarter career coaching! Try it now in your AI Coach.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-2 text-xs bg-white hover:bg-primary hover:text-white"
          onClick={handleNavigateToAICoach}
        >
          Try Now
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// This component manages notification state and persistence
export function ModelNotificationContainer() {
  const [notifications, setNotifications] = React.useState<string[]>([]);
  const [dismissed, setDismissed] = React.useState(false);
  
  // Load notifications from localStorage on mount
  React.useEffect(() => {
    const storedNotifications = localStorage.getItem('ascentul_model_notifications');
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        // Extract model names from the stored notifications
        const modelNames = parsed.map((item: {id: string, label: string}) => item.label);
        setNotifications(modelNames);
      } catch (e) {
        console.error('Error parsing stored notifications:', e);
      }
    }
  }, []);
  
  // Handle dismiss
  const handleDismiss = () => {
    setDismissed(true);
    clearModelNotifications();
  };
  
  // If dismissed or no notifications, don't render
  if (dismissed || !notifications.length) return null;
  
  return (
    <ModelNotification 
      modelNames={notifications} 
      onDismiss={handleDismiss}
    />
  );
}