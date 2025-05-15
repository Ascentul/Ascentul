import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  endpoint?: string; // API endpoint to call for deletion
  itemId?: number;
  itemType: string; // For toast messages (e.g., "Work history", "Education", etc.)
  onSuccess?: () => void;
  onConfirm?: () => Promise<void>; // Custom confirm handler for direct API calls
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title = "Confirm deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  endpoint,
  itemId,
  itemType,
  onSuccess,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      const response = await apiRequest('DELETE', `${endpoint}/${itemId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to delete ${itemType.toLowerCase()}` }));
        throw new Error(errorData.error || `Failed to delete ${itemType.toLowerCase()}`);
      }

      // For successful responses, don't try to parse JSON if it's 204 No Content
      if (response.status === 204) {
        return { success: true };
      }
      
      return await response.json().catch(() => ({ success: true }));
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: `${itemType} deleted`,
        description: `The ${itemType.toLowerCase()} has been deleted successfully.`,
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/career-data'] });

      // Close the dialog
      onOpenChange(false);

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    if (onConfirm) {
      setIsDeleting(true);
      try {
        await onConfirm();
        toast({
          title: `${itemType} deleted`,
          description: `The ${itemType.toLowerCase()} has been deleted successfully.`,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || `Failed to delete ${itemType.toLowerCase()}`,
          variant: 'destructive',
        });
      } finally {
        setIsDeleting(false);
      }
    } else if (endpoint && itemId) {
      deleteMutation.mutate();
    } else {
      console.error('DeleteConfirmationDialog: Either onConfirm or endpoint+itemId must be provided');
      toast({
        title: 'Configuration Error',
        description: 'The delete dialog is not properly configured.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}