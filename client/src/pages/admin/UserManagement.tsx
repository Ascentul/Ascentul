import { useState, createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Search, Filter, MoreHorizontal, Users, RefreshCw, Download, Plus, UserPlus, UserCog } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUser, useIsAdminUser } from '@/lib/useUserData';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';


// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from '@/components/ui/sheet';

// Schema for staff user creation
const addStaffUserSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Schema for user editing
const editUserSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  userType: z.enum(["regular", "university_student", "university_admin", "staff"]),
  university: z.string().optional(),
  subscriptionPlan: z.enum(["free", "premium", "university"]),
  accountStatus: z.enum(["active", "inactive", "suspended"]),
});

type AddStaffUserFormValues = z.infer<typeof addStaffUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

// Create context for sharing state between components
interface UserManagementContextType {
  selectedUser: User | null;
  isEditUserOpen: boolean;
  setIsEditUserOpen: (open: boolean) => void;
  updateUserMutation: any;
  searchTerm: string;
  filters: any;
  currentPage: number;
}

const UserManagementContext = createContext<UserManagementContextType | null>(null);

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  userType: "regular" | "university_student" | "university_admin" | "staff";
  university?: string;
  universityId?: number;
  subscriptionPlan: "free" | "premium" | "university";
  subscriptionStatus: "active" | "inactive" | "cancelled" | "past_due";
  lastLogin: string;
  signupDate: string;
  accountStatus: "active" | "inactive" | "suspended";
  usageStats: {
    logins: number;
    sessionsLast30Days: number;
    avgSessionTime: string;
    featuresUsed: string[];
    activityLevel: "high" | "medium" | "low";
  };
}

