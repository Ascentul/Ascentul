import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlusCircle, MinusCircle, FileText } from 'lucide-react';

const resumeSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  template: z.string().default('standard'),
  content: z.object({
    personalInfo: z.object({
      fullName: z.string().min(1, { message: 'Full name is required' }),
      email: z.string().email({ message: 'Please enter a valid email' }),
      phone: z.string().optional(),
      location: z.string().optional(),
      linkedIn: z.string().optional(),
      portfolio: z.string().optional(),
    }),
    summary: z.string().optional(),
    skills: z.array(z.string()).default([]),
    experience: z.array(z.object({
      company: z.string(),
      position: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      currentJob: z.boolean().default(false),
      description: z.string().optional(),
    })).default([]),
    education: z.array(z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      description: z.string().optional(),
    })).default([]),
    projects: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      url: z.string().optional(),
      technologies: z.array(z.string()).default([]),
    })).default([]),
    certifications: z.array(z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.string(),
      url: z.string().optional(),
    })).default([]),
  }).default({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      portfolio: '',
    },
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  }),
});

type ResumeFormValues = z.infer<typeof resumeSchema>;

interface ResumeFormProps {
  resume?: any;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ResumeForm({ resume, onSuccess, open, onOpenChange }: ResumeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const defaultValues: ResumeFormValues = {
    name: resume?.name || '',
    template: resume?.template || 'standard',
    content: resume?.content || {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedIn: '',
        portfolio: '',
      },
      summary: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
    },
  };

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues,
  });

  const createResumeMutation = useMutation({
    mutationFn: async (data: ResumeFormValues) => {
      return apiRequest('POST', '/api/resumes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      toast({
        title: 'Resume Created',
        description: 'Your resume has been created successfully',
      });
      if (onSuccess) onSuccess();
      if (onOpenChange) onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create resume: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateResumeMutation = useMutation({
    mutationFn: async (data: ResumeFormValues) => {
      return apiRequest('PUT', `/api/resumes/${resume?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      toast({
        title: 'Resume Updated',
        description: 'Your resume has been updated successfully',
      });
      if (onSuccess) onSuccess();
      if (onOpenChange) onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update resume: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: ResumeFormValues) => {
    setIsSubmitting(true);
    try {
      if (resume?.id) {
        // Update existing resume with the current form data
        await updateResumeMutation.mutateAsync(data);
      } else {
        // Create new resume with form data
        await createResumeMutation.mutateAsync(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was a problem with your resume",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() === '') return;
    
    const currentSkills = form.getValues('content.skills') || [];
    if (!currentSkills.includes(skillInput.trim())) {
      form.setValue('content.skills', [...currentSkills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    const currentSkills = form.getValues('content.skills') || [];
    form.setValue(
      'content.skills',
      currentSkills.filter((s) => s !== skill)
    );
  };

  const addExperience = () => {
    const currentExperience = form.getValues('content.experience') || [];
    form.setValue('content.experience', [
      ...currentExperience,
      {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        currentJob: false,
        description: '',
      },
    ]);
  };

  const removeExperience = (index: number) => {
    const currentExperience = form.getValues('content.experience') || [];
    form.setValue(
      'content.experience',
      currentExperience.filter((_, i) => i !== index)
    );
  };

  const addEducation = () => {
    const currentEducation = form.getValues('content.education') || [];
    form.setValue('content.education', [
      ...currentEducation,
      {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
  };

  const removeEducation = (index: number) => {
    const currentEducation = form.getValues('content.education') || [];
    form.setValue(
      'content.education',
      currentEducation.filter((_, i) => i !== index)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resume?.id ? 'Edit Resume' : 'Create New Resume'}</DialogTitle>
          <DialogDescription>
            {resume?.id 
              ? 'Update your resume information below.' 
              : 'Fill out the details for your new resume. You can move between sections using the tabs.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Developer Resume" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Tabs defaultValue="personal">
              <TabsList className="grid grid-cols-3 md:grid-cols-7">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
              </TabsList>
              
              {/* Personal Info */}
              <TabsContent value="personal">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="content.personalInfo.fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="content.personalInfo.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="content.personalInfo.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="(123) 456-7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content.personalInfo.location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="City, State" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="content.personalInfo.linkedIn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input placeholder="linkedin.com/in/johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content.personalInfo.portfolio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portfolio Website</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Summary */}
              <TabsContent value="summary">
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="content.summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Summary</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Briefly describe your professional background and strengths..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Skills */}
              <TabsContent value="skills">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormLabel>Skills</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill (e.g., JavaScript)"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                        />
                        <Button type="button" onClick={addSkill}>
                          Add
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {form.watch('content.skills').map((skill, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="text-primary/70 hover:text-primary"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Experience */}
              <TabsContent value="experience">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <FormLabel className="text-base">Work Experience</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addExperience}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                    
                    {form.watch('content.experience').length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                        <p className="text-neutral-500">No work experience added yet</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={addExperience}
                        >
                          Add Experience
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {form.watch('content.experience').map((_, index) => (
                          <div key={index} className="border p-4 rounded-lg relative">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => removeExperience(index)}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <FormField
                                control={form.control}
                                name={`content.experience.${index}.company`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Company</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Company Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`content.experience.${index}.position`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Job Title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <FormField
                                control={form.control}
                                name={`content.experience.${index}.startDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input placeholder="MM/YYYY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`content.experience.${index}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="MM/YYYY or Present" 
                                        {...field} 
                                        disabled={form.watch(`content.experience.${index}.currentJob`)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`content.experience.${index}.currentJob`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 mb-4">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                                    />
                                  </FormControl>
                                  <FormLabel className="!mt-0">
                                    This is my current job
                                  </FormLabel>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`content.experience.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Describe your responsibilities and achievements..."
                                      className="min-h-[100px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Education */}
              <TabsContent value="education">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <FormLabel className="text-base">Education</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEducation}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    
                    {form.watch('content.education').length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                        <p className="text-neutral-500">No education added yet</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={addEducation}
                        >
                          Add Education
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {form.watch('content.education').map((_, index) => (
                          <div key={index} className="border p-4 rounded-lg relative">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => removeEducation(index)}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            
                            <FormField
                              control={form.control}
                              name={`content.education.${index}.institution`}
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Institution</FormLabel>
                                  <FormControl>
                                    <Input placeholder="University or School Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <FormField
                                control={form.control}
                                name={`content.education.${index}.degree`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Degree</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Bachelor of Science" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`content.education.${index}.field`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Field of Study</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Computer Science" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <FormField
                                control={form.control}
                                name={`content.education.${index}.startDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input placeholder="MM/YYYY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`content.education.${index}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input placeholder="MM/YYYY or Present" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`content.education.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Add achievements, activities, or other relevant information..."
                                      className="min-h-[100px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Projects */}
              <TabsContent value="projects">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <FormLabel className="text-base">Projects</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentProjects = form.getValues('content.projects') || [];
                          form.setValue('content.projects', [
                            ...currentProjects,
                            {
                              name: '',
                              description: '',
                              url: '',
                              technologies: [],
                            },
                          ]);
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Project
                      </Button>
                    </div>
                    
                    {form.watch('content.projects').length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                        <p className="text-neutral-500">No projects added yet</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => {
                            const currentProjects = form.getValues('content.projects') || [];
                            form.setValue('content.projects', [
                              ...currentProjects,
                              {
                                name: '',
                                description: '',
                                url: '',
                                technologies: [],
                              },
                            ]);
                          }}
                        >
                          Add Project
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {form.watch('content.projects').map((_, index) => (
                          <div key={index} className="border p-4 rounded-lg relative">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => {
                                const currentProjects = form.getValues('content.projects') || [];
                                form.setValue(
                                  'content.projects',
                                  currentProjects.filter((_, i) => i !== index)
                                );
                              }}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            
                            <FormField
                              control={form.control}
                              name={`content.projects.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Project Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Project Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`content.projects.${index}.url`}
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Project URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`content.projects.${index}.description`}
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Describe the project, your role, and outcomes..."
                                      className="min-h-[100px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Template Selection */}
              <TabsContent value="template">
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resume Template</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="modern">Modern</SelectItem>
                              <SelectItem value="classic">Classic</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-6 space-y-4">
                      <h3 className="text-sm font-medium">Template Preview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`border-2 rounded-md p-3 transition-all duration-200 ${form.watch('template') === 'modern' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                          <div className="font-medium text-sm mb-2">Modern</div>
                          <div className="aspect-w-8.5 aspect-h-11 bg-neutral-100 rounded overflow-hidden">
                            <div className="p-3">
                              <div className="h-6 bg-primary/20 mb-4 rounded w-1/2"></div>
                              <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-8">
                                  <div className="h-3 bg-neutral-200 rounded w-full mb-2"></div>
                                  <div className="h-3 bg-neutral-200 rounded w-4/5 mb-2"></div>
                                  <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                                </div>
                                <div className="col-span-4">
                                  <div className="h-12 bg-neutral-200 rounded"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`border-2 rounded-md p-3 transition-all duration-200 ${form.watch('template') === 'classic' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                          <div className="font-medium text-sm mb-2">Classic</div>
                          <div className="aspect-w-8.5 aspect-h-11 bg-neutral-100 rounded overflow-hidden">
                            <div className="p-3">
                              <div className="h-6 bg-neutral-200 mb-4 rounded-sm w-1/3 mx-auto"></div>
                              <div className="border-t border-b border-neutral-300 py-2 mb-4">
                                <div className="h-3 bg-neutral-200 rounded-sm w-1/2 mx-auto"></div>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <div className="h-3 bg-neutral-200 rounded-sm w-full"></div>
                                <div className="h-3 bg-neutral-200 rounded-sm w-full"></div>
                                <div className="h-3 bg-neutral-200 rounded-sm w-3/4"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={`border-2 rounded-md p-3 transition-all duration-200 ${form.watch('template') === 'minimal' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                          <div className="font-medium text-sm mb-2">Minimal</div>
                          <div className="aspect-w-8.5 aspect-h-11 bg-neutral-100 rounded overflow-hidden">
                            <div className="p-3">
                              <div className="h-5 bg-neutral-200 mb-6 rounded-sm w-1/4"></div>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="h-3 bg-neutral-200 rounded-sm w-1/2"></div>
                                <div className="h-3 bg-neutral-200 rounded-sm w-full"></div>
                                <div className="h-3 bg-neutral-200 rounded-sm w-full"></div>
                                <div className="h-3 bg-neutral-200 rounded-sm w-2/3"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={`border-2 rounded-md p-3 transition-all duration-200 ${form.watch('template') === 'professional' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                          <div className="font-medium text-sm mb-2">Professional</div>
                          <div className="aspect-w-8.5 aspect-h-11 bg-neutral-100 rounded overflow-hidden">
                            <div className="grid grid-cols-12">
                              <div className="col-span-4 bg-primary/20 h-full p-3">
                                <div className="h-4 bg-neutral-200 rounded w-full mb-3"></div>
                                <div className="h-3 bg-neutral-200 rounded w-4/5 mb-2"></div>
                                <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                              </div>
                              <div className="col-span-8 p-3">
                                <div className="h-5 bg-neutral-200 mb-4 rounded w-2/3"></div>
                                <div className="h-3 bg-neutral-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-neutral-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : resume?.id ? 'Update Resume' : 'Create Resume'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}