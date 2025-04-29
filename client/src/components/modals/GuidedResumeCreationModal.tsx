import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  ArrowLeft, 
  Briefcase, 
  ChevronRight, 
  Layout, 
  Layers,
  Loader2, 
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import ResumeTemplateGallery from '../ResumeTemplateGallery';
import type { ResumeTemplateStyle } from '../ResumeTemplates'; 

// Steps in the resume creation flow
type CreationStep = 'select-template' | 'fill-details';

// Form schema
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  targetJobTitle: z.string().min(2, 'Job title must be at least 2 characters').max(100),
  targetCompany: z.string().optional(),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
  summary: z.string().min(20, 'Summary should be at least 20 characters'),
  template: z.enum(['modern', 'classic', 'minimal', 'professional']),
});

type FormData = z.infer<typeof formSchema>;

interface GuidedResumeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateResume?: (resumeData: any) => void;
}

export default function GuidedResumeCreationModal({ 
  isOpen, 
  onClose,
  onCreateResume
}: GuidedResumeCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<CreationStep>('select-template');
  
  // Selected template from the gallery
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateStyle>('modern');
  
  // Default form values
  const defaultValues: FormData = {
    title: '',
    targetJobTitle: '',
    targetCompany: '',
    industry: '',
    summary: '',
    template: selectedTemplate,
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Update form when template changes
  const updateFormTemplate = (template: ResumeTemplateStyle) => {
    setSelectedTemplate(template);
    form.setValue('template', template);
  };
  
  // This is now a two-step wizard that leads to the ResumeForm
  // We don't need the createResumeMutation here as we'll open the ResumeForm
  // after collecting basic information
  
  // Handle form submission
  const onSubmit = (data: FormData) => {
    // Create a new resume object with the form data
    const newResume = {
      name: data.title,
      template: data.template,
      content: {
        personalInfo: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          linkedIn: '',
          portfolio: '',
        },
        summary: data.summary,
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
      }
    };
    
    // Toast success message
    toast({
      title: "Resume template selected",
      description: "Now let's fill in the details for your new resume.",
    });
    
    // Pass the newResume data to the parent via the callback
    if (onCreateResume) {
      onCreateResume(newResume);
    }
    
    // Close this modal and reset the form
    if (onClose) {
      setCurrentStep('select-template');
      form.reset();
      onClose();
    }
  };
  
  // Go to next step
  const goToNextStep = () => {
    if (currentStep === 'select-template') {
      form.setValue('template', selectedTemplate);
      setCurrentStep('fill-details');
    }
  };
  
  // Go back to previous step
  const goBackStep = () => {
    if (currentStep === 'fill-details') {
      setCurrentStep('select-template');
    }
  };
  
  // Reset state when closing
  const handleClose = () => {
    setCurrentStep('select-template');
    form.reset();
    onClose();
  };
  
  // Step titles and descriptions
  const stepContent = {
    'select-template': {
      title: "Choose Resume Style",
      description: "Select a resume style that matches your professional identity and goals",
    },
    'fill-details': {
      title: "Resume Details",
      description: "Add information to personalize your resume",
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={currentStep === 'select-template' ? "max-w-3xl" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>{stepContent[currentStep].title}</DialogTitle>
          <DialogDescription>
            {stepContent[currentStep].description}
          </DialogDescription>
          <button 
            onClick={handleClose} 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        
        {currentStep === 'select-template' && (
          <div className="py-4">
            <ResumeTemplateGallery
              selectedTemplate={selectedTemplate}
              onSelectTemplate={updateFormTemplate}
            />
            
            <div className="mt-8 flex justify-end">
              <Button 
                variant="default" 
                onClick={goToNextStep}
                className="gap-1"
              >
                Continue
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
        
        {currentStep === 'fill-details' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Frontend Developer Resume" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetJobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Frontend Developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Company (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Google" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Summary</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Skilled frontend developer with 5 years of experience..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="px-4 py-3 mt-2 mb-4 bg-primary/5 rounded-md">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-primary" />
                  <p className="text-sm font-medium">Selected Template: <span className="font-semibold capitalize text-primary">{selectedTemplate}</span></p>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between mt-6 sm:space-x-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBackStep}
                  className="gap-1"
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
                
                <Button 
                  type="submit"
                >
                  Create Resume
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}