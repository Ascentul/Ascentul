import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Building, 
  Calendar, 
  Mail, 
  Users, 
  AlertTriangle,
  RefreshCw,
  Download,
  FileDown,
  Eye,
  Edit,
  Ban,
  UserPlus,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useUser, useIsAdminUser } from '@/lib/useUserData';
import { useLocation } from 'wouter';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from '@/hooks/use-toast';

// Define types
interface University {
  id: number;
  name: string;
  adminName: string;
  adminEmail: string;
  licensePlan: 'Starter' | 'Pro' | 'Enterprise';
  licenseSeats: number;
  licenseUsed: number;
  licenseStart: string;
  licenseEnd: string;
  status: 'Active' | 'Expired' | 'Suspended';
  universityId: string;
  createdAt: string;
  engagementStats: {
    logins: number;
    activeUsers: number;
    featuresUsed: string[];
    completionRate: number;
  };
}

// Create university form schema
const addUniversitySchema = z.object({
  name: z.string().min(2, { message: "University name is required" }),
  adminName: z.string().min(2, { message: "Admin name is required" }),
  adminEmail: z.string().email({ message: "Please enter a valid email" }),
  licensePlan: z.enum(["Starter", "Pro", "Enterprise"], {
    required_error: "Please select a license plan",
  }),
  licenseSeats: z.coerce.number().min(1, { message: "Must have at least 1 seat" }),
  licenseStart: z.string().min(1, { message: "Start date is required" }),
  licenseEnd: z.string().min(1, { message: "End date is required" }),
});

type AddUniversityFormValues = z.infer<typeof addUniversitySchema>;

