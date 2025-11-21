"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Briefcase,
  GraduationCap,
  Code,
  Users,
  TrendingUp,
} from "lucide-react";

export const goalTemplates = [
  {
    id: "career-change",
    title: "Career Change",
    description: "Transition to a new career field",
    icon: <Briefcase className="h-5 w-5" />,
    category: "Career",
    prefill: {
      title: "Transition to [New Field]",
      description:
        "Successfully transition from my current role to a new career in [target field]",
      milestones: [
        "Research target industry and roles",
        "Identify skill gaps and create learning plan",
        "Update resume and LinkedIn profile",
        "Network with professionals in target field",
        "Apply to relevant positions",
        "Complete transition successfully",
      ],
    },
  },
  {
    id: "skill-development",
    title: "Skill Development",
    description: "Learn new technical or professional skills",
    icon: <Code className="h-5 w-5" />,
    category: "Learning",
    prefill: {
      title: "Master [Skill Name]",
      description:
        "Develop proficiency in [specific skill] to advance my career",
      milestones: [
        "Complete foundational course or tutorial",
        "Build first practice project",
        "Join community or study group",
        "Complete intermediate-level project",
        "Obtain certification (if applicable)",
        "Apply skill in professional context",
      ],
    },
  },
  {
    id: "promotion",
    title: "Get Promoted",
    description: "Advance to the next level in your current role",
    icon: <TrendingUp className="h-5 w-5" />,
    category: "Career",
    prefill: {
      title: "Get Promoted to [Target Position]",
      description: "Earn promotion to [target role] within [timeframe]",
      milestones: [
        "Meet with manager to discuss promotion path",
        "Identify required skills and experience",
        "Take on additional responsibilities",
        "Complete relevant training or certifications",
        "Document achievements and impact",
        "Formally apply or interview for promotion",
      ],
    },
  },
  {
    id: "networking",
    title: "Build Network",
    description: "Expand your professional network",
    icon: <Users className="h-5 w-5" />,
    category: "Networking",
    prefill: {
      title: "Build Professional Network",
      description:
        "Expand my network to [target number] meaningful professional connections",
      milestones: [
        "Optimize LinkedIn profile",
        "Attend industry events or meetups",
        "Join professional associations",
        "Reach out to alumni network",
        "Schedule informational interviews",
        "Maintain regular contact with network",
      ],
    },
  },
  {
    id: "education",
    title: "Further Education",
    description: "Pursue additional education or certifications",
    icon: <GraduationCap className="h-5 w-5" />,
    category: "Education",
    prefill: {
      title: "Complete [Degree/Certification]",
      description:
        "Successfully complete [specific program] to advance my career",
      milestones: [
        "Research and select program",
        "Complete application process",
        "Secure funding or employer support",
        "Begin coursework",
        "Maintain good academic standing",
        "Complete program and earn credential",
      ],
    },
  },
  {
    id: "leadership",
    title: "Leadership Development",
    description: "Develop leadership and management skills",
    icon: <Target className="h-5 w-5" />,
    category: "Leadership",
    prefill: {
      title: "Develop Leadership Skills",
      description:
        "Build leadership capabilities to prepare for management roles",
      milestones: [
        "Complete leadership assessment",
        "Enroll in leadership development program",
        "Seek mentorship from senior leader",
        "Lead a project or initiative",
        "Practice public speaking and presentation",
        "Apply for leadership role or promotion",
      ],
    },
  },
];

interface GoalTemplatesProps {
  onSelectTemplate: (templateId: string) => void;
}

export default function GoalTemplates({
  onSelectTemplate,
}: GoalTemplatesProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Goal Templates</h3>
          <p className="text-sm text-muted-foreground">
            Get started quickly with pre-built goal templates
          </p>
        </div>

        <div
          className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {goalTemplates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow cursor-pointer flex-shrink-0 w-64"
            >
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-[#0C29AB] rounded-lg flex-shrink-0">
                    <div className="text-white">{template.icon}</div>
                  </div>
                  <h4 className="font-medium text-sm">{template.title}</h4>
                </div>

                <p className="text-xs text-muted-foreground mb-3 flex-grow">
                  {template.description}
                </p>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs mt-auto"
                  onClick={() => onSelectTemplate(template.id)}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
