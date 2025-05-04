import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Mail, Upload, Copy, CheckCircle2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define form schema for invitations
const inviteFormSchema = z.object({
  emails: z.string().min(1, { message: 'Email addresses are required' }),
  role: z.string().min(1, { message: 'Role is required' }),
  message: z.string().optional(),
  expiresAfter: z.string().min(1, { message: 'Expiration period is required' }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function Invite() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const inviteLink = 'https://ascentul.com/join/university-code-XYZ123';

  // Initialize form
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      emails: '',
      role: 'student',
      message: 'You have been invited to join our university on the Ascentul career development platform. Please use the link below to create your account.',
      expiresAfter: '7days',
    },
  });

  // Handle invitation submission
  const onSubmit = (data: InviteFormValues) => {
    // In a real implementation, this would send API request
    console.log('Invitation data:', data);
    
    // Show success toast
    toast({
      title: 'Invitations Sent',
      description: `Invitations have been sent to ${data.emails.split('\n').length} recipients.`,
    });
    
    setShowInviteLink(true);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Simulate file processing
    setTimeout(() => {
      setIsUploading(false);
      
      // Set emails field with mock data from file
      form.setValue('emails', 'student1@university.edu\nstudent2@university.edu\nstudent3@university.edu');
      
      toast({
        title: 'File Uploaded',
        description: '3 email addresses were extracted from the CSV file.',
      });
    }, 1500);
  };

  // Handle copy invite link to clipboard
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    
    toast({
      title: 'Link Copied',
      description: 'Invitation link copied to clipboard',
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite Students</h1>
        <p className="text-muted-foreground">
          Send invitations to students to join your university's Ascentul platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invitation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Email Invitations</CardTitle>
            <CardDescription>
              Invite multiple students by email address. Enter one email per line or upload a CSV file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="emails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Addresses</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter email addresses (one per line)"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter one email address per line or{' '}
                        <label className="cursor-pointer text-primary">
                          upload a CSV file
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </label>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                            <SelectItem value="career_advisor">Career Advisor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiresAfter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires After</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Expiration period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3days">3 Days</SelectItem>
                            <SelectItem value="7days">7 Days</SelectItem>
                            <SelectItem value="14days">14 Days</SelectItem>
                            <SelectItem value="30days">30 Days</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invitation Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a custom message for the invitation email"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitations
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Bulk Upload and Instructions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Template</CardTitle>
              <CardDescription>
                Download a template for bulk invitations or create your own CSV file with these columns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-medium mb-2">Required CSV Format:</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-xs">
                  email,role,firstName,lastName<br />
                  student1@university.edu,student,John,Smith<br />
                  student2@university.edu,student,Jane,Doe
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {showInviteLink && (
            <Card>
              <CardHeader>
                <CardTitle>Invitation Link</CardTitle>
                <CardDescription>
                  Share this link with students to join your university platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Input
                    readOnly
                    value={inviteLink}
                    className="mr-2 font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={copyInviteLink}
                    className="flex-shrink-0"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                This link will expire based on the settings you selected.
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}