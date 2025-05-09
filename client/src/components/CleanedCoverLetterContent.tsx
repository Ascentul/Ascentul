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
      if (!content) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        console.log("Fetching cleaned content from API...");
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
        console.log("API response:", data);
        
        // The API returns cleanedLetterBody
        if (data.cleanedLetterBody) {
          setCleanedContent(data.cleanedLetterBody);
          console.log("Content cleaned successfully");
        } else {
          console.log("API did not return cleaned content, using original");
          // Apply client-side cleaning as fallback
          const clientSideCleaned = cleanAIOutput(content)
            .replace(/dear hiring manager[,.]?/i, '')
            .replace(/dear recruitment team[,.]?/i, '')
            .replace(/sincerely,?[\s\S]*$/i, '');
          setCleanedContent(clientSideCleaned);
        }
      } catch (error) {
        console.error('Error cleaning cover letter content:', error);
        // Apply client-side cleaning as fallback
        const clientSideCleaned = cleanAIOutput(content)
          .replace(/dear hiring manager[,.]?/i, '')
          .replace(/dear recruitment team[,.]?/i, '')
          .replace(/sincerely,?[\s\S]*$/i, '');
        setCleanedContent(clientSideCleaned);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCleanedContent();
  }, [content, cleanAIOutput]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  // First, clean the content even further with regex to remove any remaining headers
  const furtherCleaned = cleanedContent
    .replace(/^[A-Z][a-z]+ [A-Z][a-z]+\s*\n/, '') // Remove name at start
    .replace(/^.*?@.*?\s*\n/, '') // Remove email at start
    .replace(/^Dear\s+[^,\n]*[,\n]/, '') // Remove any remaining Dear...
    .replace(/Sincerely,?\s*\n.*$/, ''); // Remove closing
  
  return (
    <>
      {replaceUserPlaceholders(cleanAIOutput(furtherCleaned))
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