import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  BriefcaseBusiness,
  Award,
  Braces,
  Cpu,
  LineChart,
  User,
  Database,
  Layers,
  Lightbulb,
  GraduationCap,
  DollarSign,
  Calendar,
  CalendarDays,
  BookOpen,
  Loader2,
  SearchX,
  MapPin,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types for career path data
interface CareerSkill {
  name: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

interface CertificationRecommendation {
  name: string;
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeToComplete: string;
  relevance: 'highly relevant' | 'relevant' | 'somewhat relevant';
}

interface CareerNode {
  id: string;
  title: string;
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salaryRange: string;
  yearsExperience: string;
  skills: CareerSkill[];
  growthPotential: 'low' | 'medium' | 'high';
  description: string;
  icon: JSX.Element;
}

interface CareerPath {
  id: string;
  name: string;
  nodes: CareerNode[];
}

const LevelBadgeColors: Record<string, string> = {
  'entry': 'bg-blue-100 text-blue-800',
  'mid': 'bg-green-100 text-green-800',
  'senior': 'bg-purple-100 text-purple-800',
  'lead': 'bg-yellow-100 text-yellow-800',
  'executive': 'bg-red-100 text-red-800',
};

const SkillLevelColors: Record<string, string> = {
  'basic': 'bg-slate-100 text-slate-800',
  'intermediate': 'bg-amber-100 text-amber-800',
  'advanced': 'bg-emerald-100 text-emerald-800',
};

const GrowthIndicators: Record<string, { icon: JSX.Element, text: string, color: string }> = {
  'low': { 
    icon: <TrendingUp className="h-4 w-4" />, 
    text: 'Low Growth',
    color: 'text-amber-500'
  },
  'medium': { 
    icon: <TrendingUp className="h-4 w-4" />, 
    text: 'Medium Growth',
    color: 'text-blue-500'
  },
  'high': { 
    icon: <Sparkles className="h-4 w-4" />, 
    text: 'High Growth',
    color: 'text-green-500'
  }
};

// Sample data for career paths
const softwareEngineeringPath: CareerPath = {
  id: 'software-engineering',
  name: 'Software Engineering',
  nodes: [
    {
      id: 'junior-developer',
      title: 'Junior Developer',
      level: 'entry',
      salaryRange: '$60,000 - $85,000',
      yearsExperience: '0-2 years',
      skills: [
        { name: 'JavaScript', level: 'intermediate' },
        { name: 'HTML/CSS', level: 'intermediate' },
        { name: 'Git', level: 'basic' },
        { name: 'React', level: 'basic' }
      ],
      growthPotential: 'high',
      description: 'Builds and maintains web applications under supervision. Focuses on learning coding standards and processes.',
      icon: <Braces className="h-6 w-6 text-primary" />
    },
    {
      id: 'mid-level-developer',
      title: 'Mid-Level Developer',
      level: 'mid',
      salaryRange: '$85,000 - $120,000',
      yearsExperience: '2-5 years',
      skills: [
        { name: 'JavaScript', level: 'advanced' },
        { name: 'TypeScript', level: 'intermediate' },
        { name: 'React', level: 'intermediate' },
        { name: 'Node.js', level: 'intermediate' },
        { name: 'SQL', level: 'basic' }
      ],
      growthPotential: 'high',
      description: 'Works independently on features and resolves complex bugs. Mentors junior developers and contributes to technical decisions.',
      icon: <Cpu className="h-6 w-6 text-primary" />
    },
    {
      id: 'senior-developer',
      title: 'Senior Developer',
      level: 'senior',
      salaryRange: '$120,000 - $160,000',
      yearsExperience: '5-8 years',
      skills: [
        { name: 'JavaScript/TypeScript', level: 'advanced' },
        { name: 'System Design', level: 'intermediate' },
        { name: 'Cloud Services', level: 'intermediate' },
        { name: 'Performance Optimization', level: 'intermediate' },
        { name: 'CI/CD', level: 'intermediate' }
      ],
      growthPotential: 'medium',
      description: 'Leads development of complex features and architecture. Mentors team members and influences technical strategy.',
      icon: <Database className="h-6 w-6 text-primary" />
    },
    {
      id: 'lead-developer',
      title: 'Lead Developer',
      level: 'lead',
      salaryRange: '$150,000 - $190,000',
      yearsExperience: '8-12 years',
      skills: [
        { name: 'Architecture Design', level: 'advanced' },
        { name: 'Team Leadership', level: 'intermediate' },
        { name: 'Project Planning', level: 'intermediate' },
        { name: 'Cross-team Collaboration', level: 'intermediate' }
      ],
      growthPotential: 'medium',
      description: 'Oversees multiple teams or complex projects. Responsible for technical excellence, mentorship, and delivery.',
      icon: <BriefcaseBusiness className="h-6 w-6 text-primary" />
    },
    {
      id: 'engineering-manager',
      title: 'Engineering Manager',
      level: 'lead',
      salaryRange: '$170,000 - $210,000',
      yearsExperience: '10+ years',
      skills: [
        { name: 'Team Management', level: 'advanced' },
        { name: 'Project Management', level: 'advanced' },
        { name: 'Strategic Planning', level: 'intermediate' },
        { name: 'Budget Management', level: 'intermediate' }
      ],
      growthPotential: 'medium',
      description: 'Manages teams of developers, focusing on people development, process improvement, and project delivery.',
      icon: <User className="h-6 w-6 text-primary" />
    },
    {
      id: 'cto',
      title: 'Chief Technology Officer',
      level: 'executive',
      salaryRange: '$200,000 - $300,000+',
      yearsExperience: '15+ years',
      skills: [
        { name: 'Technology Strategy', level: 'advanced' },
        { name: 'Executive Leadership', level: 'advanced' },
        { name: 'Business Acumen', level: 'advanced' },
        { name: 'Innovation Management', level: 'advanced' }
      ],
      growthPotential: 'low',
      description: 'Sets technical vision and strategy. Responsible for all aspects of technology and engineering across the organization.',
      icon: <Award className="h-6 w-6 text-primary" />
    }
  ]
};

const dataAnalyticsPath: CareerPath = {
  id: 'data-analytics',
  name: 'Data Analytics',
  nodes: [
    {
      id: 'data-analyst',
      title: 'Data Analyst',
      level: 'entry',
      salaryRange: '$55,000 - $80,000',
      yearsExperience: '0-2 years',
      skills: [
        { name: 'SQL', level: 'intermediate' },
        { name: 'Excel', level: 'intermediate' },
        { name: 'Data Visualization', level: 'basic' },
        { name: 'Statistical Analysis', level: 'basic' }
      ],
      growthPotential: 'high',
      description: 'Collects, processes, and performs statistical analyses of data. Creates reports and visualizations to communicate insights.',
      icon: <LineChart className="h-6 w-6 text-primary" />
    },
    {
      id: 'senior-data-analyst',
      title: 'Senior Data Analyst',
      level: 'mid',
      salaryRange: '$80,000 - $110,000',
      yearsExperience: '3-5 years',
      skills: [
        { name: 'SQL', level: 'advanced' },
        { name: 'Python/R', level: 'intermediate' },
        { name: 'Advanced Statistics', level: 'intermediate' },
        { name: 'Data Modeling', level: 'intermediate' }
      ],
      growthPotential: 'high',
      description: 'Leads complex data analysis projects and develops advanced reporting solutions. Mentors junior analysts.',
      icon: <LineChart className="h-6 w-6 text-primary" />
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist',
      level: 'senior',
      salaryRange: '$110,000 - $150,000',
      yearsExperience: '5-8 years',
      skills: [
        { name: 'Machine Learning', level: 'intermediate' },
        { name: 'Python', level: 'advanced' },
        { name: 'Statistical Modeling', level: 'advanced' },
        { name: 'Big Data Technologies', level: 'intermediate' }
      ],
      growthPotential: 'medium',
      description: 'Develops predictive models and algorithms. Extracts insights from complex datasets to solve business problems.',
      icon: <Cpu className="h-6 w-6 text-primary" />
    },
    {
      id: 'lead-data-scientist',
      title: 'Lead Data Scientist',
      level: 'lead',
      salaryRange: '$140,000 - $180,000',
      yearsExperience: '8-12 years',
      skills: [
        { name: 'Advanced ML Algorithms', level: 'advanced' },
        { name: 'Team Leadership', level: 'intermediate' },
        { name: 'Research Methods', level: 'advanced' },
        { name: 'Strategy Development', level: 'intermediate' }
      ],
      growthPotential: 'medium',
      description: 'Leads data science teams and initiatives. Translates business problems into data science solutions and oversees implementation.',
      icon: <Database className="h-6 w-6 text-primary" />
    },
    {
      id: 'chief-data-officer',
      title: 'Chief Data Officer',
      level: 'executive',
      salaryRange: '$180,000 - $250,000+',
      yearsExperience: '12+ years',
      skills: [
        { name: 'Data Strategy', level: 'advanced' },
        { name: 'Executive Leadership', level: 'advanced' },
        { name: 'Data Governance', level: 'advanced' },
        { name: 'Business Acumen', level: 'advanced' }
      ],
      growthPotential: 'low',
      description: 'Oversees all data-related activities and strategy. Responsible for data quality, governance, and leveraging data as a strategic asset.',
      icon: <Award className="h-6 w-6 text-primary" />
    }
  ]
};

// Array of all career paths
const careerPaths: CareerPath[] = [softwareEngineeringPath, dataAnalyticsPath];

// Sample certification data for roles
interface Certification {
  name: string;
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeToComplete: string;
  relevance: 'highly relevant' | 'relevant' | 'somewhat relevant';
}

const roleCertifications: Record<string, Certification[]> = {
  'junior-developer': [
    {
      name: 'Web Development Fundamentals',
      provider: 'Codecademy',
      difficulty: 'beginner',
      estimatedTimeToComplete: '2-3 months',
      relevance: 'highly relevant'
    },
    {
      name: 'JavaScript Algorithms and Data Structures',
      provider: 'freeCodeCamp',
      difficulty: 'intermediate',
      estimatedTimeToComplete: '3 months',
      relevance: 'relevant'
    }
  ],
  'mid-level-developer': [
    {
      name: 'React Developer Certification',
      provider: 'Meta',
      difficulty: 'intermediate',
      estimatedTimeToComplete: '2-3 months',
      relevance: 'highly relevant'
    },
    {
      name: 'AWS Certified Developer',
      provider: 'Amazon Web Services',
      difficulty: 'intermediate',
      estimatedTimeToComplete: '3-6 months',
      relevance: 'relevant'
    }
  ],
  'senior-developer': [
    {
      name: 'Certified Kubernetes Application Developer',
      provider: 'Cloud Native Computing Foundation',
      difficulty: 'advanced',
      estimatedTimeToComplete: '3-6 months',
      relevance: 'relevant'
    },
    {
      name: 'AWS Solutions Architect Professional',
      provider: 'Amazon Web Services',
      difficulty: 'advanced',
      estimatedTimeToComplete: '6 months',
      relevance: 'relevant'
    }
  ],
  'lead-developer': [
    {
      name: 'Google Cloud Professional Cloud Architect',
      provider: 'Google Cloud',
      difficulty: 'advanced',
      estimatedTimeToComplete: '6 months',
      relevance: 'relevant'
    },
    {
      name: 'Certified Scrum Master',
      provider: 'Scrum Alliance',
      difficulty: 'intermediate',
      estimatedTimeToComplete: '1-2 months',
      relevance: 'highly relevant'
    }
  ],
  'engineering-manager': [
    {
      name: 'Project Management Professional (PMP)',
      provider: 'Project Management Institute',
      difficulty: 'advanced',
      estimatedTimeToComplete: '6 months',
      relevance: 'highly relevant'
    },
    {
      name: 'Certified ScrumMaster',
      provider: 'Scrum Alliance',
      difficulty: 'intermediate',
      estimatedTimeToComplete: '1 month',
      relevance: 'highly relevant'
    }
  ],
  'cto': [
    {
      name: 'TOGAF Enterprise Architecture Certification',
      provider: 'The Open Group',
      difficulty: 'advanced',
      estimatedTimeToComplete: '3-6 months',
      relevance: 'highly relevant'
    },
    {
      name: 'Certified Information Security Manager (CISM)',
      provider: 'ISACA',
      difficulty: 'advanced',
      estimatedTimeToComplete: '6 months',
      relevance: 'relevant'
    }
  ],
  'data-analyst': [
    {
      name: 'Google Data Analytics Professional Certificate',
      provider: 'Google',
      difficulty: 'beginner',
      estimatedTimeToComplete: '6 months',
      relevance: 'highly relevant'
    },
    {
      name: 'Microsoft Power BI Data Analyst',
      provider: 'Microsoft',
      difficulty: 'intermediate',
      estimatedTimeToComplete: '2-3 months',
      relevance: 'highly relevant'
    }
  ],
  'senior-data-analyst': [
    {
      name: 'Tableau Desktop Specialist',
      provider: 'Tableau',
      difficulty: 'intermediate',
      estimatedTimeToComplete: '2-3 months',
      relevance: 'highly relevant'
    },
    {
      name: 'SAS Certified Data Scientist',
      provider: 'SAS',
      difficulty: 'advanced',
      estimatedTimeToComplete: '6 months',
      relevance: 'relevant'
    }
  ],
  'data-scientist': [
    {
      name: 'IBM Data Science Professional Certificate',
      provider: 'IBM',
      difficulty: 'intermediate',
      estimatedTimeToComplete: '3-6 months',
      relevance: 'highly relevant'
    },
    {
      name: 'Azure Data Scientist Associate',
      provider: 'Microsoft',
      difficulty: 'advanced',
      estimatedTimeToComplete: '3-6 months',
      relevance: 'relevant'
    }
  ],
  'lead-data-scientist': [
    {
      name: 'Certified Machine Learning Engineer',
      provider: 'MLOps Foundation',
      difficulty: 'advanced',
      estimatedTimeToComplete: '6 months',
      relevance: 'highly relevant'
    },
    {
      name: 'TensorFlow Developer Certificate',
      provider: 'Google',
      difficulty: 'advanced',
      estimatedTimeToComplete: '3 months',
      relevance: 'relevant'
    }
  ],
  'chief-data-officer': [
    {
      name: 'DAMA Certified Data Management Professional',
      provider: 'DAMA International',
      difficulty: 'advanced',
      estimatedTimeToComplete: '6 months',
      relevance: 'highly relevant'
    },
    {
      name: 'Certified Chief Data Officer',
      provider: 'MIT CDOIQ Program',
      difficulty: 'advanced',
      estimatedTimeToComplete: '6-12 months',
      relevance: 'highly relevant'
    }
  ]
};

// Define the insights interface
interface RoleInsight {
  suggestedRoles: {
    title: string;
    description: string;
    keySkills: string[];
    salaryRange: string;
    growthPotential: 'low' | 'medium' | 'high';
    timeToAchieve: string;
  }[];
  transferableSkills: {
    skill: string;
    relevance: string;
    currentProficiency: 'basic' | 'intermediate' | 'advanced';
  }[];
  recommendedCertifications: {
    name: string;
    provider: string;
    timeToComplete: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    relevance: string;
  }[];
  developmentPlan: {
    step: string;
    timeframe: string;
    description: string;
  }[];
  insights: string;
}

// Function to map icon string to JSX component
const getIconComponent = (iconName: string): JSX.Element => {
  // Default to Briefcase if not matched
  const iconSize = "h-6 w-6 text-primary";
  
  switch (iconName?.toLowerCase()) {
    case 'braces':
      return <Braces className={iconSize} />;
    case 'cpu':
      return <Cpu className={iconSize} />;
    case 'database':
      return <Database className={iconSize} />;
    case 'briefcase':
      return <BriefcaseBusiness className={iconSize} />;
    case 'user':
      return <User className={iconSize} />;
    case 'award':
      return <Award className={iconSize} />;
    case 'linechart':
      return <LineChart className={iconSize} />;
    case 'layers':
      return <Layers className={iconSize} />;
    case 'graduation':
      return <GraduationCap className={iconSize} />;
    case 'lightbulb':
      return <Lightbulb className={iconSize} />;
    case 'book':
      return <BookOpen className={iconSize} />;
    default:
      // If the icon name is not recognized or null/undefined, use a default icon
      return <BriefcaseBusiness className={iconSize} />;
  }
};

// Define exploration modes
type ExplorationMode = 'target' | 'profile';

// Define career profile data interface for typechecking
interface CareerProfileData {
  workHistory?: any[];
  education?: any[];
  skills?: any[];
  [key: string]: any;
}

// Starter career paths removed as no longer needed

export default function CareerPathExplorer() {
  // We'll use the router for navigation instead of direct window.location
  const navigate = (path: string) => {
    // This is a safe way to navigate programmatically
    const link = document.createElement('a');
    link.href = path;
    link.setAttribute('data-navigation', 'true');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const { toast } = useToast();
  const [activePath, setActivePath] = useState<CareerPath>(careerPaths[0]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [roleCertifications, setRoleCertifications] = useState<Record<string, CertificationRecommendation[]>>({});
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Job title search
  const [jobTitle, setJobTitle] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [generatedPath, setGeneratedPath] = useState<any>(null);
  
  // 2-Mode exploration state
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>(() => {
    // Try to get from localStorage first
    const savedMode = localStorage.getItem('careerExplorationMode');
    if (savedMode && ['target', 'profile'].includes(savedMode)) {
      return savedMode as ExplorationMode;
    }
    
    // Default to 'profile' if user has required data, otherwise 'target'
    const hasRequiredData = true; // Will be set based on profile data check
    return hasRequiredData ? 'profile' : 'target';
  });
  
  // Query user profile data if in profile mode
  const { data: careerProfileData, isLoading: isLoadingProfile } = useQuery<CareerProfileData>({
    queryKey: ['/api/career-data/profile'],
    enabled: explorationMode === 'profile'
  });
  
  // Update local storage when mode changes
  useEffect(() => {
    localStorage.setItem('careerExplorationMode', explorationMode);
  }, [explorationMode]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Adjust as needed
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount 
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const selectedNode = selectedNodeId 
    ? activePath.nodes.find(node => node.id === selectedNodeId) 
    : null;
    
  const handleNodeClick = (nodeId: string) => {
    const isCurrentlySelected = selectedNodeId === nodeId;
    setSelectedNodeId(nodeId);
    
    if (!isCurrentlySelected) {
      setDrawerOpen(true);
      // Fetch AI-generated certification recommendations when a node is clicked
      fetchCertificationRecommendations(nodeId);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };
  
  // Function to fetch AI-generated certification recommendations
  const fetchCertificationRecommendations = async (nodeId: string) => {
    // Skip if we already have recommendations for this node
    if (roleCertifications[nodeId]) {
      return;
    }
    
    const node = activePath.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    try {
      setIsLoadingCertifications(true);
      
      const response = await apiRequest('POST', '/api/career-certifications', {
        role: node.title,
        level: node.level,
        skills: node.skills
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch certification recommendations');
      }
      
      const data = await response.json();
      
      // Update the certifications state with the new recommendations
      setRoleCertifications(prev => ({
        ...prev,
        [nodeId]: data
      }));
      
    } catch (error) {
      console.error('Error fetching certification recommendations:', error);
      toast({
        title: "Failed to load certifications",
        description: "There was a problem retrieving AI certification recommendations.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCertifications(false);
    }
  };

  // Helper function for starter paths removed
  
  // Helper function to render the Profile-based Paths view
  const renderProfileBasedPaths = () => {
    if (isLoadingProfile) {
      return (
        <div className="flex items-center justify-center py-12 mt-6 border border-dashed rounded-lg border-gray-300 bg-gray-50/50">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3">Loading your career profile data...</span>
        </div>
      );
    }
    
    const hasCompleteProfile = careerProfileData && 
      ((careerProfileData.workHistory && careerProfileData.workHistory.length > 0) || 
       (careerProfileData.education && careerProfileData.education.length > 0) || 
       (careerProfileData.skills && careerProfileData.skills.length > 0));
       
    if (!hasCompleteProfile) {
      return (
        <div className="text-center py-16 px-6 mt-6 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md shadow-gray-200 border border-gray-100 w-full">
          <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <User className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-medium mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Complete Your Profile
          </h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            Add your work history, education, and skills in Account Settings to get personalized career path suggestions.
          </p>
          <Button size="lg" className="bg-[#1333c2] hover:bg-[#0f2aae] text-white shadow-sm hover:shadow-lg transition-all" asChild>
            <a href="/account/career">Complete Your Profile</a>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-4">Career Paths Based on Your Profile</h2>
        <p className="text-muted-foreground mb-6">
          These paths are suggested based on your current role, skills, and experience.
        </p>
        
        {/* Implementation would use careerProfileData to generate or fetch personalized paths */}
        {/* For demo, just show sample paths from the standard paths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {careerPaths.slice(0, 2).map((path) => (
            <Card key={path.id} className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-4">{path.name}</h3>
                
                <div className="space-y-4">
                  {path.nodes.slice(0, 3).map((node, index) => (
                    <div key={node.id} className="flex items-start gap-3">
                      <div className="rounded-full p-2 bg-primary/10 shrink-0">
                        {node.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{node.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {node.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className={`${LevelBadgeColors[node.level]} text-xs`}>
                            {node.level.charAt(0).toUpperCase() + node.level.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">View Full Path</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Career Path Explorer</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Visualize potential career progressions and explore different roles.
          </p>
        </div>
      </div>
      
      {/* Mode Selection Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Tabs
          value={explorationMode}
          onValueChange={(value) => setExplorationMode(value as 'target' | 'profile')}
          className="w-auto"
        >
          <TabsList 
            className="mb-4 bg-gray-100 rounded-md p-1" 
            role="tablist"
          >
            <TabsTrigger 
              value="target" 
              className="rounded-md transition-all duration-200 ease-in-out flex items-center justify-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
              role="tab"
              aria-selected={explorationMode === 'target'}
              tabIndex={explorationMode === 'target' ? 0 : -1}
            >
              <span>Search Target Role</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="rounded-md transition-all duration-200 ease-in-out flex items-center justify-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
              role="tab"
              aria-selected={explorationMode === 'profile'}
              tabIndex={explorationMode === 'profile' ? 0 : -1}
            >
              <span>Suggested Paths for Me</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Render the appropriate view based on exploration mode */}
      {explorationMode === 'profile' && renderProfileBasedPaths()}
      
      {/* Job Title Search - Only show in 'target' mode */}
      {explorationMode === 'target' && (
        <div className="mb-6 mt-6 space-y-2">
          <Label htmlFor="job-title-search" className="text-sm sm:text-base">Quick Career Path Generator</Label>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="flex-1 w-full">
              <Input
                id="job-title-search"
                placeholder="Enter a job title (e.g., Software Engineer, Data Scientist)"
                value={jobTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobTitle(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
            <Button 
              onClick={() => {
                if (!jobTitle.trim()) {
                  toast({
                    title: "Job title required",
                    description: "Please enter a job title to generate a career path.",
                    variant: "destructive"
                  });
                  return;
                }
                
                setIsSearching(true);
                
                apiRequest('POST', '/api/career-path/generate-from-job', {
                  jobTitle: jobTitle.trim()
                })
                  .then(res => res.json())
                  .then(data => {
                    console.log('API Response:', data);
                    
                    // Check if the data has a 'paths' array (from the OpenAI response)
                    if (data.paths && data.paths.length > 0) {
                      // The first path in the paths array is the main career path
                      const mainPath = data.paths[0];
                      
                      // Make sure it has the required format
                      if (mainPath && mainPath.nodes && mainPath.nodes.length > 0) {
                        // Process the nodes to add proper icon components
                        const processedPath = {
                          ...mainPath,
                          nodes: mainPath.nodes.map((node: any) => {
                            // Map the icon string to an actual React component
                            const iconComponent = getIconComponent(node.icon);
                            
                            return {
                              ...node,
                              icon: iconComponent
                            };
                          })
                        };
                        
                        // Set this as the generated path
                        setGeneratedPath(processedPath);
                        setActivePath(processedPath);
                        
                        toast({
                          title: "Career Path Generated",
                          description: `Career path for "${jobTitle}" has been generated successfully.`,
                        });
                      } else {
                        throw new Error('Invalid path structure returned');
                      }
                    } else {
                      throw new Error('No valid career paths found in response');
                    }
                    
                    setIsSearching(false);
                  })
                  .catch(err => {
                    console.error('Error generating career path:', err);
                    setIsSearching(false);
                    toast({
                      title: "Error",
                      description: `Failed to generate career path: ${err.message || 'Unknown error'}`,
                      variant: "destructive"
                    });
                  });
              }}
              disabled={isSearching || !jobTitle.trim()}
              className="min-w-[120px] bg-[#1333c2] hover:bg-[#0f2aae] text-white"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate</>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Quickly generate a career path based on a specific job title
          </p>
        </div>
      )}

      {/* Only show Path Selector in target mode with generated path */}
      {explorationMode === 'target' && generatedPath && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => {
              setActivePath(generatedPath);
              setSelectedNodeId(null);
            }}
            className="bg-[#1333c2] hover:bg-[#0f2aae] text-white shadow-sm hover:shadow-lg transition-all"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generatedPath.name || `${jobTitle} Path`}
          </Button>
        </div>
      )}

      {/* Career Path Visualization - Only shown after search in target mode */}
      {explorationMode === 'target' && generatedPath && (
        <div className="relative mt-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Career Path Progression</h2>
          {/* Mobile view - Stacked cards for small screens */}
          <div className="sm:hidden space-y-4 pb-10">
            {activePath.nodes.map((node, index) => (
              <motion.div 
                key={node.id}
                className={cn(
                  "cursor-pointer transition-all relative",
                  selectedNodeId === node.id ? "scale-[1.02]" : "hover:scale-[1.02]"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleNodeClick(node.id)}
              >
                <Card className={cn(
                  "shadow-md",
                  selectedNodeId === node.id ? "border-primary ring-1 ring-primary" : ""
                )}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="mt-1">
                        {node.icon}
                      </div>
                      <Badge className={LevelBadgeColors[node.level]}>
                        {node.level.charAt(0).toUpperCase() + node.level.slice(1)}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{node.title}</h3>
                    <div className="text-sm text-muted-foreground mb-2">{node.salaryRange}</div>
                    <div className="text-xs text-muted-foreground">Experience: {node.yearsExperience}</div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs mt-2", 
                      GrowthIndicators[node.growthPotential].color
                    )}>
                      {GrowthIndicators[node.growthPotential].icon}
                      {GrowthIndicators[node.growthPotential].text}
                    </div>
                  </CardContent>
                </Card>
                {index < activePath.nodes.length - 1 && (
                  <div className="flex justify-center my-2">
                    <div className="rotate-90 text-gray-400">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Tablet/Desktop view - Horizontal scrolling */}
          <div className="relative mx-4 sm:mx-14 hidden sm:block">
            <div className="absolute left-[-30px] sm:left-[-40px] top-1/2 -translate-y-1/2 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleScroll('left')}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
              </Button>
            </div>
            
            <div 
              ref={scrollContainerRef}
              className="pb-6 px-2 overflow-x-auto scrollbar-hide relative flex items-start gap-4"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* Background Line */}
              <div className="absolute top-20 left-0 right-10 h-1 bg-gray-200" />
              
              {/* Career Nodes */}
              {activePath.nodes.map((node, index) => (
                <div 
                  key={node.id}
                  className="flex flex-col items-center min-w-[230px] sm:min-w-[250px] first:pl-4"
                >
                  <motion.div 
                    className={cn(
                      "cursor-pointer transition-all relative mt-4",
                      selectedNodeId === node.id ? "scale-105" : "hover:scale-105"
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <Card className={cn(
                      "w-[230px] sm:w-60 shadow-md",
                      selectedNodeId === node.id ? "border-primary ring-1 ring-primary" : ""
                    )}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="mt-1">
                            {node.icon}
                          </div>
                          <Badge className={LevelBadgeColors[node.level]}>
                            {node.level.charAt(0).toUpperCase() + node.level.slice(1)}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-base sm:text-lg mb-1">{node.title}</h3>
                        <div className="text-sm text-muted-foreground mb-2">{node.salaryRange}</div>
                        <div className="text-xs text-muted-foreground">Experience: {node.yearsExperience}</div>
                        <div className={cn(
                          "flex items-center gap-1 text-xs mt-2", 
                          GrowthIndicators[node.growthPotential].color
                        )}>
                          {GrowthIndicators[node.growthPotential].icon}
                          {GrowthIndicators[node.growthPotential].text}
                        </div>
                      </CardContent>
                    </Card>
                    {index < activePath.nodes.length - 1 && (
                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
            
            <div className="absolute right-[-30px] sm:right-[-40px] top-1/2 -translate-y-1/2 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleScroll('right')}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {explorationMode === 'target' && !generatedPath && (
        <motion.div 
          className="text-center py-10 sm:py-16 px-4 sm:px-6 mt-6 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md shadow-gray-200 border border-gray-100 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm">
            <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-medium mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            You haven't generated any career paths yet
          </h3>
          <p className="text-neutral-500 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
            Enter a job title above and click "Generate" to explore a personalized career progression path.
          </p>
          <Button 
            onClick={() => {
              const searchInput = document.getElementById('job-title-search') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              }
            }}
            size="default" 
            className="bg-[#1333c2] hover:bg-[#0f2aae] text-white shadow-sm hover:shadow-lg transition-all"
          >
            <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Generate My First Path
          </Button>
        </motion.div>
      )}

      {/* Role Detail Dialog */}
      <Dialog open={drawerOpen && selectedNode !== null} onOpenChange={setDrawerOpen}>
        {selectedNode && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-4 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                {selectedNode.icon}
                <DialogTitle className="text-xl sm:text-2xl">{selectedNode.title}</DialogTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className={LevelBadgeColors[selectedNode.level]}>
                  {selectedNode.level.charAt(0).toUpperCase() + selectedNode.level.slice(1)} Level
                </Badge>
                <span className="text-muted-foreground hidden sm:inline">·</span>
                <span className="text-muted-foreground">{selectedNode.salaryRange}</span>
                <span className="text-muted-foreground hidden sm:inline">·</span>
                <span className="text-muted-foreground">{selectedNode.yearsExperience} experience</span>
              </div>
              <DialogDescription className="text-sm sm:text-base">
                Explore this role's requirements, growth potential, and recommended certifications
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-4 sm:px-6 pb-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="skills" className="text-xs sm:text-sm">Skills & Reqs</TabsTrigger>
                  <TabsTrigger value="certifications" className="text-xs sm:text-sm">Certifications</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Role Description</h3>
                    <p className="text-muted-foreground">{selectedNode.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Growth Outlook</h3>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md", 
                        GrowthIndicators[selectedNode.growthPotential].color,
                        "bg-opacity-10"
                      )}>
                        {GrowthIndicators[selectedNode.growthPotential].icon}
                        <span className="font-medium">{GrowthIndicators[selectedNode.growthPotential].text} Potential</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2">
                      {selectedNode.growthPotential === 'high' && "This role has excellent growth prospects with many advancement opportunities."}
                      {selectedNode.growthPotential === 'medium' && "This role offers good growth opportunities with moderate advancement potential."}
                      {selectedNode.growthPotential === 'low' && "This role has reached a senior level with specialized growth focused on expertise rather than title progression."}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Compensation Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>Salary range: {selectedNode.salaryRange}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Experience: {selectedNode.yearsExperience}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="skills" className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Skills</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedNode.skills.map(skill => (
                        <Badge key={skill.name} className={cn("py-1.5 px-3", SkillLevelColors[skill.level])}>
                          {skill.name} <span className="opacity-80">({skill.level})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Typical Requirements</h3>
                    <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                      <li>Education: {selectedNode.level === 'entry' ? 'Bachelor\'s degree or equivalent experience' : 'Bachelor\'s or Master\'s degree in relevant field'}</li>
                      <li>Experience: {selectedNode.yearsExperience}</li>
                      {selectedNode.level === 'executive' && <li>Leadership: 5+ years in senior leadership roles</li>}
                      {selectedNode.level === 'lead' && <li>Leadership: Experience managing teams or technical projects</li>}
                      <li>Communication: {selectedNode.level === 'entry' ? 'Basic' : selectedNode.level === 'mid' ? 'Intermediate' : 'Advanced'} communication skills</li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="certifications" className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">AI Recommended Certifications</h3>
                      {isLoadingCertifications && (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Loading recommendations...</span>
                        </div>
                      )}
                    </div>
                    
                    {isLoadingCertifications ? (
                      <div className="py-8 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-muted-foreground text-sm">
                          Generating personalized AI certification recommendations...
                        </p>
                      </div>
                    ) : roleCertifications[selectedNode.id] && roleCertifications[selectedNode.id].length > 0 ? (
                      <div className="space-y-4">
                        {roleCertifications[selectedNode.id].map((cert, index) => (
                          <div key={`${cert.name}-${index}`} className="border rounded-lg p-4 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{cert.name}</h4>
                                <p className="text-sm text-muted-foreground">Provider: {cert.provider}</p>
                              </div>
                              <Badge className={
                                cert.relevance === 'highly relevant' ? 'bg-green-100 text-green-800' :
                                cert.relevance === 'relevant' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }>
                                {cert.relevance}
                              </Badge>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {cert.difficulty} level
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {cert.estimatedTimeToComplete}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed rounded-lg">
                        <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">
                          No AI certification recommendations available for this role yet.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={() => fetchCertificationRecommendations(selectedNode.id)}
                        >
                          Generate Recommendations
                        </Button>
                      </div>
                    )}
                    
                    <div className="mt-6 pt-3 border-t text-xs text-muted-foreground">
                      <p>Certification recommendations are AI-generated based on current industry trends and role requirements. Always verify the relevance and accreditation status before enrolling.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <DialogFooter className="px-4 sm:px-6 pt-0 flex flex-col sm:flex-row items-center justify-between gap-2 pb-10">
              <Button 
                className="bg-[#1333c2] hover:bg-[#0f2aae] text-white px-4 w-full sm:w-auto"
                size="sm"
                disabled={isCreatingGoal}
                onClick={async () => {
                  // Check if we have existing goals to avoid duplicates
                  try {
                    // Show loading state
                    setIsCreatingGoal(true);
                    
                    // Get existing goals
                    const goalsResponse = await apiRequest('GET', '/api/goals');
                    const existingGoals = await goalsResponse.json();
                    
                    // Check if this goal already exists (by title)
                    const goalTitle = `Become a ${selectedNode.title}`;
                    const isDuplicate = existingGoals.some(
                      (goal: any) => goal.title.toLowerCase() === goalTitle.toLowerCase()
                    );
                    
                    if (isDuplicate) {
                      toast({
                        title: "Goal Already Exists",
                        description: "You already have this career goal in your tracker.",
                        variant: "default"
                      });
                      setIsCreatingGoal(false);
                      return;
                    }
                    
                    // Create the goal
                    const goalData = {
                      title: goalTitle,
                      description: `Career goal to become a ${selectedNode.title} in the ${activePath.name} industry. Salary range: ${selectedNode.salaryRange}.`,
                      status: "not_started",
                      checklist: [
                        {
                          id: crypto.randomUUID(),
                          text: `Research required skills for ${selectedNode.title} role`,
                          completed: false
                        },
                        {
                          id: crypto.randomUUID(),
                          text: `Identify training or certification needs`,
                          completed: false
                        },
                        {
                          id: crypto.randomUUID(),
                          text: `Update resume to target this role`,
                          completed: false
                        },
                        {
                          id: crypto.randomUUID(),
                          text: `Network with professionals in this field`,
                          completed: false
                        }
                      ]
                    };
                    
                    // Save the goal
                    const response = await apiRequest('POST', '/api/goals', goalData);
                    
                    if (response.ok) {
                      // Close the dialog
                      setDrawerOpen(false);
                      
                      toast({
                        title: "Career Goal Created",
                        description: `"${goalTitle}" has been added to your career goals tracker. You can view it in the Career Goals section.`,
                        action: (
                          <Button variant="outline" size="sm" onClick={() => navigate('/goals')}>
                            View Goal
                          </Button>
                        ),
                      });
                    } else {
                      throw new Error("Failed to create goal");
                    }
                  } catch (error) {
                    console.error("Error creating career goal:", error);
                    toast({
                      title: "Error Creating Goal",
                      description: "There was a problem creating your career goal. Please try again.",
                      variant: "destructive"
                    });
                  } finally {
                    setIsCreatingGoal(false);
                  }
                }}
              >
                {isCreatingGoal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Goal...
                  </>
                ) : (
                  <>Set as Career Goal</>
                )}
              </Button>

              <DialogClose asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}