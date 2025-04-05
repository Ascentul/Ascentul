import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus, 
  Loader2, 
  Shield, 
  CheckCircle, 
  XCircle
} from 'lucide-react';
import { adminApiClient } from '@/lib/adminApiClient';
import { adminEndpoints } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { queryClient } from '@/lib/queryClient';

type User = {
  id: number;
  email: string;
  name: string;
  userType: 'regular' | 'admin' | 'staff';
  isVerified: boolean;
  hasActiveSubscription: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type CreateStaffData = {
  email: string;
  name: string;
  password: string;
};

const ITEMS_PER_PAGE = 10;

export function UserManagement() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffData, setStaffData] = useState<CreateStaffData>({
    email: '',
    name: '',
    password: '',
  });
  
  // Fetch users with pagination, search, and filtering
  const { data, isLoading, isError } = useQuery({
    queryKey: [adminEndpoints.users, page, searchTerm, filterType],
    queryFn: () => adminApiClient.getUsers(
      page, 
      ITEMS_PER_PAGE, 
      {
        search: searchTerm || undefined,
        userType: filterType,
      }
    ),
  });
  
  // Create staff account mutation
  const createStaffMutation = useMutation({
    mutationFn: (data: CreateStaffData) => adminApiClient.createStaffAccount(data),
    onSuccess: () => {
      toast({
        title: 'Staff account created',
        description: 'The staff account has been created successfully.',
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [adminEndpoints.users] });
      // Reset form
      setStaffData({ email: '', name: '', password: '' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create staff account',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => 
      adminApiClient.updateUserRole(userId, role),
    onSuccess: () => {
      toast({
        title: 'User role updated',
        description: 'The user role has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [adminEndpoints.users] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update user role',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };
  
  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilterType(value === 'all' ? undefined : value);
    setPage(1); // Reset to first page when filtering
  };
  
  // Handle pagination
  const handleNextPage = () => {
    if (data && data.page < Math.ceil(data.total / data.limit)) {
      setPage(page + 1);
    }
  };
  
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStaffData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle staff creation form submission
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    createStaffMutation.mutate(staffData);
  };
  
  // Handle user role change
  const handleRoleChange = (userId: number, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };
  
  // Format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Render user status badge
  const renderUserStatus = (user: User) => {
    if (user.userType === 'admin') {
      return (
        <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          Admin
        </Badge>
      );
    } else if (user.userType === 'staff') {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Staff
        </Badge>
      );
    } else if (user.hasActiveSubscription) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          Premium
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Free
        </Badge>
      );
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium">Failed to load users</h3>
        <p className="text-muted-foreground">
          There was an error loading the user data. Please try again.
        </p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: [adminEndpoints.users] })}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <Select
            value={filterType || 'all'}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by role" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="regular">Regular Users</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Staff Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Staff Account</DialogTitle>
              <DialogDescription>
                Create a new staff account with administrative access to help manage user queries and content.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateStaff}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={staffData.name}
                    onChange={handleInputChange}
                    placeholder="Enter staff member's name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={staffData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={staffData.password}
                    onChange={handleInputChange}
                    placeholder="Enter secure password"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createStaffMutation.isPending}
                >
                  {createStaffMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Staff Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden md:table-cell">Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data?.users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              data?.users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderUserStatus(user)}
                  </TableCell>
                  <TableCell>
                    {user.isVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(user.lastLoginAt)}
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
                        <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        {user.userType !== 'admin' && (
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {user.userType !== 'staff' && user.userType !== 'admin' && (
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'staff')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Staff
                          </DropdownMenuItem>
                        )}
                        {(user.userType === 'staff' || user.userType === 'admin') && (
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'regular')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Remove Role
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {data && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {data.users.length} of {data.total} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= Math.ceil(data.total / data.limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}