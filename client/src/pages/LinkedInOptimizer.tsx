import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Info, 
  Link as LinkIcon, 
  Target, 
  BrainCircuit,
  BarChart3,
  ListChecks,
  Goal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    if (score < 40) return "text-red-500 dark:text-red-400";
    if (score < 70) return "text-amber-500 dark:text-amber-400";
    return "text-green-500 dark:text-green-400";
  };
  
  const getScoreGradient = (score: number) => {
    if (score < 40) return "bg-gradient-to-r from-red-500 to-red-600";
    if (score < 70) return "bg-gradient-to-r from-amber-500 to-amber-600";
    return "bg-gradient-to-r from-green-500 to-green-600";
  };
  
  const getScoreIcon = (score: number) => {
    if (score < 40) return <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />;
    if (score < 70) return <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
    return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
  };

  return (
    <Card className="p-5 mb-5 shadow-md bg-card border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
      <div 
        className="flex justify-between items-center cursor-pointer rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors p-1" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 flex items-center gap-2.5">
          <div className="flex-shrink-0">
            {getScoreIcon(score)}
          </div>
          <h3 className="text-lg font-medium">
            {title}
          </h3>
          <div className={`ml-auto font-bold text-lg ${getScoreColor(score)}`}>
            {score}/100
          </div>
        </div>
        <div className="ml-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 overflow-hidden"
          >
            <div className="mb-4">
              <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-2.5 rounded-full ${getScoreGradient(score)}`}
                />
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-3 border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">{feedback}</p>
            </div>
            
            {suggestions && Array.isArray(suggestions) && suggestions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <ListChecks className="h-4 w-4 text-primary" /> 
                  Suggestions:
                </h4>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {suggestions && !Array.isArray(suggestions) && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <ListChecks className="h-4 w-4 text-primary" /> 
                  Suggestion:
                </h4>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{suggestions}</span>
                </div>
              </div>
            )}
            
            {children && <div className="mt-4">{children}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Add to Goal button component
interface AddToGoalButtonProps {
  goalText: string;
}

function AddToGoalButton({ goalText }: AddToGoalButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  // Get existing goals to check for duplicates
  const { data: existingGoals = [] } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/goals');
      if (!response.ok) return [];
      return response.json();
    },
    // Don't refetch on window focus to reduce API calls
    refetchOnWindowFocus: false
  });
  
  // Check if this goal already exists (by title)
  const isDuplicate = existingGoals.some(
    (goal: any) => goal.title.toLowerCase() === goalText.toLowerCase()
  );
  
  // Mutation to save the goal
  const saveGoalMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title: goalText,
        description: "Created from LinkedIn Optimizer action plan",
        status: "not_started",
        source: "LinkedIn Optimizer"
      };
      const response = await apiRequest('POST', '/api/goals', data);
      return response.json();
    },
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      toast({
        title: "Added to Career Goals",
        description: "This action has been added to your career goals tracker",
      });
      // Invalidate goals cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add goal",
        description: error.message || "There was an error adding this to your goals",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });
  
  const handleAddToGoals = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger parent click events
    if (!isDuplicate) {
      saveGoalMutation.mutate();
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`ml-2 px-2 ${isDuplicate ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleAddToGoals}
            disabled={isDuplicate || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">Add to Goals</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isDuplicate 
            ? "This goal already exists in your Career Goals" 
            : "Click to add this as a goal to track in your dashboard"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
      try {
        // Using direct fetch for debugging purposes
        const url = "/api/linkedin-optimizer/analyze";
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(import.meta.env.DEV ? { "Authorization": "Bearer dev_token" } : {})
          },
          body: JSON.stringify(data),
          credentials: "include"
        });
        
        // Check if we received JSON as expected
        const contentType = response.headers.get('Content-Type') || '';
        
        if (!contentType.includes('application/json')) {
          const fallbackText = await response.text(); // Get raw text/HTML for inspection
          console.error("❌ Expected JSON, but got:", contentType);
          console.error("Response preview:", fallbackText.slice(0, 300)); // Show first part of HTML
          
          throw new Error("LinkedIn may have blocked the request. Please try again later or check your profile URL.");
        }
        
        // Now we can safely parse the JSON
        const responseData = await response.json();
        console.log("✅ Analysis Data:", responseData);
        
        // Check for error status
        if (!response.ok) {
          throw new Error(responseData.message || "Failed to analyze LinkedIn profile");
        }
        
        return responseData;
      } catch (err) {
        console.error("Error in LinkedIn Optimizer:", err);
        throw new Error(err.message || "Something went wrong analyzing your LinkedIn profile.");
      }
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
          <Card className="p-8 shadow-lg border-primary/10 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-blue-950/20">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="profile-url" className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    Paste your LinkedIn URL (public profile)
                  </label>
                  <div className="relative">
                    <Input
                      id="profile-url"
                      placeholder="https://www.linkedin.com/in/yourprofile"
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      className="pr-10 transition-all border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="target-job" className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <Target className="h-4 w-4 text-primary" />
                    What job are you optimizing for?
                  </label>
                  <Select
                    value={targetJobTitle}
                    onValueChange={setTargetJobTitle}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary">
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
                  
                  <AnimatePresence>
                    {targetJobTitle === "other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          className="mt-2 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          placeholder="Enter job title"
                          value={customJob}
                          onChange={(e) => setCustomJob(e.target.value)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-primary">
                    <BrainCircuit className="h-4 w-4" />
                    What you'll get:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span>A comprehensive score out of 100</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span>Personalized AI feedback for every section</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span>Career goals based on your profile gaps</span>
                    </li>
                  </ul>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full py-6 text-base font-medium shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700" 
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <div className="relative mr-3">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <div className="absolute inset-0 rounded-full animate-ping bg-white/20" style={{ animationDuration: '2s' }}></div>
                        </div>
                        Analyzing profile... {targetJobTitle && `Tailoring insights for ${targetJobTitle === "other" ? customJob : targetJobTitle}`}
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-5 w-5" />
                        Analyze My Profile
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </form>
          </Card>
        )}
        
        {results && (
          <div className="mt-8">
            <div className="bg-card rounded-lg p-8 shadow-lg border border-gray-100 dark:border-gray-800 mb-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Your LinkedIn Profile Score
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Based on analysis for {targetJobTitle === "other" ? customJob : targetJobTitle} position
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                  <Button 
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/5 transition-all" 
                    onClick={() => setResults(null)}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Start New Analysis
                  </Button>
                </motion.div>
              </div>
              
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <div className="flex justify-between mb-3">
                  <span className="font-medium flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Overall Profile Score
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {results.overallScore}/100
                  </span>
                </div>
                <div className="h-3 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                  <div
                    className={`h-3 rounded-full ${
                      results.overallScore < 40
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : results.overallScore < 70
                          ? "bg-gradient-to-r from-amber-500 to-amber-600"
                          : "bg-gradient-to-r from-green-500 to-green-600"
                    }`}
                    style={{ width: `${results.overallScore}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  {results.overallScore < 40 
                    ? "Your profile needs significant improvement to be competitive for this role." 
                    : results.overallScore < 70 
                      ? "Your profile shows potential but could benefit from targeted improvements." 
                      : "Your profile is well-optimized for this role with only minor improvements needed."}
                </p>
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
                  className={`px-4 py-2 -mb-px flex items-center gap-1 ${
                    activeTab === "action-plan"
                      ? "border-b-2 border-primary"
                      : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("action-plan")}
                >
                  Action Plan
                  <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                    Save As Goals
                  </span>
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
                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Save Actions to Your Goals</h3>
                        <p className="text-blue-700 dark:text-blue-400 text-sm">
                          Click the "+ Add to Goals" button next to any action item to save it to your Career Goals tracker. 
                          You can then track your progress on these improvements over time in your goals dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-medium mb-2 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                      High Priority Actions
                    </h3>
                    <ul className="space-y-2">
                      {results.actionPlan.highPriority.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="mt-1 flex-shrink-0">
                            {getPriorityIcon("high")}
                          </div>
                          <div className="flex flex-1 justify-between items-start">
                            <span>{action}</span>
                            <AddToGoalButton goalText={action} />
                          </div>
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
                          <div className="mt-1 flex-shrink-0">
                            {getPriorityIcon("medium")}
                          </div>
                          <div className="flex flex-1 justify-between items-start">
                            <span>{action}</span>
                            <AddToGoalButton goalText={action} />
                          </div>
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
                          <div className="mt-1 flex-shrink-0">
                            {getPriorityIcon("low")}
                          </div>
                          <div className="flex flex-1 justify-between items-start">
                            <span>{action}</span>
                            <AddToGoalButton goalText={action} />
                          </div>
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