export default function UserManagement() {
  const { user } = useUser();
  const isAdmin = useIsAdminUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    userType: 'all',
    subscriptionPlan: 'all',
    university: 'all',
    activityLevel: 'all',
    signupPeriod: 'all',
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const itemsPerPage = 10;

  // Redirect if not admin
  if (user && !isAdmin) {
    setLocation('/dashboard');
    return null;
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  const queryClient = useQueryClient();

  // Fetch users with search and filters
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users', searchTerm, filters, currentPage],
    // In a real app, this would call the appropriate API with pagination/filters
    // This is mocked for demo
    initialData: Array.from({ length: 50 }, (_, i) => createMockUser(i + 1)),
  });

  // Mutation for updating user status
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: 'active' | 'inactive' | 'suspended' }) => {
      // This is where you'd call your API
      // await apiRequest('PUT', `/api/admin/users/${userId}/status`, { status });
      return { userId, status };
    },
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(['/api/admin/users', searchTerm, filters, currentPage], 
        (old: User[] | undefined) => 
          old?.map(user => 
            user.id === data.userId 
              ? { ...user, accountStatus: data.status } 
              : user
          )
      );
    }
  });

  // Mutation for upgrading subscription
  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      plan 
    }: { 
      userId: number; 
      plan: 'free' | 'premium' | 'university' 
    }) => {
      // This is where you'd call your API
      // await apiRequest('PUT', `/api/admin/users/${userId}/subscription`, { plan });
      return { userId, plan };
    },
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(['/api/admin/users', searchTerm, filters, currentPage], 
        (old: User[] | undefined) => 
          old?.map(user => 
            user.id === data.userId 
              ? { ...user, subscriptionPlan: data.plan, subscriptionStatus: 'active' } 
              : user
          )
      );
    }
  });
  
  // Mutation for updating user details
  const updateUserMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      userData 
    }: { 
      userId: number;
      userData: EditUserFormValues;
    }) => {
      // This is where you'd call your API
      // const res = await apiRequest('PUT', `/api/admin/users/${userId}`, userData);
      // return await res.json();
      
      // For demo, we'll just return the updated user data
      return { userId, ...userData };
    },
    onSuccess: (data) => {
      const { userId, ...updatedData } = data;
      
      // Show success toast
      toast({
        title: "User updated",
        description: `${data.name}'s profile has been updated.`,
      });
      
      // Close edit modal
      setIsEditUserOpen(false);
      
      // Update the cache
      queryClient.setQueryData(['/api/admin/users', searchTerm, filters, currentPage], 
        (old: User[] | undefined) => 
          old?.map(user => 
            user.id === userId 
              ? { ...user, ...updatedData } 
              : user
          )
      );
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter users based on search and filters
  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUserType = filters.userType === 'all' || user.userType === filters.userType;
    const matchesSubscription = filters.subscriptionPlan === 'all' || user.subscriptionPlan === filters.subscriptionPlan;
    const matchesUniversity = filters.university === 'all' || 
      (filters.university === 'none' && !user.university) ||
      (user.university === filters.university);
    const matchesActivity = filters.activityLevel === 'all' || user.usageStats.activityLevel === filters.activityLevel;
    
    // Parse dates for signup period filter
    const signupDate = new Date(user.signupDate);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 60)); // already subtracted 30
    
    const matchesSignupPeriod = 
      filters.signupPeriod === 'all' ||
      (filters.signupPeriod === 'last30' && signupDate >= thirtyDaysAgo) ||
      (filters.signupPeriod === 'last90' && signupDate >= ninetyDaysAgo) ||
      (filters.signupPeriod === 'older' && signupDate < ninetyDaysAgo);

    return matchesSearch && matchesUserType && matchesSubscription && 
           matchesUniversity && matchesActivity && matchesSignupPeriod;
  });

  // Paginate users
  const paginatedUsers = filteredUsers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage);

  // View a user's details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };
  
  // Edit a user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  // Update a user's status
  const handleUpdateStatus = (userId: number, status: 'active' | 'inactive' | 'suspended') => {
    updateUserStatusMutation.mutate({ userId, status });
  };

  // Upgrade a user's subscription
  const handleUpgradeSubscription = (userId: number, plan: 'free' | 'premium' | 'university') => {
    upgradeSubscriptionMutation.mutate({ userId, plan });
  };

  // Export users list (would be implemented in a real app)
  const handleExportUsers = () => {
    alert('This would export the current filtered user list as CSV');
  };

  // Create context value for sharing with EditUserDialog
  const contextValue: UserManagementContextType = {
    selectedUser,
    isEditUserOpen,
    setIsEditUserOpen,
    updateUserMutation,
    searchTerm,
    filters,
    currentPage
  };

  return (
    <UserManagementContext.Provider value={contextValue}>
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage and monitor all users in the system</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <AddStaffUserDialog />
          <Button variant="outline" size="sm" onClick={handleExportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="default" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or username..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select 
                value={filters.userType} 
                onValueChange={(value) => setFilters({...filters, userType: value})}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="university_student">Student</SelectItem>
                  <SelectItem value="university_admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.subscriptionPlan} 
                onValueChange={(value) => setFilters({...filters, subscriptionPlan: value})}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Users</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filteredUsers?.length} users found
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Access Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Plan</TableHead>
                      <TableHead className="hidden lg:table-cell">University</TableHead>
                      <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                      <TableHead className="hidden xl:table-cell">Activity</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <UserTypeBadge type={user.userType} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <SubscriptionBadge 
                            plan={user.subscriptionPlan} 
                            status={user.subscriptionStatus} 
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.university ? (
                            <span className="text-sm">{user.university}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <ActivityBadge level={user.usageStats.activityLevel} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <StatusBadge status={user.accountStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => 
                                  handleUpdateStatus(
                                    user.id, 
                                    user.accountStatus === 'active' ? 'inactive' : 'active'
                                  )
                                }
                              >
                                {user.accountStatus === 'active' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Subscription</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (user.subscriptionPlan !== 'premium') {
                                    handleUpgradeSubscription(user.id, 'premium');
                                  }
                                }}
                                className={user.subscriptionPlan === 'premium' ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                Upgrade to Premium
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    {currentPage === 1 ? (
                      <span className="opacity-50 cursor-not-allowed">
                        <PaginationPrevious />
                      </span>
                    ) : (
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      />
                    )}
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    
                    // Handle pagination display for many pages
                    if (totalPages > 5) {
                      if (currentPage <= 3) {
                        // Show first 3 pages, ellipsis, and last page
                        if (i < 3) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={pageNum === currentPage}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (i === 3) {
                          return <PaginationEllipsis key="ellipsis1" />;
                        } else {
                          return (
                            <PaginationItem key={totalPages}>
                              <PaginationLink
                                onClick={() => setCurrentPage(totalPages)}
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      } else if (currentPage > totalPages - 3) {
                        // Show first page, ellipsis, and last 3 pages
                        if (i === 0) {
                          return (
                            <PaginationItem key={1}>
                              <PaginationLink
                                onClick={() => setCurrentPage(1)}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (i === 1) {
                          return <PaginationEllipsis key="ellipsis2" />;
                        } else {
                          const page = totalPages - 4 + i;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={page === currentPage}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      } else {
                        // Show first page, ellipsis, current page and neighbors, ellipsis, last page
                        if (i === 0) {
                          return (
                            <PaginationItem key={1}>
                              <PaginationLink
                                onClick={() => setCurrentPage(1)}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (i === 1) {
                          return <PaginationEllipsis key="ellipsis3" />;
                        } else if (i === 2) {
                          return (
                            <PaginationItem key={currentPage}>
                              <PaginationLink
                                isActive={true}
                                onClick={() => setCurrentPage(currentPage)}
                              >
                                {currentPage}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (i === 3) {
                          return <PaginationEllipsis key="ellipsis4" />;
                        } else {
                          return (
                            <PaginationItem key={totalPages}>
                              <PaginationLink
                                onClick={() => setCurrentPage(totalPages)}
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      }
                    } else {
                      // Less than 5 pages, show all
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  })}
                  
                  <PaginationItem>
                    {currentPage === totalPages ? (
                      <span className="opacity-50 cursor-not-allowed">
                        <PaginationNext />
                      </span>
                    ) : (
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      />
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>

      {/* Advanced Filters Dialog */}
      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
            <SheetDescription>
              Filter users by multiple criteria.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">User Type</h3>
              <Select 
                value={filters.userType} 
                onValueChange={(value) => setFilters({...filters, userType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="university_student">University Student</SelectItem>
                  <SelectItem value="university_admin">University Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Subscription Plan</h3>
              <Select 
                value={filters.subscriptionPlan} 
                onValueChange={(value) => setFilters({...filters, subscriptionPlan: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">University</h3>
              <Select 
                value={filters.university} 
                onValueChange={(value) => setFilters({...filters, university: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  <SelectItem value="none">No University</SelectItem>
                  <SelectItem value="MIT">MIT</SelectItem>
                  <SelectItem value="Stanford">Stanford</SelectItem>
                  <SelectItem value="Harvard">Harvard</SelectItem>
                  <SelectItem value="Berkeley">UC Berkeley</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Activity Level</h3>
              <Select 
                value={filters.activityLevel} 
                onValueChange={(value) => setFilters({...filters, activityLevel: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Signup Period</h3>
              <Select 
                value={filters.signupPeriod} 
                onValueChange={(value) => setFilters({...filters, signupPeriod: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select signup period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="older">Older than 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  userType: 'all',
                  subscriptionPlan: 'all',
                  university: 'all',
                  activityLevel: 'all',
                  signupPeriod: 'all',
                });
              }}
            >
              Reset
            </Button>
            <Button onClick={() => setIsFiltersOpen(false)}>Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* User Details Drawer */}
      <Sheet open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <SheetContent className="sm:max-w-xl overflow-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle>User Details</SheetTitle>
                <SheetDescription>
                  Complete information about {selectedUser.name}
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <div className="flex items-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold">{selectedUser.name}</h2>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedUser.accountStatus} />
                      <UserTypeBadge type={selectedUser.userType} />
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                    <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Username" value={selectedUser.username} />
                        <InfoItem label="User ID" value={`#${selectedUser.id}`} />
                        <InfoItem 
                          label="Signup Date" 
                          value={format(new Date(selectedUser.signupDate), 'PPP')} 
                        />
                        <InfoItem 
                          label="Last Login" 
                          value={format(new Date(selectedUser.lastLogin), 'PPP')} 
                        />
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium mb-2">University Information</h3>
                        {selectedUser.university ? (
                          <div className="grid grid-cols-2 gap-4">
                            <InfoItem label="University" value={selectedUser.university} />
                            <InfoItem label="University ID" value={`#${selectedUser.universityId}`} />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not affiliated with a university</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="activity" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Activity Level</h3>
                        <div className="flex items-center gap-2">
                          <ActivityBadge level={selectedUser.usageStats.activityLevel} />
                          <span className="text-sm text-muted-foreground">
                            {selectedUser.usageStats.activityLevel === 'high' 
                              ? 'Very engaged user' 
                              : selectedUser.usageStats.activityLevel === 'medium'
                                ? 'Regular user'
                                : 'Occasional user'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem 
                          label="Logins" 
                          value={selectedUser.usageStats.logins.toString()} 
                        />
                        <InfoItem 
                          label="Sessions (30d)" 
                          value={selectedUser.usageStats.sessionsLast30Days.toString()} 
                        />
                        <InfoItem 
                          label="Avg. Session Time" 
                          value={selectedUser.usageStats.avgSessionTime} 
                        />
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium mb-2">Features Used</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.usageStats.featuresUsed.map(feature => (
                            <Badge key={feature} variant="outline">{feature}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="subscription" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Current Plan</h3>
                          <div className="flex items-center mt-1">
                            <SubscriptionBadge 
                              plan={selectedUser.subscriptionPlan} 
                              status={selectedUser.subscriptionStatus} 
                            />
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Change Plan</Button>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Upgrade Options</h3>
                        <div className="space-y-2">
                          {selectedUser.subscriptionPlan !== 'premium' && (
                            <div className="border rounded-md p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">Premium Plan</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Full access to all features
                                  </p>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleUpgradeSubscription(selectedUser.id, 'premium')}
                                >
                                  Upgrade
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {selectedUser.subscriptionPlan !== 'university' && (
                            <div className="border rounded-md p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">University Plan</h4>
                                  <p className="text-sm text-muted-foreground">
                                    University-specific features and integrations
                                  </p>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => handleUpgradeSubscription(selectedUser.id, 'university')}
                                >
                                  Upgrade
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Billing Information</h3>
                        <p className="text-sm text-muted-foreground">
                          This is a demonstration. Billing information would be displayed here.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <SheetFooter>
                <Button 
                  variant="outline" 
                  onClick={() => 
                    handleUpdateStatus(
                      selectedUser.id, 
                      selectedUser.accountStatus === 'active' ? 'inactive' : 'active'
                    )
                  }
                >
                  {selectedUser.accountStatus === 'active' ? 'Deactivate' : 'Activate'} Account
                </Button>
                <Button onClick={() => setIsUserDetailsOpen(false)}>Close</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Add the EditUserDialog component */}
      <EditUserDialog />
    </div>
    </UserManagementContext.Provider>
  );
}

// Helper Components
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function UserTypeBadge({ type }: { type: string }) {
  let className = '';
  let variant: "outline" | "secondary" | "destructive" | null = "outline";
  
  switch(type) {
    case 'regular':
      className = 'text-blue-600 bg-blue-50 border-blue-200';
      break;
    case 'university_student':
      className = 'text-green-600 bg-green-50 border-green-200';
      break;
    case 'university_admin':
      className = 'text-purple-600 bg-purple-50 border-purple-200';
      break;
    case 'staff':
      className = 'text-amber-600 bg-amber-50 border-amber-200';
      break;
    case 'admin':
      variant = "destructive";
      className = 'font-medium';
      break;
    default:
      className = 'text-gray-600 bg-gray-50 border-gray-200';
  }
  
  let displayName = 'User';
  if (type === 'regular') displayName = 'Regular';
  else if (type === 'university_student') displayName = 'Student';
  else if (type === 'university_admin') displayName = 'Uni Admin';
  else if (type === 'staff') displayName = 'Staff';
  else if (type === 'admin') displayName = 'Admin';
      
  return (
    <Badge variant={variant} className={className}>
      {displayName}
    </Badge>
  );
}

function SubscriptionBadge({ 
  plan, 
  status 
}: { 
  plan: string; 
  status: string;
}) {
  let className = '';
  let variant: "outline" | "secondary" | "destructive" | null = "outline";
  
  switch(plan) {
    case 'free':
      className = 'text-gray-600 bg-gray-50 border-gray-200';
      break;
    case 'premium':
      className = 'text-amber-600 bg-amber-50 border-amber-200';
      break;
    case 'university':
      variant = "secondary";
      className = 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      break;
    default:
      className = 'text-gray-600 bg-gray-50 border-gray-200';
  }
  
  // Replace emoji dots with colored indicators
  const StatusIndicator = () => {
    switch(status) {
      case 'active':
        return <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 inline-block" />;
      case 'inactive':
        return <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5 inline-block" />;
      case 'cancelled':
        return <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 inline-block" />;
      case 'past_due':
        return <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 inline-block" />;
      default:
        return null;
    }
  };
  
  // Display name with better capitalization
  const displayName = plan === 'free' ? 'Free' : 
                     plan === 'premium' ? 'Premium' : 
                     plan === 'university' ? 'University' : 
                     plan.charAt(0).toUpperCase() + plan.slice(1);
  
  return (
    <Badge variant={variant} className={className}>
      <StatusIndicator />{displayName}
    </Badge>
  );
}

function ActivityBadge({ level }: { level: string }) {
  let className = '';
  
  switch(level) {
    case 'high':
      className = 'text-green-600 bg-green-50 border-green-200';
      break;
    case 'medium':
      className = 'text-blue-600 bg-blue-50 border-blue-200';
      break;
    case 'low':
      className = 'text-orange-600 bg-orange-50 border-orange-200';
      break;
    default:
      className = 'text-gray-600 bg-gray-50 border-gray-200';
  }
  
  return (
    <Badge variant="outline" className={className}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  let className = '';
  
  switch(status) {
    case 'active':
      className = 'text-green-600 bg-green-50 border-green-200';
      break;
    case 'inactive':
      className = 'text-gray-600 bg-gray-50 border-gray-200';
      break;
    case 'suspended':
      className = 'text-red-600 bg-red-50 border-red-200';
      break;
    default:
      className = 'text-gray-600 bg-gray-50 border-gray-200';
  }
  
  return (
    <Badge variant="outline" className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Add Staff User Dialog Component
function AddStaffUserDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<AddStaffUserFormValues>({
    resolver: zodResolver(addStaffUserSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
    },
  });

  const createStaffUserMutation = useMutation({
    mutationFn: async (values: AddStaffUserFormValues) => {
      const res = await apiRequest('POST', '/api/admin/create-staff', values);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create staff user');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Staff user created",
        description: `${data.user.name} was added as a staff member.`,
      });
      setOpen(false);
      form.reset();
      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating staff user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: AddStaffUserFormValues) {
    createStaffUserMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Staff User</DialogTitle>
          <DialogDescription>
            Create a new staff user account. Staff users will have access to administrative features with limited permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="staffuser" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Staff Member Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="staff@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Set a strong temporary password for this staff user.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createStaffUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStaffUserMutation.isPending}
              >
                {createStaffUserMutation.isPending ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Staff User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Component context variables from parent component
  const parentContext = useContext(UserManagementContext);

  if (!parentContext || !parentContext.selectedUser) {
    return null;
  }

  const { 
    selectedUser, 
    isEditUserOpen, 
    setIsEditUserOpen, 
    updateUserMutation,
    searchTerm,
    filters,
    currentPage
  } = parentContext;

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: selectedUser.name,
      email: selectedUser.email,
      userType: selectedUser.userType,
      university: selectedUser.university || '',
      subscriptionPlan: selectedUser.subscriptionPlan,
      accountStatus: selectedUser.accountStatus,
    },
  });

  // Reset form when selected user changes or dialog opens
  useEffect(() => {
    if (selectedUser && isEditUserOpen) {
      form.reset({
        name: selectedUser.name,
        email: selectedUser.email,
        userType: selectedUser.userType,
        university: selectedUser.university || '',
        subscriptionPlan: selectedUser.subscriptionPlan,
        accountStatus: selectedUser.accountStatus,
      });
    }
  }, [selectedUser, isEditUserOpen, form]);

  function onSubmit(values: EditUserFormValues) {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({ 
      userId: selectedUser.id, 
      userData: values 
    });
  }

  return (
    <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
      <DialogContent className="sm:max-w-md overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to {selectedUser.name}'s profile
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="User's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="university_student">University Student</SelectItem>
                      <SelectItem value="university_admin">University Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(form.watch('userType') === 'university_student' || form.watch('userType') === 'university_admin') && (
              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University</FormLabel>
                    <FormControl>
                      <Input placeholder="University name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="subscriptionPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subscription plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="accountStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditUserOpen(false)}
                disabled={updateUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to create mock user data for demonstration

function createMockUser(id: number): User {
  const userTypes = ['regular', 'university_student', 'university_admin'] as const;
  const universities = ['MIT', 'Stanford', 'Harvard', 'Berkeley'];
  const subscriptionPlans = ['free', 'premium', 'university'] as const;
  const subscriptionStatuses = ['active', 'inactive', 'cancelled', 'past_due'] as const;
  const activityLevels = ['high', 'medium', 'low'] as const;
  const features = ['Resume Builder', 'Cover Letters', 'Interview Prep', 'AI Coach', 'Work History', 'Goals'];
  
  const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };
  
  const getRandomFromArray = <T,>(array: readonly T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  const userType = getRandomFromArray(userTypes);
  const university = userType.includes('university') 
    ? getRandomFromArray(universities) 
    : undefined;
  const subscriptionPlan = userType.includes('university') 
    ? 'university' as const
    : getRandomFromArray(['free', 'premium'] as const);
  
  // Ensure more active users and mostly active accounts for demo purposes
  const activityLevel = Math.random() > 0.3 
    ? getRandomFromArray(['high', 'medium'] as const) 
    : 'low' as const;
  
  const accountStatus = Math.random() > 0.2 
    ? 'active' as const 
    : getRandomFromArray(['inactive', 'suspended'] as const);
  
  return {
    id,
    username: `user${id}`,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    userType,
    university,
    universityId: university ? Math.floor(Math.random() * 20) + 1 : undefined,
    subscriptionPlan,
    subscriptionStatus: Math.random() > 0.2 ? 'active' : getRandomFromArray(subscriptionStatuses),
    lastLogin: randomDate(oneYearAgo, now).toISOString(),
    signupDate: randomDate(oneYearAgo, now).toISOString(),
    accountStatus,
    usageStats: {
      logins: Math.floor(Math.random() * 100) + 1,
      sessionsLast30Days: Math.floor(Math.random() * 30) + 1,
      avgSessionTime: `${Math.floor(Math.random() * 60) + 1} min`,
      featuresUsed: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => 
        getRandomFromArray(features)
      ).filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      activityLevel,
    }
  };
}