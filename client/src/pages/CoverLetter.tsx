import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { exportCoverLetterToPDF } from '@/utils/exportPDF';
import { jsPDF } from 'jspdf';

// Add html2pdf type for TypeScript
declare global {
  interface Window {
    html2pdf: any;
  }
}
import { 
  Plus, 
  Mail,
  Download, 
  Copy, 
  Trash2, 
  Edit, 
  FileText, 
  Sparkles, 
  BarChart4, 
  UploadCloud, 
  FileUp,
  Loader2,
  ArrowLeft,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CoverLetterForm from '@/components/CoverLetterForm';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function CoverLetter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLetterOpen, setIsAddLetterOpen] = useState(false);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<any>(null);
  const [previewLetter, setPreviewLetter] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [copySuccess, setCopySuccess] = useState(false);
  const [optimizedCopySuccess, setOptimizedCopySuccess] = useState(false);
  const [generationTimestamp, setGenerationTimestamp] = useState<Date | null>(null);

  // Fetch user's cover letters
  const { data: coverLetters = [], isLoading } = useQuery({
    queryKey: ['/api/cover-letters'],
  });

  // AI generation form fields
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  // Analysis form fields
  const [analyzeJobDescription, setAnalyzeJobDescription] = useState('');
  const [analyzeCoverLetterText, setAnalyzeCoverLetterText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const deleteCoverLetterMutation = useMutation({
    mutationFn: async (letterId: number) => {
      return apiRequest('DELETE', `/api/cover-letters/${letterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
      toast({
        title: 'Cover Letter Deleted',
        description: 'Your cover letter has been deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const duplicateCoverLetterMutation = useMutation({
    mutationFn: async (coverLetter: any) => {
      const newCoverLetter = {
        ...coverLetter,
        name: `${coverLetter.name} (Copy)`,
      };
      delete newCoverLetter.id;
      delete newCoverLetter.createdAt;
      delete newCoverLetter.updatedAt;

      return apiRequest('POST', '/api/cover-letters', newCoverLetter);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
      toast({
        title: 'Cover Letter Duplicated',
        description: 'A copy of your cover letter has been created',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to duplicate cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const generateCoverLetterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/cover-letters/generate', {
        jobTitle,
        companyName,
        jobDescription,
        type: 'complete'
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Cover Letter Generated',
        description: 'AI has generated a cover letter for you',
      });
      setGeneratedContent(data.content);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      // For suggestions, only the job description is required
      const res = await apiRequest('POST', '/api/cover-letters/generate', {
        jobTitle: jobTitle || 'Not specified',
        companyName: companyName || 'Not specified',
        jobDescription,
        type: 'suggestions'
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Suggestions Generated',
        description: 'Writing suggestions for your cover letter have been generated',
      });
      setGeneratedContent(data.suggestions || data.content);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate suggestions: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const analyzeCoverLetterMutation = useMutation({
    mutationFn: async () => {
      if (!analyzeJobDescription || !analyzeCoverLetterText) {
        throw new Error("Both job description and cover letter are required");
      }

      const res = await apiRequest('POST', '/api/cover-letters/analyze', {
        coverLetter: analyzeCoverLetterText,
        jobDescription: analyzeJobDescription,
      });

      return res.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: 'Analysis Complete',
        description: 'Your cover letter has been analyzed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: `Error analyzing cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDeleteLetter = (coverLetterId: number) => {
    if (confirm('Are you sure you want to delete this cover letter?')) {
      deleteCoverLetterMutation.mutate(coverLetterId);
    }
  };

  const handleSaveGenerated = () => {
    if (!generatedContent) return;

    // Create a new cover letter with the generated content
    const newCoverLetter = {
      name: `${jobTitle} at ${companyName}`,
      template: 'standard',
      content: {
        header: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          date: new Date().toLocaleDateString(),
        },
        recipient: {
          name: '',
          company: companyName,
          position: 'Hiring Manager',
          address: '',
        },
        body: generatedContent,
        closing: 'Sincerely,',
      }
    };

    // Create a new cover letter with the mutation
    apiRequest('POST', '/api/cover-letters', newCoverLetter)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
        toast({
          title: '✅ Cover letter saved',
          description: "Your cover letter has been saved to 'My Cover Letters'",
        });
        setGeneratedContent('');
        setJobTitle('');
        setCompanyName('');
        setJobDescription('');

        // Redirect to main tab would go here if needed
      })
      .catch((error) => {
        toast({
          title: 'Error saving cover letter',
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      });
  };

  const filteredLetters = () => {
    if (!coverLetters || !Array.isArray(coverLetters)) return [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return coverLetters.filter(
        (coverLetter: any) => coverLetter.name.toLowerCase().includes(query)
      );
    }

    return coverLetters;
  };

  // Helper function to clean AI output by removing meta commentary
  const cleanAIOutput = (text: string): string => {
    if (!text) return "";

    // Check for separator like "---" and cut content after it
    const cutoff = text.indexOf('---');
    if (cutoff !== -1) return text.slice(0, cutoff).trim();

    // Filter out lines with common AI meta-commentary
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      return !lowerLine.startsWith('this cover letter') &&
             !lowerLine.startsWith('overall') &&
             !lowerLine.startsWith('the above text') &&
             !lowerLine.startsWith('in summary') &&
             !lowerLine.startsWith('this version') &&
             !lowerLine.includes('aligns your experience') &&
             !lowerLine.includes('demonstrates your qualifications') &&
             !lowerLine.includes('effectively showcases') &&
             !lowerLine.includes('feel free to customize');
    });
    return filteredLines.join('\n').trim();
  };

  // This function has been moved to a utility file, we're keeping it here for backwards compatibility
  // with other parts of the code
  const directPdfExport = (coverLetter: any) => {
    // First set the preview letter so the proper content is in the DOM
    setPreviewLetter(coverLetter);

    // Use a timeout to ensure the DOM is updated before export
    setTimeout(() => {
      // Call the utility directly (no parameters needed)
      exportCoverLetterToPDF();
      console.log('Starting improved PDF export for cover letter');
    }, 100);

    try {
      // Create a temporary div for PDF export with professional styling
      const container = document.createElement('div');
      container.id = 'coverLetterPreview';
      container.className = 'pdf-export';

      // Apply professional PDF styling
      container.style.width = '8.5in';
      container.style.minHeight = '11in';
      container.style.padding = '1in';
      container.style.fontFamily = 'Georgia, serif';
      container.style.fontSize = '12pt';
      container.style.lineHeight = '1.6';
      container.style.color = '#000';
      container.style.backgroundColor = 'white';
      container.style.boxSizing = 'border-box';

      // Create inner container for proper alignment
      const innerContainer = document.createElement('div');
      innerContainer.className = 'pdf-inner';
      innerContainer.style.maxWidth = '6.5in';
      innerContainer.style.margin = '0 auto';
      innerContainer.style.textAlign = 'left';

      // Get letter data
      const letter = coverLetter;

      // Process body content
      let bodyContent = '';
      if (letter.content.body) {
        bodyContent = letter.content.body
          .split('\n')
          .filter((para: string) => para.trim().length > 0)
          .map((para: string) => `<p style="margin-bottom: 12px;">${para}</p>`)
          .join('');
      } else {
        bodyContent = '<p style="margin-bottom: 12px;">No content available.</p>';
      }

      // Create professional letter content with proper formatting
      innerContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 36px;">
          <h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 8px; font-family: Georgia, serif;">${letter.content.header.fullName || '[Your Name]'}</h1>
          <p style="margin-bottom: 12px;">${letter.content.header.date || new Date().toLocaleDateString()}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <p style="margin-bottom: 4px;">Hiring Manager</p>
          <p style="margin-bottom: 4px;">${letter.content.recipient.company || 'Company Name'}</p>
        </div>

        <p style="margin-bottom: 24px;">Dear Hiring Manager,</p>

        <div style="margin-bottom: 24px; text-align: justify;">
          ${bodyContent}
        </div>

        <div style="margin-top: 36px;">
          <p style="margin-bottom: 24px;">${letter.content.closing || 'Sincerely,'}</p>
          <p>${letter.content.header.fullName || '[Your Name]'}</p>
        </div>
      `;

      // Append the inner container to the main container
      container.appendChild(innerContainer);

      // Attach to document but position off-screen
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '-9999px';
      container.style.zIndex = '-1000';
      document.body.appendChild(container);

      // Generate filename from letter name
      const filename = `${letter.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Configure PDF export options for better quality and formatting
      const options = {
        margin: 0, // No margins since we've already applied them in the container
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait',
          compress: true
        }
      };

      console.log('Generating PDF with professional styling');

      // Add delay to ensure DOM rendering is complete
      setTimeout(() => {
        window.html2pdf()
          .from(container)
          .set(options)
          .save()
          .then(() => {
            console.log('PDF generated successfully with professional styling');
            toast({
              title: 'PDF Downloaded',
              description: `Your cover letter "${letter.name}" has been saved as a PDF.`,
            });

            // Clean up
            document.body.removeChild(container);
          })
          .catch((err: any) => {
            console.error('Professional PDF generation failed:', err);
            toast({
              title: 'Error',
              description: 'PDF generation failed. Trying alternative method...',
              variant: 'destructive',
            });

            // Clean up
            document.body.removeChild(container);

            // Fall back to direct jsPDF generation if HTML method fails
            try {
              // Get a direct reference to the jsPDF library
              const { jsPDF } = window.html2pdf().worker;

              // Create a new PDF document
              const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'letter'
              });

              // Set up basic configurations
              doc.setFont('Georgia');
              doc.setFontSize(12);

              // Define page dimensions
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              const margin = 72; // 1 inch margins in points
              const textWidth = pageWidth - (margin * 2);

              // Define starting positions
              let y = margin;
              const x = margin;

              // Header section - centered
              doc.setFontSize(16);
              doc.setFont('Georgia', 'bold');

              // Full name
              const fullName = letter.content.header.fullName || '[Your Name]';
              const fullNameWidth = doc.getStringUnitWidth(fullName) * 16 * doc.internal.scaleFactor / 72;
              doc.text(fullName, (pageWidth - fullNameWidth) / 2, y);
              y += 24;

              // Date
              doc.setFontSize(12);
              doc.setFont('Georgia', 'normal');
              const date = letter.content.header.date || new Date().toLocaleDateString();
              const dateWidth = doc.getStringUnitWidth(date) * 12 * doc.internal.scaleFactor / 72;
              doc.text(date, (pageWidth - dateWidth) / 2, y);
              y += 40;

              // Recipient section
              doc.text('Hiring Manager', x, y);
              y += 20;
              doc.text(letter.content.recipient.company || 'Company Name', x, y);
              y += 40;

              // Greeting
              doc.text('Dear Hiring Manager,', x, y);
              y += 40;

              // Body content
              if (letter.content.body) {
                // Process the body text by splitting into paragraphs
                const paragraphs = letter.content.body.split('\n')
                  .filter((para: string) => para.trim().length > 0);

                // Add each paragraph with spacing
                for (const paragraph of paragraphs) {
                  // Word wrapping with split text function
                  const splitText = doc.splitTextToSize(paragraph, textWidth);
                  doc.text(splitText, x, y);
                  y += 20 * splitText.length; // Add spacing based on number of wrapped lines
                  y += 20; // Space between paragraphs
                }
              } else {
                doc.text('No content available.', x, y);
                y += 20;
              }

              // Add closing
              y += 20;
              doc.text(letter.content.closing || 'Sincerely,', x, y);
              y += 40;
              doc.text(letter.content.header.fullName || '[Your Name]', x, y);

              // Save the PDF
              doc.save(filename);

              // Show success notification
              toast({
                title: 'PDF Downloaded',
                description: `Your cover letter "${letter.name}" has been saved as a PDF.`,
              });
            } catch (finalError) {
              console.error('All PDF generation methods failed:', finalError);
              toast({
                title: 'Error',
                description: 'All PDF generation methods failed. Please try again later.',
                variant: 'destructive',
              });
            }
          });
      }, 500); // Increased delay to ensure rendering
    } catch (error) {
      console.error('Error in PDF export setup:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while preparing the PDF.',
        variant: 'destructive',
      });
    }
  };

  // Handle PDF downloads for any cover letter content
  const handleDownloadPDF = (elementId: string) => {
    console.log(`Handling PDF download for: ${elementId}`);

    // For cover letter card buttons - extract the letter ID and use it for direct export
    if (elementId.startsWith('previewLetter-')) {
      const letterId = parseInt(elementId.replace('previewLetter-', ''), 10);
      console.log(`Looking for cover letter with ID: ${letterId}`);

      // Find the letter in the cover letters array
      const letterToExport = coverLetters.find((letter: any) => letter.id === letterId);

      if (letterToExport) {
        console.log('Found letter to export, setting as preview letter');
        // Set the preview letter so our export function can access it
        setPreviewLetter(letterToExport);

        // Use setTimeout to ensure state is updated before exporting
        setTimeout(() => {
          console.log('Exporting preview letter to PDF');
          exportCoverLetterToPDF();
        }, 50);
        return;
      } else {
        // If letter not found, show a toast
        toast({
          title: 'Error',
          description: `Could not find cover letter with ID ${letterId}`,
          variant: 'destructive',
        });
        return;
      }
    }

    // For generated content case
    if (elementId === 'generatedContent') {
      const filename = `Generated_Cover_Letter_${new Date().toISOString().split('T')[0]}.pdf`;
      exportPDF(elementId, filename);
      return;
    }

    // For optimized content case
    if (elementId === 'optimizedCoverLetterContent') {
      const filename = `Optimized_Cover_Letter_${new Date().toISOString().split('T')[0]}.pdf`;
      exportPDF(elementId, filename);
      return;
    }

    // Default case - just use the element ID as part of filename
    const filename = `${elementId.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    exportPDF(elementId, filename);
  };




  // Helper function to replace placeholder tags with user information
  const replaceUserPlaceholders = (text: string): string => {
    if (!user) return text;

    // Validate field length for proper fallbacks
    const nameToDisplay = user.name && user.name.length >= 2 ? user.name : '[Your Name]';
    const emailToDisplay = user.email && user.email.length >= 5 ? user.email : '[Email Address]';
    // We'll use a default value since phone may not be in the user object
    const phoneToDisplay = '[Phone Number]';
    const locationToDisplay = user.location && user.location.length >= 2 ? user.location : '[Your Address]';

    return text
      // Name replacements
      .replace(/\[Your Name\]/g, nameToDisplay)
      .replace(/\[your name\]/g, nameToDisplay.toLowerCase())
      .replace(/\[YOUR NAME\]/g, nameToDisplay.toUpperCase())

      // Email replacements
      .replace(/\[Your Email\]/g, emailToDisplay)
      .replace(/\[your email\]/g, emailToDisplay.toLowerCase())
      .replace(/\[YOUR EMAIL\]/g, emailToDisplay.toUpperCase())
      .replace(/\[Email Address\]/g, emailToDisplay)
      .replace(/\[email address\]/g, emailToDisplay.toLowerCase())
      .replace(/\[EMAIL ADDRESS\]/g, emailToDisplay.toUpperCase())

      // Phone replacements
      .replace(/\[Your Phone\]/g, phoneToDisplay)
      .replace(/\[your phone\]/g, phoneToDisplay.toLowerCase())
      .replace(/\[YOUR PHONE\]/g, phoneToDisplay.toUpperCase())
      .replace(/\[Phone Number\]/g, phoneToDisplay)
      .replace(/\[phone number\]/g, phoneToDisplay.toLowerCase())
      .replace(/\[PHONE NUMBER\]/g, phoneToDisplay.toUpperCase())

      // Location/Address replacements
      .replace(/\[Your Location\]/g, locationToDisplay)
      .replace(/\[your location\]/g, locationToDisplay.toLowerCase())
      .replace(/\[YOUR LOCATION\]/g, locationToDisplay.toUpperCase())
      .replace(/\[Your Address\]/g, locationToDisplay)
      .replace(/\[your address\]/g, locationToDisplay.toLowerCase())
      .replace(/\[YOUR ADDRESS\]/g, locationToDisplay.toUpperCase());
  };

  // Function to copy content to clipboard
  const handleCopyToClipboard = () => {
    // Process content: clean AI commentary and replace user placeholders
    const processedContent = replaceUserPlaceholders(cleanAIOutput(generatedContent));

    navigator.clipboard.writeText(processedContent)
      .then(() => {
        setCopySuccess(true);
        toast({
          title: '✅ Copied to clipboard',
          description: 'The cover letter content has been copied',
        });
        // Reset copy success after 3 seconds
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch((error) => {
        toast({
          title: 'Copy failed',
          description: 'Failed to copy content to clipboard',
          variant: 'destructive',
        });
        console.error('Copy failed:', error);
      });

    // Create an element to scroll to the generated content to provide feedback
    const contentElement = document.getElementById('generatedContent');
    if (contentElement) {
      contentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const generateCoverLetter = () => {
    if (!jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a job description to generate a cover letter',
        variant: 'destructive',
      });
      return;
    }

    generateCoverLetterMutation.mutate();
    setGenerationTimestamp(new Date());
  };

  const generateSuggestions = () => {
    if (!jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a job description to generate suggestions',
        variant: 'destructive',
      });
      return;
    }

    generateSuggestionsMutation.mutate();
    setGenerationTimestamp(new Date());
  };

  const handleAnalyzeCoverLetter = () => {
    if (!analyzeJobDescription || !analyzeCoverLetterText) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a job description and cover letter to analyze',
        variant: 'destructive',
      });
      return;
    }

    analyzeCoverLetterMutation.mutate();
  };

  // Function to copy optimized cover letter content to clipboard
  const handleCopyOptimizedCoverLetter = () => {
    if (!analysisResult?.optimizedCoverLetter) {
      toast({
        title: 'Nothing to copy',
        description: 'No optimized cover letter content available',
        variant: 'destructive',
      });
      return;
    }

    // Process content: replace user placeholders
    const processedContent = replaceUserPlaceholders(analysisResult.optimizedCoverLetter);

    navigator.clipboard.writeText(processedContent)
      .then(() => {
        setOptimizedCopySuccess(true);
        toast({
          title: '✅ Copied to clipboard',
          description: 'The optimized cover letter has been copied',
        });
        // Reset copy success after 3 seconds
        setTimeout(() => setOptimizedCopySuccess(false), 3000);
      })
      .catch((error) => {
        toast({
          title: 'Copy failed',
          description: 'Failed to copy content to clipboard',
          variant: 'destructive',
        });
        console.error('Copy failed:', error);
      });

    // Create an element to scroll to the optimized content to provide feedback
    const contentElement = document.getElementById('optimizedCoverLetterContent');
    if (contentElement) {
      contentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSaveOptimizedCoverLetter = () => {
    if (!analysisResult?.optimizedCoverLetter) return;

    // Create a new cover letter with the optimized content
    const newCoverLetter = {
      name: `Optimized Cover Letter ${new Date().toLocaleDateString()}`,
      template: 'standard',
      content: {
        header: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          date: new Date().toLocaleDateString(),
        },
        recipient: {
          name: '',
          company: '',
          position: 'Hiring Manager',
          address: '',
        },
        body: analysisResult.optimizedCoverLetter,
        closing: 'Sincerely,',
      }
    };

    // Create a new cover letter with the mutation
    apiRequest('POST', '/api/cover-letters', newCoverLetter)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
        toast({
          title: 'Optimized Cover Letter Saved',
          description: 'Your optimized cover letter has been saved',
        });
        setAnalysisResult(null);
        setAnalyzeJobDescription('');
        setAnalyzeCoverLetterText('');
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: `Failed to save optimized cover letter: ${error.message}`,
          variant: 'destructive',
        });
      });
  };

  // This was removed to eliminate duplication (function is defined above)

  // We use the exportCoverLetterToPDF utility imported at the top of the file

  // Export cover letter as PDF using jsPDF for reliable generation
  const exportPDF = (elementId: string, filename: string = "cover-letter.pdf") => {
    try {
      // Special handling for previewLetter with direct data
      if (elementId.startsWith('previewLetter-') && previewLetter) {
        // Use our dedicated function for cover letter objects
        exportCoverLetterToPDF();
        return;
      }

      // Get the element to export
      const element = document.getElementById(elementId);
      if (!element) {
        toast({
          title: 'Error',
          description: 'Could not find the cover letter content to download',
          variant: 'destructive',
        });
        return;
      }

      // Extract the text content for reliable PDF generation
      let letterBody = "";

      // Different extraction based on element type
      if (elementId === 'generatedContent' || elementId === 'optimizedCoverLetterContent') {
        // For AI-generated content, get the text and clean it
        letterBody = element.textContent || "";
        letterBody = cleanAIOutput(letterBody);
        letterBody = replaceUserPlaceholders(letterBody);
      } else {
        // For general content, just get the text
        letterBody = element.textContent || "";
      }

      if (!letterBody || letterBody.trim() === "") {
        toast({
          title: 'Empty Content',
          description: 'There is no content to export as PDF.',
          variant: 'destructive',
        });
        return;
      }

      console.log("Creating PDF with text content:", letterBody.substring(0, 100) + "...");

      // Create PDF document directly with jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      // Set font
      doc.setFont("helvetica");
      doc.setFontSize(12);

      // Define margins (1 inch = 25.4mm)
      const margin = 25.4; 

      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Calculate text width (accounting for margins)
      const textWidth = pageWidth - (margin * 2);

      // Add a title based on context
      const title = elementId === 'generatedContent' ? 
        'Generated Cover Letter' : 
        (elementId === 'optimizedCoverLetterContent' ? 
          'Optimized Cover Letter' : 'Cover Letter');

      // Add title at the top
      doc.setFontSize(16);
      doc.text(title, margin, margin);

      // Add a separator line
      doc.setLineWidth(0.5);
      doc.line(margin, margin + 5, pageWidth - margin, margin + 5);

      // Format user info if available
      const userName = user?.name || '[Your Name]';
      const recipientCompany = companyName || '[Company Name]';
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // Add header information
      doc.setFontSize(12);
      doc.text(`${userName}`, margin, margin + 12);
      doc.text(`${currentDate}`, margin, margin + 18);
      doc.text(`To: ${recipientCompany}`, margin, margin + 28);

      // Reset font size for body
      doc.setFontSize(11);

      // Split text to fit within page width and respect line breaks
      const bodyLines = doc.splitTextToSize(letterBody, textWidth);

      // Add content with proper spacing
      doc.text(bodyLines, margin, margin + 40);

      // Add closing
      const textHeight = doc.getTextDimensions(bodyLines).h;
      doc.text(`Sincerely,`, margin, margin + 45 + textHeight);
      doc.text(`${userName}`, margin, margin + 55 + textHeight);

      // Generate output filename
      const outputFilename = filename || `cover-letter-${new Date().toISOString().split('T')[0]}.pdf`;

      // Save the PDF
      doc.save(outputFilename);

      toast({
        title: 'PDF Downloaded',
        description: 'Your cover letter has been downloaded as a PDF.',
      });

    } catch (error) {
      console.error('Error in PDF export:', error);
      toast({
        title: 'Error Preparing PDF',
        description: 'There was a problem formatting your cover letter for PDF export.',
        variant: 'destructive',
      });
    }
  };

  // Animation variants - optimized for performance
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }
  };

  const subtleUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.2, 
        ease: "easeOut" 
      } 
    }
  };

  const cardAnimation = {
    hidden:{ opacity: 0, y: 20 },
    visible: {      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4, 
        ease: "easeOut" 
      } 
    }
  };

  const staggeredContainer = {
    hidden: { opacity: 1 }, // Start with opacity 1 for container
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Stagger children animations
        delayChildren: 0.1 // Small delay before starting animations
      }
    }
  };

  return (
    <motion.div 
      className="container mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between mb-6"
        variants={subtleUp}
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Cover Letters</h1>
          <p className="text-neutral-500">Create targeted cover letters for your job applications</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={() => {
            setSelectedCoverLetter(null);
            setIsAddLetterOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Cover Letter
        </Button>
      </motion.div>

      <Tabs defaultValue="letters" className="space-y-4">
        <TabsList className="mb-4">
          <TabsTrigger value="letters">
            My Cover Letters {Array.isArray(coverLetters) && coverLetters.length > 0 && `(${coverLetters.length})`}
          </TabsTrigger>
          <TabsTrigger value="suggestions">Generate With AI</TabsTrigger>
          <TabsTrigger value="analyze">Upload & Analyze</TabsTrigger>
        </TabsList>

        <TabsContent value="letters" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Input
              placeholder="Search cover letters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Cover Letters Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : Array.isArray(coverLetters) && coverLetters.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 cover-letter-grid"
              variants={staggeredContainer}
              style={{ alignItems: 'stretch' }}
            >
              {filteredLetters().map((coverLetter: any, i: number) => (
                <motion.div 
                  key={coverLetter.id}
                  variants={cardAnimation}
                  className="will-change-transform"
                  style={{ 
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden' 
                  }}
                >
                  <Card className="overflow-hidden h-full flex flex-col cover-letter-card min-h-[180px] transition-shadow duration-300">
                    <CardContent className="p-0 flex-1">
                      <div className="bg-primary/5 pt-5 pb-4 px-6 flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="h-10 w-10 text-primary mr-4" />
                          <div>
                            <h3 className="font-medium">{coverLetter.name}</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                              Created: {new Date(coverLetter.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-neutral-400 mt-1">
                              Last updated: {new Date(coverLetter.updatedAt || coverLetter.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Preview text removed for cleaner UI */}
                    </CardContent>
                    <CardFooter className="p-4 flex justify-between border-t bg-white mt-auto">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPreviewLetter(coverLetter)}
                      >
                        Preview
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedCoverLetter(coverLetter);
                            setIsAddLetterOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => duplicateCoverLetterMutation.mutate(coverLetter)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteLetter(coverLetter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 flex items-center gap-1 text-xs"
                          onClick={() => handleDownloadPDF(`previewLetter-${coverLetter.id}`)}
                          title="Download letter as PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-16 px-6 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md shadow-gray-200 border border-gray-100 w-full"
              variants={fadeIn}
            >
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <FileText className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-medium mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">You haven't created any cover letters yet</h3>
              <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                Create your first professional cover letter to showcase your qualifications
                and experience to potential employers.
              </p>
              <Button 
                onClick={() => {
                  setSelectedCoverLetter(null);
                  setIsAddLetterOpen(true);
                }}
                size="lg" 
                className="shadow-sm hover:shadow-lg transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Cover Letter
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 will-change-opacity will-change-transform card-grid-container"
            variants={subtleUp}
            style={{ transform: 'translateZ(0)', alignItems: 'flex-start' }}
          >
            {/* Input form */}
            <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] generate-cover-letter-card shadow-md shadow-gray-200">
              <CardContent className="pt-6 rounded-t-xl bg-transparent">
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
                  <FileUp className="h-5 w-5 mr-2 text-blue-500" />
                  Generate Cover Letter Content
                </h3>
                <div className="space-y-5">
                  {/* Responsive grid for inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitleSuggestions" className="flex items-center">
                        <span className="text-primary mr-1">1.</span> Job Title
                      </Label>
                      <Input 
                        id="jobTitleSuggestions"
                        placeholder="Marketing Manager" 
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        disabled={generateCoverLetterMutation.isPending || generateSuggestionsMutation.isPending}
                        className="border-2 border-primary/20 focus:border-primary/40"
                      />
                      {jobTitle && (
                        <p className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Added
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyNameSuggestions" className="flex items-center">
                        <span className="text-primary mr-1">2.</span> Company Name
                      </Label>
                      <Input 
                        id="companyNameSuggestions" 
                        placeholder="XYZ Corporation" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={generateCoverLetterMutation.isPending || generateSuggestionsMutation.isPending}
                        className="border-2 border-primary/20 focus:border-primary/40"
                      />
                      {companyName && (
                        <p className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Added
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobDescriptionSuggestions" className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-primary mr-1">3.</span> Job Description <span className="text-red-500 ml-1">*</span>
                      </div>
                      {jobDescription.trim().length > 100 && (
                        <span className="text-green-600 text-xs font-medium flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </span>
                      )}
                    </Label>
                    <Textarea 
                      id="jobDescriptionSuggestions" 
                      placeholder="Paste the job description here..."
                      className={`min-h-[180px] resize-y border-2 ${
                        jobDescription.trim().length > 100 ? 'border-green-200 focus:border-green-300' : 
                        jobDescription.trim().length > 50 ? 'border-amber-200 focus:border-amber-300' : 
                        jobDescription.trim().length > 0 ? 'border-red-200 focus:border-red-300' : 
                        'border-primary/20 focus:border-primary/40'
                      }`}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      disabled={generateCoverLetterMutation.isPending || generateSuggestionsMutation.isPending}
                    />
                    {jobDescription.trim().length > 0 && jobDescription.trim().length < 50 && (
                      <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 mr-2 mt-0.5 shrink-0"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                          <div className="font-medium mb-1">Job Description Too Short</div>
                          <div className="text-xs">
                            Please provide a more detailed job description for better results. AI works best with comprehensive details.
                          </div>
                        </div>
                      </div>
                    )}
                    {jobDescription.trim().length >= 50 && jobDescription.trim().length <= 100 && (
                      <div className="p-3 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 mr-2 mt-0.5 shrink-0"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                          <div className="font-medium mb-1">More Details Recommended</div>
                          <div className="text-xs">
                            Consider adding more details from the job posting to generate more targeted content.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <Button 
                      onClick={generateCoverLetter}
                      disabled={!jobDescription || generateCoverLetterMutation.isPending || generateSuggestionsMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {generateCoverLetterMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      Generate Full Letter
                    </Button>

                    <Button 
                      onClick={generateSuggestions}
                      disabled={!jobDescription || generateSuggestionsMutation.isPending || generateCoverLetterMutation.isPending}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      {generateSuggestionsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Get Suggestions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200">
              <CardContent className="pt-6 rounded-t-xl bg-transparent">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                    AI-Generated Content
                  </h3>

                  {generationTimestamp && (
                    <span className="text-xs text-neutral-500 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      Generated {generationTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>

                {!generatedContent ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center border border-dashed border-slate-200 rounded-lg">
                    <Sparkles className="h-12 w-12 text-neutral-300 mb-3" />
                    <p className="text-neutral-500 max-w-xs">
                      Provide job details and click 'Generate' to create a tailored cover letter, or get writing suggestions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div 
                        className="p-4 bg-primary/5 rounded-lg border border-primary/10 whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-y-auto" 
                        id="generatedContent"
                      >
                        {/* Process the content to replace placeholders with user data if available and clean AI commentary */}
                        {user ? (
                          <>{replaceUserPlaceholders(cleanAIOutput(generatedContent))}</>
                        ) : (
                          <>{cleanAIOutput(generatedContent).split(/(\[.*?\])/).map((part, index) => {
                            // Check if this part is a placeholder (surrounded by brackets)
                            const isPlaceholder = /^\[.*\]$/.test(part);
                            return isPlaceholder ? (
                              <span key={index} className="text-neutral-400" title="Fill in your personal details in your profile">
                                {part}
                              </span>
                            ) : (
                              <span key={index}>{part}</span>
                            );
                          })}</>
                        )}
                      </div>
                    </motion.div>

                    {/* Button row integrated with parent gradient background */}
                    <div className="grid grid-cols-4 gap-2 mt-4 px-2">
                      <Button 
                        variant="outline" 
                        className="col-span-1"
                        onClick={() => {
                          setGeneratedContent('');
                          setGenerationTimestamp(null);
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Reset
                      </Button>

                      <Button 
                        variant="outline"
                        className="col-span-1"
                        onClick={handleCopyToClipboard}
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>

                      <Button 
                        onClick={handleSaveGenerated} 
                        disabled={!generatedContent}
                        className="col-span-2"
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Save Letter
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>


        <TabsContent value="analyze" className="space-y-6">
          <motion.div 
            className="flex flex-col lg:flex-row gap-6 items-start will-change-opacity will-change-transform"
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            {/* Left column: Cover letter upload and job description - using lg:w-1/2 for proper sizing */}
            <div className="lg:w-1/2">
              <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200">
                <CardContent className="pt-6 rounded-t-xl bg-transparent">
                  <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
                    <FileUp className="h-5 w-5 mr-2 text-blue-500" />
                    Analyze Your Cover Letter
                  </h3>
                  <div className="space-y-6">
                    {/* Job Description input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium field-label">
                        <div className="flex items-center">
                          <span className="text-primary mr-1">1.</span> Job Description <span className="text-red-500 ml-1">*</span>
                        </div>
                        {analyzeJobDescription.trim().length > 100 && (
                          <span className="text-green-600 text-xs font-medium flex items-center field-status">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 mr-1"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Complete
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAnalyzeJobDescription("We're hiring a marketing associate with strong writing and cross-functional collaboration skills. The ideal candidate has experience creating compelling content, managing social media campaigns, and analyzing performance metrics. You'll work with our creative team to develop marketing materials that align with our brand voice and drive customer engagement.")}
                          className="h-6 text-xs text-primary ml-auto"
                        >
                          Paste Example
                        </Button>
                      </Label>
                      <Textarea
                        placeholder="We're hiring a marketing associate with strong writing and cross-functional collaboration skills..."
                        value={analyzeJobDescription}
                        onChange={(e) => setAnalyzeJobDescription(e.target.value)}
                        className={`min-h-[150px] resize-y border-2 ${
                          analyzeJobDescription.trim().length > 100 ? 'border-green-200 focus:border-green-300' : 
                          analyzeJobDescription.trim().length > 50 ? 'border-amber-200 focus:border-amber-300' : 
                          analyzeJobDescription.trim().length > 0 ? 'border-red-200 focus:border-red-300' : 
                          'border-primary/20 focus:border-primary/40'
                        }`}
                        id="jobDescription"
                        disabled={analyzeCoverLetterMutation.isPending}
                      />
                      {analyzeJobDescription.trim().length > 0 && analyzeJobDescription.trim().length < 50 && (
                        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 mr-2 mt-0.5 shrink-0"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <div>
                            <div className="font-medium mb-1">Job Description Too Short</div>
                            <div className="text-xs">
                              Please provide a more detailed job description (at least 50 characters) for accurate analysis.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cover Letter textarea */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium field-label">
                        <div className="flex items-center">
                          <span className="text-primary mr-1">2.</span> Your Cover Letter <span className="text-red-500 ml-1">*</span>
                        </div>
                        {analyzeCoverLetterText.trim().length > 200 && (
                          <span className="text-green-600 text-xs font-medium flex items-center field-status">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 mr-1"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Complete
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAnalyzeCoverLetterText("Dear Hiring Manager,\n\nI'm writing to apply for the Marketing Associate position at your company. With my background in content creation and digital marketing, I believe I would be a valuable addition to your team. I have experience managing social media campaigns, creating engaging content, and analyzing performance metrics to optimize marketing strategies.\n\nThank you for considering my application. I look forward to the opportunity to discuss how my skills align with your needs.\n\nSincerely,\n[Your Name]")}
                          className="h-6 text-xs text-primary ml-auto"
                        >
                          Paste Example
                        </Button>
                      </Label>
                      <Textarea
                        placeholder="Dear [Hiring Manager], I'm writing to apply for the Marketing Associate position..."
                        value={analyzeCoverLetterText}
                        onChange={(e) => setAnalyzeCoverLetterText(e.target.value)}
                        className={`min-h-[200px] resize-y border-2 ${
                          analyzeCoverLetterText.trim().length > 200 ? 'border-green-200 focus:border-green-300' : 
                          analyzeCoverLetterText.trim().length > 100 ? 'border-amber-200 focus:border-amber-300' : 
                          analyzeCoverLetterText.trim().length > 0 ? 'border-red-200 focus:border-red-300' : 
                          'border-primary/20 focus:border-primary/40'
                        }`}
                        id="coverLetterInput"
                        disabled={analyzeCoverLetterMutation.isPending}
                      />
                      {analyzeCoverLetterText.trim().length > 0 && analyzeCoverLetterText.trim().length < 100 && (
                        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 mr-2 mt-0.5 shrink-0"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <div>
                            <div className="font-medium mb-1">Cover Letter Too Short</div>
                            <div className="text-xs">
                              Please provide a more complete cover letter (at least 100 characters) for meaningful analysis.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Analyze button with tooltip */}
                    <div className="relative">
                      <Button 
                        className="w-full relative transition-all duration-300" 
                        onClick={handleAnalyzeCoverLetter}
                        disabled={analyzeCoverLetterMutation.isPending || !analyzeJobDescription.trim() || !analyzeCoverLetterText.trim() || 
                                 analyzeJobDescription.trim().length < 50 || analyzeCoverLetterText.trim().length < 100}
                        variant={analyzeCoverLetterMutation.isPending ? "outline" : "default"}
                        id="analyzeBtn"
                        title="AI will assess how well your cover letter aligns with the job description and offer suggestions to improve clarity, tone, and relevance."
                      >
                        {analyzeCoverLetterMutation.isPending ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing Cover Letter...
                          </>
                        ) : (
                          <>
                            <BarChart4 className="h-4 w-4 mr-2" />
                            {!analyzeJobDescription.trim() || !analyzeCoverLetterText.trim() ? 
                            "Analyze Cover Letter" : 
                            "Analyze Cover Letter"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: Analysis results or loading state or instructions */}
            <div className="lg:w-1/2">
              {analysisResult ? (
                <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200">
                  <CardContent className="pt-6 pb-1 rounded-t-xl bg-transparent">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header" id="analysisHeader">
                        <BarChart4 className="h-5 w-5 mr-2 text-blue-500" />
                        AI Analysis Results
                      </h3>
                      <span className="text-xs text-neutral-500 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                        Analyzed {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Score cards are styled with dynamic classes based on score */}
                        <div className={`flex flex-col items-center p-3 rounded-lg border score-box ${
                          Math.round(analysisResult.overallScore) < 60 
                            ? 'bg-red-50/70 border-red-100' 
                            : Math.round(analysisResult.overallScore) < 80 
                              ? 'bg-amber-50/70 border-amber-100' 
                              : 'bg-emerald-50/70 border-emerald-100'
                        }`}
                            title="Overall score reflecting the quality of your cover letter">
                          <span className="text-xl font-bold">{Math.round(analysisResult.overallScore)}</span>
                          <span className="text-xs text-neutral-500">Overall</span>
                          <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                            {Math.round(analysisResult.overallScore) < 60 
                              ? 'Needs Work' 
                              : Math.round(analysisResult.overallScore) < 80 
                                ? 'Good'
                                : 'Excellent'}
                          </span>
                        </div>

                        <div className={`flex flex-col items-center p-3 rounded-lg border score-box ${
                          Math.round(analysisResult.alignment) < 60 
                            ? 'bg-red-50/70 border-red-100' 
                            : Math.round(analysisResult.alignment) < 80 
                              ? 'bg-amber-50/70 border-amber-100' 
                              : 'bg-emerald-50/70 border-emerald-100'
                        }`}
                            title="How well your letter aligns with the job requirements">
                          <span className="text-xl font-bold">{Math.round(analysisResult.alignment)}</span>
                          <span className="text-xs text-neutral-500">Alignment</span>
                          <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                            {Math.round(analysisResult.alignment) < 60 
                              ? 'Misaligned' 
                              : Math.round(analysisResult.alignment) < 80 
                                ? 'Aligned'
                                : 'Perfect Match'}
                          </span>
                        </div>

                        <div className={`flex flex-col items-center p-3 rounded-lg border score-box ${
                          Math.round(analysisResult.persuasiveness) < 60 
                            ? 'bg-red-50/70 border-red-100' 
                            : Math.round(analysisResult.persuasiveness) < 80 
                              ? 'bg-amber-50/70 border-amber-100' 
                              : 'bg-emerald-50/70 border-emerald-100'
                        }`}
                            title="How persuasive and compelling your letter is">
                          <span className="text-xl font-bold">{Math.round(analysisResult.persuasiveness)}</span>
                          <span className="text-xs text-neutral-500">Persuasive</span>
                          <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                            {Math.round(analysisResult.persuasiveness) < 60 
                              ? 'Basic' 
                              : Math.round(analysisResult.persuasiveness) < 80 
                                ? 'Convincing'
                                : 'Compelling'}
                          </span>
                        </div>

                        <div className={`flex flex-col items-center p-3 rounded-lg border score-box ${
                          Math.round(analysisResult.clarity) < 60 
                            ? 'bg-red-50/70 border-red-100' 
                            : Math.round(analysisResult.clarity) < 80 
                              ? 'bg-amber-50/70 border-amber-100' 
                              : 'bg-emerald-50/70 border-emerald-100'
                        }`}
                            title="Clarity and readability of your writing">
                          <span className="text-xl font-bold">{Math.round(analysisResult.clarity)}</span>
                          <span className="text-xs text-neutral-500">Clarity</span>
                          <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                            {Math.round(analysisResult.clarity) < 60 
                              ? 'Unclear' 
                              : Math.round(analysisResult.clarity) < 80 
                                ? 'Clear'
                                : 'Crystal Clear'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <span className="text-emerald-500 mr-1">✓</span> Strengths
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-emerald-50/50 p-2 rounded-md border border-emerald-100/50" id="strengthsList">
                          {analysisResult.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-neutral-700">{strength}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <span className="text-amber-500 mr-1">⚠️</span> Areas to Improve
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-amber-50/50 p-2 rounded-md border border-amber-100/50" id="areasToImproveList">
                          {analysisResult.weaknesses.map((weakness: string, index: number) => (
                            <li key={index} className="text-neutral-700">{weakness}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <span className="text-blue-500 mr-1">💡</span> Suggestions
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-blue-50/50 p-2 rounded-md border border-blue-100/50" id="suggestionsList">
                          {analysisResult.improvementSuggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-neutral-700">{suggestion}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 flex flex-col h-full" id="optimizedCoverLetterSection">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium flex items-center">
                            <span className="text-primary mr-1">📝</span> Optimized Cover Letter
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs" 
                            onClick={() => {
                              const optimizedSection = document.getElementById('optimizedCoverLetterContent');
                              const toggleButton = document.getElementById('toggleOptimizedBtn');
                              if (optimizedSection && toggleButton) {
                                if (optimizedSection.classList.contains('hidden')) {
                                  optimizedSection.classList.remove('hidden');
                                  toggleButton.textContent = 'Hide';
                                } else {
                                  optimizedSection.classList.add('hidden');
                                  toggleButton.textContent = 'Show';
                                }
                              }
                            }}
                            id="toggleOptimizedBtn"
                          >
                            Hide
                          </Button>
                        </div>

                        {/* Styled content box with scrollable area */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 relative flex-grow">
                          {/* Generation timestamp metadata */}
                          {generationTimestamp && (
                            <div className="absolute top-1 right-2 text-xs text-slate-400 italic">
                              Generated: {new Intl.DateTimeFormat('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).format(generationTimestamp)}
                            </div>
                          )}

                          <div 
                            className="p-4 max-h-[400px] overflow-y-auto text-sm whitespace-pre-wrap"
                            id="optimizedCoverLetterContent"
                          >
                            {analysisResult.optimizedCoverLetter && replaceUserPlaceholders(cleanAIOutput(analysisResult.optimizedCoverLetter))
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
                          </div>
                        </div>
                      </div>
                      
                      {/* Action button row directly on gradient background */}
                      <div className="p-6 pt-0">
                        <div className="grid grid-cols-4 gap-2">
                          <Button 
                            variant="outline" 
                            className="col-span-1"
                            onClick={() => {
                              setAnalysisResult({
                                ...analysisResult,
                                optimizedCoverLetter: ''
                              });
                            }}
                            title="Reset optimized content"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Reset
                          </Button>

                          <Button 
                            variant="outline"
                            className="col-span-1"
                            onClick={() => handleCopyOptimizedCoverLetter()}
                            disabled={!analysisResult.optimizedCoverLetter}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>

                          <Button 
                            className="col-span-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                            onClick={handleSaveOptimizedCoverLetter}
                            title="Save this optimized version as a new cover letter"
                            disabled={!analysisResult.optimizedCoverLetter}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Save Optimized Version
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : analyzeCoverLetterMutation.isPending ? (
                <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200">
                  <CardContent className="pt-6 rounded-t-xl bg-transparent">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header" id="analysisHeader">
                        <BarChart4 className="h-5 w-5 mr-2 text-blue-500" />
                        AI Analysis Results
                      </h3>
                    </div>

                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="w-16 h-16 mb-6 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      </div>

                      <p className="text-neutral-600 text-lg mb-2">
                        Analyzing your cover letter...
                      </p>

                      <p className="text-neutral-500 mb-6">
                        This may take a few seconds.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200">
                  <CardContent className="pt-6 rounded-t-xl bg-transparent">
                    <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header" id="analysisHeader">
                      <BarChart4 className="h-5 w-5 mr-2 text-blue-500" />
                      AI Analysis Results
                    </h3>

                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="w-16 h-16 mb-6 text-neutral-200">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M32 12L35.3 18.76L42.64 19.84L37.32 25.04L38.64 32.36L32 28.88L25.36 32.36L26.68 25.04L21.36 19.84L28.7 18.76L32 12Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M32 12L35.3 18.76L42.64 19.84L37.32 25.04L38.64 32.36L32 28.88L25.36 32.36L26.68 25.04L21.36 19.84L28.7 18.76L32 12Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M44 42L46 46L50 47L47 50L48 54L44 52L40 54L41 50L38 47L42 46L44 42Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M20 44L18 46L20 48L18 50L20 52L22 50L24 52L22 48L24 46L22 44L20 44Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      <p className="text-neutral-600 text-lg mb-2">
                        Submit your cover letter and job description
                      </p>

                      <p className="text-neutral-500 mb-6">
                        to see AI-powered analysis and suggestions.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        </TabsContent>














































































































































































































































































































































































































































































































      </Tabs>

      {/* Cover letter creation/edit dialog */}
      <Dialog open={isAddLetterOpen} onOpenChange={setIsAddLetterOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCoverLetter ? 'Edit Cover Letter' : 'Create New Cover Letter'}
            </DialogTitle>
          </DialogHeader>
          <CoverLetterForm
            coverLetter={selectedCoverLetter}
            onSuccess={() => setIsAddLetterOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      {previewLetter && (
        <Dialog open={!!previewLetter} onOpenChange={() => setPreviewLetter(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{previewLetter.name}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportCoverLetterToPDF()}
                  title="Download letter body text as PDF"
                  className="flex items-center gap-2 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Body</span>
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div 
              className="space-y-6 p-4 bg-white" 
              id="pdf-export-content"
            >
              {/* Header with contact info */}
              <div className="text-center">
                <h2 className="text-xl font-bold">{previewLetter.content.header.fullName || '[Your Name]'}</h2>
                <div className="text-sm space-x-2 text-neutral-600 mt-1 flex justify-center flex-wrap">
                  {previewLetter.content.header.email && <span>{previewLetter.content.header.email}</span>}
                  {previewLetter.content.header.phone && <><span>|</span><span>{previewLetter.content.header.phone}</span></>}
                  {previewLetter.content.header.location && <><span>|</span><span>{previewLetter.content.header.location}</span></>}
                </div>
                <div className="text-sm text-neutral-500 mt-1">
                  {previewLetter.content.header.date || new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Recipient Info */}
              <div className="space-y-1">
                {previewLetter.content.recipient.name && <p>{previewLetter.content.recipient.name}</p>}
                {previewLetter.content.recipient.position && <p>{previewLetter.content.recipient.position}</p>}
                {previewLetter.content.recipient.company && <p>{previewLetter.content.recipient.company}</p>}
                {previewLetter.content.recipient.address && <p>{previewLetter.content.recipient.address}</p>}
              </div>

              {/* Greeting */}
              <p>Dear {previewLetter.content.recipient.name || 'Hiring Manager'},</p>

              {/* Body content */}
              <div className="whitespace-pre-wrap">
                {previewLetter.content.body}
              </div>

              {/* Closing */}
              <div className="space-y-4">
                <p>{previewLetter.content.closing || 'Sincerely,'}</p>
                <p>{previewLetter.content.header.fullName || '[Your Name]'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}