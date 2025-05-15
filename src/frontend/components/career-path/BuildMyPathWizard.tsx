import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BriefcaseBusiness,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  PanelRight,
  Save,
  Target,
  Wand2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CareerPathExplorer } from '@/components/career-path/CareerPathExplorer';

// Define validation schemas for each step
const stepOneSchema = z.object({
  currentJobTitle: z.string().min(1, 'Current job title is required'),
  yearsOfExperience: z.string().min(1, 'Years of experience is required'),
});

const stepTwoSchema = z.object({
  workHistory: z.array(
    z.object({
      id: z.number().optional(),
      company: z.string(),
      position: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      currentJob: z.boolean().optional(),
      description: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      achievements: z.array(z.string()).nullable().optional(),
    })
  ),
});

const stepThreeSchema = z.object({
  desiredRole: z.string().optional(),
  desiredField: z.string().optional(),
  desiredTimeframe: z.string().optional(),
  additionalInfo: z.string().optional(),
});

// Combine all steps into one schema for final submission
const formSchema = stepOneSchema.merge(stepTwoSchema).merge(stepThreeSchema);

type FormValues = z.infer<typeof formSchema>;

// Component for work history item in step 2
const WorkHistoryItem = ({ 
  item, 
  index, 
  onChange, 
  onRemove 
}: { 
  item: any, 
  index: number, 
  onChange: (index: number, field: string, value: any) => void,
  onRemove: (index: number) => void
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormItem>
            <FormLabel>Company</FormLabel>
            <FormControl>
              <Input 
                value={item.company} 
                onChange={(e) => onChange(index, 'company', e.target.value)} 
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>Position</FormLabel>
            <FormControl>
              <Input 
                value={item.position} 
                onChange={(e) => onChange(index, 'position', e.target.value)} 
              />
            </FormControl>
          </FormItem>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormItem>
            <FormLabel>Start Date</FormLabel>
            <FormControl>
              <Input 
                type="date" 
                value={item.startDate}
                onChange={(e) => onChange(index, 'startDate', e.target.value)} 
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>End Date</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={item.endDate || ''}
                  disabled={item.currentJob}
                  onChange={(e) => onChange(index, 'endDate', e.target.value)} 
                />
                <div className="flex items-center gap-1 ml-2">
                  <input 
                    type="checkbox" 
                    id={`currentJob-${index}`}
                    checked={item.currentJob}
                    onChange={(e) => {
                      onChange(index, 'currentJob', e.target.checked);
                      if (e.target.checked) {
                        onChange(index, 'endDate', null);
                      }
                    }} 
                  />
                  <label htmlFor={`currentJob-${index}`} className="text-sm">Current job</label>
                </div>
              </div>
            </FormControl>
          </FormItem>
        </div>

        <div className="mb-4">
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                value={item.description || ''}
                onChange={(e) => onChange(index, 'description', e.target.value)}
                placeholder="Describe your responsibilities and achievements" 
              />
            </FormControl>
          </FormItem>
        </div>

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onRemove(index)}
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface BuildMyPathWizardProps {
  onClose?: () => void;
}

export const BuildMyPathWizard = ({ onClose }: BuildMyPathWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedPath, setGeneratedPath] = useState<any>(null);
  const [savedPathName, setSavedPathName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Forms for each step
  const stepOneForm = useForm<z.infer<typeof stepOneSchema>>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      currentJobTitle: '',
      yearsOfExperience: '',
    },
  });

  const stepTwoForm = useForm<z.infer<typeof stepTwoSchema>>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      workHistory: [],
    },
  });

  const stepThreeForm = useForm<z.infer<typeof stepThreeSchema>>({
    resolver: zodResolver(stepThreeSchema),
    defaultValues: {
      desiredRole: '',
      desiredField: '',
      desiredTimeframe: '',
      additionalInfo: '',
    },
  });

  // Fetch work history data
  const { data: workHistoryData, isLoading: isLoadingWorkHistory } = useQuery({
    queryKey: ['/api/work-history'],
    onSuccess: (data) => {
      // Format dates for form consumption
      const formattedData = data.map((item: any) => ({
        ...item,
        startDate: new Date(item.startDate).toISOString().split('T')[0],
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : null,
      }));
      stepTwoForm.setValue('workHistory', formattedData);
    },
  });

  // Mutation to generate career path
  const generatePathMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('POST', '/api/career-path/generate', data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedPath(data);
      setCurrentStep(3); // Move to results step
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate career path: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to save career path
  const savePathMutation = useMutation({
    mutationFn: async (data: { name: string, pathData: any }) => {
      const response = await apiRequest('POST', '/api/career-path/save', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Career path saved successfully',
      });
      setIsSaving(false);
      // Invalidate queries to refresh saved paths
      queryClient.invalidateQueries({ queryKey: ['/api/career-path/saved'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to save career path: ${error.message}`,
        variant: 'destructive',
      });
      setIsSaving(false);
    },
  });

  // Handle adding new work history item
  const handleAddWorkHistory = () => {
    const currentWorkHistory = stepTwoForm.getValues('workHistory') || [];
    stepTwoForm.setValue('workHistory', [
      ...currentWorkHistory,
      {
        company: '',
        position: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        currentJob: false,
        description: '',
      },
    ]);
  };

  // Handle work history item change
  const handleWorkHistoryChange = (index: number, field: string, value: any) => {
    const currentWorkHistory = [...stepTwoForm.getValues('workHistory')];
    currentWorkHistory[index] = {
      ...currentWorkHistory[index],
      [field]: value,
    };
    stepTwoForm.setValue('workHistory', currentWorkHistory);
  };

  // Handle removing work history item
  const handleRemoveWorkHistory = (index: number) => {
    const currentWorkHistory = [...stepTwoForm.getValues('workHistory')];
    currentWorkHistory.splice(index, 1);
    stepTwoForm.setValue('workHistory', currentWorkHistory);
  };

  // Handle saving generated path
  const handleSavePath = () => {
    if (!savedPathName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please provide a name for your career path',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    savePathMutation.mutate({
      name: savedPathName,
      pathData: generatedPath,
    });
  };

  // Handle form submission for each step
  const handleStepSubmit = async (step: number) => {
    try {
      if (step === 0) {
        await stepOneForm.trigger();
        if (stepOneForm.formState.isValid) {
          setCurrentStep(1);
        }
      } else if (step === 1) {
        await stepTwoForm.trigger();
        if (stepTwoForm.formState.isValid) {
          setCurrentStep(2);
        }
      } else if (step === 2) {
        await stepThreeForm.trigger();
        if (stepThreeForm.formState.isValid) {
          // Combine all form data and generate path
          const combinedData = {
            ...stepOneForm.getValues(),
            ...stepTwoForm.getValues(),
            ...stepThreeForm.getValues(),
          };
          generatePathMutation.mutate(combinedData);
        }
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  // Handle going back a step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Define steps content
  const steps = [
    {
      title: 'Current Role',
      icon: <BriefcaseBusiness className="h-5 w-5" />,
      description: 'Confirm your current role and experience',
      content: (
        <Form {...stepOneForm}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <FormField
              control={stepOneForm.control}
              name="currentJobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter your current job title or role
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={stepOneForm.control}
              name="yearsOfExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select years of experience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0-1">Less than 1 year</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your total professional experience
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      ),
    },
    {
      title: 'Work History',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      description: 'Review and edit your work history',
      content: (
        <Form {...stepTwoForm}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Your Work History</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm or update your work experience
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddWorkHistory}
                size="sm"
                variant="outline"
              >
                Add Experience
              </Button>
            </div>

            {isLoadingWorkHistory ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {stepTwoForm.getValues('workHistory')?.length === 0 ? (
                  <div className="text-center py-8 border rounded-md border-dashed">
                    <p className="text-muted-foreground">No work history found</p>
                    <Button
                      type="button"
                      onClick={handleAddWorkHistory}
                      variant="outline"
                      className="mt-4"
                    >
                      Add Your First Experience
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stepTwoForm.getValues('workHistory')?.map((item, index) => (
                      <WorkHistoryItem
                        key={index}
                        item={item}
                        index={index}
                        onChange={handleWorkHistoryChange}
                        onRemove={handleRemoveWorkHistory}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </form>
        </Form>
      ),
    },
    {
      title: 'Career Goals',
      icon: <Target className="h-5 w-5" />,
      description: 'What are your career aspirations?',
      content: (
        <Form {...stepThreeForm}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <FormField
              control={stepThreeForm.control}
              name="desiredRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired Role (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Chief Technology Officer"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a specific role you're aiming for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={stepThreeForm.control}
              name="desiredField"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired Field/Industry (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Artificial Intelligence, Healthcare"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    If you're considering a career change, enter the field
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={stepThreeForm.control}
              name="desiredTimeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeframe (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timeframe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How quickly do you want to achieve your goal?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={stepThreeForm.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any other details about your career goals or constraints"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any other relevant information that might help generate a better path
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      ),
    },
    {
      title: 'Results',
      icon: <Wand2 className="h-5 w-5" />,
      description: 'Your personalized career path',
      content: (
        <div className="space-y-6">
          {generatePathMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Generating Your Career Path</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We're creating a personalized career roadmap based on your work history and goals.
                This may take a minute...
              </p>
            </div>
          ) : generatedPath ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Your Personalized Career Path</h3>
                <p className="text-muted-foreground">
                  Based on your work history and career goals, here are recommended paths:
                </p>
              </div>

              {/* Path visualization */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <CareerPathExplorer pathData={generatedPath} />
              </div>

              {/* Save path section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Save This Career Path</h4>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter a name for this career path"
                    value={savedPathName}
                    onChange={(e) => setSavedPathName(e.target.value)}
                    className="max-w-md"
                  />
                  <Button
                    onClick={handleSavePath}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Path
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No results available yet.</p>
              <Button
                onClick={() => setCurrentStep(0)}
                variant="outline"
                className="mt-4"
              >
                Start Over
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col items-center ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
              style={{ width: `${100 / steps.length}%` }}
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  steps[index].icon
                )}
              </div>
              <div className="text-sm font-medium">{step.title}</div>
            </div>
          ))}
        </div>
        <div className="relative mt-3">
          <div className="absolute left-0 top-1/2 h-px w-full bg-muted -translate-y-1/2" />
          <div
            className="absolute left-0 top-1/2 h-px bg-primary -translate-y-1/2 transition-all duration-300"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-1">{steps[currentStep].title}</h2>
        <p className="text-muted-foreground mb-6">{steps[currentStep].description}</p>
        <div>{steps[currentStep].content}</div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 && onClose ? onClose : handlePrevStep}
          disabled={generatePathMutation.isPending}
        >
          {currentStep === 0 ? 'Cancel' : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </>
          )}
        </Button>
        
        {currentStep < 3 ? (
          <Button
            onClick={() => handleStepSubmit(currentStep)}
            disabled={generatePathMutation.isPending}
          >
            {currentStep === 2 ? (
              <>
                Generate Path
                <Wand2 className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
};