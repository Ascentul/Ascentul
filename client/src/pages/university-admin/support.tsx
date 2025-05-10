import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from "@/lib/queryClient";
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/lib/useUserData';

const supportFormSchema = z.object({
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters' }),
  issueType: z.string().min(1, { message: 'Please select a category' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters' }),
  priority: z.string().min(1, { message: 'Please select a priority level' }),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

export default function UniversityAdminSupportPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      subject: '',
      issueType: '',
      description: '',
      priority: 'medium',
    },
  });

  async function onSubmit(data: SupportFormValues) {
    setIsSubmitting(true);
    
    try {
      // Get university name from user data if available
      const universityName = user?.universityName || 'Unknown University';
      
      await apiRequest('POST', '/api/in-app/support', {
        ...data,
        source: 'university-admin',
        name: user?.name,
        email: user?.email,
        universityName: universityName
      });
      
      setIsSuccess(true);
      toast({
        title: 'Support request submitted',
        description: 'Our team will get back to you as soon as possible.',
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Your support request could not be submitted. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const resetForm = () => {
    setIsSuccess(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Support</h1>
        <p className="text-muted-foreground">
          Have a question or issue? Submit a support ticket and our team will assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Submit a Support Request</CardTitle>
            <CardDescription>
              Please provide detailed information about your issue or question.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="bg-green-100 text-green-800 p-4 rounded-md inline-flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Support request submitted
                </div>
                <h3 className="text-xl font-semibold">Thank you for reaching out!</h3>
                <p className="text-muted-foreground">
                  We've received your support request and will get back to you as soon as possible.
                </p>
                <Button onClick={resetForm}>Submit Another Request</Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Briefly describe your issue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="issueType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="account_access">Account Access</SelectItem>
                              <SelectItem value="student_management">Student Management</SelectItem>
                              <SelectItem value="invitation_issue">Invitation Issues</SelectItem>
                              <SelectItem value="data_analytics">Data & Analytics</SelectItem>
                              <SelectItem value="university_profile">University Profile</SelectItem>
                              <SelectItem value="feature_request">Feature Request</SelectItem>
                              <SelectItem value="bug_report">Bug Report</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide detailed information about your issue..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Support Request'
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Monday - Friday:</span>
                  <br />9:00 AM - 6:00 PM EST
                </p>
                <p className="text-sm">
                  <span className="font-medium">Response Time:</span>
                  <br />Within 24 hours (business days)
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Urgent issues will receive priority response.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>Student invitation emails not received</li>
                <li>Student account access issues</li>
                <li>Data export functionality</li>
                <li>Analytics dashboard questions</li>
                <li>University profile updates</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href="https://ascentul.com/university-admin-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary hover:underline"
                >
                  University Administrator Guide
                </a>
                <a
                  href="https://ascentul.com/university-faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary hover:underline"
                >
                  Frequently Asked Questions
                </a>
                <a
                  href="https://ascentul.com/university-best-practices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary hover:underline"
                >
                  Best Practices & Tips
                </a>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://ascentul.com/university-help', '_blank')}
              >
                Visit Help Center
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}