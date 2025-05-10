import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form schema using Zod
const supportFormSchema = z.object({
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters",
  }),
  issueType: z.string().min(1, {
    message: "Please select an issue type",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }),
  priority: z.string().min(1, {
    message: "Please select a priority level",
  }),
});

// Define the form values type based on the schema
type SupportFormValues = z.infer<typeof supportFormSchema>;

export default function UniversityAdminSupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  // Initialize the form with react-hook-form and zod validation
  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      subject: "",
      issueType: "",
      description: "",
      priority: "medium",
    },
  });

  // Setup the mutation for submitting the support ticket
  const submitTicketMutation = useMutation({
    mutationFn: async (values: SupportFormValues) => {
      const data = {
        ...values,
        source: "university-admin", // Mark the source as university-admin
        email: user?.email,
        name: user?.name,
        universityName: user?.universityName || "Not specified",
      };

      const response = await apiRequest("POST", "/api/in-app/support", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit support request");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you as soon as possible.",
      });
      setSubmitted(true);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: SupportFormValues) {
    submitTicketMutation.mutate(values);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">University Admin Support</h1>
      
      {submitted && !submitTicketMutation.isPending ? (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Ticket Submitted</AlertTitle>
          <AlertDescription className="text-green-700">
            Thank you for contacting support. We've received your request and will respond as soon as possible.
          </AlertDescription>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setSubmitted(false)}
          >
            Submit Another Request
          </Button>
        </Alert>
      ) : (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Submit a support request and our team will help you resolve any issues with your university portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your issue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select issue type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="account_access">Account Access</SelectItem>
                          <SelectItem value="student_management">Student Management</SelectItem>
                          <SelectItem value="reporting">Reporting Issues</SelectItem>
                          <SelectItem value="technical">Technical Problems</SelectItem>
                          <SelectItem value="billing">Billing Questions</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low - General question or feedback</SelectItem>
                          <SelectItem value="medium">Medium - Issue affecting some functionality</SelectItem>
                          <SelectItem value="high">High - Major issue affecting core functions</SelectItem>
                          <SelectItem value="critical">Critical - System completely unusable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide detailed information about your issue including any error messages you received"
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-3">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitTicketMutation.isPending}
                  >
                    {submitTicketMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit Support Ticket"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col items-start border-t pt-6">
            <div className="flex items-start space-x-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
              <p>
                For urgent matters requiring immediate assistance, please contact our support team directly at <a href="mailto:support@ascentul.io" className="text-primary hover:underline">support@ascentul.io</a>
              </p>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}