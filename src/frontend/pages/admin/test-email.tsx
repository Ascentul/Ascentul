import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Info, Mail, Building } from 'lucide-react';

// Zod schema for the test email form
const testEmailSchema = z.object({
  recipient: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  template: z.string().optional(),
  content: z.string().min(1, { message: "Email content is required" }),
});

type TestEmailFormValues = z.infer<typeof testEmailSchema>;

// Zod schema for the university invite form
const universityInviteSchema = z.object({
  universityName: z.string().min(1, { message: "University name is required" }),
  adminEmail: z.string().email({ message: "Please enter a valid email address" }),
  adminName: z.string().min(1, { message: "Admin name is required" }),
});

type UniversityInviteFormValues = z.infer<typeof universityInviteSchema>;

export default function TestEmailPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  
  // General test email form
  const form = useForm<TestEmailFormValues>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      recipient: "",
      subject: "Test Email from CareerTracker",
      template: "general",
      content: "This is a test email from the CareerTracker admin panel. If you're seeing this, the email system is working correctly.",
    },
  });
  
  // University invite form
  const inviteForm = useForm<UniversityInviteFormValues>({
    resolver: zodResolver(universityInviteSchema),
    defaultValues: {
      universityName: "",
      adminEmail: "",
      adminName: "",
    },
  });
  
  // Submit handler for general test email
  const onSubmit = async (values: TestEmailFormValues) => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await apiRequest("POST", "/api/admin/test-email", values);
      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        message: response.ok ? "Email sent successfully!" : "Failed to send email",
        details: data.message || JSON.stringify(data),
      });
      
      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Test email was sent successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send test email. See details below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Error sending email",
        details: error instanceof Error ? error.message : String(error),
      });
      
      toast({
        title: "Error",
        description: "An error occurred while sending the test email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit handler for university invite test
  const onInviteSubmit = async (values: UniversityInviteFormValues) => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await apiRequest("POST", "/api/admin/test-university-invite", values);
      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        message: response.ok ? "University invite email sent successfully!" : "Failed to send university invite",
        details: data.message || JSON.stringify(data),
      });
      
      if (response.ok) {
        toast({
          title: "Invite Sent",
          description: "University invite email was sent successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send university invite. See details below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Error sending university invite",
        details: error instanceof Error ? error.message : String(error),
      });
      
      toast({
        title: "Error",
        description: "An error occurred while sending the university invite.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Testing Tools</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">
            <Mail className="w-4 h-4 mr-2" />
            General Test Email
          </TabsTrigger>
          <TabsTrigger value="university">
            <Building className="w-4 h-4 mr-2" />
            University Invite
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Test the email delivery system by sending a test email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recipient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input placeholder="test@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Template (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="welcome">Welcome</SelectItem>
                            <SelectItem value="password-reset">Password Reset</SelectItem>
                            <SelectItem value="verification">Email Verification</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a template or leave as General for a basic test email.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={5}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {testResult && (
            <Card className={testResult.success ? "border-green-500" : "border-red-500"}>
              <CardHeader className={testResult.success ? "bg-green-50" : "bg-red-50"}>
                <CardTitle className="flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  {testResult.message}
                </CardTitle>
              </CardHeader>
              {testResult.details && (
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                    {testResult.details}
                  </pre>
                </CardContent>
              )}
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="university" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test University Invite</CardTitle>
              <CardDescription>
                Test the university admin invitation email system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="universityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Example University" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={inviteForm.control}
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
                  
                  <FormField
                    control={inviteForm.control}
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
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send University Invite
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {testResult && (
            <Card className={testResult.success ? "border-green-500" : "border-red-500"}>
              <CardHeader className={testResult.success ? "bg-green-50" : "bg-red-50"}>
                <CardTitle className="flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  {testResult.message}
                </CardTitle>
              </CardHeader>
              {testResult.details && (
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                    {testResult.details}
                  </pre>
                </CardContent>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}