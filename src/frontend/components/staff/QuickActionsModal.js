import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, SendHorizonal, Users, AlertTriangle, CheckCircle, RefreshCw, ShieldAlert, BellRing, PieChart, Settings, Lock, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function QuickActionsModal({ open, onOpenChange }) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('broadcast');
    const [isProcessing, setIsProcessing] = useState(false);
    // Broadcast message state
    const [broadcastData, setBroadcastData] = useState({
        message: '',
        userTypes: {
            all: true,
            free: true,
            premium: true,
            university: true
        },
        priority: 'normal',
        persistent: false
    });
    // User management state
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    // System maintenance state
    const [maintenanceData, setMaintenanceData] = useState({
        enabled: false,
        scheduledTime: '',
        estimatedDuration: '',
        message: 'Scheduled maintenance: CareerTracker.io will be temporarily unavailable for system upgrades.'
    });
    // Mock users data for user management tab
    const mockUsers = [
        { id: '1', name: 'Alex Johnson', email: 'alex@example.com', userType: 'premium', status: 'active' },
        { id: '2', name: 'Sam Wilson', email: 'sam@university.edu', userType: 'university', status: 'active' },
        { id: '3', name: 'Jordan Taylor', email: 'jordan@example.com', userType: 'free', status: 'inactive' },
        { id: '4', name: 'Casey Morgan', email: 'casey@example.com', userType: 'premium', status: 'past_due' },
        { id: '5', name: 'Dana Lee', email: 'dana@university.edu', userType: 'university', status: 'active' }
    ];
    // Filtered users based on search query
    const filteredUsers = mockUsers.filter(user => user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.userType.toLowerCase().includes(userSearchQuery.toLowerCase()));
    // Handle broadcast submit
    const handleBroadcastSubmit = () => {
        if (!broadcastData.message) {
            toast({
                title: "Message Required",
                description: "Please enter a message to broadcast.",
                variant: "destructive"
            });
            return;
        }
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            // Show success notification
            toast({
                title: "Broadcast Sent",
                description: "Message has been sent to all selected user types.",
                variant: "default"
            });
            // Reset form
            setBroadcastData({
                ...broadcastData,
                message: ''
            });
            // Close modal
            onOpenChange(false);
        }, 1500);
    };
    // Handle maintenance toggle
    const handleMaintenanceToggle = (enabled) => {
        setMaintenanceData({
            ...maintenanceData,
            enabled
        });
        toast({
            title: enabled ? "Maintenance Mode Activated" : "Maintenance Mode Deactivated",
            description: enabled
                ? "The system will show a maintenance banner to users."
                : "The maintenance banner has been removed.",
            variant: "default"
        });
    };
    // Handle user action (for user management tab)
    const handleUserAction = (action) => {
        if (selectedUsers.length === 0) {
            toast({
                title: "No Users Selected",
                description: "Please select at least one user to perform this action.",
                variant: "destructive"
            });
            return;
        }
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            // Show success notification
            toast({
                title: "Action Completed",
                description: `${action} completed for ${selectedUsers.length} users.`,
                variant: "default"
            });
            // Reset selection
            setSelectedUsers([]);
        }, 1000);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[600px] max-h-[80vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [_jsx(Zap, { className: "h-5 w-5" }), _jsx("span", { children: "Quick Actions" })] }), _jsx(DialogDescription, { children: "Perform common administrative tasks quickly" })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-3 mb-4", children: [_jsxs(TabsTrigger, { value: "broadcast", className: "flex items-center", children: [_jsx(SendHorizonal, { className: "h-4 w-4 mr-2" }), "Broadcast"] }), _jsxs(TabsTrigger, { value: "users", className: "flex items-center", children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), "Users"] }), _jsxs(TabsTrigger, { value: "maintenance", className: "flex items-center", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Maintenance"] })] }), _jsx(TabsContent, { value: "broadcast", className: "space-y-4", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "broadcast-message", children: "Announcement Message" }), _jsx(Textarea, { id: "broadcast-message", placeholder: "Enter your announcement message to users...", className: "resize-none", rows: 4, value: broadcastData.message, onChange: (e) => setBroadcastData({
                                                    ...broadcastData,
                                                    message: e.target.value
                                                }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Send To" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mt-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "all-users", checked: broadcastData.userTypes.all, onCheckedChange: (checked) => {
                                                                    const newUserTypes = {
                                                                        all: checked,
                                                                        free: checked,
                                                                        premium: checked,
                                                                        university: checked
                                                                    };
                                                                    setBroadcastData({
                                                                        ...broadcastData,
                                                                        userTypes: newUserTypes
                                                                    });
                                                                } }), _jsx(Label, { htmlFor: "all-users", className: "cursor-pointer", children: "All Users" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "free-users", checked: broadcastData.userTypes.free, onCheckedChange: (checked) => {
                                                                    const newUserTypes = {
                                                                        ...broadcastData.userTypes,
                                                                        free: checked,
                                                                        all: checked && broadcastData.userTypes.premium && broadcastData.userTypes.university
                                                                    };
                                                                    setBroadcastData({
                                                                        ...broadcastData,
                                                                        userTypes: newUserTypes
                                                                    });
                                                                } }), _jsx(Label, { htmlFor: "free-users", className: "cursor-pointer", children: "Free Users" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "premium-users", checked: broadcastData.userTypes.premium, onCheckedChange: (checked) => {
                                                                    const newUserTypes = {
                                                                        ...broadcastData.userTypes,
                                                                        premium: checked,
                                                                        all: checked && broadcastData.userTypes.free && broadcastData.userTypes.university
                                                                    };
                                                                    setBroadcastData({
                                                                        ...broadcastData,
                                                                        userTypes: newUserTypes
                                                                    });
                                                                } }), _jsx(Label, { htmlFor: "premium-users", className: "cursor-pointer", children: "Premium Users" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "university-users", checked: broadcastData.userTypes.university, onCheckedChange: (checked) => {
                                                                    const newUserTypes = {
                                                                        ...broadcastData.userTypes,
                                                                        university: checked,
                                                                        all: checked && broadcastData.userTypes.free && broadcastData.userTypes.premium
                                                                    };
                                                                    setBroadcastData({
                                                                        ...broadcastData,
                                                                        userTypes: newUserTypes
                                                                    });
                                                                } }), _jsx(Label, { htmlFor: "university-users", className: "cursor-pointer", children: "University Users" })] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Message Priority" }), _jsxs("div", { className: "flex space-x-2 mt-2", children: [_jsx(Button, { type: "button", variant: broadcastData.priority === 'low' ? 'default' : 'outline', size: "sm", onClick: () => setBroadcastData({
                                                            ...broadcastData,
                                                            priority: 'low'
                                                        }), children: "Low" }), _jsx(Button, { type: "button", variant: broadcastData.priority === 'normal' ? 'default' : 'outline', size: "sm", onClick: () => setBroadcastData({
                                                            ...broadcastData,
                                                            priority: 'normal'
                                                        }), children: "Normal" }), _jsx(Button, { type: "button", variant: broadcastData.priority === 'urgent' ? 'default' : 'outline', size: "sm", onClick: () => setBroadcastData({
                                                            ...broadcastData,
                                                            priority: 'urgent'
                                                        }), className: broadcastData.priority === 'urgent' ? 'bg-red-500 hover:bg-red-600' : '', children: "Urgent" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "persistent-message", checked: broadcastData.persistent, onCheckedChange: (checked) => setBroadcastData({
                                                    ...broadcastData,
                                                    persistent: checked
                                                }) }), _jsx(Label, { htmlFor: "persistent-message", className: "cursor-pointer", children: "Persistent Message (requires user dismissal)" })] })] }) }), _jsxs(TabsContent, { value: "users", className: "space-y-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search users by name, email, or user type...", className: "pl-10", value: userSearchQuery, onChange: (e) => setUserSearchQuery(e.target.value) })] }), _jsx("div", { className: "border rounded-md overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-muted border-b", children: [_jsx("th", { className: "w-10 text-left p-2", children: _jsx("div", { className: "flex items-center", children: _jsx("input", { type: "checkbox", className: "rounded border-gray-300", onChange: (e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedUsers(filteredUsers.map(u => u.id));
                                                                        }
                                                                        else {
                                                                            setSelectedUsers([]);
                                                                        }
                                                                    }, checked: filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length, "aria-label": "Select all users" }) }) }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "User" }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Type" }), _jsx("th", { className: "text-left p-2 text-sm font-medium", children: "Status" })] }) }), _jsx("tbody", { children: filteredUsers.length > 0 ? (filteredUsers.map(user => (_jsxs("tr", { className: "border-b last:border-b-0 hover:bg-muted/50", children: [_jsx("td", { className: "p-2", children: _jsx("input", { type: "checkbox", className: "rounded border-gray-300", checked: selectedUsers.includes(user.id), onChange: (e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedUsers([...selectedUsers, user.id]);
                                                                    }
                                                                    else {
                                                                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                                    }
                                                                }, "aria-label": `Select ${user.name}` }) }), _jsx("td", { className: "p-2", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: user.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: user.email })] }) }), _jsx("td", { className: "p-2", children: _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${user.userType === 'premium'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : user.userType === 'university'
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-gray-100 text-gray-800'}`, children: user.userType }) }), _jsx("td", { className: "p-2", children: _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${user.status === 'active'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : user.status === 'past_due'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'}`, children: user.status }) })] }, user.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "p-4 text-center text-muted-foreground", children: "No users found matching your search" }) })) })] }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleUserAction('Reset password'), disabled: isProcessing || selectedUsers.length === 0, children: [_jsx(Lock, { className: "h-4 w-4 mr-2" }), "Reset Password"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleUserAction('Send verification email'), disabled: isProcessing || selectedUsers.length === 0, children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2" }), "Verify Email"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleUserAction('Manage subscription'), disabled: isProcessing || selectedUsers.length === 0, children: [_jsx(PieChart, { className: "h-4 w-4 mr-2" }), "Manage Subscription"] })] })] }), _jsxs(TabsContent, { value: "maintenance", className: "space-y-4", children: [_jsxs("div", { className: "rounded-lg border p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Settings, { className: "h-5 w-5 text-yellow-500" }), _jsx("h3", { className: "font-medium", children: "Maintenance Mode" })] }), _jsx(Switch, { id: "maintenance-toggle", checked: maintenanceData.enabled, onCheckedChange: handleMaintenanceToggle })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "scheduled-time", children: "Scheduled Time" }), _jsx(Input, { id: "scheduled-time", type: "datetime-local", value: maintenanceData.scheduledTime, onChange: (e) => setMaintenanceData({
                                                                        ...maintenanceData,
                                                                        scheduledTime: e.target.value
                                                                    }), disabled: !maintenanceData.enabled })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "estimated-duration", children: "Estimated Duration" }), _jsx(Input, { id: "estimated-duration", placeholder: "e.g. 2 hours", value: maintenanceData.estimatedDuration, onChange: (e) => setMaintenanceData({
                                                                        ...maintenanceData,
                                                                        estimatedDuration: e.target.value
                                                                    }), disabled: !maintenanceData.enabled })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "maintenance-message", children: "Maintenance Message" }), _jsx(Textarea, { id: "maintenance-message", placeholder: "Message to display to users during maintenance...", rows: 3, value: maintenanceData.message, onChange: (e) => setMaintenanceData({
                                                                ...maintenanceData,
                                                                message: e.target.value
                                                            }), disabled: !maintenanceData.enabled })] })] }), maintenanceData.enabled && (_jsxs("div", { className: "mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start space-x-2", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-500 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-yellow-800", children: "Maintenance Mode is Active" }), _jsxs("p", { className: "text-xs text-yellow-700 mt-1", children: ["Users will see a maintenance banner and new logins may be restricted.", maintenanceData.scheduledTime && maintenanceData.estimatedDuration && (` Scheduled for ${new Date(maintenanceData.scheduledTime).toLocaleString()} 
                         (estimated duration: ${maintenanceData.estimatedDuration}).`)] })] })] }))] }), _jsxs("div", { className: "rounded-lg border p-4", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-4", children: [_jsx(ShieldAlert, { className: "h-5 w-5 text-red-500" }), _jsx("h3", { className: "font-medium", children: "Emergency Actions" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs(Button, { variant: "outline", className: "border-red-200 text-red-600 hover:bg-red-50", children: [_jsx(Lock, { className: "h-4 w-4 mr-2" }), "Disable All Logins"] }), _jsxs(Button, { variant: "outline", className: "border-yellow-200 text-yellow-600 hover:bg-yellow-50", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Reset API Rate Limits"] }), _jsxs(Button, { variant: "outline", className: "border-blue-200 text-blue-600 hover:bg-blue-50", children: [_jsx(BellRing, { className: "h-4 w-4 mr-2" }), "Send Emergency Alert"] }), _jsxs(Button, { variant: "outline", className: "border-green-200 text-green-600 hover:bg-green-50", children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2" }), "Clear System Cache"] })] })] })] })] }), _jsxs(DialogFooter, { children: [activeTab === 'broadcast' && (_jsx(Button, { onClick: handleBroadcastSubmit, disabled: isProcessing || !broadcastData.message, className: "ml-auto", children: isProcessing ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), "Sending..."] })) : (_jsxs(_Fragment, { children: [_jsx(SendHorizonal, { className: "h-4 w-4 mr-2" }), "Send Broadcast"] })) })), activeTab !== 'broadcast' && (_jsx(DialogClose, { asChild: true, children: _jsx(Button, { variant: "outline", children: "Close" }) }))] })] }) }));
}
