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
import { PlusCircle, MinusCircle, FileText } from 'lucide-react';
import { CareerDataImport } from '@/components/CareerDataImport';

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
}

export default function ResumeForm({ resume, onSuccess }: ResumeFormProps) {
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
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Career Data Import */}
        <div className="mb-4">
          <CareerDataImport form={form} />
        </div>

        <Tabs defaultValue="personal">
          <TabsList className="grid grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
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
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="form-checkbox h-4 w-4 text-primary rounded focus:ring-primary"
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                This is my current job
                              </FormLabel>
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
                                  <Input placeholder="Bachelor's, Master's, etc." {...field} />
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
                                  <Input placeholder="Computer Science, Business, etc." {...field} />
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
                                  <Input placeholder="MM/YYYY or Expected Graduation" {...field} />
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
                                  placeholder="Relevant courses, honors, activities..."
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
        </Tabs>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : resume?.id ? 'Update Resume' : 'Create Resume'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
