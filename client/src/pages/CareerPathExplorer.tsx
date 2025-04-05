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
  BookOpen,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types for career path data
interface CareerSkill {
  name: string;
  level: 'basic' | 'intermediate' | 'advanced';
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

export default function CareerPathExplorer() {
  const { toast } = useToast();
  const [activePath, setActivePath] = useState<CareerPath>(careerPaths[0]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [roleInsights, setRoleInsights] = useState<RoleInsight | null>(null);
  const [showInsightsDrawer, setShowInsightsDrawer] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Job title search
  const [jobTitle, setJobTitle] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [generatedPath, setGeneratedPath] = useState<any>(null);

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
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Career Path Explorer</h1>
          <p className="text-muted-foreground mt-1">
            Visualize potential career progressions and explore different roles.
          </p>
        </div>
      </div>
      
      {/* Job Title Search */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <Label htmlFor="job-title-search">Quick Career Path Generator</Label>
                <Input
                  id="job-title-search"
                  placeholder="Enter a job title (e.g., Software Engineer, Data Scientist)"
                  value={jobTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobTitle(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Quickly generate a career path based on a specific job title
                </p>
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
                            nodes: mainPath.nodes.map(node => {
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
                className="min-w-[120px]"
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
          </CardContent>
        </Card>
      </div>

      {/* Path Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        
        {/* Show generated path if exists */}
        {generatedPath && (
          <Button
            variant={activePath.id === generatedPath.id ? "default" : "outline"}
            onClick={() => {
              setActivePath(generatedPath);
              setSelectedNodeId(null);
            }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white hover:text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generatedPath.name || `${jobTitle} Path`}
          </Button>
        )}
      </div>

      {/* Career Path Visualization */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleScroll('left')}
            className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="pb-6 overflow-x-auto scrollbar-hide relative flex items-start gap-4"
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
              className="flex flex-col items-center min-w-[250px] first:pl-4"
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
                  "w-60 shadow-md",
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
                  <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
        
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleScroll('right')}
            className="h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-100"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Role Detail Drawer */}
      <Drawer open={drawerOpen && selectedNode !== null} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          {selectedNode && (
            <>
              <DrawerHeader className="px-6">
                <div className="flex items-center gap-3 mb-1">
                  {selectedNode.icon}
                  <DrawerTitle className="text-2xl">{selectedNode.title}</DrawerTitle>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={LevelBadgeColors[selectedNode.level]}>
                    {selectedNode.level.charAt(0).toUpperCase() + selectedNode.level.slice(1)} Level
                  </Badge>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{selectedNode.salaryRange}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{selectedNode.yearsExperience} experience</span>
                </div>
                <DrawerDescription>
                  Explore this role's requirements, growth potential, and recommended certifications
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="px-6 pb-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="skills">Skills & Requirements</TabsTrigger>
                    <TabsTrigger value="certifications">Certifications</TabsTrigger>
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
                      <h3 className="text-lg font-semibold mb-2">Recommended Certifications</h3>
                      {roleCertifications[selectedNode.id] ? (
                        <div className="space-y-4">
                          {roleCertifications[selectedNode.id].map(cert => (
                            <div key={cert.name} className="border rounded-lg p-4">
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
                        <p className="text-muted-foreground">
                          No specific certifications are recommended for this role.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DrawerFooter className="px-6 pt-0">
                <Button className="w-full">
                  Set as Career Goal
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Show loading state
                    setIsGeneratingInsights(true);
                    
                    // Fetch work history first
                    apiRequest('GET', '/api/work-history')
                      .then(res => res.json())
                      .then(workHistory => {
                        // Call the API endpoint to generate role insights based on work history
                        return apiRequest('POST', '/api/generate-role-details', {
                          currentRole: selectedNode.title,
                          yearsExperience: selectedNode.yearsExperience,
                          industry: activePath.name,
                          workHistory
                        });
                      })
                      .then(res => res.json())
                      .then(insights => {
                        // Handle insights data
                        setRoleInsights(insights);
                        setShowInsightsDrawer(true);
                        setIsGeneratingInsights(false);
                        toast({
                          title: "AI Insights Generated",
                          description: "Career path insights have been generated based on your work history.",
                        });
                      })
                      .catch(err => {
                        console.error('Error generating role insights:', err);
                        setIsGeneratingInsights(false);
                        toast({
                          title: "Error Generating Insights",
                          description: "Unable to generate insights. Please try again later.",
                          variant: "destructive"
                        });
                      });
                  }}
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Generate AI Suggestions Based on My Work History
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
      
      {/* AI Insights Drawer */}
      <Drawer open={showInsightsDrawer} onOpenChange={setShowInsightsDrawer}>
        <DrawerContent className="max-h-[90vh]">
          {isGeneratingInsights ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Generating personalized career insights...</p>
              <p className="text-muted-foreground">This may take a moment as we analyze your work history</p>
            </div>
          ) : roleInsights ? (
            <>
              <DrawerHeader className="px-6">
                <DrawerTitle className="text-2xl">AI Career Insights</DrawerTitle>
                <DrawerDescription>
                  Personalized career recommendations based on your work history and selected role
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="px-6 pb-6 space-y-6">
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{roleInsights.insights}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Suggested Career Paths</h3>
                  <div className="space-y-4">
                    {roleInsights.suggestedRoles.map((role, index) => (
                      <div key={`role-${index}`} className="rounded-lg border bg-card p-4">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{role.title}</h4>
                          <Badge className={
                            role.growthPotential === 'high' ? 'bg-green-100 text-green-800' :
                            role.growthPotential === 'medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }>
                            {role.growthPotential} growth
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{role.description}</p>
                        <div className="mt-2">
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                            <span className="text-muted-foreground">{role.salaryRange}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                            <span className="text-muted-foreground">Est. time: {role.timeToAchieve}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {role.keySkills.slice(0, 3).map((skill, i) => (
                            <Badge key={`skill-${index}-${i}`} variant="outline" className="bg-slate-50">
                              {skill}
                            </Badge>
                          ))}
                          {role.keySkills.length > 3 && (
                            <Badge variant="outline" className="bg-slate-50">
                              +{role.keySkills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Your Transferable Skills</h3>
                  <div className="space-y-2">
                    {roleInsights.transferableSkills.map((skill, index) => (
                      <div key={`skill-${index}`} className="rounded-lg border bg-card p-3 flex justify-between items-center">
                        <div>
                          <span className="font-medium">{skill.skill}</span>
                          <p className="text-sm text-muted-foreground">{skill.relevance}</p>
                        </div>
                        <Badge className={
                          skill.currentProficiency === 'advanced' ? 'bg-green-100 text-green-800' :
                          skill.currentProficiency === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }>
                          {skill.currentProficiency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Development Plan</h3>
                  <div className="rounded-lg border bg-card">
                    {roleInsights.developmentPlan.map((step, index) => (
                      <div key={`step-${index}`} className={`p-4 ${index !== roleInsights.developmentPlan.length - 1 ? 'border-b' : ''}`}>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">{step.step}</h4>
                          <Badge variant="outline" className="ml-auto">{step.timeframe}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm ml-8">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recommended Certifications</h3>
                  <div className="space-y-3">
                    {roleInsights.recommendedCertifications.map((cert, index) => (
                      <div key={`cert-${index}`} className="rounded-lg border bg-card p-4">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{cert.name}</h4>
                          <Badge className={
                            cert.difficulty === 'advanced' ? 'bg-purple-100 text-purple-800' :
                            cert.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {cert.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Provider: {cert.provider}</p>
                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-muted-foreground">Est. time: {cert.timeToComplete}</span>
                          <span className="text-muted-foreground">{cert.relevance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <DrawerFooter className="px-6 pt-0">
                <Button className="w-full">
                  Create Goal Based on These Insights
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-lg font-medium">No insights available</p>
              <p className="text-muted-foreground">Try generating insights for this role</p>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}