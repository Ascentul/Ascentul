import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
export function DeleteConfirmationDialog({ open, onOpenChange, title = "Confirm deletion", description = "Are you sure you want to delete this item? This action cannot be undone.", endpoint, itemId, itemType, onSuccess, onConfirm, }) {
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
        onError: (error) => {
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
                if (onSuccess)
                    onSuccess();
            }
            catch (error) {
                toast({
                    title: 'Error',
                    description: error.message || `Failed to delete ${itemType.toLowerCase()}`,
                    variant: 'destructive',
                });
            }
            finally {
                setIsDeleting(false);
            }
        }
        else if (endpoint && itemId) {
            deleteMutation.mutate();
        }
        else {
            console.error('DeleteConfirmationDialog: Either onConfirm or endpoint+itemId must be provided');
            toast({
                title: 'Configuration Error',
                description: 'The delete dialog is not properly configured.',
                variant: 'destructive',
            });
        }
    };
    return (_jsx(AlertDialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: title }), _jsx(AlertDialogDescription, { children: description })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(Button, { variant: "destructive", onClick: handleDelete, disabled: isDeleting, children: isDeleting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Deleting..."] })) : ('Delete') })] })] }) }));
}
