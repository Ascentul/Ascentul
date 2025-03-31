import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  SendHorizonal, 
  Users, 
  AlertTriangle,
  CheckCircle, 
  RefreshCw,
  UserPlus,
  ShieldAlert,
  BellRing,
  PieChart,
  Settings,
  Lock,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickActionsModal({ open, onOpenChange }: QuickActionsModalProps) {
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
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
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.userType.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

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
  const handleMaintenanceToggle = (enabled: boolean) => {
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
  const handleUserAction = (action: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Actions</span>
          </DialogTitle>
          <DialogDescription>
            Perform common administrative tasks quickly
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="broadcast" className="flex items-center">
              <SendHorizonal className="h-4 w-4 mr-2" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Maintenance
            </TabsTrigger>
          </TabsList>
          
          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="broadcast-message">Announcement Message</Label>
                <Textarea 
                  id="broadcast-message"
                  placeholder="Enter your announcement message to users..."
                  className="resize-none"
                  rows={4}
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({
                    ...broadcastData,
                    message: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label>Send To</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="all-users" 
                      checked={broadcastData.userTypes.all}
                      onCheckedChange={(checked) => {
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
                      }} 
                    />
                    <Label htmlFor="all-users" className="cursor-pointer">All Users</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="free-users"
                      checked={broadcastData.userTypes.free}
                      onCheckedChange={(checked) => {
                        const newUserTypes = {
                          ...broadcastData.userTypes,
                          free: checked,
                          all: checked && broadcastData.userTypes.premium && broadcastData.userTypes.university
                        };
                        setBroadcastData({
                          ...broadcastData,
                          userTypes: newUserTypes
                        });
                      }}  
                    />
                    <Label htmlFor="free-users" className="cursor-pointer">Free Users</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="premium-users"
                      checked={broadcastData.userTypes.premium}
                      onCheckedChange={(checked) => {
                        const newUserTypes = {
                          ...broadcastData.userTypes,
                          premium: checked,
                          all: checked && broadcastData.userTypes.free && broadcastData.userTypes.university
                        };
                        setBroadcastData({
                          ...broadcastData,
                          userTypes: newUserTypes
                        });
                      }}  
                    />
                    <Label htmlFor="premium-users" className="cursor-pointer">Premium Users</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="university-users"
                      checked={broadcastData.userTypes.university}
                      onCheckedChange={(checked) => {
                        const newUserTypes = {
                          ...broadcastData.userTypes,
                          university: checked,
                          all: checked && broadcastData.userTypes.free && broadcastData.userTypes.premium
                        };
                        setBroadcastData({
                          ...broadcastData,
                          userTypes: newUserTypes
                        });
                      }}  
                    />
                    <Label htmlFor="university-users" className="cursor-pointer">University Users</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label>Message Priority</Label>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    type="button"
                    variant={broadcastData.priority === 'low' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setBroadcastData({
                      ...broadcastData,
                      priority: 'low'
                    })}
                  >
                    Low
                  </Button>
                  <Button 
                    type="button"
                    variant={broadcastData.priority === 'normal' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setBroadcastData({
                      ...broadcastData,
                      priority: 'normal'
                    })}
                  >
                    Normal
                  </Button>
                  <Button 
                    type="button"
                    variant={broadcastData.priority === 'urgent' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setBroadcastData({
                      ...broadcastData,
                      priority: 'urgent'
                    })}
                    className={broadcastData.priority === 'urgent' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    Urgent
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="persistent-message" 
                  checked={broadcastData.persistent}
                  onCheckedChange={(checked) => setBroadcastData({
                    ...broadcastData,
                    persistent: checked
                  })} 
                />
                <Label htmlFor="persistent-message" className="cursor-pointer">
                  Persistent Message (requires user dismissal)
                </Label>
              </div>
            </div>
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or user type..."
                className="pl-10"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="w-10 text-left p-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                          aria-label="Select all users"
                        />
                      </div>
                    </th>
                    <th className="text-left p-2 text-sm font-medium">User</th>
                    <th className="text-left p-2 text-sm font-medium">Type</th>
                    <th className="text-left p-2 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="p-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            aria-label={`Select ${user.name}`}
                          />
                        </td>
                        <td className="p-2">
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.userType === 'premium' 
                              ? 'bg-green-100 text-green-800' 
                              : user.userType === 'university'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.userType}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : user.status === 'past_due'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No users found matching your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleUserAction('Reset password')}
                disabled={isProcessing || selectedUsers.length === 0}
              >
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleUserAction('Send verification email')}
                disabled={isProcessing || selectedUsers.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Email
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleUserAction('Manage subscription')}
                disabled={isProcessing || selectedUsers.length === 0}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </div>
          </TabsContent>
          
          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-medium">Maintenance Mode</h3>
                </div>
                <Switch 
                  id="maintenance-toggle"
                  checked={maintenanceData.enabled}
                  onCheckedChange={handleMaintenanceToggle}
                />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="scheduled-time">Scheduled Time</Label>
                    <Input 
                      id="scheduled-time"
                      type="datetime-local"
                      value={maintenanceData.scheduledTime}
                      onChange={(e) => setMaintenanceData({
                        ...maintenanceData,
                        scheduledTime: e.target.value
                      })}
                      disabled={!maintenanceData.enabled}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="estimated-duration">Estimated Duration</Label>
                    <Input 
                      id="estimated-duration"
                      placeholder="e.g. 2 hours"
                      value={maintenanceData.estimatedDuration}
                      onChange={(e) => setMaintenanceData({
                        ...maintenanceData,
                        estimatedDuration: e.target.value
                      })}
                      disabled={!maintenanceData.enabled}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Textarea 
                    id="maintenance-message"
                    placeholder="Message to display to users during maintenance..."
                    rows={3}
                    value={maintenanceData.message}
                    onChange={(e) => setMaintenanceData({
                      ...maintenanceData,
                      message: e.target.value
                    })}
                    disabled={!maintenanceData.enabled}
                  />
                </div>
              </div>
              
              {maintenanceData.enabled && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Maintenance Mode is Active
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Users will see a maintenance banner and new logins may be restricted.
                      {maintenanceData.scheduledTime && maintenanceData.estimatedDuration && (
                        ` Scheduled for ${new Date(maintenanceData.scheduledTime).toLocaleString()} 
                         (estimated duration: ${maintenanceData.estimatedDuration}).`
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <h3 className="font-medium">Emergency Actions</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  <Lock className="h-4 w-4 mr-2" />
                  Disable All Logins
                </Button>
                <Button variant="outline" className="border-yellow-200 text-yellow-600 hover:bg-yellow-50">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset API Rate Limits
                </Button>
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <BellRing className="h-4 w-4 mr-2" />
                  Send Emergency Alert
                </Button>
                <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Clear System Cache
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {activeTab === 'broadcast' && (
            <Button 
              onClick={handleBroadcastSubmit} 
              disabled={isProcessing || !broadcastData.message}
              className="ml-auto"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendHorizonal className="h-4 w-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
          )}
          
          {activeTab !== 'broadcast' && (
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}