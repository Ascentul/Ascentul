import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Star,
  RefreshCcw,
  Settings,
  AlertCircle,
  EyeOff,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  Trash2,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Review types
interface Review {
  id: number
  userId: number
  rating: number
  feedback: string
  source: string
  status: string
  isPublic: boolean
  adminNotes?: string | null
  appVersion: string
  createdAt: string
  moderatedAt?: string | null
  moderatedBy?: number | null
}

interface User {
  id: number
  name: string
  username: string
  email: string
  profileImage?: string | null
}

const ReviewCard: React.FC<{
  review: Review
  user?: User
  onTogglePublic?: (id: number, isPublic: boolean) => void
  onUpdateStatus?: (id: number, status: string) => void
  onDelete?: (id: number) => void
}> = ({ review, user, onTogglePublic, onUpdateStatus, onDelete }) => {
  const stars = Array(5)
    .fill(0)
    .map((_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4",
          i < review.rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        )}
      />
    ))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "in-app":
        return "bg-blue-100 text-blue-800"
      case "website":
        return "bg-purple-100 text-purple-800"
      case "email":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="mb-4 border rounded-lg shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {user?.name || "Anonymous User"}
              </CardTitle>
              <CardDescription className="text-xs">
                User ID: {review.userId} •{" "}
                {new Date(review.createdAt).toLocaleDateString()}
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
          {review.feedback || (
            <span className="text-gray-400 italic">No feedback provided</span>
          )}
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
                    onCheckedChange={(checked) =>
                      onTogglePublic(review.id, checked)
                    }
                  />
                  <Label htmlFor={`public-${review.id}`} className="text-sm">
                    {review.isPublic ? (
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" /> Public
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <EyeOff className="h-3 w-3 mr-1" /> Private
                      </span>
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
              {onUpdateStatus && review.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-800 flex items-center"
                    onClick={() => onUpdateStatus(review.id, "approved")}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-800 flex items-center"
                    onClick={() => onUpdateStatus(review.id, "rejected")}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </>
              )}

              {onUpdateStatus && review.status !== "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(review.id, "pending")}
                >
                  Reset Status
                </Button>
              )}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  )
}

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-8 text-center">
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
      <Filter className="h-6 w-6 text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
    <p className="mt-2 text-sm text-gray-500">{message}</p>
  </div>
)

const ReviewsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null)

  // Define type for API responses
  interface ReviewsResponse {
    reviews: Review[]
  }

  // Fetch all reviews for admin
  const {
    data: adminReviews,
    isLoading: adminLoading,
    error: adminError,
    refetch: refetchAdmin
  } = useQuery<ReviewsResponse>({
    queryKey: ["/api/reviews"],
    retry: 3,
    retryDelay: 1000,
    enabled: true,
    gcTime: 0 // Disable caching to ensure fresh data
  })

  // Fetch public reviews
  const {
    data: publicReviews,
    isLoading: publicLoading,
    error: publicError,
    refetch: refetchPublic
  } = useQuery<ReviewsResponse>({
    queryKey: ["/api/reviews/public"], // Use the public endpoint directly
    retry: 3,
    retryDelay: 1000,
    enabled: true,
    gcTime: 0 // Disable caching to ensure fresh data
  })

  // API handlers for review management
  const handleTogglePublic = async (id: number, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // Include credentials for authentication
        body: JSON.stringify({ isPublic })
      })

      if (!response.ok) {
        throw new Error("Failed to update review visibility")
      }

      // Refresh the data
      refetchAdmin()
      refetchPublic()

      toast({
        title: "Review visibility updated",
        description: `Review is now ${isPublic ? "public" : "private"}.`
      })
    } catch (error) {
      console.error("Error updating review visibility:", error)
      toast({
        title: "Update failed",
        description: "There was a problem updating the review visibility.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // Include credentials for authentication
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error("Failed to update review status")
      }

      // Refresh the data
      refetchAdmin()

      toast({
        title: "Review status updated",
        description: `Review status changed to ${status}.`,
        variant:
          status === "approved"
            ? "default"
            : status === "rejected"
            ? "destructive"
            : "default"
      })
    } catch (error) {
      console.error("Error updating review status:", error)
      toast({
        title: "Update failed",
        description: "There was a problem updating the review status.",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = () => {
    refetchAdmin()
    refetchPublic()
    toast({
      title: "Refreshing reviews",
      description: "Fetching the latest reviews from the database."
    })
  }

  const handleDeleteRequest = (id: number) => {
    setReviewToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return

    try {
      const response = await fetch(`/api/reviews/${reviewToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include" // Include credentials for authentication
      })

      if (!response.ok) {
        throw new Error("Failed to delete review")
      }

      // Refresh the data
      refetchAdmin()
      refetchPublic()

      toast({
        title: "Review deleted",
        description: "The review has been successfully deleted."
      })
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the review.",
        variant: "destructive"
      })
    } finally {
      // Reset the state
      setDeleteDialogOpen(false)
      setReviewToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setReviewToDelete(null)
  }

  // Filter reviews based on active tab
  const getFilteredReviews = () => {
    // First check if we have data
    if (!adminReviews) {
      console.log("No admin reviews data available")
      return []
    }

    // Check if adminReviews is an array (new format from API)
    if (Array.isArray(adminReviews)) {
      console.log("Processing adminReviews as array", adminReviews)

      // Extract the review objects from the array of {review, user} objects
      const reviews = adminReviews.map((item) => item.review)

      switch (activeTab) {
        case "pending":
          return reviews.filter((r: Review) => r.status === "pending")
        case "approved":
          return reviews.filter((r: Review) => r.status === "approved")
        case "rejected":
          return reviews.filter((r: Review) => r.status === "rejected")
        case "public":
          return reviews.filter((r: Review) => r.isPublic)
        case "all":
        default:
          return reviews
      }
    }

    // Handle the old format where adminReviews has a 'reviews' property
    if (adminReviews.reviews && Array.isArray(adminReviews.reviews)) {
      console.log("Processing adminReviews.reviews", adminReviews.reviews)

      switch (activeTab) {
        case "pending":
          return adminReviews.reviews.filter(
            (r: Review) => r.status === "pending"
          )
        case "approved":
          return adminReviews.reviews.filter(
            (r: Review) => r.status === "approved"
          )
        case "rejected":
          return adminReviews.reviews.filter(
            (r: Review) => r.status === "rejected"
          )
        case "public":
          return adminReviews.reviews.filter((r: Review) => r.isPublic)
        case "all":
        default:
          return adminReviews.reviews
      }
    }

    console.log("Unable to process reviews data:", adminReviews)
    return []
  }

  if (adminLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (adminError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
        <h3 className="font-medium">Error loading reviews</h3>
        <p className="text-sm">
          There was a problem fetching the reviews. Please try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => refetchAdmin()}
        >
          Retry
        </Button>
      </div>
    )
  }

  const filteredReviews = getFilteredReviews()

  // Find the users for each review
  const getUsers = () => {
    if (!adminReviews) return {}

    // If adminReviews is an array of objects with review and user properties
    if (Array.isArray(adminReviews)) {
      // Create a map of userId -> user data
      const userMap: Record<number, User> = {}
      adminReviews.forEach((item) => {
        if (item.user && item.review) {
          userMap[item.review.userId] = item.user
        }
      })
      return userMap
    }

    return {}
  }

  const userMap = getUsers()

  return (
    <div className="space-y-4">
      {/* Delete confirmation dialog */}
      <ReviewDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        reviewId={reviewToDelete || 0}
      />

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
                  user={userMap[review.userId]}
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

        {publicLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : publicError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <p className="text-sm">
              There was a problem fetching public reviews.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => refetchPublic()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              // Process reviews data based on format
              let reviewsToDisplay: Review[] = []

              if (publicReviews) {
                if (Array.isArray(publicReviews)) {
                  console.log("Public reviews is an array")
                  // Extract reviews from array of {review, user} objects
                  reviewsToDisplay = publicReviews.map((item) => item.review)
                } else if (
                  publicReviews.reviews &&
                  Array.isArray(publicReviews.reviews)
                ) {
                  console.log("Public reviews has reviews property")
                  reviewsToDisplay = publicReviews.reviews
                }
              }

              console.log("Public reviews to display:", reviewsToDisplay)

              if (reviewsToDisplay.length > 0) {
                return reviewsToDisplay.map((review: Review) => (
                  <Card
                    key={review.id}
                    className="overflow-hidden border rounded-lg shadow-sm"
                  >
                    <CardHeader className="pb-2 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="text-xs">
                              {review.userId.toString()[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-sm">
                              Verified User
                            </CardTitle>
                            <div className="flex mt-1">
                              {Array(5)
                                .fill(0)
                                .map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "h-3 w-3",
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    )}
                                  />
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
                      {review.feedback || (
                        <span className="text-gray-400 italic">
                          No feedback provided
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))
              } else {
                return (
                  <div className="col-span-1 md:col-span-2">
                    <EmptyState message="No public reviews available to display." />
                  </div>
                )
              }
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewsTab
