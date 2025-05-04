import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  Copy, 
  Send, 
  Mail, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock,
  AlertCircle
} from 'lucide-react';

interface Invitation {
  id: number;
  email: string;
  status: 'sent' | 'accepted' | 'expired';
  sentDate: string;
  expiryDate: string;
}

export default function InviteStudentsPage() {
  const { toast } = useToast();
  const [emails, setEmails] = useState('');
  const [message, setMessage] = useState('I\'d like to invite you to join Ascentul, our university\'s career development platform. This tool will help you build your professional profile, explore career paths, and prepare for interviews.');
  const [isSending, setIsSending] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  // Mock invitation history
  const invitations: Invitation[] = [
    {
      id: 1,
      email: 'student1@university.edu',
      status: 'accepted',
      sentDate: '2025-04-25',
      expiryDate: '2025-05-25',
    },
    {
      id: 2,
      email: 'student2@university.edu',
      status: 'sent',
      sentDate: '2025-05-01',
      expiryDate: '2025-06-01',
    },
    {
      id: 3,
      email: 'student3@university.edu',
      status: 'sent',
      sentDate: '2025-05-02',
      expiryDate: '2025-06-02',
    },
    {
      id: 4,
      email: 'student4@university.edu',
      status: 'expired',
      sentDate: '2025-03-01',
      expiryDate: '2025-04-01',
    },
    {
      id: 5,
      email: 'student5@university.edu',
      status: 'accepted',
      sentDate: '2025-04-15',
      expiryDate: '2025-05-15',
    },
  ];
  
  // Handle sending invitations
  const handleSendInvitations = () => {
    if (!emails.trim()) {
      toast({
        title: 'No email addresses provided',
        description: 'Please enter at least one email address to send invitations.',
        variant: 'destructive',
      });
      return;
    }
    
    // Get email addresses as array, removing empty lines and trimming whitespace
    const emailList = emails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (emailList.length === 0) {
      toast({
        title: 'No valid email addresses',
        description: 'Please enter at least one valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSending(true);
    
    // Simulate API call to send invitations
    setTimeout(() => {
      setIsSending(false);
      setEmails('');
      
      toast({
        title: 'Invitations sent successfully',
        description: `${emailList.length} ${emailList.length === 1 ? 'invitation has' : 'invitations have'} been sent.`,
      });
    }, 1500);
  };
  
  // Handle CSV file upload
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setCsvFile(files[0]);
      
      // Simulate processing the CSV file
      setTimeout(() => {
        toast({
          title: 'CSV file processed',
          description: 'Email addresses have been extracted from the CSV file.',
        });
        
        // In a real implementation, you would parse the CSV and extract emails
        // For demo purposes, just set some sample emails
        setEmails('student6@university.edu\nstudent7@university.edu\nstudent8@university.edu');
      }, 1000);
    }
  };
  
  // Generate invitation link
  const invitationLink = 'https://ascentul.com/register?university_code=UNI123456&admin_ref=789';
  
  // Copy invitation link to clipboard
  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: 'Link copied to clipboard',
      description: 'You can now paste the invitation link anywhere.',
    });
  };
  
  // Get status badge styling
  const getStatusBadge = (status: Invitation['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Download invitation template
  const downloadTemplate = () => {
    toast({
      title: 'Template downloaded',
      description: 'The CSV template has been downloaded to your device.',
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite Students</h1>
        <p className="text-muted-foreground">
          Add new students to your university's Ascentul platform.
        </p>
      </div>
      
      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="email" className="data-[state=active]:bg-white">
            <Mail className="h-4 w-4 mr-2" />
            Email Invitations
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-white">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="link" className="data-[state=active]:bg-white">
            <Copy className="h-4 w-4 mr-2" />
            Invitation Link
          </TabsTrigger>
        </TabsList>
        
        {/* Email Invitations Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Send Email Invitations</CardTitle>
              <CardDescription>
                Invite students by sending personalized email invitations directly from the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emails">Student Email Addresses</Label>
                <Textarea 
                  id="emails" 
                  placeholder="Enter email addresses, one per line" 
                  className="min-h-[120px]"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter one email address per line. Students will receive an invitation to join the platform.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Invitation Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Enter a personalized message" 
                  className="min-h-[100px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  This message will be included in the invitation email.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button 
                onClick={handleSendInvitations}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitations
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Bulk Upload Tab */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload</CardTitle>
              <CardDescription>
                Upload a CSV file containing multiple student email addresses at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Upload CSV File</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-1">Drag & drop your CSV file</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Or click to browse files. The file should contain a column with email addresses.
                  </p>
                  <div>
                    <Input
                      type="file"
                      accept=".csv"
                      id="csv-upload"
                      className="hidden"
                      onChange={handleCsvUpload}
                    />
                    <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                  {csvFile && (
                    <div className="mt-4 text-sm">
                      Selected file: <span className="font-medium">{csvFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Button variant="link" className="p-0" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                
                <Button disabled={!csvFile}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Process Bulk Invitations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Invitation Link Tab */}
        <TabsContent value="link">
          <Card>
            <CardHeader>
              <CardTitle>Shareable Invitation Link</CardTitle>
              <CardDescription>
                Create a shareable link that students can use to register directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>University Registration Link</Label>
                <div className="flex">
                  <Input 
                    value={invitationLink} 
                    readOnly 
                    className="flex-1 rounded-r-none"
                  />
                  <Button
                    className="rounded-l-none"
                    onClick={copyInvitationLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This link contains your university's unique code. Students will be automatically associated with your institution.
                </p>
              </div>
              
              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-semibold flex items-center mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Link Features
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <div className="h-4 w-4 mr-2 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    </div>
                    <span>Students are pre-assigned to your university</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-4 w-4 mr-2 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    </div>
                    <span>Tracks which admin shared the link</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-4 w-4 mr-2 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    </div>
                    <span>Automatically applies student-specific features</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-4 w-4 mr-2 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    </div>
                    <span>Works until your license expires or you revoke it</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Invitation History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invitations</CardTitle>
          <CardDescription>
            Track the status of invitations you've sent to students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                  <TableCell>{new Date(invitation.sentDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invitation.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {invitation.status === 'expired' ? (
                      <Button size="sm" variant="outline">
                        Resend
                      </Button>
                    ) : invitation.status === 'sent' ? (
                      <Button size="sm" variant="outline">
                        Remind
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled>
                        -
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center border-t p-4">
          <Button variant="outline" size="sm">View All Invitations</Button>
        </CardFooter>
      </Card>
    </div>
  );
}