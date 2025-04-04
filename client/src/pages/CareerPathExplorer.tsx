import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Database 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

export default function CareerPathExplorer() {
  const [activePath, setActivePath] = useState<CareerPath>(careerPaths[0]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

      {/* Path Selector */}
      <div className="flex gap-2 mb-6">
        {careerPaths.map(path => (
          <Button
            key={path.id}
            variant={activePath.id === path.id ? "default" : "outline"}
            onClick={() => {
              setActivePath(path);
              setSelectedNodeId(null);
            }}
          >
            {path.name}
          </Button>
        ))}
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
                onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
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

      {/* Detailed Node View */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    {selectedNode.icon}
                    <h2 className="text-2xl font-bold">{selectedNode.title}</h2>
                  </div>
                  <div className="text-muted-foreground mt-1">{selectedNode.salaryRange} · {selectedNode.yearsExperience} experience</div>
                </div>
                <Badge className={LevelBadgeColors[selectedNode.level]}>
                  {selectedNode.level.charAt(0).toUpperCase() + selectedNode.level.slice(1)} Level
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Role Description</h3>
                  <p className="text-muted-foreground">{selectedNode.description}</p>
                  
                  <div className="mt-4">
                    <div className={cn(
                      "flex items-center gap-1 text-sm", 
                      GrowthIndicators[selectedNode.growthPotential].color
                    )}>
                      {GrowthIndicators[selectedNode.growthPotential].icon}
                      <span className="font-medium">{GrowthIndicators[selectedNode.growthPotential].text} Potential</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Key Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.skills.map(skill => (
                      <Badge key={skill.name} className={cn("py-1", SkillLevelColors[skill.level])}>
                        {skill.name} ({skill.level})
                      </Badge>
                    ))}
                  </div>
                  
                  {/* CTA */}
                  <div className="mt-6 space-y-2">
                    <Button className="w-full">Set as Career Goal</Button>
                    <Button variant="outline" className="w-full">Explore Similar Roles</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}