export default function Universities() {
  const { user } = useUser();
  const isAdmin = useIsAdminUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expiringFilter, setExpiringFilter] = useState(false);
  const [isAddUniversityOpen, setIsAddUniversityOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  // Fetch universities with search and filters
  const { data: universities, isLoading } = useQuery<University[]>({
    queryKey: ['/api/admin/universities', searchTerm, statusFilter, expiringFilter],
    // In a real app, this would call the API
    // This is mocked for demo
    initialData: Array.from({ length: 15 }, (_, i) => createMockUniversity(i + 1)),
  });

  // Filter universities based on filters
  const filteredUniversities = universities?.filter(university => {
    // Filter by search term
    const matchesSearch = searchTerm === '' ||
      university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      university.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || university.status === statusFilter;
    
    // Filter by expiring soon (next 30 days)
    const isExpiringSoon = () => {
      if (!expiringFilter) return true;
      
      const endDate = new Date(university.licenseEnd);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      return endDate <= thirtyDaysFromNow && endDate >= today;
    };
    
    return matchesSearch && matchesStatus && isExpiringSoon();
  });

  // Add university mutation
  const addUniversityMutation = useMutation({
    mutationFn: async (data: AddUniversityFormValues) => {
      // This would be an API call in a real app
      const universityId = generateUniversityId();
      const newUniversity: University = {
        id: universities.length + 1,
        name: data.name,
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        licensePlan: data.licensePlan as 'Starter' | 'Pro' | 'Enterprise',
        licenseSeats: data.licenseSeats,
        licenseUsed: 0,
        licenseStart: data.licenseStart,
        licenseEnd: data.licenseEnd,
        status: 'Active',
        universityId,
        createdAt: new Date().toISOString(),
        engagementStats: {
          logins: 0,
          activeUsers: 0,
          featuresUsed: [],
          completionRate: 0
        }
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return newUniversity;
    },
    onSuccess: (newUniversity) => {
      // Update cache with new university
      queryClient.setQueryData(
        ['/api/admin/universities', searchTerm, statusFilter, expiringFilter],
        (old: University[] | undefined) => [...(old || []), newUniversity]
      );
      
      // Close modal and show success message
      setIsAddUniversityOpen(false);
      
      toast({
        title: "University Added",
        description: `${newUniversity.name} has been added successfully.`,
      });
      
      // In a real app, you would trigger an email to the admin
      toast({
        title: "Admin Invite Sent",
        description: `An invitation has been sent to ${newUniversity.adminEmail}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding University",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update university status mutation
  const updateUniversityStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'Active' | 'Suspended' | 'Expired' }) => {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, status };
    },
    onSuccess: (data) => {
      // Update cache with new status
      queryClient.setQueryData(
        ['/api/admin/universities', searchTerm, statusFilter, expiringFilter],
        (old: University[] | undefined) => 
          old?.map(university => 
            university.id === data.id 
              ? { ...university, status: data.status } 
              : university
          )
      );
      
      const statusText = data.status.toLowerCase();
      const actionText = data.status === 'Active' ? 'activated' : 
                        data.status === 'Suspended' ? 'suspended' : 'marked as expired';
      
      toast({
        title: `University ${actionText}`,
        description: `The university has been ${actionText} successfully.`,
      });
      
      // If we're updating the currently selected university, update it
      if (selectedUniversity && selectedUniversity.id === data.id) {
        setSelectedUniversity({
          ...selectedUniversity,
          status: data.status
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating University",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Form for adding a new university
  const addUniversityForm = useForm<AddUniversityFormValues>({
    resolver: zodResolver(addUniversitySchema),
    defaultValues: {
      name: "",
      adminName: "",
      adminEmail: "",
      licensePlan: "Starter",
      licenseSeats: 50,
      licenseStart: new Date().toISOString().substring(0, 10),
      licenseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().substring(0, 10)
    }
  });

  // Handle university row click to open details drawer
  const handleUniversityRowClick = (university: University) => {
    setSelectedUniversity(university);
    setIsDrawerOpen(true);
  };

  // Handle form submission for adding a university
  function onSubmitAddUniversity(values: AddUniversityFormValues) {
    addUniversityMutation.mutate(values);
  }

  // Generate a random university ID
  function generateUniversityId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Universities</h1>
          <p className="text-muted-foreground">Manage university clients and licenses</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button onClick={() => setIsAddUniversityOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New University
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
                placeholder="Search by university name or admin email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="expiringFilter" 
                  checked={expiringFilter}
                  onCheckedChange={(checked) => setExpiringFilter(checked === true)}
                />
                <Label htmlFor="expiringFilter" className="text-sm font-medium">
                  Expiring Soon
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Universities Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Universities</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filteredUniversities?.length} universities found
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>University</TableHead>
                    <TableHead className="hidden md:table-cell">Admin Email</TableHead>
                    <TableHead className="hidden sm:table-cell">License Plan</TableHead>
                    <TableHead className="hidden md:table-cell">Seats</TableHead>
                    <TableHead className="hidden lg:table-cell">Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUniversities?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No universities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUniversities?.map((university) => (
                      <TableRow 
                        key={university.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleUniversityRowClick(university)}
                      >
                        <TableCell>
                          <div className="font-medium">{university.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {university.adminEmail}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{university.adminEmail}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <LicensePlanBadge plan={university.licensePlan} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center">
                            <span className="mr-2 text-sm">
                              {university.licenseUsed} / {university.licenseSeats}
                            </span>
                            <Progress 
                              value={(university.licenseUsed / university.licenseSeats) * 100} 
                              className="h-2 w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {format(new Date(university.licenseEnd), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={university.status} />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleUniversityRowClick(university)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  const newStatus = university.status === 'Suspended' ? 'Active' : 'Suspended';
                                  updateUniversityStatusMutation.mutate({ 
                                    id: university.id, 
                                    status: newStatus
                                  });
                                }}
                              >
                                {university.status === 'Suspended' ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reactivate
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Seats
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset Admin
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
          )}
        </CardContent>
      </Card>

      {/* Add University Modal */}
      <Dialog open={isAddUniversityOpen} onOpenChange={setIsAddUniversityOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New University</DialogTitle>
            <DialogDescription>
              Create a new university client. An invite will be sent to the university admin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addUniversityForm}>
            <form onSubmit={addUniversityForm.handleSubmit(onSubmitAddUniversity)} className="space-y-4">
              <FormField
                control={addUniversityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University Name</FormLabel>
                    <FormControl>
                      <Input placeholder="University of Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addUniversityForm.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addUniversityForm.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@university.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addUniversityForm.control}
                  name="licensePlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plan</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Starter">Starter</SelectItem>
                          <SelectItem value="Pro">Pro</SelectItem>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addUniversityForm.control}
                  name="licenseSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Seats</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addUniversityForm.control}
                  name="licenseStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addUniversityForm.control}
                  name="licenseEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsAddUniversityOpen(false)}
                  disabled={addUniversityMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addUniversityMutation.isPending}
                >
                  {addUniversityMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add University"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* University Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedUniversity && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl">{selectedUniversity.name}</SheetTitle>
                <SheetDescription>
                  University ID: {selectedUniversity.universityId}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex justify-between items-center">
                  <StatusBadge status={selectedUniversity.status} large />
                  <span className="text-sm text-muted-foreground">
                    Added on {format(new Date(selectedUniversity.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Main Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">License Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Plan</span>
                        <LicensePlanBadge plan={selectedUniversity.licensePlan} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Seats</span>
                        <span>{selectedUniversity.licenseUsed} / {selectedUniversity.licenseSeats}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium block mb-1">Seat Usage</span>
                        <div className="flex items-center">
                          <Progress 
                            value={(selectedUniversity.licenseUsed / selectedUniversity.licenseSeats) * 100} 
                            className="h-2 flex-1"
                          />
                          <span className="ml-2 text-sm">
                            {Math.round((selectedUniversity.licenseUsed / selectedUniversity.licenseSeats) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-sm font-medium">License Start</span>
                        <span>{format(new Date(selectedUniversity.licenseStart), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">License End</span>
                        <span className={`${isLicenseExpiringSoon(selectedUniversity.licenseEnd) ? 'text-orange-500 font-semibold' : ''}`}>
                          {format(new Date(selectedUniversity.licenseEnd), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Admin Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{selectedUniversity.adminEmail}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{selectedUniversity.adminName}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Engagement Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Active Users</span>
                          <span className="text-sm font-medium">
                            {selectedUniversity.engagementStats.activeUsers} users
                          </span>
                        </div>
                        <Progress 
                          value={(selectedUniversity.engagementStats.activeUsers / selectedUniversity.licenseSeats) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Completion Rate</span>
                          <span className="text-sm font-medium">
                            {selectedUniversity.engagementStats.completionRate}%
                          </span>
                        </div>
                        <Progress 
                          value={selectedUniversity.engagementStats.completionRate} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="pt-2">
                        <span className="text-sm font-medium block mb-2">Features Used</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedUniversity.engagementStats.featuresUsed.length > 0 ? (
                            selectedUniversity.engagementStats.featuresUsed.map((feature, index) => (
                              <Badge key={index} variant="outline" className="bg-primary/10">
                                {feature}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No features used yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 mt-6">
                  <Button className="w-full" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Extend License
                  </Button>
                  <Button 
                    className="w-full" 
                    variant={selectedUniversity.status === 'Suspended' ? 'default' : 'outline'}
                    onClick={() => {
                      const newStatus = selectedUniversity.status === 'Suspended' ? 'Active' : 'Suspended';
                      updateUniversityStatusMutation.mutate({ 
                        id: selectedUniversity.id, 
                        status: newStatus
                      });
                    }}
                  >
                    {selectedUniversity.status === 'Suspended' ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reactivate University
                      </>
                    ) : (
                      <>
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend University
                      </>
                    )}
                  </Button>
                  <Button className="w-full" variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Seats
                  </Button>
                  <Button className="w-full" variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Admin Password
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Helper components
function StatusBadge({ status, large = false }: { status: string, large?: boolean }) {
  let variant = "default";
  let statusColor = "";
  
  switch (status) {
    case 'Active':
      variant = "outline";
      statusColor = "bg-green-500/20 text-green-700 border-green-500/20";
      break;
    case 'Expired':
      variant = "outline";
      statusColor = "bg-red-500/20 text-red-700 border-red-500/20";
      break;
    case 'Suspended':
      variant = "outline";
      statusColor = "bg-orange-500/20 text-orange-700 border-orange-500/20";
      break;
  }
  
  return (
    <Badge 
      variant={variant as any} 
      className={`${statusColor} ${large ? 'px-3 py-1.5 text-sm' : ''}`}
    >
      {status}
    </Badge>
  );
}

function LicensePlanBadge({ plan }: { plan: string }) {
  let planColor = "";
  
  switch (plan) {
    case 'Starter':
      planColor = "bg-blue-500/20 text-blue-700 border-blue-500/20";
      break;
    case 'Pro':
      planColor = "bg-purple-500/20 text-purple-700 border-purple-500/20";
      break;
    case 'Enterprise':
      planColor = "bg-primary/20 text-primary border-primary/20";
      break;
  }
  
  return (
    <Badge variant="outline" className={planColor}>
      {plan}
    </Badge>
  );
}

// Helper function to check if license is expiring in 30 days
function isLicenseExpiringSoon(licenseEndDate: string): boolean {
  const endDate = new Date(licenseEndDate);
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  return endDate <= thirtyDaysFromNow && endDate >= today;
}

// Mock data function
function createMockUniversity(id: number): University {
  const plans = ['Starter', 'Pro', 'Enterprise'] as const;
  const statuses = ['Active', 'Expired', 'Suspended'] as const;
  const features = [
    'Resume Builder', 
    'Career Coach', 
    'Interview Prep', 
    'Job Finder', 
    'Skills Assessment',
    'Cover Letter Generator',
    'Networking Tools'
  ];
  
  // Generate random dates within reasonable ranges
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(today.getMonth() - Math.floor(Math.random() * 6)); // 0-6 months ago
  
  const endDate = new Date(startDate);
  endDate.setFullYear(startDate.getFullYear() + 1); // License for 1 year
  
  // Status weighted towards active
  const randomStatus = Math.random();
  let status: typeof statuses[number];
  if (randomStatus < 0.7) {
    status = 'Active';
  } else if (randomStatus < 0.9) {
    status = 'Expired';
  } else {
    status = 'Suspended';
  }
  
  // For some universities, make the expiry date coming up soon
  if (id % 4 === 0 && status === 'Active') {
    endDate.setDate(today.getDate() + Math.floor(Math.random() * 30)); // Expires in 0-30 days
  }
  
  // Random license seats and usage
  const licenseSeats = 50 + Math.floor(Math.random() * 450); // 50-500 seats
  const licenseUsed = Math.floor(licenseSeats * (0.3 + Math.random() * 0.7)); // 30-100% usage
  
  // Generate 2-5 random features used
  const featuresUsed: string[] = [];
  const featureCount = 2 + Math.floor(Math.random() * 4);
  while (featuresUsed.length < featureCount) {
    const feature = features[Math.floor(Math.random() * features.length)];
    if (!featuresUsed.includes(feature)) {
      featuresUsed.push(feature);
    }
  }
  
  return {
    id,
    name: `University ${id}`,
    adminName: `Admin ${id}`,
    adminEmail: `admin${id}@university${id}.edu`,
    licensePlan: plans[id % 3],
    licenseSeats,
    licenseUsed,
    licenseStart: startDate.toISOString(),
    licenseEnd: endDate.toISOString(),
    status,
    universityId: `UNIV${id}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    createdAt: startDate.toISOString(),
    engagementStats: {
      logins: Math.floor(Math.random() * 1000),
      activeUsers: Math.min(licenseUsed, licenseSeats),
      featuresUsed,
      completionRate: Math.floor(Math.random() * 100),
    }
  };
}