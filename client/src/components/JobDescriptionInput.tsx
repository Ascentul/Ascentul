import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
  minLength?: number;
  isAnalyzing?: boolean;
  placeholder?: string;
}

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  value,
  onChange,
  required = true,
  className = '',
  id = 'jobDescription',
  minLength = 100,
  isAnalyzing = false,
  placeholder = "Paste the job description here to compare with your resume...",
}) => {
  const [jobDescQuality, setJobDescQuality] = useState<'empty' | 'poor' | 'fair' | 'good'>('empty');
  const [charCount, setCharCount] = useState(0);
  
  // Update quality rating and character count when value changes
  useEffect(() => {
    const trimmedValue = value.trim();
    setCharCount(trimmedValue.length);
    
    if (!trimmedValue) {
      setJobDescQuality('empty');
    } else if (trimmedValue.length < 50) {
      setJobDescQuality('poor');
    } else if (trimmedValue.length < minLength) {
      setJobDescQuality('fair');
    } else {
      setJobDescQuality('good');
    }
  }, [value, minLength]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        {jobDescQuality === 'good' && !isAnalyzing && (
          <div className="flex items-center text-green-600 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            <span>Good length ({charCount} characters)</span>
          </div>
        )}
      </div>
      
      <Textarea
        id={id}
        placeholder={placeholder}
        className={`resize-y border-2 ${
          jobDescQuality === 'good' ? 'border-green-200 focus:border-green-300' : 
          jobDescQuality === 'fair' ? 'border-amber-200 focus:border-amber-300' : 
          jobDescQuality === 'poor' ? 'border-red-200 focus:border-red-300' : 
          'border-primary/20 focus:border-primary/40'
        } ${className}`}
        value={value}
        onChange={handleChange}
        disabled={isAnalyzing}
      />
      
      {isAnalyzing && (
        <div className="flex items-center space-x-2 text-primary/80">
          <Loader2 className="animate-spin h-4 w-4" />
          <span className="text-sm">Analyzing with AI...</span>
        </div>
      )}
      
      {!isAnalyzing && jobDescQuality === 'empty' && required && (
        <div className="h-4"></div>
      )}
      
      {!isAnalyzing && jobDescQuality === 'poor' && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium">Job Description Too Short</AlertTitle>
          <AlertDescription className="text-xs">
            Please provide a more detailed job description (at least 50 characters) for accurate analysis.
          </AlertDescription>
        </Alert>
      )}
      
      {!isAnalyzing && jobDescQuality === 'fair' && (
        <Alert className="bg-amber-50 border-amber-200 py-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-sm font-medium text-amber-700">Job Description Could Be Better</AlertTitle>
          <AlertDescription className="text-xs text-amber-700">
            For accurate AI analysis, a more detailed job description ({minLength}+ characters) with specific skills,
            responsibilities, and requirements is recommended.
          </AlertDescription>
        </Alert>
      )}
      
      {!isAnalyzing && jobDescQuality === 'good' && (
        <Alert className="bg-green-50 border-green-200 py-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-sm font-medium text-green-700">Good Job Description</AlertTitle>
          <AlertDescription className="text-xs text-green-700">
            This job description has enough detail for effective analysis. Including specific skills and requirements will yield better results.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default JobDescriptionInput;