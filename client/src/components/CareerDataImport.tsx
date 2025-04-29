import { useState } from 'react';
import { useCareerData } from '@/hooks/use-career-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Briefcase, GraduationCap, LucideTag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn } from 'react-hook-form';

// The items we can import into a resume
interface ImportableItem {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  selected: boolean;
}

interface CareerDataImportProps {
  form: UseFormReturn<any>;
}

export function CareerDataImport({ form }: CareerDataImportProps) {
  const { toast } = useToast();
  const { careerData, isLoading, error } = useCareerData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('experience');
  
  // Track selected items in each category
  const [selectedWorkItems, setSelectedWorkItems] = useState<number[]>([]);
  const [selectedEducationItems, setSelectedEducationItems] = useState<number[]>([]);
  const [selectedSkillItems, setSelectedSkillItems] = useState<number[]>([]);

  // Format work history for display
  const workItems: ImportableItem[] = careerData?.workHistory.map(job => ({
    id: job.id,
    title: job.position,
    subtitle: job.company,
    description: job.description,
    date: job.startDate && job.endDate 
      ? `${format(new Date(job.startDate), 'MMM yyyy')} – ${format(new Date(job.endDate), 'MMM yyyy')}`
      : job.startDate 
        ? `${format(new Date(job.startDate), 'MMM yyyy')} – Present`
        : '',
    selected: selectedWorkItems.includes(job.id)
  })) || [];

  // Format education history for display
  const educationItems: ImportableItem[] = careerData?.educationHistory.map(edu => ({
    id: edu.id,
    title: edu.degree,
    subtitle: edu.institution,
    description: edu.description,
    date: edu.startDate && edu.endDate 
      ? `${format(new Date(edu.startDate), 'MMM yyyy')} – ${format(new Date(edu.endDate), 'MMM yyyy')}`
      : edu.startDate 
        ? `${format(new Date(edu.startDate), 'MMM yyyy')} – Present`
        : '',
    selected: selectedEducationItems.includes(edu.id)
  })) || [];

  // Format skills for display
  const skillItems: ImportableItem[] = careerData?.skills.map(skill => ({
    id: skill.id,
    title: skill.name,
    subtitle: skill.category,
    description: skill.yearOfExperience ? `${skill.yearOfExperience} years experience` : undefined,
    selected: selectedSkillItems.includes(skill.id)
  })) || [];

  // Toggle selection of a work history item
  const toggleWorkItem = (id: number) => {
    setSelectedWorkItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Toggle selection of an education history item
  const toggleEducationItem = (id: number) => {
    setSelectedEducationItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Toggle selection of a skill item
  const toggleSkillItem = (id: number) => {
    setSelectedSkillItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Import the selected items into the resume form
  const importSelectedItems = () => {
    // Import work history
    if (selectedWorkItems.length > 0) {
      const currentExperience = form.getValues('content.experience') || [];
      const selectedJobs = careerData?.workHistory.filter(job => 
        selectedWorkItems.includes(job.id)
      ) || [];

      const newExperience = [
        ...currentExperience,
        ...selectedJobs.map(job => ({
          company: job.company,
          position: job.position,
          startDate: job.startDate ? format(new Date(job.startDate), 'yyyy-MM-dd') : '',
          endDate: job.endDate ? format(new Date(job.endDate), 'yyyy-MM-dd') : '',
          currentJob: !job.endDate,
          description: job.description || '',
        }))
      ];

      form.setValue('content.experience', newExperience);
    }

    // Import education history
    if (selectedEducationItems.length > 0) {
      const currentEducation = form.getValues('content.education') || [];
      const selectedEducation = careerData?.educationHistory.filter(edu => 
        selectedEducationItems.includes(edu.id)
      ) || [];

      const newEducation = [
        ...currentEducation,
        ...selectedEducation.map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field || '',
          startDate: edu.startDate ? format(new Date(edu.startDate), 'yyyy-MM-dd') : '',
          endDate: edu.endDate ? format(new Date(edu.endDate), 'yyyy-MM-dd') : '',
          description: edu.description || '',
        }))
      ];

      form.setValue('content.education', newEducation);
    }

    // Import skills
    if (selectedSkillItems.length > 0) {
      const currentSkills = form.getValues('content.skills') || [];
      const selectedSkills = careerData?.skills.filter(skill => 
        selectedSkillItems.includes(skill.id)
      ) || [];

      const newSkills = [
        ...currentSkills,
        ...selectedSkills.map(skill => skill.name)
      ];

      // Remove duplicates
      const uniqueSkills = [...new Set(newSkills)];
      form.setValue('content.skills', uniqueSkills);
    }

    // Close dialog and show success message
    setIsDialogOpen(false);
    toast({
      title: 'Career Data Imported',
      description: 'Your selected items have been added to the resume.',
    });

    // Reset selections
    setSelectedWorkItems([]);
    setSelectedEducationItems([]);
    setSelectedSkillItems([]);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Import Career Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Import Your Career Data</DialogTitle>
          <DialogDescription>
            Select items from your career profile to add to this resume. You can choose from your work experience, education, and skills.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading your career data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-destructive">Error loading career data. Please try again later.</p>
            <Button 
              variant="outline"
              className="mt-4"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="experience" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                Work Experience
              </TabsTrigger>
              <TabsTrigger value="education" className="flex items-center">
                <GraduationCap className="mr-2 h-4 w-4" />
                Education
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center">
                <LucideTag className="mr-2 h-4 w-4" />
                Skills
              </TabsTrigger>
            </TabsList>
            
            {/* Work Experience Tab */}
            <TabsContent value="experience" className="max-h-[400px] overflow-y-auto">
              {workItems.length > 0 ? (
                workItems.map(job => (
                  <Card key={job.id} className="mb-3">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{job.title}</CardTitle>
                          <CardDescription>{job.subtitle}</CardDescription>
                        </div>
                        <Checkbox 
                          id={`work-${job.id}`}
                          checked={selectedWorkItems.includes(job.id)}
                          onCheckedChange={() => toggleWorkItem(job.id)}
                        />
                      </div>
                    </CardHeader>
                    {(job.description || job.date) && (
                      <CardContent className="pb-4 pt-0">
                        {job.date && <p className="text-sm text-muted-foreground mb-1">{job.date}</p>}
                        {job.description && <p className="text-sm">{job.description}</p>}
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No work experience found. Add some in your Career Profile first.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Education Tab */}
            <TabsContent value="education" className="max-h-[400px] overflow-y-auto">
              {educationItems.length > 0 ? (
                educationItems.map(edu => (
                  <Card key={edu.id} className="mb-3">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{edu.title}</CardTitle>
                          <CardDescription>{edu.subtitle}</CardDescription>
                        </div>
                        <Checkbox 
                          id={`edu-${edu.id}`}
                          checked={selectedEducationItems.includes(edu.id)}
                          onCheckedChange={() => toggleEducationItem(edu.id)}
                        />
                      </div>
                    </CardHeader>
                    {(edu.description || edu.date) && (
                      <CardContent className="pb-4 pt-0">
                        {edu.date && <p className="text-sm text-muted-foreground mb-1">{edu.date}</p>}
                        {edu.description && <p className="text-sm">{edu.description}</p>}
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No education history found. Add some in your Career Profile first.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Skills Tab */}
            <TabsContent value="skills" className="max-h-[400px] overflow-y-auto">
              {skillItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {skillItems.map(skill => (
                    <Card key={skill.id} className="mb-2">
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base">{skill.title}</CardTitle>
                            {skill.subtitle && (
                              <CardDescription>{skill.subtitle}</CardDescription>
                            )}
                          </div>
                          <Checkbox 
                            id={`skill-${skill.id}`}
                            checked={selectedSkillItems.includes(skill.id)}
                            onCheckedChange={() => toggleSkillItem(skill.id)}
                          />
                        </div>
                      </CardHeader>
                      {skill.description && (
                        <CardContent className="py-0">
                          <p className="text-xs text-muted-foreground">{skill.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No skills found. Add some in your Career Profile first.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedWorkItems.length > 0 && `${selectedWorkItems.length} work items`}
              {selectedWorkItems.length > 0 && (selectedEducationItems.length > 0 || selectedSkillItems.length > 0) && ', '}
              {selectedEducationItems.length > 0 && `${selectedEducationItems.length} education items`}
              {selectedEducationItems.length > 0 && selectedSkillItems.length > 0 && ', '}
              {selectedSkillItems.length > 0 && `${selectedSkillItems.length} skills`}
              {selectedWorkItems.length === 0 && selectedEducationItems.length === 0 && selectedSkillItems.length === 0 && 'No items selected'}
            </span>
            <div>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button
                onClick={importSelectedItems}
                disabled={
                  isLoading ||
                  Boolean(error) ||
                  (selectedWorkItems.length === 0 &&
                    selectedEducationItems.length === 0 &&
                    selectedSkillItems.length === 0)
                }
              >
                Import Selected
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}