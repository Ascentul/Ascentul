import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "@/lib/useUserData";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Scroll,
  Globe,
  FileText,
  MapPin,
  Pencil,
  Plus,
  X,
  Clock,
  Calendar
} from "lucide-react";
import { useLocation, useRoute } from "wouter";

const remotePreferenceOptions = [
  { value: "remote", label: "Remote Only" },
  { value: "hybrid", label: "Hybrid Preferred" },
  { value: "onsite", label: "On-site Only" },
  { value: "flexible", label: "Flexible" }
];

const proficiencyLevelOptions = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Elementary" },
  { value: 3, label: "Intermediate" },
  { value: 4, label: "Advanced" },
  { value: 5, label: "Expert" }
];

const languageProficiencyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "native", label: "Native" }
];

const formatDate = (date: string | Date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export default function CareerProfile() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  // Edit state management
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [addingLanguage, setAddingLanguage] = useState(false);
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<number | null>(null);
  const [editingCertification, setEditingCertification] = useState<number | null>(null);
  const [addingCertification, setAddingCertification] = useState(false);
  
  // Data fetching
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/me'],
    enabled: !!user
  });
  
  const { data: workHistory, isLoading: workHistoryLoading } = useQuery({
    queryKey: ['/api/work-history'],
    enabled: !!user
  });
  
  const { data: educationHistory, isLoading: educationLoading } = useQuery({
    queryKey: ['/api/education-history'],
    enabled: !!user
  });
  
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements/personal'],
    enabled: !!user
  });

  const { data: certifications, isLoading: certificationsLoading } = useQuery({
    queryKey: ['/api/certifications'],
    enabled: !!user
  });

  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['/api/skills'],
    enabled: !!user
  });

  const { data: languages, isLoading: languagesLoading } = useQuery({
    queryKey: ['/api/languages'],
    enabled: !!user
  });

  // Forms
  const userProfileForm = useForm({
    defaultValues: {
      careerSummary: userData?.careerSummary || "",
      location: userData?.location || "",
      remotePreference: userData?.remotePreference || ""
    }
  });

  const skillForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Skill name is required"),
        proficiencyLevel: z.number().min(1).max(5),
        category: z.string().min(1, "Category is required"),
        yearOfExperience: z.number().optional()
      })
    ),
    defaultValues: {
      name: "",
      proficiencyLevel: 1,
      category: "technical",
      yearOfExperience: undefined
    }
  });

  const languageForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Language name is required"),
        proficiencyLevel: z.string().min(1, "Proficiency level is required")
      })
    ),
    defaultValues: {
      name: "",
      proficiencyLevel: "beginner"
    }
  });

  const certificationForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Certification name is required"),
        issuingOrganization: z.string().min(1, "Issuing organization is required"),
        issueDate: z.string().min(1, "Issue date is required"),
        expirationDate: z.string().optional(),
        credentialId: z.string().optional(),
        credentialUrl: z.string().optional()
      })
    ),
    defaultValues: {
      name: "",
      issuingOrganization: "",
      issueDate: "",
      expirationDate: "",
      credentialId: "",
      credentialUrl: ""
    }
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Profile updated",
        description: "Your career profile has been updated successfully."
      });
    }
  });

  const createSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/skills`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      setAddingSkill(false);
      skillForm.reset();
      toast({
        title: "Skill added",
        description: "Your skill has been added to your profile."
      });
    }
  });

  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return apiRequest(`/api/skills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      setEditingSkill(null);
      skillForm.reset();
      toast({
        title: "Skill updated",
        description: "Your skill has been updated successfully."
      });
    }
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/skills/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      toast({
        title: "Skill deleted",
        description: "The skill has been removed from your profile."
      });
    }
  });

  const createLanguageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/languages`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/languages'] });
      setAddingLanguage(false);
      languageForm.reset();
      toast({
        title: "Language added",
        description: "The language has been added to your profile."
      });
    }
  });

  const updateLanguageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return apiRequest(`/api/languages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/languages'] });
      setEditingLanguage(null);
      languageForm.reset();
      toast({
        title: "Language updated",
        description: "The language has been updated successfully."
      });
    }
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/languages/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/languages'] });
      toast({
        title: "Language deleted",
        description: "The language has been removed from your profile."
      });
    }
  });

  const createCertificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/certifications`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      setAddingCertification(false);
      certificationForm.reset();
      toast({
        title: "Certification added",
        description: "Your certification has been added to your profile."
      });
    }
  });

  const updateCertificationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return apiRequest(`/api/certifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      setEditingCertification(null);
      certificationForm.reset();
      toast({
        title: "Certification updated",
        description: "Your certification has been updated successfully."
      });
    }
  });

  const deleteCertificationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/certifications/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      toast({
        title: "Certification deleted",
        description: "The certification has been removed from your profile."
      });
    }
  });

  // Save user profile data
  const onSaveProfile = (type: string, data: any) => {
    updateUserMutation.mutate(data);
    if (type === 'summary') setEditingSummary(false);
    if (type === 'location') setEditingLocation(false);
  };

  // Skill handlers
  const onAddSkill = (data: any) => {
    createSkillMutation.mutate(data);
  };

  const onEditSkill = (skillId: number, skill: any) => {
    setEditingSkill(skillId);
    skillForm.reset({
      name: skill.name,
      proficiencyLevel: skill.proficiencyLevel,
      category: skill.category,
      yearOfExperience: skill.yearOfExperience
    });
  };

  const onUpdateSkill = (data: any) => {
    if (editingSkill !== null) {
      updateSkillMutation.mutate({ id: editingSkill, data });
    }
  };

  // Language handlers
  const onAddLanguage = (data: any) => {
    createLanguageMutation.mutate(data);
  };

  const onEditLanguage = (langId: number, lang: any) => {
    setEditingLanguage(langId);
    languageForm.reset({
      name: lang.name,
      proficiencyLevel: lang.proficiencyLevel
    });
  };

  const onUpdateLanguage = (data: any) => {
    if (editingLanguage !== null) {
      updateLanguageMutation.mutate({ id: editingLanguage, data });
    }
  };

  // Certification handlers
  const onAddCertification = (data: any) => {
    createCertificationMutation.mutate(data);
  };

  const onEditCertification = (certId: number, cert: any) => {
    setEditingCertification(certId);
    certificationForm.reset({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate || "",
      credentialId: cert.credentialId || "",
      credentialUrl: cert.credentialUrl || ""
    });
  };

  const onUpdateCertification = (data: any) => {
    if (editingCertification !== null) {
      updateCertificationMutation.mutate({ id: editingCertification, data });
    }
  };

  // Calculate profile completion
  useEffect(() => {
    if (userLoading || workHistoryLoading || educationLoading || 
        skillsLoading || languagesLoading || certificationsLoading) {
      return;
    }

    let completedSections = 0;
    let totalSections = 8; // Total number of sections
    
    // Check if each section has data
    if (userData?.careerSummary) completedSections++;
    if (userData?.location) completedSections++;
    if (workHistory && workHistory.length > 0) completedSections++;
    if (educationHistory && educationHistory.length > 0) completedSections++;
    if (achievements && achievements.length > 0) completedSections++;
    if (certifications && certifications.length > 0) completedSections++;
    if (skills && skills.length > 0) completedSections++;
    if (languages && languages.length > 0) completedSections++;
    
    setCompletionPercentage(Math.round((completedSections / totalSections) * 100));
  }, [
    userData, workHistory, educationHistory, achievements, 
    certifications, skills, languages, 
    userLoading, workHistoryLoading, educationLoading,
    achievementsLoading, certificationsLoading, skillsLoading, languagesLoading
  ]);

  // Update form values when user data changes
  useEffect(() => {
    if (userData) {
      userProfileForm.reset({
        careerSummary: userData.careerSummary || "",
        location: userData.location || "",
        remotePreference: userData.remotePreference || ""
      });
    }
  }, [userData]);

  // Loading state
  if (userLoading) {
    return <div className="flex justify-center items-center h-96">Loading profile...</div>;
  }

  return (
    <div className="container py-6 max-w-5xl">
      {/* Profile Completion Bar - Sticky */}
      <div className="sticky top-0 z-10 bg-background pb-4 border-b mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">Career Profile</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{completionPercentage}% Complete</span>
          </div>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Career Summary Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Career Summary</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setEditingSummary(true)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Career Summary</span>
            </Button>
          </CardHeader>
          <CardContent>
            {userData?.careerSummary ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {userData.careerSummary}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Add a summary of your career goals, experience, and expertise.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Location & Preferences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Location & Preferences</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setEditingLocation(true)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Location</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="flex-1">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {userData?.location || <span className="italic">Add your location</span>}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Remote Preference</p>
                  <p className="text-sm text-muted-foreground">
                    {userData?.remotePreference 
                      ? remotePreferenceOptions.find(opt => opt.value === userData.remotePreference)?.label 
                      : <span className="italic">Set your remote work preference</span>}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Work History</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              asChild
              className="h-8"
            >
              <a href="/work-history">
                <Plus className="h-4 w-4 mr-2" />
                <span>Edit Work History</span>
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {workHistory && workHistory.length > 0 ? (
              <div className="space-y-4">
                {workHistory.map((job: any) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{job.position}</h3>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(job.startDate)} — {job.currentJob ? 'Present' : formatDate(job.endDate)}
                        </span>
                      </div>
                    </div>
                    {job.location && (
                      <p className="text-xs text-muted-foreground mt-1">{job.location}</p>
                    )}
                    {job.description && (
                      <p className="mt-2 text-sm">{job.description}</p>
                    )}
                    {job.achievements && job.achievements.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Key Achievements:</p>
                        <ul className="list-disc list-inside text-sm pl-2 mt-1">
                          {job.achievements.map((achievement: string, index: number) => (
                            <li key={index} className="text-muted-foreground">{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground italic">
                  Add your work experience to showcase your professional journey.
                </p>
                <Button asChild className="mt-2">
                  <a href="/work-history">Add Work History</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Education</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              asChild
              className="h-8"
            >
              <a href="/education-history">
                <Plus className="h-4 w-4 mr-2" />
                <span>Edit Education</span>
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {educationHistory && educationHistory.length > 0 ? (
              <div className="space-y-4">
                {educationHistory.map((edu: any) => (
                  <div key={edu.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{edu.degree} in {edu.fieldOfStudy}</h3>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(edu.startDate)} — {edu.current ? 'Present' : formatDate(edu.endDate)}
                        </span>
                      </div>
                    </div>
                    {edu.location && (
                      <p className="text-xs text-muted-foreground mt-1">{edu.location}</p>
                    )}
                    {edu.description && (
                      <p className="mt-2 text-sm">{edu.description}</p>
                    )}
                    {edu.achievements && edu.achievements.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Academic Achievements:</p>
                        <ul className="list-disc list-inside text-sm pl-2 mt-1">
                          {edu.achievements.map((achievement: string, index: number) => (
                            <li key={index} className="text-muted-foreground">{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground italic">
                  Add your educational background to highlight your academic qualifications.
                </p>
                <Button asChild className="mt-2">
                  <a href="/education-history">Add Education</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Achievements</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              asChild
              className="h-8"
            >
              <a href="/achievements">
                <Plus className="h-4 w-4 mr-2" />
                <span>Add Achievement</span>
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {achievements && achievements.length > 0 ? (
              <div className="space-y-4">
                {achievements.map((achievement: any) => (
                  <div key={achievement.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-medium">{achievement.title}</h3>
                        {achievement.issuingOrganization && (
                          <p className="text-sm text-muted-foreground">{achievement.issuingOrganization}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(achievement.achievementDate)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {achievement.category}
                      </Badge>
                    </div>
                    {achievement.description && (
                      <p className="mt-2 text-sm">{achievement.description}</p>
                    )}
                    {achievement.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {achievement.skills.split(',').map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground italic">
                  Add your professional and personal achievements to showcase your accomplishments.
                </p>
                <Button asChild className="mt-2">
                  <a href="/achievements">Add Achievement</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Skills</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setAddingSkill(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Skill</span>
            </Button>
          </CardHeader>
          <CardContent>
            {skills && skills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {skills.map((skill: any) => (
                  <div key={skill.id} className="border rounded-lg p-3 relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onEditSkill(skill.id, skill)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteSkillMutation.mutate(skill.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{skill.name}</h3>
                      <Badge 
                        variant="outline" 
                        className="text-xs capitalize"
                      >
                        {skill.category}
                      </Badge>
                    </div>
                    <div className="flex mt-2 items-center gap-2">
                      <div className="bg-primary/10 h-1.5 rounded-full flex-1">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${(skill.proficiencyLevel / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {proficiencyLevelOptions.find(opt => opt.value === skill.proficiencyLevel)?.label}
                      </span>
                    </div>
                    {skill.yearOfExperience && (
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{skill.yearOfExperience} {skill.yearOfExperience === 1 ? 'year' : 'years'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground italic">
                  Add skills to showcase your technical expertise and professional capabilities.
                </p>
                <Button onClick={() => setAddingSkill(true)} className="mt-2">
                  Add Skills
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Scroll className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Certifications</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setAddingCertification(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Certification</span>
            </Button>
          </CardHeader>
          <CardContent>
            {certifications && certifications.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {certifications.map((cert: any) => (
                  <div key={cert.id} className="border rounded-lg p-4 relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onEditCertification(cert.id, cert)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteCertificationMutation.mutate(cert.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                    <div>
                      <h3 className="font-medium">{cert.name}</h3>
                      <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Issued: {formatDate(cert.issueDate)}
                          {cert.expirationDate && ` • Expires: ${formatDate(cert.expirationDate)}`}
                        </span>
                      </div>
                    </div>
                    {cert.credentialId && (
                      <p className="text-xs mt-2">
                        <span className="font-medium">Credential ID:</span> {cert.credentialId}
                      </p>
                    )}
                    {cert.credentialUrl && (
                      <a 
                        href={cert.credentialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        View Credential
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground italic">
                  Add your professional certifications to validate your expertise.
                </p>
                <Button onClick={() => setAddingCertification(true)} className="mt-2">
                  Add Certification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Languages</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setAddingLanguage(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Language</span>
            </Button>
          </CardHeader>
          <CardContent>
            {languages && languages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {languages.map((language: any) => (
                  <div key={language.id} className="border rounded-lg p-3 relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onEditLanguage(language.id, language)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteLanguageMutation.mutate(language.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                    <h3 className="font-medium">{language.name}</h3>
                    <Badge 
                      variant="secondary" 
                      className="mt-2"
                    >
                      {languageProficiencyOptions.find(opt => opt.value === language.proficiencyLevel)?.label}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground italic">
                  Add languages you speak to showcase your communication abilities.
                </p>
                <Button onClick={() => setAddingLanguage(true)} className="mt-2">
                  Add Language
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs/Modals */}
      
      {/* Edit Career Summary Dialog */}
      <Dialog open={editingSummary} onOpenChange={setEditingSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Career Summary</DialogTitle>
            <DialogDescription>
              Summarize your professional experience, goals, and expertise.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={userProfileForm.handleSubmit((data) => onSaveProfile('summary', { careerSummary: data.careerSummary }))}>
            <div className="space-y-4 py-4">
              <Textarea 
                placeholder="Write a brief summary of your career..."
                className="min-h-32"
                {...userProfileForm.register('careerSummary')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSummary(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Location & Preferences Dialog */}
      <Dialog open={editingLocation} onOpenChange={setEditingLocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location & Preferences</DialogTitle>
            <DialogDescription>
              Update your location and work preferences.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={userProfileForm.handleSubmit((data) => onSaveProfile('location', {
            location: data.location,
            remotePreference: data.remotePreference
          }))}>
            <div className="space-y-4 py-4">
              <FormField
                control={userProfileForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={userProfileForm.control}
                name="remotePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remote Work Preference</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your remote work preference" />
                        </SelectTrigger>
                        <SelectContent>
                          {remotePreferenceOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingLocation(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={addingSkill} onOpenChange={setAddingSkill}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
            <DialogDescription>
              Add a professional skill to your profile.
            </DialogDescription>
          </DialogHeader>
          <Form {...skillForm}>
            <form onSubmit={skillForm.handleSubmit(onAddSkill)} className="space-y-4 py-4">
              <FormField
                control={skillForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., React.js, Project Management" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select skill category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="soft">Soft Skills</SelectItem>
                          <SelectItem value="industry">Industry Knowledge</SelectItem>
                          <SelectItem value="tool">Tools & Software</SelectItem>
                          <SelectItem value="methodology">Methodologies</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="proficiencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency Level</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value.toString()} 
                        onValueChange={val => field.onChange(parseInt(val))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select proficiency level" />
                        </SelectTrigger>
                        <SelectContent>
                          {proficiencyLevelOptions.map(option => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="yearOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 3" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddingSkill(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Skill</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Skill Dialog */}
      <Dialog open={editingSkill !== null} onOpenChange={(open) => !open && setEditingSkill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update the details of your skill.
            </DialogDescription>
          </DialogHeader>
          <Form {...skillForm}>
            <form onSubmit={skillForm.handleSubmit(onUpdateSkill)} className="space-y-4 py-4">
              <FormField
                control={skillForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., React.js, Project Management" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select skill category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="soft">Soft Skills</SelectItem>
                          <SelectItem value="industry">Industry Knowledge</SelectItem>
                          <SelectItem value="tool">Tools & Software</SelectItem>
                          <SelectItem value="methodology">Methodologies</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="proficiencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency Level</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value.toString()} 
                        onValueChange={val => field.onChange(parseInt(val))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select proficiency level" />
                        </SelectTrigger>
                        <SelectContent>
                          {proficiencyLevelOptions.map(option => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="yearOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 3" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingSkill(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Language Dialog */}
      <Dialog open={addingLanguage} onOpenChange={setAddingLanguage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Language</DialogTitle>
            <DialogDescription>
              Add a language you speak to your profile.
            </DialogDescription>
          </DialogHeader>
          <Form {...languageForm}>
            <form onSubmit={languageForm.handleSubmit(onAddLanguage)} className="space-y-4 py-4">
              <FormField
                control={languageForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., English, Spanish, Mandarin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={languageForm.control}
                name="proficiencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency Level</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select proficiency level" />
                        </SelectTrigger>
                        <SelectContent>
                          {languageProficiencyOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddingLanguage(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Language</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Language Dialog */}
      <Dialog open={editingLanguage !== null} onOpenChange={(open) => !open && setEditingLanguage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Language</DialogTitle>
            <DialogDescription>
              Update your language proficiency.
            </DialogDescription>
          </DialogHeader>
          <Form {...languageForm}>
            <form onSubmit={languageForm.handleSubmit(onUpdateLanguage)} className="space-y-4 py-4">
              <FormField
                control={languageForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., English, Spanish, Mandarin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={languageForm.control}
                name="proficiencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency Level</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select proficiency level" />
                        </SelectTrigger>
                        <SelectContent>
                          {languageProficiencyOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingLanguage(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={addingCertification} onOpenChange={setAddingCertification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
            <DialogDescription>
              Add a professional certification to your profile.
            </DialogDescription>
          </DialogHeader>
          <Form {...certificationForm}>
            <form onSubmit={certificationForm.handleSubmit(onAddCertification)} className="space-y-4 py-4">
              <FormField
                control={certificationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AWS Certified Solutions Architect" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="issuingOrganization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Amazon Web Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date (if applicable)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential ID (if applicable)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC123XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="credentialUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential URL (if applicable)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddingCertification(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Certification</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Certification Dialog */}
      <Dialog open={editingCertification !== null} onOpenChange={(open) => !open && setEditingCertification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Certification</DialogTitle>
            <DialogDescription>
              Update your certification details.
            </DialogDescription>
          </DialogHeader>
          <Form {...certificationForm}>
            <form onSubmit={certificationForm.handleSubmit(onUpdateCertification)} className="space-y-4 py-4">
              <FormField
                control={certificationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AWS Certified Solutions Architect" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="issuingOrganization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Amazon Web Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date (if applicable)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential ID (if applicable)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC123XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={certificationForm.control}
                name="credentialUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential URL (if applicable)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCertification(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}