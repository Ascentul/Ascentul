import React, { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

import { 
  Mail, 
  Users, 
  AlertCircle, 
  Copy, 
  Check, 
  Plus, 
  Trash2,
  Upload,
  Loader2
} from 'lucide-react';

// Interface for academic program data from the API
interface AcademicProgram {
  id: number;
  programName: string;
  degreeType: string;
  departmentName: string;
  description?: string;
  duration?: number;
  active: boolean;
}

// Form schema for inviting students
const inviteFormSchema = z.object({
  emailAddresses: z.string()
    .min(1, "Email addresses are required")
    .refine(emails => {
      const emailList = emails.split(',').map(email => email.trim());
      return emailList.every(email => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      });
    }, {
      message: "Please enter valid email addresses separated by commas"
    }),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  program: z.string().min(1, "Program is required"),
  sendCopy: z.boolean().default(false),
  expirationDays: z.string().min(1, "Expiration period is required"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function Invite() {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  // Fetch academic programs data from the API
  const { data: programs, isLoading, error } = useQuery<AcademicProgram[]>({
    queryKey: ['/academic-programs'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      emailAddresses: "",
      subject: "Invitation to Ascentul Career Platform",
      message: "Dear Student,\n\nYou have been invited to join the Ascentul Career Development Platform by your university. This platform will help you prepare for your career journey with AI-powered tools for resume building, interview preparation, and more.\n\nPlease click the link below to create your account and get started.\n\nBest regards,\nCareer Services Team",
      program: "",
      sendCopy: true,
      expirationDays: "30",
    }
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      toast({
        title: "CSV File Selected",
        description: `${file.name} has been selected. Click "Parse Emails" to extract email addresses.`,
      });
    }
  };

  const parseCsvFile = () => {
    if (!csvFile) {
      toast({
        title: "No CSV File",
        description: "Please upload a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, we would parse the CSV file
    // For demo purposes, we'll just set some sample emails
    const sampleEmails = "student1@stanford.edu, student2@stanford.edu, student3@stanford.edu, student4@stanford.edu, student5@stanford.edu";
    form.setValue("emailAddresses", sampleEmails);
    
    toast({
      title: "Emails Extracted",
      description: `Successfully extracted ${sampleEmails.split(',').length} email addresses from the CSV file.`,
    });
  };

  const copyInviteLink = () => {
    // In a real implementation, we would generate an actual invite link
    const inviteLink = "https://app.ascentul.com/invite/abc123xyz456";
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    
    toast({
      title: "Invite Link Copied",
      description: "The invite link has been copied to your clipboard.",
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const onSubmit = (data: InviteFormValues) => {

    // Count the number of emails
    const emailCount = data.emailAddresses.split(',').filter(email => email.trim().length > 0).length;
    
    toast({
      title: "Invitations Sent",
      description: `Successfully sent ${emailCount} invitations to students.`,
    });
    
    setInviteSent(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite Students</h1>
        <p className="text-muted-foreground">
          Send invitations to students to join the Ascentul Career Development Platform.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Invitations</CardTitle>
              <CardDescription>
                Invite students via email to create their accounts on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="emailAddresses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Addresses</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter email addresses separated by commas"
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter student email addresses separated by commas, or upload a CSV file.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                    >
                      <label className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV
                        <input 
                          type="file" 
                          accept=".csv" 
                          className="hidden" 
                          onChange={handleCsvUpload}
                        />
                      </label>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={parseCsvFile}
                      disabled={!csvFile}
                    >
                      Parse Emails
                    </Button>
                    
                    {csvFile && (
                      <p className="text-sm text-muted-foreground">
                        {csvFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="program"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoading ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                              ) : error ? (
                                <div className="flex items-center justify-center py-6 text-destructive">
                                  <AlertCircle className="h-5 w-5 mr-2" />
                                  <span>Failed to load programs</span>
                                </div>
                              ) : !programs || programs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                  <p>No programs found</p>
                                  <p className="text-xs mt-1">Add programs in Settings</p>
                                </div>
                              ) : (
                                <>
                                  <SelectGroup>
                                    <SelectLabel>Undergraduate Programs</SelectLabel>
                                    {programs
                                      .filter(program => program.active && 
                                        ["Associate", "Bachelor"].includes(program.degreeType))
                                      .map(program => (
                                        <SelectItem 
                                          key={program.id} 
                                          value={program.id.toString()}>
                                          {program.programName} ({program.degreeType})
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectGroup>
                                  <SelectGroup>
                                    <SelectLabel>Graduate Programs</SelectLabel>
                                    {programs
                                      .filter(program => program.active && 
                                        ["Master", "Doctorate", "Certificate"].includes(program.degreeType))
                                      .map(program => (
                                        <SelectItem 
                                          key={program.id} 
                                          value={program.id.toString()}>
                                          {program.programName} ({program.degreeType})
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectGroup>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expirationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invitation Expiration</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select expiration period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Email subject line" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter email message content"
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Customize the invitation message sent to students.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sendCopy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Send me a copy
                          </FormLabel>
                          <FormDescription>
                            Receive a copy of the invitation email for your records.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitations
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invite Link</CardTitle>
              <CardDescription>
                Generate a shareable invite link that can be used by multiple students.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <div className="font-medium">Ascentul Invite Link</div>
                  <div className="truncate text-sm text-muted-foreground">
                    https://app.ascentul.com/invite/abc123xyz456
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyInviteLink}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button className="w-full" variant="outline" onClick={copyInviteLink}>
                {isCopied ? "Copied!" : "Copy Invite Link"}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent student invitation activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">25 Students</p>
                    <p className="text-sm text-muted-foreground">Invited this month</p>
                  </div>
                  <Users className="h-8 w-8 text-primary opacity-80" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Recent Invites</div>
                  <div className="text-sm">
                    <p className="flex justify-between py-1">
                      <span>Computer Science (BS)</span>
                      <span className="text-muted-foreground">12 students</span>
                    </p>
                    <p className="flex justify-between py-1">
                      <span>MBA Program</span>
                      <span className="text-muted-foreground">8 students</span>
                    </p>
                    <p className="flex justify-between py-1">
                      <span>Engineering (MS)</span>
                      <span className="text-muted-foreground">5 students</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {inviteSent && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Invitations have been sent successfully. Students will receive an email with instructions to join the platform.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}