import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { UserReview } from "@/utils/schema";
import { useToast } from '@/hooks/use-toast';
import { convertToCSV, generateExportFileName, downloadFile } from '@/utils/csvExport';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Star, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Flag, 
  AlertTriangle, 
  Shield,
  Trash2,
  RefreshCw,
  Download,
  FileDown,
} from 'lucide-react';

// Type definition for reviews with user information
type ReviewWithUser = {
  review: UserReview & { 
    status: string;
    isPublic: boolean;
    adminNotes?: string;
    moderatedAt?: Date;
    moderatedBy?: number;
    appVersion?: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
};

// Review detail dialog component
function ReviewDetailDialog({ 
  review, 
  open, 
  onOpenChange 
}: { 
  review: ReviewWithUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState<string>(review?.review.status || 'pending');
  const [isPublic, setIsPublic] = useState<boolean>(review?.review.isPublic || true);
  const [adminNotes, setAdminNotes] = useState<string>(review?.review.adminNotes || '');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateReviewMutation = useMutation({
    mutationFn: async (data: { status: string; isPublic: boolean; adminNotes: string }) => {
      if (!review) return null;
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
    onError: (error: Error) => {
      toast({
        title: "Error updating review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const flagReviewMutation = useMutation({
    mutationFn: async () => {
      if (!review) return null;
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
    onError: (error: Error) => {
      toast({
        title: "Error flagging review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      if (!review) return null;
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
    onError: (error: Error) => {
      toast({
        title: "Error deleting review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!review) return null;

  const handleSave = () => {
    updateReviewMutation.mutate({ status, isPublic, adminNotes });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Details</DialogTitle>
          <DialogDescription>
            Review submitted by {review.user.name} on {new Date(review.review.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">User Information</h3>
              <p className="text-sm">{review.user.name} ({review.user.email})</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1">Rating</h3>
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < review.review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="ml-2 text-sm font-semibold">{review.review.rating}/5</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1">Review Source</h3>
              <Badge variant="outline">{review.review.source}</Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1">App Version</h3>
              <p className="text-sm">{review.review.appVersion || 'Not recorded'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1">Date Submitted</h3>
              <p className="text-sm">{new Date(review.review.createdAt).toLocaleString()}</p>
            </div>

            {review.review.moderatedAt && (
              <div>
                <h3 className="text-sm font-medium mb-1">Last Moderated</h3>
                <p className="text-sm">{new Date(review.review.moderatedAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Feedback</h3>
              <div className="p-3 bg-muted rounded-md text-sm">
                {review.review.feedback || 'No written feedback provided'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="status">Moderation Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-40">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="public" 
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Show publicly</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add private notes about this review..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="h-20"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="destructive" 
              onClick={() => deleteReviewMutation.mutate()}
              disabled={deleteReviewMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteReviewMutation.isPending ? 'Deleting...' : 'Delete Review'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => flagReviewMutation.mutate()}
              disabled={flagReviewMutation.isPending}
            >
              <Flag className="h-4 w-4 mr-2" />
              {flagReviewMutation.isPending ? 'Flagging...' : 'Flag as Inappropriate'}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateReviewMutation.isPending}
            >
              {updateReviewMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReviewsPage() {
  // Get toast from useToast hook
  const { toast } = useToast();
  
  // State for filters
  const [rating, setRating] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  
  // State for selected review
  const [selectedReview, setSelectedReview] = useState<ReviewWithUser | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);

  // Query for fetching reviews
  const { data: reviews, isLoading, isError } = useQuery({
    queryKey: ['reviews', rating, status, search, sortBy, sortOrder],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (rating !== 'all') queryParams.set('rating', rating);
      if (status !== 'all') queryParams.set('status', status);
      if (search) queryParams.set('search', search);
      if (sortBy) queryParams.set('sortBy', sortBy);
      if (sortOrder) queryParams.set('sortOrder', sortOrder);
      
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
    pending: reviews?.filter((r: ReviewWithUser) => r.review.status === 'pending').length || 0,
    approved: reviews?.filter((r: ReviewWithUser) => r.review.status === 'approved').length || 0,
    rejected: reviews?.filter((r: ReviewWithUser) => r.review.status === 'rejected').length || 0,
    averageRating: reviews?.length 
      ? (reviews.reduce((acc: number, r: ReviewWithUser) => acc + r.review.rating, 0) / reviews.length).toFixed(1)
      : 'N/A'
  };

  const handleViewReview = (review: ReviewWithUser) => {
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
        "User": (r: ReviewWithUser) => r.user.name,
        "Email": (r: ReviewWithUser) => r.user.email,
        "Rating": (r: ReviewWithUser) => r.review.rating,
        "Comment": (r: ReviewWithUser) => r.review.feedback || '',
        "Date": (r: ReviewWithUser) => new Date(r.review.createdAt).toISOString(),
        "Status": (r: ReviewWithUser) => r.review.status,
        "Source": (r: ReviewWithUser) => r.review.source,
        "App Version": (r: ReviewWithUser) => r.review.appVersion || '',
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
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Render status badge based on review status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold mr-2">{reviewStats.averageRating}</div>
              {reviewStats.averageRating !== 'N/A' && (
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{reviewStats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reviewStats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reviewStats.rejected}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Reviews Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>
              Manage and moderate customer reviews across the platform
            </CardDescription>
          </div>
          <Button 
            onClick={handleExportReviews}
            disabled={isExporting || isLoading || !reviews?.length}
            className="mt-4 sm:mt-0"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Reviews
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reviews..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <div>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Reviews Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-red-500">
                      Error loading reviews. Please try again.
                    </TableCell>
                  </TableRow>
                ) : reviews?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="rounded-full bg-background p-2 border">
                          <Star className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No reviews found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews?.map((review: ReviewWithUser) => (
                    <TableRow key={review.review.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(review.review.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{review.user.name}</div>
                        <div className="text-xs text-muted-foreground">{review.user.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.review.feedback || <span className="text-muted-foreground italic">No written feedback</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{review.review.source}</Badge>
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(review.review.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReview(review)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Details Dialog */}
      <ReviewDetailDialog 
        review={selectedReview} 
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}