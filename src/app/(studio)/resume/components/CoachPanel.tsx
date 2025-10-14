'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  Target,
  TrendingUp,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface CoachTip {
  id: string;
  category: 'content' | 'formatting' | 'strategy' | 'ats';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const COACH_TIPS: CoachTip[] = [
  {
    id: 'quantify-achievements',
    category: 'content',
    title: 'Quantify Your Achievements',
    description: 'Use numbers, percentages, and metrics to show impact. Instead of "Improved sales," write "Increased sales by 35% in Q2 2024."',
    priority: 'high',
  },
  {
    id: 'action-verbs',
    category: 'content',
    title: 'Start with Strong Action Verbs',
    description: 'Begin bullet points with powerful verbs like "Led," "Developed," "Architected," or "Optimized" instead of weak verbs like "Helped" or "Responsible for."',
    priority: 'high',
  },
  {
    id: 'tailor-keywords',
    category: 'strategy',
    title: 'Tailor Keywords to the Job',
    description: 'Match your resume to the job description by incorporating relevant keywords and skills that align with the role.',
    priority: 'high',
  },
  {
    id: 'ats-formatting',
    category: 'ats',
    title: 'Keep Formatting Simple',
    description: 'Avoid tables, text boxes, and complex formatting that ATS systems may struggle to parse. Use standard section headings.',
    priority: 'medium',
  },
  {
    id: 'consistent-tense',
    category: 'content',
    title: 'Use Consistent Tense',
    description: 'Use present tense for current roles (e.g., "Manage") and past tense for previous positions (e.g., "Managed").',
    priority: 'medium',
  },
  {
    id: 'one-page',
    category: 'formatting',
    title: 'Aim for One Page',
    description: 'Unless you have 10+ years of experience, keep your resume to one page. Be concise and focus on your most relevant achievements.',
    priority: 'medium',
  },
  {
    id: 'skill-evidence',
    category: 'content',
    title: 'Show, Don\'t Just List Skills',
    description: 'Instead of only listing skills, demonstrate them in your experience bullets. Show how you used those skills to achieve results.',
    priority: 'low',
  },
  {
    id: 'relevant-experience',
    category: 'strategy',
    title: 'Prioritize Relevant Experience',
    description: 'List your most relevant experience first. You can minimize or remove unrelated roles that don\'t support your target position.',
    priority: 'low',
  },
];

const DISMISSED_TIPS_STORAGE_KEY = 'dismissedCoachTips';

interface CoachPanelProps {
  className?: string;
}

export function CoachPanel({ className }: CoachPanelProps) {
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DISMISSED_TIPS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? new Set(parsed) : new Set();
        }
      } catch {
        // Ignore corrupted data and start fresh
      }
    }
    return new Set();
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['content', 'strategy']));
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(DISMISSED_TIPS_STORAGE_KEY, JSON.stringify(Array.from(dismissedTips)));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [dismissedTips]);

  const visibleTips = COACH_TIPS.filter(tip => !dismissedTips.has(tip.id));

  const tipsByCategory = useMemo(() => {
    return visibleTips.reduce((acc, tip) => {
      if (!acc[tip.category]) acc[tip.category] = [];
      acc[tip.category].push(tip);
      return acc;
    }, {} as Record<string, CoachTip[]>);
  }, [visibleTips]);

  const handleDismiss = (tipId: string) => {
    setDismissedTips(prev => new Set([...prev, tipId]));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content': return <Lightbulb className="h-4 w-4" />;
      case 'strategy': return <Target className="h-4 w-4" />;
      case 'formatting': return <CheckCircle2 className="h-4 w-4" />;
      case 'ats': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'content': return 'Content Tips';
      case 'strategy': return 'Strategy Tips';
      case 'formatting': return 'Formatting Tips';
      case 'ats': return 'ATS Optimization';
      default: return category;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (visibleTips.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Resume Coach
          </CardTitle>
          <CardDescription>
            All tips completed! Great work on your resume.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Resume Coach
        </CardTitle>
        <CardDescription>
          Best practices and tips to improve your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(tipsByCategory).map(([category, tips]) => (
          <div key={category} className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1 h-auto font-medium text-sm"
              onClick={() => toggleCategory(category)}
              aria-expanded={expandedCategories.has(category)}
            >
              {expandedCategories.has(category) ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              {getCategoryIcon(category)}
              <span className="ml-2">{getCategoryLabel(category)}</span>
              <Badge variant="secondary" className="ml-auto">
                {tips.length}
              </Badge>
            </Button>

            {expandedCategories.has(category) && (
              <div className="space-y-2 pl-2">
                {tips.map((tip) => (
                  <div
                    key={tip.id}
                    className="flex items-start gap-2 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{tip.title}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(tip.priority)}`}
                        >
                          {tip.priority.charAt(0).toUpperCase() + tip.priority.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {tip.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => handleDismiss(tip.id)}
                      aria-label={`Dismiss ${tip.title} tip`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
