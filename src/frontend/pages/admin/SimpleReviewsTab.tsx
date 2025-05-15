import React, { useState } from 'react';
import { Star, RefreshCcw, Settings, AlertCircle, EyeOff, Eye, CheckCircle, XCircle, Filter, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Review types
interface Review {
  id: number;
  userId: number;
  rating: number;
  feedback: string;
  source: string;
  status: string;
  isPublic: boolean;
  adminNotes?: string | null;
  appVersion: string;
  createdAt: string;
  moderatedAt?: string | null;
  moderatedBy?: number | null;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  profileImage?: string | null;
}

const ReviewCard: React.FC<{ 
  review: Review, 
  user?: User, 
  onTogglePublic?: (id: number, isPublic: boolean) => void,
  onUpdateStatus?: (id: number, status: string) => void,
  onDelete?: (id: number) => void
}> = ({ review, user, onTogglePublic, onUpdateStatus, onDelete }) => {
  const stars = Array(5).fill(0).map((_, i) => (
    <Star key={i} className={cn(
      "h-4 w-4", 
      i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
    )} />
  ));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceBadge = (source: string) => {
    switch(source) {
      case 'in-app': return 'bg-blue-100 text-blue-800';
      case 'website': return 'bg-purple-100 text-purple-800';
      case 'email': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4 border rounded-lg shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{user?.name || 'Anonymous User'}</CardTitle>
              <CardDescription className="text-xs">
                User ID: {review.userId} • {new Date(review.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getSourceBadge(review.source)}>
              {review.source}
            </Badge>
            <Badge variant="outline" className={getStatusColor(review.status)}>
              {review.status}
            </Badge>
          </div>
        </div>
        <div className="flex mt-1">
          {stars}
          <span className="ml-2 text-sm font-medium">{review.rating}/5</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-gray-700 my-2 whitespace-pre-wrap">
          {review.feedback || <span className="text-gray-400 italic">No feedback provided</span>}
        </div>
        {review.adminNotes && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <p className="text-xs font-medium text-gray-500">Admin Notes:</p>
            <p className="text-sm text-gray-700">{review.adminNotes}</p>
          </div>
        )}
      </CardContent>
      
      {(onTogglePublic || onUpdateStatus || onDelete) && (
        <>
          <Separator />
          <CardFooter className="pt-2 pb-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {onTogglePublic && (
                <>
                  <Switch 
                    id={`public-${review.id}`}
                    checked={review.isPublic}
                    onCheckedChange={(checked) => onTogglePublic(review.id, checked)}
                  />
                  <Label htmlFor={`public-${review.id}`} className="text-sm">
                    {review.isPublic ? (
                      <span className="flex items-center"><Eye className="h-3 w-3 mr-1" /> Public</span>
                    ) : (
                      <span className="flex items-center"><EyeOff className="h-3 w-3 mr-1" /> Private</span>
                    )}
                  </Label>
                </>
              )}
              
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={() => onDelete(review.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {onUpdateStatus && review.status === 'pending' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-600 hover:text-green-800 flex items-center"
                    onClick={() => onUpdateStatus(review.id, 'approved')}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-800 flex items-center"
                    onClick={() => onUpdateStatus(review.id, 'rejected')}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </>
              )}
              
              {onUpdateStatus && review.status !== 'pending' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onUpdateStatus(review.id, 'pending')}
                >
                  Reset Status
                </Button>
              )}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

const EmptyState: React.FC<{message: string}> = ({ message }) => (
  <div className="p-8 text-center">
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
      <Filter className="h-6 w-6 text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
    <p className="mt-2 text-sm text-gray-500">{message}</p>
  </div>
);

const SimpleReviewsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  // Sample mock data for the UI demonstration
  const mockReviews: Review[] = [
    {
      id: 1,
      userId: 1,
      rating: 5,
      feedback: "Ascentul has been incredibly helpful for my career search. The resume builder and AI tools provided excellent guidance.",
      source: "in-app",
      status: "approved",
      isPublic: true,
      adminNotes: null,
      appVersion: "1.0",
      createdAt: new Date().toISOString(),
      moderatedAt: new Date().toISOString(),
      moderatedBy: 9, // Admin user ID
    },
    {
      id: 2,
      userId: 2,
      rating: 4,
      feedback: "Great platform for job seeking. The AI coach helped me prepare for interviews effectively.",
      source: "website",
      status: "pending",
      isPublic: false,
      adminNotes: null,
      appVersion: "1.0",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: 3,
      userId: 3,
      rating: 3,
      feedback: "Good features but the UI could be improved. Some buttons are hard to find.",
      source: "email",
      status: "rejected",
      isPublic: false,
      adminNotes: "Contains UI criticism, will be addressed in next update",
      appVersion: "1.0",
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      moderatedAt: new Date(Date.now() - 86400000).toISOString(),
      moderatedBy: 9,
    }
  ];
  
  // Sample mock users
  const mockUsers: Record<number, User> = {
    1: {
      id: 1,
      name: "John Smith",
      username: "johnsmith",
      email: "john@example.com",
      profileImage: null
    },
    2: {
      id: 2,
      name: "Emily Johnson",
      username: "emilyjohnson",
      email: "emily@example.com",
      profileImage: null
    },
    3: {
      id: 3,
      name: "Michael Brown",
      username: "michaelbrown",
      email: "michael@example.com",
      profileImage: null
    }
  };
  
  // Filter reviews based on active tab
  const getFilteredReviews = () => {
    switch(activeTab) {
      case 'pending':
        return mockReviews.filter(r => r.status === 'pending');
      case 'approved':
        return mockReviews.filter(r => r.status === 'approved');
      case 'rejected':
        return mockReviews.filter(r => r.status === 'rejected');
      case 'public':
        return mockReviews.filter(r => r.isPublic);
      case 'all':
      default:
        return mockReviews;
    }
  };
  
  const handleTogglePublic = (id: number, isPublic: boolean) => {
    toast({
      title: "Database Migration Required",
      description: "This action requires a database migration to add the missing `deleted_at` column.",
      variant: "destructive",
    });
  };

  const handleUpdateStatus = (id: number, status: string) => {
    toast({
      title: "Database Migration Required",
      description: "This action requires a database migration to add the missing `deleted_at` column.",
      variant: "destructive",
    });
  };

  const handleRefresh = () => {
    toast({
      title: "Database Migration Required",
      description: "This action requires a database migration to add the missing `deleted_at` column.",
    });
  };
  
  const handleDeleteRequest = (id: number) => {
    toast({
      title: "Database Migration Required",
      description: "This action requires a database migration to add the missing `deleted_at` column.",
      variant: "destructive",
    });
  };
  
  const filteredReviews = getFilteredReviews();
  
  return (
    <div className="space-y-4">
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database Migration Required</AlertTitle>
        <AlertDescription>
          The reviews functionality requires a database migration to add the missing "deleted_at" column defined in the schema. 
          This is a temporary demonstration view with sample data.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          className="flex items-center"
        >
          <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          {filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review: Review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review}
                  user={mockUsers[review.userId]}
                  onTogglePublic={handleTogglePublic}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={`No ${activeTab} reviews found.`} />
          )}
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Public Reviews Preview</h3>
        <p className="text-sm text-gray-500 mb-4">
          This section shows how the reviews appear on the public site.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(() => {
            const publicReviews = mockReviews.filter(r => r.status === 'approved' && r.isPublic);
            
            if (publicReviews.length > 0) {
              return publicReviews.map((review: Review) => (
                <Card key={review.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {mockUsers[review.userId]?.name || 'Anonymous User'}
                        </CardTitle>
                        <div className="flex items-center mt-1">
                          <div className="flex mr-2">
                            {Array(5).fill(0).map((_, i) => (
                              <Star key={i} className={cn(
                                "h-3 w-3", 
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              )} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm py-3">
                    {review.feedback || <span className="text-gray-400 italic">No feedback provided</span>}
                  </CardContent>
                </Card>
              ));
            } else {
              return (
                <div className="col-span-1 md:col-span-2">
                  <EmptyState message="No public reviews available to display." />
                </div>
              );
            }
          })()}
        </div>
      </div>
      
      <div className="mt-8 p-4 border border-dashed border-gray-300 rounded-md">
        <h3 className="text-lg font-medium mb-2 flex items-center">
          <Settings className="h-4 w-4 mr-2" /> Database Migration Instructions
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          To fully enable the reviews functionality, database migration is required.
        </p>
        <div className="bg-gray-50 p-4 rounded text-sm font-mono">
          <p className="mb-2">1. Run the command to add the missing column:</p>
          <div className="bg-black text-white p-2 rounded">
            ALTER TABLE user_reviews ADD COLUMN deleted_at TIMESTAMP;
          </div>
          <p className="mt-4 mb-2">2. Update the schema in shared/schema.ts:</p>
          <div className="bg-black text-white p-2 rounded">
            export const userReviews = pgTable('user_reviews', &#123;<br/>
            &nbsp;&nbsp;// Existing columns...<br/>
            &nbsp;&nbsp;deletedAt: timestamp('deleted_at'),<br/>
            &#125;);
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleReviewsTab;