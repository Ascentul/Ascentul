import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';
import EmailTester from '@/components/EmailTester';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Email Administration Dashboard
 * A management interface for email-related functionality
 */
export default function EmailAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mailStatus, setMailStatus] = useState<{
    configured: boolean;
    apiKey: boolean;
    domain: boolean;
    message?: string;
  }>({
    configured: false,
    apiKey: false,
    domain: false
  });
  
  // Check if the current user is an admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const response = await apiRequest('GET', '/api/users/me');
        const userData = await response.json();
        
        if (userData && (userData.userType === 'admin' || userData.userType === 'university_admin')) {
          setIsAdmin(true);
        } else {
          toast({
            title: "Access Denied",
            description: "You need administrator privileges to access this page.",
            variant: "destructive"
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/dashboard');
      }
    };
    
    // Check mail service status
    const checkMailStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/mail/status');
        const statusData = await response.json();
        setMailStatus(statusData);
      } catch (error) {
        console.error('Error checking mail status:', error);
        setMailStatus({
          configured: false,
          apiKey: false,
          domain: false,
          message: 'Failed to connect to mail service'
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
    checkMailStatus();
  }, [navigate, toast]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need administrator privileges to access this page.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Email Administration</h1>
      <p className="text-muted-foreground mb-8">Manage and test email functionality.</p>
      
      {/* Mail Service Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Mail Service Status</CardTitle>
          <CardDescription>Current status of the email service connection.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant={mailStatus.configured ? "default" : "destructive"} className="mb-4">
            <div className="flex items-center gap-2">
              {mailStatus.configured ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <AlertTitle>Mail Service: {mailStatus.configured ? 'Configured' : 'Not Configured'}</AlertTitle>
            </div>
            <AlertDescription>
              {mailStatus.message || (mailStatus.configured 
                ? 'The mail service is properly configured and ready to send emails.' 
                : 'The mail service is not properly configured. Please check your environment variables.')}
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-md">
              <div className="flex items-center gap-2 mb-2">
                {mailStatus.apiKey ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
                <h3 className="font-medium">API Key</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {mailStatus.apiKey 
                  ? 'Mailgun API key is properly configured.' 
                  : 'Mailgun API key is missing or invalid.'}
              </p>
            </div>
            
            <div className="p-4 border rounded-md">
              <div className="flex items-center gap-2 mb-2">
                {mailStatus.domain ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-yellow-500" />}
                <h3 className="font-medium">Mail Domain</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {mailStatus.domain 
                  ? 'Mail domain is properly configured.' 
                  : 'Using default mail domain: mail.ascentul.io'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Email Testing Interface */}
      <Tabs defaultValue="tester" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tester">Email Tester</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tester">
          <EmailTester />
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Email Logs</CardTitle>
              <CardDescription>
                View recent email activity and delivery status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-12 text-center text-muted-foreground">
                Email logging functionality will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Manage and customize email templates used throughout the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-12 text-center text-muted-foreground">
                Email template management will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}