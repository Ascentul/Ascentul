import React from "react";
import { formatDistance } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart4, 
  Star, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Lightbulb,
  Code,
  Heart, 
  FileSpreadsheet,
  KeySquare
} from "lucide-react";

// Interface for the analysis result
export interface ResumeAnalysisResult {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvementSuggestions: string[];
  technicalSkillAssessment: string[];
  softSkillAssessment: string[];
  formattingFeedback: string[];
  keywordMatchScore: number;
  relevanceScore: number;
  timestamp?: string;
}

interface ResumeAnalysisResultsProps {
  results: ResumeAnalysisResult;
  className?: string;
}

const ResumeAnalysisResults: React.FC<ResumeAnalysisResultsProps> = ({ 
  results, 
  className = "" 
}) => {
  // Calculate when the analysis was performed
  const timestamp = results.timestamp || new Date().toISOString();
  const timeAgo = formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
  
  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };
  
  // Helper function to get progress bar color based on score
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-amber-600";
    return "bg-red-600";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analysis header with timestamp */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-primary/90 flex items-center analysis-header">
          <BarChart4 className="h-5 w-5 mr-2" />
          AI Resume Analysis
        </h3>
        <span className="text-xs text-neutral-500 flex items-center">
          <Clock className="h-3.5 w-3.5 mr-1" />
          Analyzed {timeAgo}
        </span>
      </div>
      
      {/* Overall scores section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Match Score */}
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center mb-2">
              <h4 className="text-sm font-medium text-neutral-700">Overall Match</h4>
              <div className={`text-3xl font-bold ${getScoreColor(results.overallScore)}`}>
                {results.overallScore}%
              </div>
            </div>
            <Progress 
              value={results.overallScore} 
              className={`h-2 ${getProgressColor(results.overallScore)}`} 
            />
          </CardContent>
        </Card>
        
        {/* Keyword Match Score */}
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center mb-2">
              <h4 className="text-sm font-medium text-neutral-700">Keyword Match</h4>
              <div className={`text-3xl font-bold ${getScoreColor(results.keywordMatchScore)}`}>
                {results.keywordMatchScore}%
              </div>
            </div>
            <Progress 
              value={results.keywordMatchScore} 
              className={`h-2 ${getProgressColor(results.keywordMatchScore)}`} 
            />
          </CardContent>
        </Card>
        
        {/* Relevance Score */}
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center mb-2">
              <h4 className="text-sm font-medium text-neutral-700">Relevance Score</h4>
              <div className={`text-3xl font-bold ${getScoreColor(results.relevanceScore)}`}>
                {results.relevanceScore}%
              </div>
            </div>
            <Progress 
              value={results.relevanceScore} 
              className={`h-2 ${getProgressColor(results.relevanceScore)}`} 
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Strengths Section */}
      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-md flex items-center text-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Strengths
          </CardTitle>
          <CardDescription>
            Areas where your resume matches well with the job description
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            {results.strengths.map((strength, index) => (
              <li key={`strength-${index}`} className="text-neutral-700">{strength}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      {/* Weaknesses Section */}
      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-md flex items-center text-red-700">
            <XCircle className="h-4 w-4 mr-2" />
            Areas to Improve
          </CardTitle>
          <CardDescription>
            Aspects where your resume could better align with the job requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            {results.weaknesses.map((weakness, index) => (
              <li key={`weakness-${index}`} className="text-neutral-700">{weakness}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      {/* Missing Keywords Section */}
      {results.missingKeywords.length > 0 && (
        <Card className="overflow-hidden border-slate-200">
          <CardHeader className="py-4 px-6">
            <CardTitle className="text-md flex items-center text-amber-700">
              <KeySquare className="h-4 w-4 mr-2" />
              Missing Keywords
            </CardTitle>
            <CardDescription>
              Key terms from the job description not found in your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <div className="flex flex-wrap gap-2">
              {results.missingKeywords.map((keyword, index) => (
                <span 
                  key={`keyword-${index}`} 
                  className="bg-amber-50 text-amber-800 px-2 py-1 rounded-full text-xs font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Improvement Suggestions */}
      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-md flex items-center text-blue-700">
            <Lightbulb className="h-4 w-4 mr-2" />
            Improvement Suggestions
          </CardTitle>
          <CardDescription>
            Actionable recommendations to enhance your resume for this position
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            {results.improvementSuggestions.map((suggestion, index) => (
              <li key={`suggestion-${index}`} className="text-neutral-700">{suggestion}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      {/* Two Column Section for Technical and Soft Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Technical Skills Assessment */}
        <Card className="overflow-hidden border-slate-200">
          <CardHeader className="py-4 px-6">
            <CardTitle className="text-md flex items-center text-violet-700">
              <Code className="h-4 w-4 mr-2" />
              Technical Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              {results.technicalSkillAssessment.map((skill, index) => (
                <li key={`tech-${index}`} className="text-neutral-700">{skill}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        {/* Soft Skills Assessment */}
        <Card className="overflow-hidden border-slate-200">
          <CardHeader className="py-4 px-6">
            <CardTitle className="text-md flex items-center text-pink-700">
              <Heart className="h-4 w-4 mr-2" />
              Soft Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              {results.softSkillAssessment.map((skill, index) => (
                <li key={`soft-${index}`} className="text-neutral-700">{skill}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Formatting Feedback */}
      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-md flex items-center text-teal-700">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Formatting Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            {results.formattingFeedback.map((feedback, index) => (
              <li key={`format-${index}`} className="text-neutral-700">{feedback}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeAnalysisResults;