import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Download, Eye, MoreHorizontal, RefreshCw, Search, Mail, CreditCard, Calendar, Clock, AlertTriangle, User, Building2, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DrawerContent, DrawerClose, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, Drawer } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

// Customer interface
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

// Removed mock data generation - now using real Stripe billing data from API

// Utility function to get status badge variant
function getBadgeVariantForStatus(status: string): "default" | "destructive" | "outline" | "secondary" | null | undefined {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Canceled':
      return 'destructive';
    case 'Trialing':
      return 'secondary';
    default:
      return 'outline';
  }
}

export default function BillingPage() {
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [customerFilter, setCustomerFilter] = useState('all');

  // Fetch customers data
  const { data: customers, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/billing'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/billing');
      return response;
    }
  });

  // Filter customers based on search query and customer type filter
  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.stripeCustomerId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      customerFilter === 'all' || 
      (customerFilter === 'pro' && customer.userType === 'Pro') ||
      (customerFilter === 'university' && customer.userType === 'University');
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Handle customer row click
  const handleCustomerRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await apiRequest('POST', '/api/admin/billing/cancel', { customerId });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Subscription canceled",
        description: "The customer's subscription has been canceled.",
      });
      setIsDrawerOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error canceling subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await apiRequest('POST', '/api/admin/billing/reactivate', { customerId });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Subscription reactivated",
        description: "The customer's subscription has been reactivated.",
      });
      setIsDrawerOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error reactivating subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async (customerId: number) => {
      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Request sent",
        description: "A payment update request has been sent to the customer.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending payment update request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Payments</h2>
          <p className="text-muted-foreground">Manage customer subscriptions and payments</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setCustomerFilter}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Customers</TabsTrigger>
            <TabsTrigger value="pro">Pro Users</TabsTrigger>
            <TabsTrigger value="university">Universities</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-[240px] pl-8"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Payment</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="animate-spin h-5 w-5 mr-2 text-muted-foreground" />
                        <span>Loading customers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No customers found</p>
                      {searchQuery && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Try adjusting your search query
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleCustomerRowClick(customer)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal flex items-center">
                          {customer.userType === 'Pro' ? (
                            <User className="h-3 w-3 mr-1" />
                          ) : (
                            <Building2 className="h-3 w-3 mr-1" />
                          )}
                          <span>{customer.userType}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariantForStatus(customer.status)}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.status === 'Canceled' ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          format(new Date(customer.nextPaymentDate), 'MMM d, yyyy')
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ${customer.totalAmountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => {
                          e.stopPropagation();
                          handleCustomerRowClick(customer);
                        }}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          {!isLoading && filteredCustomers.length > 0 && (
            <CardFooter className="py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {filteredCustomers.length} of {customers.length} customers
              </div>
            </CardFooter>
          )}
        </Card>
      </Tabs>

      {/* Customer Details Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          {selectedCustomer && (
            <>
              <DrawerHeader>
                <div className="flex items-center">
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="mr-2">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </DrawerClose>
                  <DrawerTitle>Customer Details</DrawerTitle>
                </div>
                <DrawerDescription>View and manage customer subscription</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 py-2 overflow-auto">
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Customer Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{selectedCustomer.name}</span>
                          
                          <span className="text-muted-foreground">Email:</span>
                          <div className="flex items-center">
                            <span className="font-medium">{selectedCustomer.email}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          <span className="text-muted-foreground">Customer ID:</span>
                          <span className="font-mono text-xs">{selectedCustomer.stripeCustomerId}</span>
                          
                          <span className="text-muted-foreground">User Type:</span>
                          <span className="font-medium">{selectedCustomer.userType}</span>
                          
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={getBadgeVariantForStatus(selectedCustomer.status)}>
                            {selectedCustomer.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Subscription Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium">{selectedCustomer.currentPlan}</span>
                          
                          <span className="text-muted-foreground">Started:</span>
                          <span>{format(new Date(selectedCustomer.subscriptionStart), 'MMM d, yyyy')}</span>
                          
                          {selectedCustomer.status !== 'Canceled' && (
                            <>
                              <span className="text-muted-foreground">Renewal:</span>
                              <span>{format(new Date(selectedCustomer.subscriptionRenewal), 'MMM d, yyyy')}</span>
                            </>
                          )}
                          
                          {selectedCustomer.userType === 'University' && selectedCustomer.seats && (
                            <>
                              <span className="text-muted-foreground">Seats:</span>
                              <span>
                                {selectedCustomer.usedSeats} / {selectedCustomer.seats} used
                                <Progress 
                                  value={(selectedCustomer.usedSeats! / selectedCustomer.seats!) * 100} 
                                  className="h-2 mt-1"
                                />
                              </span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Payment Method */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Payment Method</CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updatePaymentMethodMutation.mutate(selectedCustomer.id)}
                        disabled={updatePaymentMethodMutation.isPending}
                      >
                        {updatePaymentMethodMutation.isPending ? (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-3 w-3" />
                            Update
                          </>
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {selectedCustomer.paymentMethod ? (
                        <div className="flex items-center p-3 border rounded-md bg-muted/40">
                          <div className="mr-4">
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {selectedCustomer.paymentMethod.brand} •••• {selectedCustomer.paymentMethod.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Expires {selectedCustomer.paymentMethod.expMonth}/{selectedCustomer.paymentMethod.expYear}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center p-3 border rounded-md bg-muted/40">
                          <AlertTriangle className="h-8 w-8 text-destructive mr-4" />
                          <div>
                            <p className="font-medium">No payment method on file</p>
                            <p className="text-sm text-muted-foreground">Customer needs to add a payment method</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCustomer.paymentHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4">
                                <p className="text-muted-foreground">No payment history available</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedCustomer.paymentHistory.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-mono text-xs">
                                  {payment.id}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(payment.date), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    payment.status === 'Paid' 
                                      ? 'default' 
                                      : payment.status === 'Failed' 
                                        ? 'destructive' 
                                        : 'outline'
                                  }>
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {payment.invoiceUrl && (
                                    <Button variant="ghost" size="icon">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <DrawerFooter className="border-t px-4 py-4">
                <div className="flex justify-between w-full">
                  <Button
                    variant="outline"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Close
                  </Button>
                  <div className="flex gap-2">
                    {selectedCustomer.status === 'Canceled' ? (
                      <Button
                        onClick={() => reactivateSubscriptionMutation.mutate(selectedCustomer.id)}
                        disabled={reactivateSubscriptionMutation.isPending}
                      >
                        {reactivateSubscriptionMutation.isPending ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Reactivating...
                          </>
                        ) : (
                          <>
                            <BadgeCheck className="mr-2 h-4 w-4" />
                            Reactivate Subscription
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={() => cancelSubscriptionMutation.mutate(selectedCustomer.id)}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        {cancelSubscriptionMutation.isPending ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Canceling...
                          </>
                        ) : (
                          "Cancel Subscription"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}