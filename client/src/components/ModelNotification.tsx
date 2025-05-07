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

// Alert banner for model notifications - disabled per user request
export function ModelNotificationAlert() {
  // Always return null to prevent the notification from appearing
  return null;
}

// Bell notification icon with counter - disabled per user request
export function ModelNotificationIcon() {
  // Simply return the bell icon without any notifications
  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
    </Button>
  );
}

// Container that renders the alert in the appropriate context
export function ModelNotificationContainer() {
  return <ModelNotificationAlert />;
}