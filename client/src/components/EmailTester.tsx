import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

/**
 * Email Tester Component for Developers and Admins
 * This component provides a simple interface to test various email types
 */
export default function EmailTester() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  
  // Test email state
  const [testEmail, setTestEmail] = useState<string>('');
  const [testName, setTestName] = useState<string>('');
  
  // Welcome email state
  const [welcomeEmail, setWelcomeEmail] = useState<string>('');
  const [welcomeName, setWelcomeName] = useState<string>('');
  
  // Application update email state
  const [applicationEmail, setApplicationEmail] = useState<string>('');
  const [applicationName, setApplicationName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [positionTitle, setPositionTitle] = useState<string>('');
  const [status, setStatus] = useState<string>('Interviewing');
  
  // Custom email state
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [customHtml, setCustomHtml] = useState<string>('');
  
  // Send test email
  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send the test email to.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/mail/test', {
        recipient: testEmail,
        name: testName
      });
      
      const data = await response.json();
      
      toast({
        title: "Test Email Sent",
        description: `Email sent successfully to ${testEmail}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Send welcome email
  const sendWelcomeEmail = async () => {
    if (!welcomeEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send the welcome email to.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/mail/welcome', {
        email: welcomeEmail,
        name: welcomeName
      });
      
      const data = await response.json();
      
      toast({
        title: "Welcome Email Sent",
        description: `Email sent successfully to ${welcomeEmail}`,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send welcome email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Send application update email
  const sendApplicationEmail = async () => {
    if (!applicationEmail || !companyName || !positionTitle || !status) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/mail/application-update', {
        email: applicationEmail,
        name: applicationName,
        companyName,
        positionTitle,
        status
      });
      
      const data = await response.json();
      
      toast({
        title: "Application Update Email Sent",
        description: `Email sent successfully to ${applicationEmail}`,
      });
    } catch (error) {
      console.error('Error sending application update email:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send application update email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Send custom email
  const sendCustomEmail = async () => {
    if (!customEmail || !customSubject || (!customText && !customHtml)) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields (to, subject, and either text or HTML content).",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/mail/custom', {
        to: customEmail,
        subject: customSubject,
        text: customText,
        html: customHtml
      });
      
      const data = await response.json();
      
      toast({
        title: "Custom Email Sent",
        description: `Email sent successfully to ${customEmail}`,
      });
    } catch (error) {
      console.error('Error sending custom email:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send custom email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Email Testing Tool</h1>
      <p className="text-muted-foreground mb-6">
        This tool allows developers and administrators to test the email functionality.
        All emails are sent through Mailgun and will appear from the <code>no-reply@mail.ascentul.io</code> address.
      </p>
      
      <Tabs defaultValue="test" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="test">Test Email</TabsTrigger>
          <TabsTrigger value="welcome">Welcome Email</TabsTrigger>
          <TabsTrigger value="application">Application Update</TabsTrigger>
          <TabsTrigger value="custom">Custom Email</TabsTrigger>
        </TabsList>
        
        {/* Test Email Tab */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Send a simple test email to verify that the email service is working correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Recipient Email</Label>
                <Input 
                  id="test-email" 
                  type="email" 
                  placeholder="recipient@example.com" 
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-name">Recipient Name (optional)</Label>
                <Input 
                  id="test-name" 
                  placeholder="John Doe" 
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={sendTestEmail} disabled={loading || !testEmail}>
                {loading ? "Sending..." : "Send Test Email"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Welcome Email Tab */}
        <TabsContent value="welcome">
          <Card>
            <CardHeader>
              <CardTitle>Send Welcome Email</CardTitle>
              <CardDescription>
                Send a welcome email to a user to simulate the onboarding process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome-email">Recipient Email</Label>
                <Input 
                  id="welcome-email" 
                  type="email" 
                  placeholder="recipient@example.com" 
                  value={welcomeEmail}
                  onChange={(e) => setWelcomeEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome-name">Recipient Name (optional)</Label>
                <Input 
                  id="welcome-name" 
                  placeholder="John Doe" 
                  value={welcomeName}
                  onChange={(e) => setWelcomeName(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={sendWelcomeEmail} disabled={loading || !welcomeEmail}>
                {loading ? "Sending..." : "Send Welcome Email"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Application Update Email Tab */}
        <TabsContent value="application">
          <Card>
            <CardHeader>
              <CardTitle>Send Application Update Email</CardTitle>
              <CardDescription>
                Send an email notification about an application status change.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-email">Recipient Email</Label>
                <Input 
                  id="app-email" 
                  type="email" 
                  placeholder="recipient@example.com" 
                  value={applicationEmail}
                  onChange={(e) => setApplicationEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-name">Recipient Name (optional)</Label>
                <Input 
                  id="app-name" 
                  placeholder="John Doe" 
                  value={applicationName}
                  onChange={(e) => setApplicationName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input 
                  id="company-name" 
                  placeholder="Acme Corp" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position-title">Position Title</Label>
                <Input 
                  id="position-title" 
                  placeholder="Software Engineer" 
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Application Status</Label>
                <select 
                  id="status"
                  className="w-full p-2 border rounded-md" 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Offer Received</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={sendApplicationEmail} 
                disabled={loading || !applicationEmail || !companyName || !positionTitle || !status}
              >
                {loading ? "Sending..." : "Send Application Update Email"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Custom Email Tab */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Send Custom Email</CardTitle>
              <CardDescription>
                Send a fully customized email with your own subject and content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-email">Recipient Email</Label>
                <Input 
                  id="custom-email" 
                  type="email" 
                  placeholder="recipient@example.com" 
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-subject">Subject</Label>
                <Input 
                  id="custom-subject" 
                  placeholder="Your Email Subject" 
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-text">Plain Text Content</Label>
                <Textarea 
                  id="custom-text" 
                  placeholder="Enter the plain text version of your email..." 
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-html">HTML Content (optional)</Label>
                <Textarea 
                  id="custom-html" 
                  placeholder="Enter the HTML version of your email..." 
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={sendCustomEmail} 
                disabled={loading || !customEmail || !customSubject || (!customText && !customHtml)}
              >
                {loading ? "Sending..." : "Send Custom Email"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}