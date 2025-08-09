import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { convertToCSV, generateExportFileName, downloadFile } from '@/utils/csvExport';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Star, Search, Eye, Flag, Trash2, RefreshCw, Download, } from 'lucide-react';
// Review detail dialog component
function ReviewDetailDialog({ review, open, onOpenChange }) {
    const [status, setStatus] = useState(review?.review.status || 'pending');
    const [isPublic, setIsPublic] = useState(review?.review.isPublic || true);
    const [adminNotes, setAdminNotes] = useState(review?.review.adminNotes || '');
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const updateReviewMutation = useMutation({
        mutationFn: async (data) => {
            if (!review)
                return null;
            const response = await apiRequest('PATCH', `/api/reviews/${review.review.id}`, data);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update review');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            toast({
                title: "Review updated",
                description: "The review has been successfully updated.",
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: "Error updating review",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const flagReviewMutation = useMutation({
        mutationFn: async () => {
            if (!review)
                return null;
            const response = await apiRequest('POST', `/api/reviews/flag/${review.review.id}`, {
                adminNotes: adminNotes || "Flagged by administrator"
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to flag review');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            toast({
                title: "Review flagged",
                description: "The review has been flagged and hidden from public view.",
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: "Error flagging review",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const deleteReviewMutation = useMutation({
        mutationFn: async () => {
            if (!review)
                return null;
            const response = await apiRequest('DELETE', `/api/reviews/${review.review.id}`, {});
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete review');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            toast({
                title: "Review deleted",
                description: "The review has been permanently deleted.",
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: "Error deleting review",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    if (!review)
        return null;
    const handleSave = () => {
        updateReviewMutation.mutate({ status, isPublic, adminNotes });
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-3xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Review Details" }), _jsxs(DialogDescription, { children: ["Review submitted by ", review.user.name, " on ", new Date(review.review.createdAt).toLocaleDateString()] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 py-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "User Information" }), _jsxs("p", { className: "text-sm", children: [review.user.name, " (", review.user.email, ")"] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Rating" }), _jsxs("div", { className: "flex items-center", children: [Array.from({ length: 5 }).map((_, i) => (_jsx(Star, { className: `h-5 w-5 ${i < review.review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}` }, i))), _jsxs("span", { className: "ml-2 text-sm font-semibold", children: [review.review.rating, "/5"] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Review Source" }), _jsx(Badge, { variant: "outline", children: review.review.source })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "App Version" }), _jsx("p", { className: "text-sm", children: review.review.appVersion || 'Not recorded' })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Date Submitted" }), _jsx("p", { className: "text-sm", children: new Date(review.review.createdAt).toLocaleString() })] }), review.review.moderatedAt && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Last Moderated" }), _jsx("p", { className: "text-sm", children: new Date(review.review.moderatedAt).toLocaleString() })] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Feedback" }), _jsx("div", { className: "p-3 bg-muted rounded-md text-sm", children: review.review.feedback || 'No written feedback provided' })] }), _jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "status", children: "Moderation Status" }), _jsxs(Select, { value: status, onValueChange: setStatus, children: [_jsx(SelectTrigger, { id: "status", className: "w-40", children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "approved", children: "Approved" }), _jsx(SelectItem, { value: "rejected", children: "Rejected" })] })] })] }) }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "public", checked: isPublic, onCheckedChange: setIsPublic }), _jsx(Label, { htmlFor: "public", children: "Show publicly" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "adminNotes", children: "Admin Notes" }), _jsx(Textarea, { id: "adminNotes", placeholder: "Add private notes about this review...", value: adminNotes, onChange: (e) => setAdminNotes(e.target.value), className: "h-20" })] })] })] }), _jsxs(DialogFooter, { className: "flex flex-col sm:flex-row sm:justify-between gap-2", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsxs(Button, { variant: "destructive", onClick: () => deleteReviewMutation.mutate(), disabled: deleteReviewMutation.isPending, children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), deleteReviewMutation.isPending ? 'Deleting...' : 'Delete Review'] }), _jsxs(Button, { variant: "secondary", onClick: () => flagReviewMutation.mutate(), disabled: flagReviewMutation.isPending, children: [_jsx(Flag, { className: "h-4 w-4 mr-2" }), flagReviewMutation.isPending ? 'Flagging...' : 'Flag as Inappropriate'] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: updateReviewMutation.isPending, children: updateReviewMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), "Saving..."] })) : ('Save Changes') })] })] })] }) }));
}
export default function ReviewsPage() {
    // Get toast from useToast hook
    const { toast } = useToast();
    // State for filters
    const [rating, setRating] = useState('all');
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    // State for selected review
    const [selectedReview, setSelectedReview] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    // Query for fetching reviews
    const { data: reviews, isLoading, isError } = useQuery({
        queryKey: ['reviews', rating, status, search, sortBy, sortOrder],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (rating !== 'all')
                queryParams.set('rating', rating);
            if (status !== 'all')
                queryParams.set('status', status);
            if (search)
                queryParams.set('search', search);
            if (sortBy)
                queryParams.set('sortBy', sortBy);
            if (sortOrder)
                queryParams.set('sortOrder', sortOrder);
            const response = await apiRequest('GET', `/api/reviews?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }
            return response.json();
        }
    });
    // Analytics data
    const reviewStats = {
        total: reviews?.length || 0,
        pending: reviews?.filter((r) => r.review.status === 'pending').length || 0,
        approved: reviews?.filter((r) => r.review.status === 'approved').length || 0,
        rejected: reviews?.filter((r) => r.review.status === 'rejected').length || 0,
        averageRating: reviews?.length
            ? (reviews.reduce((acc, r) => acc + r.review.rating, 0) / reviews.length).toFixed(1)
            : 'N/A'
    };
    const handleViewReview = (review) => {
        setSelectedReview(review);
        setDetailDialogOpen(true);
    };
    // State for export functionality
    const [isExporting, setIsExporting] = useState(false);
    // Handle export to CSV
    const handleExportReviews = async () => {
        try {
            setIsExporting(true);
            // Use current filtered/sorted reviews
            if (!reviews || reviews.length === 0) {
                toast({
                    title: "No reviews to export",
                    description: "No reviews found with the current filters.",
                    variant: "destructive",
                });
                return;
            }
            // Define the CSV headers
            const headers = {
                "User": (r) => r.user.name,
                "Email": (r) => r.user.email,
                "Rating": (r) => r.review.rating,
                "Comment": (r) => r.review.feedback || '',
                "Date": (r) => new Date(r.review.createdAt).toISOString(),
                "Status": (r) => r.review.status,
                "Source": (r) => r.review.source,
                "App Version": (r) => r.review.appVersion || '',
            };
            // Convert to CSV
            const csvContent = convertToCSV(reviews, headers);
            // Generate filename with timestamp
            const fileName = generateExportFileName('customer_reviews');
            // Trigger download
            downloadFile(csvContent, fileName);
            toast({
                title: "Export successful",
                description: `${reviews.length} reviews exported to ${fileName}`,
            });
        }
        catch (error) {
            toast({
                title: "Export failed",
                description: error instanceof Error ? error.message : "Unknown error occurred",
                variant: "destructive",
            });
        }
        finally {
            setIsExporting(false);
        }
    };
    // Render status badge based on review status
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return _jsx(Badge, { variant: "outline", className: "bg-yellow-100 text-yellow-800", children: "Pending" });
            case 'approved':
                return _jsx(Badge, { variant: "outline", className: "bg-green-100 text-green-800", children: "Approved" });
            case 'rejected':
                return _jsx(Badge, { variant: "outline", className: "bg-red-100 text-red-800", children: "Rejected" });
            default:
                return _jsx(Badge, { variant: "outline", children: "Unknown" });
        }
    };
    return (_jsxs("div", { className: "space-y-8 p-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Total Reviews" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: reviewStats.total }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Average Rating" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-2xl font-bold mr-2", children: reviewStats.averageRating }), reviewStats.averageRating !== 'N/A' && (_jsx(Star, { className: "h-5 w-5 text-yellow-400 fill-yellow-400" }))] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Pending" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold text-yellow-600", children: reviewStats.pending }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Approved" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold text-green-600", children: reviewStats.approved }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Rejected" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold text-red-600", children: reviewStats.rejected }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Customer Reviews" }), _jsx(CardDescription, { children: "Manage and moderate customer reviews across the platform" })] }), _jsx(Button, { onClick: handleExportReviews, disabled: isExporting || isLoading || !reviews?.length, className: "mt-4 sm:mt-0", children: isExporting ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), "Exporting..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export Reviews"] })) })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsx("div", { children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search reviews...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10 w-full" })] }) }), _jsx("div", { children: _jsxs(Select, { value: rating, onValueChange: setRating, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by rating" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Ratings" }), _jsx(SelectItem, { value: "5", children: "5 Stars" }), _jsx(SelectItem, { value: "4", children: "4 Stars" }), _jsx(SelectItem, { value: "3", children: "3 Stars" }), _jsx(SelectItem, { value: "2", children: "2 Stars" }), _jsx(SelectItem, { value: "1", children: "1 Star" })] })] }) }), _jsx("div", { children: _jsxs(Select, { value: status, onValueChange: setStatus, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "approved", children: "Approved" }), _jsx(SelectItem, { value: "rejected", children: "Rejected" })] })] }) }), _jsx("div", { children: _jsxs(Select, { value: sortBy, onValueChange: setSortBy, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Sort by" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "createdAt", children: "Date" }), _jsx(SelectItem, { value: "rating", children: "Rating" })] })] }) }), _jsx("div", { children: _jsxs(Select, { value: sortOrder, onValueChange: setSortOrder, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Sort order" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "desc", children: "Newest First" }), _jsx(SelectItem, { value: "asc", children: "Oldest First" })] })] }) })] }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Date" }), _jsx(TableHead, { children: "User" }), _jsx(TableHead, { children: "Rating" }), _jsx(TableHead, { children: "Feedback" }), _jsx(TableHead, { children: "Source" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Action" })] }) }), _jsx(TableBody, { children: isLoading ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 7, className: "h-24 text-center", children: _jsx("div", { className: "flex justify-center", children: _jsx(RefreshCw, { className: "h-6 w-6 animate-spin text-primary" }) }) }) })) : isError ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 7, className: "h-24 text-center text-red-500", children: "Error loading reviews. Please try again." }) })) : reviews?.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 7, className: "h-24 text-center", children: _jsxs("div", { className: "flex flex-col items-center justify-center space-y-2", children: [_jsx("div", { className: "rounded-full bg-background p-2 border", children: _jsx(Star, { className: "h-6 w-6 text-muted-foreground" }) }), _jsx("p", { className: "text-sm text-muted-foreground", children: "No reviews found" })] }) }) })) : (reviews?.map((review) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "whitespace-nowrap", children: new Date(review.review.createdAt).toLocaleDateString() }), _jsxs(TableCell, { children: [_jsx("div", { className: "font-medium", children: review.user.name }), _jsx("div", { className: "text-xs text-muted-foreground", children: review.user.email })] }), _jsx(TableCell, { children: _jsx("div", { className: "flex", children: Array.from({ length: 5 }).map((_, i) => (_jsx(Star, { className: `h-4 w-4 ${i < review.review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}` }, i))) }) }), _jsx(TableCell, { className: "max-w-xs truncate", children: review.review.feedback || _jsx("span", { className: "text-muted-foreground italic", children: "No written feedback" }) }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", children: review.review.source }) }), _jsx(TableCell, { children: renderStatusBadge(review.review.status) }), _jsx(TableCell, { className: "text-right", children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleViewReview(review), children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "View"] }) })] }, review.review.id)))) })] })] }) })] }), _jsx(ReviewDetailDialog, { review: selectedReview, open: detailDialogOpen, onOpenChange: setDetailDialogOpen })] }));
}
