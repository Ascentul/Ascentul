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
  title: string;
  description: string;
  endpoint: string; // API endpoint to call for deletion
  itemId: number;
  itemType: string; // For toast messages (e.g., "Work history", "Education", etc.)
  onSuccess?: () => void;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  endpoint,
  itemId,
  itemType,
  onSuccess,
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

  const handleDelete = () => {
    deleteMutation.mutate();
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