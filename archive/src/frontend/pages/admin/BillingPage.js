import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Download, MoreHorizontal, RefreshCw, Search, Mail, CreditCard, AlertTriangle, User, Building2, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DrawerContent, DrawerClose, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, Drawer } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
// Removed mock data generation - now using real Stripe billing data from API
// Utility function to get status badge variant
function getBadgeVariantForStatus(status) {
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
    const [selectedCustomer, setSelectedCustomer] = useState(null);
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
        const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.stripeCustomerId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = customerFilter === 'all' ||
            (customerFilter === 'pro' && customer.userType === 'Pro') ||
            (customerFilter === 'university' && customer.userType === 'University');
        return matchesSearch && matchesFilter;
    }) || [];
    // Handle customer row click
    const handleCustomerRowClick = (customer) => {
        setSelectedCustomer(customer);
        setIsDrawerOpen(true);
    };
    // Cancel subscription mutation
    const cancelSubscriptionMutation = useMutation({
        mutationFn: async (customerId) => {
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
        onError: (error) => {
            toast({
                title: "Error canceling subscription",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // Reactivate subscription mutation
    const reactivateSubscriptionMutation = useMutation({
        mutationFn: async (customerId) => {
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
        onError: (error) => {
            toast({
                title: "Error reactivating subscription",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // Update payment method mutation
    const updatePaymentMethodMutation = useMutation({
        mutationFn: async (customerId) => {
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
        onError: (error) => {
            toast({
                title: "Error sending payment update request",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold tracking-tight", children: "Billing & Payments" }), _jsx("p", { className: "text-muted-foreground", children: "Manage customer subscriptions and payments" })] }), _jsxs(Button, { onClick: () => refetch(), children: [_jsx(RefreshCw, { className: "mr-2 h-4 w-4" }), "Refresh"] })] }), _jsxs(Tabs, { defaultValue: "all", className: "w-full", onValueChange: setCustomerFilter, children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "all", children: "All Customers" }), _jsx(TabsTrigger, { value: "pro", children: "Pro Users" }), _jsx(TabsTrigger, { value: "university", children: "Universities" })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { className: "w-[240px] pl-8", placeholder: "Search customers...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] })] }), _jsxs(Card, { children: [_jsx(CardContent, { className: "p-0", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Customer" }), _jsx(TableHead, { children: "User Type" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Next Payment" }), _jsx(TableHead, { className: "text-right", children: "Amount Paid" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: isLoading ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, className: "text-center py-8", children: _jsxs("div", { className: "flex justify-center items-center", children: [_jsx(RefreshCw, { className: "animate-spin h-5 w-5 mr-2 text-muted-foreground" }), _jsx("span", { children: "Loading customers..." })] }) }) })) : filteredCustomers.length === 0 ? (_jsx(TableRow, { children: _jsxs(TableCell, { colSpan: 6, className: "text-center py-8", children: [_jsx("p", { className: "text-muted-foreground", children: "No customers found" }), searchQuery && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Try adjusting your search query" }))] }) })) : (filteredCustomers.map((customer) => (_jsxs(TableRow, { className: "cursor-pointer hover:bg-muted/50", onClick: () => handleCustomerRowClick(customer), children: [_jsx(TableCell, { children: _jsxs("div", { className: "flex flex-col", children: [_jsx("div", { className: "font-medium", children: customer.name }), _jsx("div", { className: "text-sm text-muted-foreground", children: customer.email })] }) }), _jsx(TableCell, { children: _jsxs(Badge, { variant: "outline", className: "font-normal flex items-center", children: [customer.userType === 'Pro' ? (_jsx(User, { className: "h-3 w-3 mr-1" })) : (_jsx(Building2, { className: "h-3 w-3 mr-1" })), _jsx("span", { children: customer.userType })] }) }), _jsx(TableCell, { children: _jsx(Badge, { variant: getBadgeVariantForStatus(customer.status), children: customer.status }) }), _jsx(TableCell, { children: customer.status === 'Canceled' ? (_jsx("span", { className: "text-muted-foreground", children: "\u2014" })) : (format(new Date(customer.nextPaymentDate), 'MMM d, yyyy')) }), _jsxs(TableCell, { className: "text-right", children: ["$", customer.totalAmountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })] }), _jsx(TableCell, { className: "text-right", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: (e) => {
                                                                e.stopPropagation();
                                                                handleCustomerRowClick(customer);
                                                            }, children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }) })] }, customer.id)))) })] }) }), !isLoading && filteredCustomers.length > 0 && (_jsx(CardFooter, { className: "py-4 border-t", children: _jsxs("div", { className: "text-sm text-muted-foreground", children: ["Showing ", filteredCustomers.length, " of ", customers.length, " customers"] }) }))] })] }), _jsx(Drawer, { open: isDrawerOpen, onOpenChange: setIsDrawerOpen, children: _jsx(DrawerContent, { className: "max-h-[85vh]", children: selectedCustomer && (_jsxs(_Fragment, { children: [_jsxs(DrawerHeader, { children: [_jsxs("div", { className: "flex items-center", children: [_jsx(DrawerClose, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "mr-2", children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }) }), _jsx(DrawerTitle, { children: "Customer Details" })] }), _jsx(DrawerDescription, { children: "View and manage customer subscription" })] }), _jsx("div", { className: "px-4 py-2 overflow-auto", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Customer Information" }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-[100px_1fr] gap-2 text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Name:" }), _jsx("span", { className: "font-medium", children: selectedCustomer.name }), _jsx("span", { className: "text-muted-foreground", children: "Email:" }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "font-medium", children: selectedCustomer.email }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 ml-1", children: _jsx(Mail, { className: "h-3.5 w-3.5" }) })] }), _jsx("span", { className: "text-muted-foreground", children: "Customer ID:" }), _jsx("span", { className: "font-mono text-xs", children: selectedCustomer.stripeCustomerId }), _jsx("span", { className: "text-muted-foreground", children: "User Type:" }), _jsx("span", { className: "font-medium", children: selectedCustomer.userType }), _jsx("span", { className: "text-muted-foreground", children: "Status:" }), _jsx(Badge, { variant: getBadgeVariantForStatus(selectedCustomer.status), children: selectedCustomer.status })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Subscription Details" }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-[100px_1fr] gap-2 text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Plan:" }), _jsx("span", { className: "font-medium", children: selectedCustomer.currentPlan }), _jsx("span", { className: "text-muted-foreground", children: "Started:" }), _jsx("span", { children: format(new Date(selectedCustomer.subscriptionStart), 'MMM d, yyyy') }), selectedCustomer.status !== 'Canceled' && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-muted-foreground", children: "Renewal:" }), _jsx("span", { children: format(new Date(selectedCustomer.subscriptionRenewal), 'MMM d, yyyy') })] })), selectedCustomer.userType === 'University' && selectedCustomer.seats && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-muted-foreground", children: "Seats:" }), _jsxs("span", { children: [selectedCustomer.usedSeats, " / ", selectedCustomer.seats, " used", _jsx(Progress, { value: (selectedCustomer.usedSeats / selectedCustomer.seats) * 100, className: "h-2 mt-1" })] })] }))] }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: "Payment Method" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => updatePaymentMethodMutation.mutate(selectedCustomer.id), disabled: updatePaymentMethodMutation.isPending, children: updatePaymentMethodMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "mr-2 h-3 w-3 animate-spin" }), "Updating..."] })) : (_jsxs(_Fragment, { children: [_jsx(CreditCard, { className: "mr-2 h-3 w-3" }), "Update"] })) })] }), _jsx(CardContent, { children: selectedCustomer.paymentMethod ? (_jsxs("div", { className: "flex items-center p-3 border rounded-md bg-muted/40", children: [_jsx("div", { className: "mr-4", children: _jsx(CreditCard, { className: "h-8 w-8 text-muted-foreground" }) }), _jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "font-medium", children: [selectedCustomer.paymentMethod.brand, " \u2022\u2022\u2022\u2022 ", selectedCustomer.paymentMethod.last4] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Expires ", selectedCustomer.paymentMethod.expMonth, "/", selectedCustomer.paymentMethod.expYear] })] })] })) : (_jsxs("div", { className: "flex items-center p-3 border rounded-md bg-muted/40", children: [_jsx(AlertTriangle, { className: "h-8 w-8 text-destructive mr-4" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "No payment method on file" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Customer needs to add a payment method" })] })] })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Payment History" }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Invoice ID" }), _jsx(TableHead, { children: "Date" }), _jsx(TableHead, { children: "Amount" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Action" })] }) }), _jsx(TableBody, { children: selectedCustomer.paymentHistory.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 5, className: "text-center py-4", children: _jsx("p", { className: "text-muted-foreground", children: "No payment history available" }) }) })) : (selectedCustomer.paymentHistory.map((payment) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-mono text-xs", children: payment.id }), _jsx(TableCell, { children: format(new Date(payment.date), 'MMM d, yyyy') }), _jsxs(TableCell, { children: ["$", payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })] }), _jsx(TableCell, { children: _jsx(Badge, { variant: payment.status === 'Paid'
                                                                                    ? 'default'
                                                                                    : payment.status === 'Failed'
                                                                                        ? 'destructive'
                                                                                        : 'outline', children: payment.status }) }), _jsx(TableCell, { className: "text-right", children: payment.invoiceUrl && (_jsx(Button, { variant: "ghost", size: "icon", children: _jsx(Download, { className: "h-4 w-4" }) })) })] }, payment.id)))) })] }) })] })] }) }), _jsx(DrawerFooter, { className: "border-t px-4 py-4", children: _jsxs("div", { className: "flex justify-between w-full", children: [_jsx(Button, { variant: "outline", onClick: () => setIsDrawerOpen(false), children: "Close" }), _jsx("div", { className: "flex gap-2", children: selectedCustomer.status === 'Canceled' ? (_jsx(Button, { onClick: () => reactivateSubscriptionMutation.mutate(selectedCustomer.id), disabled: reactivateSubscriptionMutation.isPending, children: reactivateSubscriptionMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "mr-2 h-4 w-4 animate-spin" }), "Reactivating..."] })) : (_jsxs(_Fragment, { children: [_jsx(BadgeCheck, { className: "mr-2 h-4 w-4" }), "Reactivate Subscription"] })) })) : (_jsx(Button, { variant: "destructive", onClick: () => cancelSubscriptionMutation.mutate(selectedCustomer.id), disabled: cancelSubscriptionMutation.isPending, children: cancelSubscriptionMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "mr-2 h-4 w-4 animate-spin" }), "Canceling..."] })) : ("Cancel Subscription") })) })] }) })] })) }) })] }));
}
