import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface LinkedInProfileData {
  url?: string;
  profileText?: string;
  targetJobTitle: string;
}

interface OptimizationResult {
  overallScore: number;
  sections: {
    headline: {
      score: number;
      feedback: string;
      suggestion: string;
    };
    about: {
      score: number;
      feedback: string;
      suggestion: string;
    };
    experience: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
    skills: {
      score: number;
      feedback: string;
      missingSkills: string[];
      suggestedSkills: string[];
    };
    featured: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
    banner: {
      score: number;
      feedback: string;
      suggestion: string;
    };
  };
  recruiterPerspective: string;
  actionPlan: {
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  };
}

const COMMON_JOB_TITLES = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
  "Digital Marketing Manager",
  "Project Manager",
  "Business Analyst",
  "Sales Representative",
  "Account Manager",
  "Operations Manager",
  "Financial Analyst",
  "Human Resources Specialist",
  "Content Writer",
  "Graphic Designer",
  "Customer Success Manager",
];

function SectionCard({ 
  title, 
  score, 
  feedback, 
  suggestions,
  children 
}: { 
  title: string; 
  score: number; 
  feedback: string; 
  suggestions?: string[] | string;
  children?: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score < 40) return "text-red-500";
    if (score < 70) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <Card className="p-4 mb-4 shadow-sm bg-card">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1">
          <h3 className="text-lg font-medium flex items-center gap-2">
            {title}
            <span className={`ml-2 font-bold ${getScoreColor(score)}`}>
              {score}/100
            </span>
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3"
        >
          <div className="mb-2">
            <div className="h-2 w-full bg-gray-200 rounded-full">
              <div 
                className={`h-2 rounded-full ${
                  score < 40 ? "bg-red-500" : score < 70 ? "bg-amber-500" : "bg-green-500"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{feedback}</p>
          
          {suggestions && Array.isArray(suggestions) && suggestions.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">Suggestions:</h4>
              <ul className="list-disc list-inside text-sm pl-2 space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {suggestions && !Array.isArray(suggestions) && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">Suggestion:</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 pl-2">{suggestions}</p>
            </div>
          )}
          
          {children && <div className="mt-3">{children}</div>}
        </motion.div>
      )}
    </Card>
  );
}

function LinkedInOptimizer() {
  const { toast } = useToast();
  const [profileUrl, setProfileUrl] = useState("");
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [customJob, setCustomJob] = useState("");
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"results" | "action-plan">("results");
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: LinkedInProfileData) => {
      const response = await apiRequest("POST", "/api/linkedin-optimizer/analyze", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to analyze LinkedIn profile");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Analysis Complete",
        description: "Your LinkedIn profile has been analyzed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalJobTitle = targetJobTitle === "other" ? customJob : targetJobTitle;
    
    if (!finalJobTitle) {
      toast({
        title: "Missing Information",
        description: "Please specify a target job title.",
        variant: "destructive",
      });
      return;
    }
    
    if (!profileUrl) {
      toast({
        title: "Missing Information",
        description: "Please enter your LinkedIn profile URL.",
        variant: "destructive",
      });
      return;
    }
    
    const data: LinkedInProfileData = {
      targetJobTitle: finalJobTitle,
      url: profileUrl
    };
    
    mutate(data);
  };
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          LinkedIn Profile Optimizer
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Analyze your LinkedIn profile and get personalized recommendations to optimize it for your target job role.
        </p>
        
        {!results && (
          <Card className="p-6 shadow-md">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                <label htmlFor="profile-url" className="block text-sm font-medium mb-1">
                  LinkedIn Profile URL
                </label>
                <Input
                  id="profile-url"
                  placeholder="https://www.linkedin.com/in/yourprofile"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                />
              </div>
                
                <div>
                  <label htmlFor="target-job" className="block text-sm font-medium mb-1">
                    Target Job Title
                  </label>
                  <Select
                    value={targetJobTitle}
                    onValueChange={setTargetJobTitle}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job title" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_JOB_TITLES.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other (specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {targetJobTitle === "other" && (
                    <Input
                      className="mt-2"
                      placeholder="Enter job title"
                      value={customJob}
                      onChange={(e) => setCustomJob(e.target.value)}
                    />
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Profile...
                    </>
                  ) : (
                    "Analyze My Profile"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
        
        {results && (
          <div className="mt-8">
            <div className="bg-card rounded-lg p-6 shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Your LinkedIn Profile Score</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setResults(null)}
                >
                  Start New Analysis
                </Button>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Overall Score</span>
                  <span className="font-bold">{results.overallScore}/100</span>
                </div>
                <Progress value={results.overallScore} className="h-2" />
              </div>
              
              <div className="flex border-b mb-4">
                <Button
                  variant="ghost"
                  className={`px-4 py-2 -mb-px ${
                    activeTab === "results"
                      ? "border-b-2 border-primary"
                      : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("results")}
                >
                  Detailed Results
                </Button>
                <Button
                  variant="ghost"
                  className={`px-4 py-2 -mb-px ${
                    activeTab === "action-plan"
                      ? "border-b-2 border-primary"
                      : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("action-plan")}
                >
                  Action Plan
                </Button>
              </div>
              
              {activeTab === "results" && (
                <div className="space-y-4">
                  <SectionCard 
                    title="Headline" 
                    score={results.sections.headline.score * 10} // Convert 0-10 to 0-100
                    feedback={results.sections.headline.feedback}
                    suggestions={results.sections.headline.suggestion}
                  />
                  
                  <SectionCard 
                    title="About Section" 
                    score={results.sections.about.score * 10} // Convert 0-10 to 0-100
                    feedback={results.sections.about.feedback}
                    suggestions={results.sections.about.suggestion}
                  />
                  
                  <SectionCard 
                    title="Experience" 
                    score={results.sections.experience.score * 10} // Convert 0-10 to 0-100
                    feedback={results.sections.experience.feedback}
                    suggestions={results.sections.experience.suggestions}
                  />
                  
                  <SectionCard 
                    title="Skills" 
                    score={results.sections.skills.score * 10} // Convert 0-10 to 0-100
                    feedback={results.sections.skills.feedback}
                  >
                    {results.sections.skills.missingSkills.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">Missing Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.sections.skills.missingSkills.map((skill, index) => (
                            <span 
                              key={index}
                              className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {results.sections.skills.suggestedSkills.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">Suggested Skills to Add:</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.sections.skills.suggestedSkills.map((skill, index) => (
                            <span 
                              key={index}
                              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </SectionCard>
                  
                  <SectionCard 
                    title="Featured Section" 
                    score={results.sections.featured.score * 10} // Convert 0-10 to 0-100
                    feedback={results.sections.featured.feedback}
                    suggestions={results.sections.featured.suggestions}
                  />
                  
                  <SectionCard 
                    title="Banner Image" 
                    score={results.sections.banner.score * 10} // Convert 0-10 to 0-100
                    feedback={results.sections.banner.feedback}
                    suggestions={results.sections.banner.suggestion}
                  />
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mt-6">
                    <h3 className="text-lg font-medium mb-2">Recruiter Perspective</h3>
                    <p className="text-gray-700 dark:text-gray-300 italic">
                      "{results.recruiterPerspective}"
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === "action-plan" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-medium mb-2 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                      High Priority Actions
                    </h3>
                    <ul className="space-y-2">
                      {results.actionPlan.highPriority.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="mt-1">
                            {getPriorityIcon("high")}
                          </div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-medium mb-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                      Medium Priority Actions
                    </h3>
                    <ul className="space-y-2">
                      {results.actionPlan.mediumPriority.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="mt-1">
                            {getPriorityIcon("medium")}
                          </div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-medium mb-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      Low Priority Actions
                    </h3>
                    <ul className="space-y-2">
                      {results.actionPlan.lowPriority.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="mt-1">
                            {getPriorityIcon("low")}
                          </div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LinkedInOptimizer;