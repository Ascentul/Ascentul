import { useState } from 'react';
import { Loader2, Mail, User, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from '@/lib/queryClient';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: string;
  description?: string;
}

export default function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/contact', {
        name,
        email,
        subject,
        message,
        timestamp: new Date().toISOString()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit contact form');
      }
      
      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Contact form submission error:", error);
      
      // Ensure we have a valid error message
      let errorMessage = "There was a problem sending your message. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {subject || "Contact Us"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description || "Send us a message and we'll get back to you as soon as possible."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input
              id="contact-subject"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="contact-message"
                placeholder="Type your message here"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="pl-10 min-h-[120px]"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Message
          </Button>
        </form>

        <DialogFooter className="sm:justify-start">
          <div className="text-xs text-muted-foreground mt-4">
            Your information is securely processed in accordance with our Privacy Policy.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}