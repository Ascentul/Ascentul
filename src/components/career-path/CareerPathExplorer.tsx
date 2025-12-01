import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Braces,
  BriefcaseBusiness,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  DollarSign,
  GraduationCap,
  Layers,
  Lightbulb,
  LineChart,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import React, { useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  icon: string;
}

interface CareerPath {
  id: string;
  name: string;
  nodes: CareerNode[];
}

const iconMap: Record<string, React.ReactNode> = {
  braces: <Braces className="h-6 w-6 text-primary" />,
  cpu: <Cpu className="h-6 w-6 text-primary" />,
  database: <Database className="h-6 w-6 text-primary" />,
  briefcase: <BriefcaseBusiness className="h-6 w-6 text-primary" />,
  user: <User className="h-6 w-6 text-primary" />,
  award: <Award className="h-6 w-6 text-primary" />,
  lineChart: <LineChart className="h-6 w-6 text-primary" />,
  layers: <Layers className="h-6 w-6 text-primary" />,
  graduation: <GraduationCap className="h-6 w-6 text-primary" />,
  lightbulb: <Lightbulb className="h-6 w-6 text-primary" />,
  book: <BookOpen className="h-6 w-6 text-primary" />,
};

const LevelBadgeColors: Record<string, string> = {
  entry: 'bg-blue-100 text-blue-800',
  mid: 'bg-green-100 text-green-800',
  senior: 'bg-purple-100 text-purple-800',
  lead: 'bg-yellow-100 text-yellow-800',
  executive: 'bg-red-100 text-red-800',
};

const GrowthIndicators: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
  low: {
    icon: <TrendingUp className="h-4 w-4" />,
    text: 'Low Growth',
    color: 'text-amber-500',
  },
  medium: {
    icon: <TrendingUp className="h-4 w-4" />,
    text: 'Medium Growth',
    color: 'text-blue-500',
  },
  high: {
    icon: <Sparkles className="h-4 w-4" />,
    text: 'High Growth',
    color: 'text-green-500',
  },
};

interface CareerPathExplorerProps {
  pathData: any;
}

export const CareerPathExplorer = ({ pathData }: CareerPathExplorerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  const formatCareerPaths = (data: any): CareerPath[] => {
    if (data.paths && Array.isArray(data.paths)) {
      return data.paths.map((path: any) => {
        const formattedNodes = path.nodes.map((node: any) => ({
          ...node,
          icon: node.icon || 'briefcase',
        }));

        return {
          ...path,
          nodes: formattedNodes,
        };
      });
    }

    // Handle single path data
    if (data.nodes && Array.isArray(data.nodes)) {
      return [
        {
          id: data.id || 'path-1',
          name: data.name || 'Career Path',
          nodes: data.nodes.map((node: any) => ({
            ...node,
            icon: node.icon || 'briefcase',
          })),
        },
      ];
    }

    const defaultPath: CareerPath = {
      id: 'recommended-path',
      name: 'Recommended Career Path',
      nodes: [],
    };

    if (data.suggestedRoles && Array.isArray(data.suggestedRoles)) {
      defaultPath.nodes = data.suggestedRoles.map((role: any, index: number) => {
        let level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
        if (index === 0) level = 'entry';
        else if (index === data.suggestedRoles.length - 1) level = 'executive';
        else if (index < data.suggestedRoles.length / 3) level = 'mid';
        else if (index < (data.suggestedRoles.length * 2) / 3) level = 'senior';
        else level = 'lead';

        return {
          id: `role-${index}`,
          title: role.title,
          level,
          salaryRange: role.salaryRange || 'Not specified',
          yearsExperience: role.timeToAchieve || 'Not specified',
          skills:
            role.keySkills?.map((skill: string) => ({
              name: skill,
              level: 'intermediate' as const,
            })) || [],
          growthPotential: role.growthPotential || 'medium',
          description: role.description || '',
          icon: role.icon || 'briefcase',
        };
      });
    }

    return [defaultPath];
  };

  const careerPaths = formatCareerPaths(pathData);
  const activePath = careerPaths[0];

  if (!activePath || !activePath.nodes || activePath.nodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No career path data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="absolute top-20 left-0 right-10 h-1 bg-gray-200" />

          {activePath.nodes.map((node, index) => (
            <div key={node.id} className="flex flex-col items-center min-w-[250px] first:pl-4">
              <motion.div
                className="transition-all relative mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="w-60 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="mt-1">
                        {iconMap[node.icon] || (
                          <BriefcaseBusiness className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <Badge className={LevelBadgeColors[node.level]}>
                        {node.level.charAt(0).toUpperCase() + node.level.slice(1)}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{node.title}</h3>
                    <div className="text-sm text-muted-foreground mb-2">{node.salaryRange}</div>
                    <div className="text-xs text-muted-foreground">
                      Experience: {node.yearsExperience}
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs mt-2',
                        GrowthIndicators[node.growthPotential].color,
                      )}
                    >
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

      {pathData.transferableSkills && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Your Transferable Skills</h3>
          <div className="flex flex-wrap gap-2">
            {pathData.transferableSkills.map((skill: any, index: number) => (
              <Badge
                key={`skill-${index}`}
                className={cn(
                  'px-3 py-1',
                  skill.currentProficiency === 'advanced'
                    ? 'bg-green-100 text-green-800'
                    : skill.currentProficiency === 'intermediate'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800',
                )}
              >
                {skill.skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {pathData.developmentPlan && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Development Plan</h3>
          <div className="space-y-2">
            {pathData.developmentPlan.map((step: any, index: number) => (
              <div key={`step-${index}`} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-white flex-shrink-0 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <span className="font-medium">{step.step}</span>
                  <span className="text-sm text-muted-foreground ml-2">({step.timeframe})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
