import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Loader2, Mail, User, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from '@/lib/queryClient';
export default function ContactDialog({ open, onOpenChange, subject, description }) {
    const { toast } = useToast();
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subjectValue, setSubjectValue] = useState(subject || '');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await apiRequest('POST', '/api/contact', {
                name,
                email,
                subject: subjectValue,
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
            setSubjectValue('');
            setMessage('');
            // Close dialog
            onOpenChange(false);
        }
        catch (error) {
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
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-center", children: subject || "Contact Us" }), _jsx(DialogDescription, { className: "text-center", children: description || "Send us a message and we'll get back to you as soon as possible." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact-name", children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "contact-name", placeholder: "Enter your full name", value: name, onChange: (e) => setName(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact-email", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "contact-email", type: "email", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact-subject", children: "Subject" }), _jsx(Input, { id: "contact-subject", placeholder: "Enter subject", value: subjectValue, onChange: (e) => setSubjectValue(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact-message", children: "Message" }), _jsxs("div", { className: "relative", children: [_jsx(MessageSquare, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Textarea, { id: "contact-message", placeholder: "Type your message here", value: message, onChange: (e) => setMessage(e.target.value), className: "pl-10 min-h-[120px]", required: true })] })] }), _jsxs(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: [isSubmitting ? _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null, "Send Message"] })] }), _jsx(DialogFooter, { className: "sm:justify-start", children: _jsx("div", { className: "text-xs text-muted-foreground mt-4", children: "Your information is securely processed in accordance with our Privacy Policy." }) })] }) }));
}
