import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface CleanedCoverLetterContentProps {
  content: string;
  cleanAIOutput: (text: string) => string;
  replaceUserPlaceholders: (text: string) => string;
}

export const CleanedCoverLetterContent = ({ 
  content,
  cleanAIOutput,
  replaceUserPlaceholders
}: CleanedCoverLetterContentProps) => {
  const [cleanedContent, setCleanedContent] = useState<string>(content);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchCleanedContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/strip-optimized-cover-letter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ optimizedLetter: content }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to clean cover letter content');
        }
        
        const data = await response.json();
        if (data.cleanedLetterBody) {
          setCleanedContent(data.cleanedLetterBody);
        } else {
          setCleanedContent(content);
        }
      } catch (error) {
        console.error('Error cleaning cover letter content:', error);
        setCleanedContent(content);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCleanedContent();
  }, [content]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <>
      {replaceUserPlaceholders(cleanAIOutput(cleanedContent))
        .split(/(\[.*?\])/).map((part, index) => {
          // Check if this part is a placeholder (surrounded by brackets)
          const isPlaceholder = /^\[.*\]$/.test(part);
          return isPlaceholder ? (
            <span key={index} className="text-neutral-400 bg-neutral-50 px-1 rounded" title="Fill in your personal details in your profile">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
    </>
  );
};

export default CleanedCoverLetterContent;