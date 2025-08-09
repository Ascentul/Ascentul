import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, RefreshCcw, EyeOff, Eye, CheckCircle, XCircle, Filter, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
const ReviewCard = ({ review, user, onTogglePublic, onUpdateStatus, onDelete }) => {
    const stars = Array(5)
        .fill(0)
        .map((_, i) => (_jsx(Star, { className: cn("h-4 w-4", i < review.rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300") }, i)));
    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    const getSourceBadge = (source) => {
        switch (source) {
            case "in-app":
                return "bg-blue-100 text-blue-800";
            case "website":
                return "bg-purple-100 text-purple-800";
            case "email":
                return "bg-indigo-100 text-indigo-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    return (_jsxs(Card, { className: "mb-4 border rounded-lg shadow-sm", children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Avatar, { children: _jsx(AvatarFallback, { children: user?.name?.[0] || "U" }) }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: user?.name || "Anonymous User" }), _jsxs(CardDescription, { className: "text-xs", children: ["User ID: ", review.userId, " \u2022", " ", new Date(review.createdAt).toLocaleDateString()] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Badge, { variant: "outline", className: getSourceBadge(review.source), children: review.source }), _jsx(Badge, { variant: "outline", className: getStatusColor(review.status), children: review.status })] })] }), _jsxs("div", { className: "flex mt-1", children: [stars, _jsxs("span", { className: "ml-2 text-sm font-medium", children: [review.rating, "/5"] })] })] }), _jsxs(CardContent, { className: "pt-0", children: [_jsx("div", { className: "text-sm text-gray-700 my-2 whitespace-pre-wrap", children: review.feedback || (_jsx("span", { className: "text-gray-400 italic", children: "No feedback provided" })) }), review.adminNotes && (_jsxs("div", { className: "mt-2 p-2 bg-gray-50 rounded-md", children: [_jsx("p", { className: "text-xs font-medium text-gray-500", children: "Admin Notes:" }), _jsx("p", { className: "text-sm text-gray-700", children: review.adminNotes })] }))] }), (onTogglePublic || onUpdateStatus || onDelete) && (_jsxs(_Fragment, { children: [_jsx(Separator, {}), _jsxs(CardFooter, { className: "pt-2 pb-2 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [onTogglePublic && (_jsxs(_Fragment, { children: [_jsx(Switch, { id: `public-${review.id}`, checked: review.isPublic, onCheckedChange: (checked) => onTogglePublic(review.id, checked) }), _jsx(Label, { htmlFor: `public-${review.id}`, className: "text-sm", children: review.isPublic ? (_jsxs("span", { className: "flex items-center", children: [_jsx(Eye, { className: "h-3 w-3 mr-1" }), " Public"] })) : (_jsxs("span", { className: "flex items-center", children: [_jsx(EyeOff, { className: "h-3 w-3 mr-1" }), " Private"] })) })] })), onDelete && (_jsxs(Button, { variant: "ghost", size: "sm", className: "text-red-600 hover:text-red-800 hover:bg-red-50", onClick: () => onDelete(review.id), children: [_jsx(Trash2, { className: "h-3 w-3 mr-1" }), " Delete"] }))] }), _jsxs("div", { className: "flex space-x-2", children: [onUpdateStatus && review.status === "pending" && (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: "outline", size: "sm", className: "text-green-600 hover:text-green-800 flex items-center", onClick: () => onUpdateStatus(review.id, "approved"), children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1" }), " Approve"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "text-red-600 hover:text-red-800 flex items-center", onClick: () => onUpdateStatus(review.id, "rejected"), children: [_jsx(XCircle, { className: "h-3 w-3 mr-1" }), " Reject"] })] })), onUpdateStatus && review.status !== "pending" && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => onUpdateStatus(review.id, "pending"), children: "Reset Status" }))] })] })] }))] }));
};
const EmptyState = ({ message }) => (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4", children: _jsx(Filter, { className: "h-6 w-6 text-gray-500" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "No reviews found" }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: message })] }));
const ReviewsTab = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    // Fetch all reviews for admin
    const { data: adminReviews, isLoading: adminLoading, error: adminError, refetch: refetchAdmin } = useQuery({
        queryKey: ["/api/reviews"],
        retry: 3,
        retryDelay: 1000,
        enabled: true,
        gcTime: 0 // Disable caching to ensure fresh data
    });
    // Fetch public reviews
    const { data: publicReviews, isLoading: publicLoading, error: publicError, refetch: refetchPublic } = useQuery({
        queryKey: ["/api/reviews/public"], // Use the public endpoint directly
        retry: 3,
        retryDelay: 1000,
        enabled: true,
        gcTime: 0 // Disable caching to ensure fresh data
    });
    // API handlers for review management
    const handleTogglePublic = async (id, isPublic) => {
        try {
            const response = await fetch(`/api/reviews/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include", // Include credentials for authentication
                body: JSON.stringify({ isPublic })
            });
            if (!response.ok) {
                throw new Error("Failed to update review visibility");
            }
            // Refresh the data
            refetchAdmin();
            refetchPublic();
            toast({
                title: "Review visibility updated",
                description: `Review is now ${isPublic ? "public" : "private"}.`
            });
        }
        catch (error) {
            console.error("Error updating review visibility:", error);
            toast({
                title: "Update failed",
                description: "There was a problem updating the review visibility.",
                variant: "destructive"
            });
        }
    };
    const handleUpdateStatus = async (id, status) => {
        try {
            const response = await fetch(`/api/reviews/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include", // Include credentials for authentication
                body: JSON.stringify({ status })
            });
            if (!response.ok) {
                throw new Error("Failed to update review status");
            }
            // Refresh the data
            refetchAdmin();
            toast({
                title: "Review status updated",
                description: `Review status changed to ${status}.`,
                variant: status === "approved"
                    ? "default"
                    : status === "rejected"
                        ? "destructive"
                        : "default"
            });
        }
        catch (error) {
            console.error("Error updating review status:", error);
            toast({
                title: "Update failed",
                description: "There was a problem updating the review status.",
                variant: "destructive"
            });
        }
    };
    const handleRefresh = () => {
        refetchAdmin();
        refetchPublic();
        toast({
            title: "Refreshing reviews",
            description: "Fetching the latest reviews from the database."
        });
    };
    const handleDeleteRequest = (id) => {
        setReviewToDelete(id);
        setDeleteDialogOpen(true);
    };
    const handleDeleteConfirm = async () => {
        if (!reviewToDelete)
            return;
        try {
            const response = await fetch(`/api/reviews/${reviewToDelete}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include" // Include credentials for authentication
            });
            if (!response.ok) {
                throw new Error("Failed to delete review");
            }
            // Refresh the data
            refetchAdmin();
            refetchPublic();
            toast({
                title: "Review deleted",
                description: "The review has been successfully deleted."
            });
        }
        catch (error) {
            console.error("Error deleting review:", error);
            toast({
                title: "Delete failed",
                description: "There was a problem deleting the review.",
                variant: "destructive"
            });
        }
        finally {
            // Reset the state
            setDeleteDialogOpen(false);
            setReviewToDelete(null);
        }
    };
    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
    };
    // Filter reviews based on active tab
    const getFilteredReviews = () => {
        // First check if we have data
        if (!adminReviews) {
            console.log("No admin reviews data available");
            return [];
        }
        // Check if adminReviews is an array (new format from API)
        if (Array.isArray(adminReviews)) {
            console.log("Processing adminReviews as array", adminReviews);
            // Extract the review objects from the array of {review, user} objects
            const reviews = adminReviews.map((item) => item.review);
            switch (activeTab) {
                case "pending":
                    return reviews.filter((r) => r.status === "pending");
                case "approved":
                    return reviews.filter((r) => r.status === "approved");
                case "rejected":
                    return reviews.filter((r) => r.status === "rejected");
                case "public":
                    return reviews.filter((r) => r.isPublic);
                case "all":
                default:
                    return reviews;
            }
        }
        // Handle the old format where adminReviews has a 'reviews' property
        if (adminReviews.reviews && Array.isArray(adminReviews.reviews)) {
            console.log("Processing adminReviews.reviews", adminReviews.reviews);
            switch (activeTab) {
                case "pending":
                    return adminReviews.reviews.filter((r) => r.status === "pending");
                case "approved":
                    return adminReviews.reviews.filter((r) => r.status === "approved");
                case "rejected":
                    return adminReviews.reviews.filter((r) => r.status === "rejected");
                case "public":
                    return adminReviews.reviews.filter((r) => r.isPublic);
                case "all":
                default:
                    return adminReviews.reviews;
            }
        }
        console.log("Unable to process reviews data:", adminReviews);
        return [];
    };
    if (adminLoading) {
        return (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    if (adminError) {
        return (_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-md text-red-800", children: [_jsx("h3", { className: "font-medium", children: "Error loading reviews" }), _jsx("p", { className: "text-sm", children: "There was a problem fetching the reviews. Please try again." }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => refetchAdmin(), children: "Retry" })] }));
    }
    const filteredReviews = getFilteredReviews();
    // Find the users for each review
    const getUsers = () => {
        if (!adminReviews)
            return {};
        // If adminReviews is an array of objects with review and user properties
        if (Array.isArray(adminReviews)) {
            // Create a map of userId -> user data
            const userMap = {};
            adminReviews.forEach((item) => {
                if (item.user && item.review) {
                    userMap[item.review.userId] = item.user;
                }
            });
            return userMap;
        }
        return {};
    };
    const userMap = getUsers();
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(ReviewDeleteDialog, { isOpen: deleteDialogOpen, onClose: handleDeleteCancel, onConfirm: handleDeleteConfirm, reviewId: reviewToDelete || 0 }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Customer Reviews" }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleRefresh, className: "flex items-center", children: [_jsx(RefreshCcw, { className: "h-4 w-4 mr-1" }), " Refresh"] })] }), _jsxs(Tabs, { defaultValue: "all", value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "grid grid-cols-5 w-full max-w-md", children: [_jsx(TabsTrigger, { value: "all", children: "All" }), _jsx(TabsTrigger, { value: "pending", children: "Pending" }), _jsx(TabsTrigger, { value: "approved", children: "Approved" }), _jsx(TabsTrigger, { value: "rejected", children: "Rejected" }), _jsx(TabsTrigger, { value: "public", children: "Public" })] }), _jsx(TabsContent, { value: activeTab, className: "mt-4", children: filteredReviews.length > 0 ? (_jsx("div", { className: "space-y-4", children: filteredReviews.map((review) => (_jsx(ReviewCard, { review: review, user: userMap[review.userId], onTogglePublic: handleTogglePublic, onUpdateStatus: handleUpdateStatus, onDelete: handleDeleteRequest }, review.id))) })) : (_jsx(EmptyState, { message: `No ${activeTab} reviews found.` })) })] }), _jsxs("div", { className: "mt-8", children: [_jsx("h3", { className: "text-xl font-semibold mb-4", children: "Public Reviews Preview" }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: "This section shows how the reviews appear on the public site." }), publicLoading ? (_jsx("div", { className: "flex justify-center items-center h-32", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) })) : publicError ? (_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-md text-red-800", children: [_jsx("p", { className: "text-sm", children: "There was a problem fetching public reviews." }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => refetchPublic(), children: "Retry" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: (() => {
                            // Process reviews data based on format
                            let reviewsToDisplay = [];
                            if (publicReviews) {
                                if (Array.isArray(publicReviews)) {
                                    console.log("Public reviews is an array");
                                    // Extract reviews from array of {review, user} objects
                                    reviewsToDisplay = publicReviews.map((item) => item.review);
                                }
                                else if (publicReviews.reviews &&
                                    Array.isArray(publicReviews.reviews)) {
                                    console.log("Public reviews has reviews property");
                                    reviewsToDisplay = publicReviews.reviews;
                                }
                            }
                            console.log("Public reviews to display:", reviewsToDisplay);
                            if (reviewsToDisplay.length > 0) {
                                return reviewsToDisplay.map((review) => (_jsxs(Card, { className: "overflow-hidden border rounded-lg shadow-sm", children: [_jsx(CardHeader, { className: "pb-2 bg-gray-50", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Avatar, { className: "h-8 w-8 mr-2", children: _jsx(AvatarFallback, { className: "text-xs", children: review.userId.toString()[0] }) }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-sm", children: "Verified User" }), _jsx("div", { className: "flex mt-1", children: Array(5)
                                                                            .fill(0)
                                                                            .map((_, i) => (_jsx(Star, { className: cn("h-3 w-3", i < review.rating
                                                                                ? "fill-yellow-400 text-yellow-400"
                                                                                : "text-gray-300") }, i))) })] })] }), _jsx(CardDescription, { className: "text-xs", children: new Date(review.createdAt).toLocaleDateString() })] }) }), _jsx(CardContent, { className: "text-sm py-3", children: review.feedback || (_jsx("span", { className: "text-gray-400 italic", children: "No feedback provided" })) })] }, review.id)));
                            }
                            else {
                                return (_jsx("div", { className: "col-span-1 md:col-span-2", children: _jsx(EmptyState, { message: "No public reviews available to display." }) }));
                            }
                        })() }))] })] }));
};
export default ReviewsTab;
