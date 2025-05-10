import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Check, AlertTriangle, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [universityName, setUniversityName] = useState('Test University');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  // Fetch the first university to use for testing
  const { data: universities } = useQuery({
    queryKey: ['/api/universities'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/universities');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const handleTestDirectEmail = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address to test the direct email functionality.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setTestResult(null);

    try {
      // Direct test using Mailgun API
      const response = await apiRequest('POST', '/api/test/send-direct-email', {
        email,
        subject: 'Test Direct Email',
        text: 'This is a test email sent directly via Mailgun API.',
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #1333c2;">Test Direct Email</h1>
                <p>This is a test email sent directly via Mailgun API at ${new Date().toISOString()}.</p>
                <p>Thank you for testing the email functionality!</p>
              </div>`
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send direct test email');
      }

      const result = await response.json();
      setTestResult({
        success: true,
        message: `Direct email sent successfully to ${email}! Message ID: ${result.id || 'unknown'}`,
      });
      toast({
        title: 'Direct email sent',
        description: `Email was successfully sent to ${email}`,
      });
    } catch (error) {
      console.error('Error sending direct test email:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      toast({
        title: 'Failed to send direct email',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestUniversityInvite = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address to test the university invite email.',
        variant: 'destructive',
      });
      return;
    }

    if (!universityName) {
      toast({
        title: 'University name required',
        description: 'Please enter a university name for the test invite.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setTestResult(null);

    try {
      let universityId = null;
      
      // Use the first university from the list if available
      if (universities && universities.length > 0) {
        universityId = universities[0].id;
      } else {
        // Create a test university if none exists
        const createUnivResponse = await apiRequest('POST', '/api/universities', {
          name: universityName,
          slug: 'test-university',
          domain: 'test.edu',
          licenseSeats: 100,
          licensePlan: 'Starter',
          licenseStart: new Date().toISOString(),
          licenseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        });
        
        if (!createUnivResponse.ok) {
          throw new Error('Failed to create test university');
        }
        
        const newUniversity = await createUnivResponse.json();
        universityId = newUniversity.id;
      }

      if (!universityId) {
        throw new Error('Could not obtain university ID for testing');
      }

      // Send university invite
      const response = await apiRequest('POST', '/api/university-invites', {
        email,
        universityId,
        role: 'admin'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send university invite');
      }

      const result = await response.json();
      setTestResult({
        success: true,
        message: `University invite sent successfully to ${email}! ${result.message || ''}`,
      });
      toast({
        title: 'University invite sent',
        description: `Invitation was successfully sent to ${email}`,
      });
    } catch (error) {
      console.error('Error sending university invite:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      toast({
        title: 'Failed to send university invite',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Email Testing Tool</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Direct Email</CardTitle>
            <CardDescription>
              Send a direct test email using the Mailgun API to verify the email configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="direct-email" className="text-sm font-medium">
                  Recipient Email Address
                </label>
                <Input
                  id="direct-email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleTestDirectEmail}
              disabled={isSending}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test University Invite</CardTitle>
            <CardDescription>
              Send a university administrator invitation email to test the invitation workflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="invite-email" className="text-sm font-medium">
                  Invite Email Address
                </label>
                <Input
                  id="invite-email"
                  placeholder="admin@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="university-name" className="text-sm font-medium">
                  University Name
                </label>
                <Input
                  id="university-name"
                  placeholder="Stanford University"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleTestUniversityInvite}
              disabled={isSending}
              variant="outline"
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send University Invite
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {testResult && (
        <Alert
          className={`mt-6 ${
            testResult.success ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {testResult.success ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{testResult.success ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}