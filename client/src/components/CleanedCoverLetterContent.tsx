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
  
  // First, strip all header content before cleaning line by line
  // This is a complete solution that removes all common headers/contact info
  let processedLines = cleanedContent.split('\n');
  let bodyStartIndex = -1;
  
  // Process each line to find where the actual body content starts
  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i].trim();
    
    // Skip empty lines at the top
    if (line === '') continue;
    
    // Check if this line starts actual content (typically starts with "I am" or similar)
    if (line.match(/^I am|^As a|^With|^Having|^Thank you/i)) {
      bodyStartIndex = i;
      break;
    }
    
    // These are obvious header lines, keep checking until we find content
    const isHeaderLine = 
      // Check if it's a job title
      line.match(/^[A-Z][a-zA-Z\s]+(Analyst|Engineer|Manager|Developer|Consultant|Designer|Specialist|Coordinator|Director|Assistant)/i) ||
      // Check if it's an email
      line.match(/^.*?@.*?$/i) ||
      // Check if it's a date
      line.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})$/i) ||
      // Check if it's a company name
      line.match(/^(Grubhub|Google|Amazon|Microsoft|Apple|Meta|LinkedIn|Twitter|Facebook|Tesla)$/i) ||
      // Check if it's a name
      line.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/i) ||
      // Check if it's a greeting
      line.match(/^Dear\s+[^,\n]*[,]/i);
      
    if (!isHeaderLine && line.length > 15) {
      // This might be the start of the body content
      bodyStartIndex = i;
      break;
    }
  }
  
  // If we found where the body starts, only keep content from that point
  let cleanedBody = bodyStartIndex !== -1 
    ? processedLines.slice(bodyStartIndex).join('\n') 
    : cleanedContent;
    
  // Now run additional regex cleaning on the body part for any remaining issues
  const furtherCleaned = cleanedBody
    // Remove any remaining Dear... at the start
    .replace(/^Dear\s+[^,\n]*[,\n]/i, '')
    // Remove closing
    .replace(/Sincerely,?\s*\n.*$/i, '')
    // Leading whitespace and multiple blank lines
    .replace(/^\s+/, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n');
  
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