import React from "react";
import { formatDistance } from "date-fns";
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  BarChart4, 
  AlertTriangle, 
  CheckCircle2, 
  CheckCircle, 
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
  
  // Helper function to get background and border color based on score
  const getScoreBoxStyles = (score: number) => {
    if (score >= 80) return "bg-emerald-50/70 border-emerald-100";
    if (score >= 60) return "bg-amber-50/70 border-amber-100";
    return "bg-red-50/70 border-red-100";
  };
  
  // Helper function to get score label based on score
  const getScoreLabel = (score: number, type: string) => {
    if (type === 'overall') {
      return score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
    } else if (type === 'keyword') {
      return score >= 80 ? 'Perfect Match' : score >= 60 ? 'Aligned' : 'Misaligned';
    } else if (type === 'relevance') {
      return score >= 80 ? 'Compelling' : score >= 60 ? 'Convincing' : 'Basic';
    } else {
      return score >= 80 ? 'Crystal Clear' : score >= 60 ? 'Clear' : 'Unclear';
    }
  };

  // Generate a clarity score (for fourth score box) - using average of other scores
  const clarityScore = Math.round((results.overallScore + results.keywordMatchScore + results.relevanceScore) / 3);

  return (
    <Card className={`overflow-hidden border-slate-200 ${className}`}>
      <CardContent className="pt-6">
        {/* Analysis header with timestamp */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-semibold text-primary/90 flex items-center analysis-header">
            <BarChart4 className="h-5 w-5 mr-2" />
            AI Analysis Results
          </h3>
          <span className="text-xs text-neutral-500 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            Analyzed {timeAgo}
          </span>
        </div>
        
        <div className="space-y-5">
          {/* Score cards in a 4-column grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Overall Score */}
            <div 
              className={`flex flex-col items-center p-3 rounded-lg border score-box ${getScoreBoxStyles(results.overallScore)}`}
              title="Overall score reflecting the quality of your resume"
            >
              <span className="text-xl font-bold">{Math.round(results.overallScore)}</span>
              <span className="text-xs text-neutral-500">Overall</span>
              <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                {getScoreLabel(results.overallScore, 'overall')}
              </span>
            </div>
            
            {/* Keyword Match Score (renamed to Alignment) */}
            <div 
              className={`flex flex-col items-center p-3 rounded-lg border score-box ${getScoreBoxStyles(results.keywordMatchScore)}`}
              title="How well your resume aligns with the job requirements"
            >
              <span className="text-xl font-bold">{Math.round(results.keywordMatchScore)}</span>
              <span className="text-xs text-neutral-500">Alignment</span>
              <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                {getScoreLabel(results.keywordMatchScore, 'keyword')}
              </span>
            </div>
            
            {/* Relevance Score (renamed to Persuasive) */}
            <div 
              className={`flex flex-col items-center p-3 rounded-lg border score-box ${getScoreBoxStyles(results.relevanceScore)}`}
              title="How persuasive and compelling your resume is"
            >
              <span className="text-xl font-bold">{Math.round(results.relevanceScore)}</span>
              <span className="text-xs text-neutral-500">Persuasive</span>
              <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                {getScoreLabel(results.relevanceScore, 'relevance')}
              </span>
            </div>
            
            {/* New Clarity Score */}
            <div 
              className={`flex flex-col items-center p-3 rounded-lg border score-box ${getScoreBoxStyles(clarityScore)}`}
              title="Clarity and readability of your writing"
            >
              <span className="text-xl font-bold">{clarityScore}</span>
              <span className="text-xs text-neutral-500">Clarity</span>
              <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                {getScoreLabel(clarityScore, 'clarity')}
              </span>
            </div>
          </div>
          
          {/* Strengths Section - styled with light green background */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <span className="text-emerald-500 mr-1">✓</span> Strengths
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm bg-emerald-50/50 p-2 rounded-md border border-emerald-100/50">
              {results.strengths.map((strength, index) => (
                <li key={`strength-${index}`} className="text-neutral-700">{strength}</li>
              ))}
            </ul>
          </div>
          
          {/* Areas to Improve Section - styled with light yellow background */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <span className="text-amber-500 mr-1">⚠️</span> Areas to Improve
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm bg-amber-50/50 p-2 rounded-md border border-amber-100/50">
              {results.weaknesses.map((weakness, index) => (
                <li key={`weakness-${index}`} className="text-neutral-700">{weakness}</li>
              ))}
            </ul>
          </div>
          
          {/* Improvement Suggestions - styled with light purple background */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <span className="text-blue-500 mr-1">💡</span> Suggestions
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm bg-blue-50/50 p-2 rounded-md border border-blue-100/50">
              {results.improvementSuggestions.map((suggestion, index) => (
                <li key={`suggestion-${index}`} className="text-neutral-700">{suggestion}</li>
              ))}
            </ul>
          </div>
          
          {/* Missing Keywords Section - using tags in amber/yellow styling */}
          {results.missingKeywords.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <KeySquare className="h-4 w-4 mr-1 text-amber-600" /> Missing Keywords
              </h4>
              <div className="flex flex-wrap gap-2 bg-amber-50/50 p-2 rounded-md border border-amber-100/50">
                {results.missingKeywords.map((keyword, index) => (
                  <span 
                    key={`keyword-${index}`} 
                    className="bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Technical and Soft Skills - 2-column layout with consistent styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Skills Assessment */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Code className="h-4 w-4 mr-1 text-violet-600" /> Technical Skills
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm bg-violet-50/50 p-2 rounded-md border border-violet-100/50">
                {results.technicalSkillAssessment.map((skill, index) => (
                  <li key={`tech-${index}`} className="text-neutral-700">{skill}</li>
                ))}
              </ul>
            </div>
            
            {/* Soft Skills Assessment */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Heart className="h-4 w-4 mr-1 text-pink-600" /> Soft Skills
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm bg-pink-50/50 p-2 rounded-md border border-pink-100/50">
                {results.softSkillAssessment.map((skill, index) => (
                  <li key={`soft-${index}`} className="text-neutral-700">{skill}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Formatting Feedback - with consistent styling */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <FileSpreadsheet className="h-4 w-4 mr-1 text-teal-600" /> Formatting Feedback
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm bg-teal-50/50 p-2 rounded-md border border-teal-100/50">
              {results.formattingFeedback.map((feedback, index) => (
                <li key={`format-${index}`} className="text-neutral-700">{feedback}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalysisResults;