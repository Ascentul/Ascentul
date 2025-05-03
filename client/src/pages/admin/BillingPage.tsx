import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { 
  Search, 
  Copy, 
  MoreHorizontal, 
  Users, 
  User,
  Building, 
  Calendar, 
  CreditCard, 
  ExternalLink,
  Mail, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  FileDown,
  Eye,
  Edit,
  Ban,
  UserPlus,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useUser, useIsAdminUser } from '@/lib/useUserData';
import { useLocation } from 'wouter';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Types for our billing data
interface Customer {
  id: number;
  stripeCustomerId: string;
  name: string;
  email: string;
  userType: 'Pro' | 'University';
  status: 'Active' | 'Canceled' | 'Trialing';
  nextPaymentDate: string;
  totalAmountPaid: number;
  currentPlan: string;
  seats?: number;
  usedSeats?: number;
  paymentMethod?: {
    type: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
  };
  paymentHistory: PaymentRecord[];
  subscriptionStart: string;
  subscriptionRenewal: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Failed' | 'Pending';
  invoiceUrl?: string;
}

// Mock data generator to simulate API response
function generateMockData(): Customer[] {
  const userTypes: ('Pro' | 'University')[] = ['Pro', 'University'];
  const statuses: ('Active' | 'Canceled' | 'Trialing')[] = ['Active', 'Canceled', 'Trialing'];
  const paymentStatuses: ('Paid' | 'Failed' | 'Pending')[] = ['Paid', 'Failed', 'Pending'];
  const proPlans = ['Monthly Pro', 'Annual Pro', 'Premium Pro'];
  const universityPlans = ['Basic University', 'Standard University', 'Enterprise University'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
    const isUniversity = userType === 'University';
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const now = new Date();
    const seats = isUniversity ? Math.floor(Math.random() * 900) + 100 : undefined;
    const usedSeats = isUniversity ? Math.floor(Math.random() * seats!) : undefined;
    
    const paymentHistory: PaymentRecord[] = Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, j) => {
      const date = new Date();
      date.setMonth(date.getMonth() - j);
      const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      
      return {
        id: `inv_${Math.random().toString(36).substr(2, 9)}`,
        date: date.toISOString(),
        amount: isUniversity ? (Math.floor(Math.random() * 5000) + 1000) : (Math.floor(Math.random() * 300) + 50),
        status,
        invoiceUrl: status === 'Paid' ? `https://dashboard.stripe.com/invoices/inv_example${i}${j}` : undefined
      };
    });
    
    const totalPaid = paymentHistory
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const nextPaymentDate = addDays(now, Math.floor(Math.random() * 30) + 1).toISOString();
    const subscriptionStart = new Date(now);
    subscriptionStart.setMonth(subscriptionStart.getMonth() - Math.floor(Math.random() * 12));
    
    const subscriptionRenewal = new Date(now);
    subscriptionRenewal.setMonth(subscriptionRenewal.getMonth() + Math.floor(Math.random() * 12));
    
    return {
      id: i + 1,
      stripeCustomerId: `cus_${Math.random().toString(36).substr(2, 9)}`,
      name: isUniversity 
        ? `${['Stanford', 'Harvard', 'MIT', 'Berkeley', 'Oxford', 'Cambridge', 'Yale', 'Princeton'][Math.floor(Math.random() * 8)]} University` 
        : `${['John', 'Jane', 'Alex', 'Sara', 'Mike', 'Emily', 'Sam', 'Olivia'][Math.floor(Math.random() * 8)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][Math.floor(Math.random() * 8)]}`,
      email: isUniversity 
        ? `admin@${['stanford', 'harvard', 'mit', 'berkeley', 'oxford', 'cambridge', 'yale', 'princeton'][Math.floor(Math.random() * 8)]}.edu`.toLowerCase() 
        : `${['john', 'jane', 'alex', 'sara', 'mike', 'emily', 'sam', 'olivia'][Math.floor(Math.random() * 8)]}.${['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis'][Math.floor(Math.random() * 8)]}@example.com`.toLowerCase(),
      userType,
      status,
      nextPaymentDate,
      totalAmountPaid: totalPaid,
      currentPlan: isUniversity ? universityPlans[Math.floor(Math.random() * universityPlans.length)] : proPlans[Math.floor(Math.random() * proPlans.length)],
      seats,
      usedSeats,
      paymentMethod: {
        type: 'card',
        brand: ['Visa', 'Mastercard', 'Amex', 'Discover'][Math.floor(Math.random() * 4)],
        last4: Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        expMonth: Math.floor(Math.random() * 12) + 1,
        expYear: 2024 + Math.floor(Math.random() * 5)
      },
      paymentHistory,
      subscriptionStart: subscriptionStart.toISOString(),
      subscriptionRenewal: subscriptionRenewal.toISOString()
    };
  });
}

// Billing Page Component
export default function BillingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Query for customer data
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/billing/customers', customerTypeFilter, statusFilter, searchTerm],
    queryFn: async () => {
      try {
        // In a real app, this would be an API call
        // const response = await apiRequest('GET', '/api/admin/billing/customers');
        // return await response.json();
        
        // For now, return mock data
        return generateMockData();
      } catch (error) {
        console.error("Error fetching billing data:", error);
        toast({
          title: "Error fetching billing data",
          description: "Failed to load customer billing information",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // Filter customers based on search and filters
  const filteredCustomers = customers
    .filter(customer => {
      // Search term filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return customer.name.toLowerCase().includes(search) ||
               customer.email.toLowerCase().includes(search) ||
               customer.stripeCustomerId.toLowerCase().includes(search);
      }
      return true;
    })
    .filter(customer => {
      // Customer type filter
      if (customerTypeFilter === 'all') return true;
      return customer.userType.toLowerCase() === customerTypeFilter.toLowerCase();
    })
    .filter(customer => {
      // Status filter
      if (statusFilter === 'all') return true;
      return customer.status.toLowerCase() === statusFilter.toLowerCase();
    });
    
  // Pagination settings
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle customer row click to view details
  const handleCustomerRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };
  
  // Mutation for canceling subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (customerId: number) => {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate API delay
      return { success: true, customerId };
    },
    onSuccess: (data) => {
      // Update the customer status in the cache
      queryClient.setQueryData(
        ['/api/admin/billing/customers', customerTypeFilter, statusFilter, searchTerm],
        (oldData: Customer[] | undefined) => 
          oldData?.map(customer => 
            customer.id === data.customerId
              ? { ...customer, status: 'Canceled' }
              : customer
          )
      );
      
      toast({
        title: "Subscription Canceled",
        description: "The customer's subscription has been canceled."
      });
      
      // Update the selected customer if we're looking at them
      if (selectedCustomer && selectedCustomer.id === data.customerId) {
        setSelectedCustomer({
          ...selectedCustomer,
          status: 'Canceled'
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to cancel subscription: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for retrying payment
  const retryPaymentMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate API delay
      return { success: true, invoiceId };
    },
    onSuccess: (data) => {
      // Update the payment status in the cache
      if (selectedCustomer) {
        const updatedHistory = selectedCustomer.paymentHistory.map(payment =>
          payment.id === data.invoiceId
            ? { ...payment, status: 'Paid' as const }
            : payment
        );
        
        setSelectedCustomer({
          ...selectedCustomer,
          paymentHistory: updatedHistory
        });
        
        // Also update in the main customers list
        queryClient.setQueryData(
          ['/api/admin/billing/customers', customerTypeFilter, statusFilter, searchTerm],
          (oldData: Customer[] | undefined) => 
            oldData?.map(customer => 
              customer.id === selectedCustomer.id
                ? { ...customer, paymentHistory: updatedHistory }
                : customer
            )
        );
      }
      
      toast({
        title: "Payment Retried",
        description: "The payment has been successfully processed."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to retry payment: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for updating seats
  const updateSeatsMutation = useMutation({
    mutationFn: async ({ customerId, newSeats }: { customerId: number, newSeats: number }) => {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate API delay
      return { success: true, customerId, newSeats };
    },
    onSuccess: (data) => {
      // Update the seats in the cache
      queryClient.setQueryData(
        ['/api/admin/billing/customers', customerTypeFilter, statusFilter, searchTerm],
        (oldData: Customer[] | undefined) => 
          oldData?.map(customer => 
            customer.id === data.customerId
              ? { ...customer, seats: data.newSeats }
              : customer
          )
      );
      
      // Update the selected customer if we're looking at them
      if (selectedCustomer && selectedCustomer.id === data.customerId) {
        setSelectedCustomer({
          ...selectedCustomer,
          seats: data.newSeats
        });
      }
      
      toast({
        title: "Seats Updated",
        description: `The license seats have been updated to ${data.newSeats}.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update seats: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Export customer billing data as CSV
  const exportBillingData = () => {
    const headers = [
      'Customer Name',
      'Email',
      'Type',
      'Status',
      'Current Plan',
      'Next Payment',
      'Total Paid'
    ];
    
    const csvRows = [
      headers.join(','),
      ...filteredCustomers.map(c => [
        `"${c.name}"`,
        `"${c.email}"`,
        c.userType,
        c.status,
        `"${c.currentPlan}"`,
        format(new Date(c.nextPaymentDate), 'MM/dd/yyyy'),
        `$${c.totalAmountPaid.toFixed(2)}`
      ].join(','))
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Billing data has been exported as CSV."
    });
  };
  
  // Pagination handlers
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setCustomerTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };
  
  // Handlers for the drawer actions
  const handleUpdateSeats = (newSeats: number) => {
    if (selectedCustomer) {
      updateSeatsMutation.mutate({ customerId: selectedCustomer.id, newSeats });
    }
  };
  
  const handleCancelSubscription = () => {
    if (selectedCustomer && selectedCustomer.status !== 'Canceled') {
      if (window.confirm(`Are you sure you want to cancel the subscription for ${selectedCustomer.name}?`)) {
        cancelSubscriptionMutation.mutate(selectedCustomer.id);
      }
    }
  };
  
  const handleRetryPayment = (invoiceId: string) => {
    retryPaymentMutation.mutate(invoiceId);
  };
  
  const openStripeCustomer = () => {
    if (selectedCustomer) {
      window.open(`https://dashboard.stripe.com/customers/${selectedCustomer.stripeCustomerId}`, '_blank');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Billing Management</h1>
          <p className="text-muted-foreground">View and manage customer subscriptions and payments</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={exportBillingData}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <Tabs defaultValue="all" onValueChange={setCustomerTypeFilter}>
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="pro">Pro Users</TabsTrigger>
          <TabsTrigger value="university">Universities</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or customer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={resetFilters}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Payment</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                      Loading customer data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No customers found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCustomerRowClick(customer)}
                  >
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.currentPlan}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="mr-2">{customer.email}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(customer.email);
                            toast({
                              title: "Email Copied",
                              description: "Email address copied to clipboard",
                              variant: "default"
                            });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.userType === 'Pro' ? 'default' : 'secondary'}>
                        {customer.userType === 'Pro' ? (
                          <User className="mr-1 h-3 w-3" />
                        ) : (
                          <Building className="mr-1 h-3 w-3" />
                        )}
                        {customer.userType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          customer.status === 'Active' ? 'success' :
                          customer.status === 'Trialing' ? 'warning' : 'destructive'
                        }
                      >
                        {customer.status === 'Active' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : customer.status === 'Trialing' ? (
                          <Clock className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(customer.nextPaymentDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      ${customer.totalAmountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          <DropdownMenuItem onClick={() => handleCustomerRowClick(customer)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Billing
                          </DropdownMenuItem>
                          
                          {customer.userType === 'University' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              const newSeats = window.prompt("Enter new number of seats:", customer.seats?.toString());
                              if (newSeats && !isNaN(parseInt(newSeats))) {
                                handleUpdateSeats(parseInt(newSeats));
                              }
                            }}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Update Seats
                            </DropdownMenuItem>
                          )}
                          
                          {customer.status !== 'Canceled' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleCancelSubscription();
                            }}>
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://dashboard.stripe.com/customers/${customer.stripeCustomerId}`, '_blank');
                          }}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View in Stripe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* Pagination Footer */}
        {filteredCustomers.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(filteredCustomers.length, (currentPage - 1) * itemsPerPage + 1)}-
              {Math.min(filteredCustomers.length, currentPage * itemsPerPage)} of {filteredCustomers.length} customers
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Customer Details Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle>Billing Details</SheetTitle>
                <SheetDescription>
                  Customer and subscription information
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6">
                {/* Customer Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{selectedCustomer.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4" />
                    {selectedCustomer.email}
                  </div>
                  <div className="flex items-center text-sm">
                    <Badge 
                      variant={
                        selectedCustomer.status === 'Active' ? 'success' :
                        selectedCustomer.status === 'Trialing' ? 'warning' : 'destructive'
                      }
                      className="mr-2"
                    >
                      {selectedCustomer.status}
                    </Badge>
                    <Badge variant="outline">
                      {selectedCustomer.userType}
                    </Badge>
                  </div>
                </div>
                
                {/* Subscription Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium border-b pb-2">Subscription Details</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Stripe ID</div>
                    <div className="font-mono">{selectedCustomer.stripeCustomerId}</div>
                    
                    <div className="text-muted-foreground">Current Plan</div>
                    <div className="font-medium">{selectedCustomer.currentPlan}</div>
                    
                    <div className="text-muted-foreground">Next Invoice</div>
                    <div>{format(new Date(selectedCustomer.nextPaymentDate), 'MMM d, yyyy')}</div>
                    
                    <div className="text-muted-foreground">Start Date</div>
                    <div>{format(new Date(selectedCustomer.subscriptionStart), 'MMM d, yyyy')}</div>
                    
                    <div className="text-muted-foreground">Renewal Date</div>
                    <div>{format(new Date(selectedCustomer.subscriptionRenewal), 'MMM d, yyyy')}</div>
                    
                    {selectedCustomer.userType === 'University' && (
                      <>
                        <div className="text-muted-foreground">License Seats</div>
                        <div className="flex items-center">
                          <span className="mr-2">{selectedCustomer.usedSeats} / {selectedCustomer.seats}</span>
                          <Progress 
                            value={(selectedCustomer.usedSeats! / selectedCustomer.seats!) * 100} 
                            className="h-2 w-16" 
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Payment Method */}
                {selectedCustomer.paymentMethod && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium border-b pb-2">Payment Method</h4>
                    
                    <div className="flex items-center p-3 border rounded-md">
                      <CreditCard className="h-8 w-8 mr-3 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {selectedCustomer.paymentMethod.brand} •••• {selectedCustomer.paymentMethod.last4}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires {selectedCustomer.paymentMethod.expMonth}/{selectedCustomer.paymentMethod.expYear}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment History */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium border-b pb-2">Payment History</h4>
                  
                  {selectedCustomer.paymentHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No payment records found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCustomer.paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <div className="font-medium">
                              ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(payment.date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge 
                              variant={
                                payment.status === 'Paid' ? 'success' :
                                payment.status === 'Pending' ? 'warning' : 'destructive'
                              }
                              className="mr-2"
                            >
                              {payment.status}
                            </Badge>
                            
                            {payment.status === 'Failed' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRetryPayment(payment.id)}
                                title="Retry payment"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            ) : payment.invoiceUrl ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(payment.invoiceUrl, '_blank')}
                                title="View invoice"
                              >
                                <FileDown className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Admin Actions */}
              <div className="space-y-2 mt-6 border-t pt-6">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={openStripeCustomer}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Stripe Dashboard
                </Button>
                
                {selectedCustomer.userType === 'University' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      const newSeats = window.prompt("Enter new number of seats:", selectedCustomer.seats?.toString());
                      if (newSeats && !isNaN(parseInt(newSeats))) {
                        handleUpdateSeats(parseInt(newSeats));
                      }
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Update License Seats
                  </Button>
                )}
                
                {selectedCustomer.status !== 'Canceled' && (
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={handleCancelSubscription}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Badge variants for success and warning
// These would normally be defined in your theme, but included here for completeness
function getBadgeVariantStyles(variant?: string) {
  if (variant === 'success') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  }
  if (variant === 'warning') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  }
}