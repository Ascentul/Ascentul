import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { exportCoverLetterToPDF } from "@/utils/exportPDF";
import { jsPDF } from "jspdf";
import CleanedCoverLetterContent from "@/components/CleanedCoverLetterContent";
import { Plus, Mail, Download, Copy, Trash2, Edit, FileText, Sparkles, BarChart4, UploadCloud, FileUp, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CoverLetterForm from "@/components/CoverLetterForm";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
export default function CoverLetter() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddLetterOpen, setIsAddLetterOpen] = useState(false);
    const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);
    const [previewLetter, setPreviewLetter] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [copySuccess, setCopySuccess] = useState(false);
    const [optimizedCopySuccess, setOptimizedCopySuccess] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [generationTimestamp, setGenerationTimestamp] = useState(null);
    // Fetch user's cover letters
    const { data: coverLetters = [], isLoading } = useQuery({
        queryKey: ["/api/cover-letters"]
    });
    // AI generation form fields
    const [jobTitle, setJobTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [generatedContent, setGeneratedContent] = useState("");
    // Analysis form fields
    const [analyzeJobDescription, setAnalyzeJobDescription] = useState("");
    const [analyzeCoverLetterText, setAnalyzeCoverLetterText] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const deleteCoverLetterMutation = useMutation({
        mutationFn: async (letterId) => {
            return apiRequest("DELETE", `/api/cover-letters/${letterId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
            toast({
                title: "Cover Letter Deleted",
                description: "Your cover letter has been deleted successfully"
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to delete cover letter: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const duplicateCoverLetterMutation = useMutation({
        mutationFn: async (coverLetter) => {
            // Create a new object without the id, createdAt, and updatedAt properties
            const { id, createdAt, updatedAt, ...restOfLetter } = coverLetter;
            const newCoverLetter = {
                ...restOfLetter,
                name: `${coverLetter.name} (Copy)`
            };
            return apiRequest("POST", "/api/cover-letters", newCoverLetter);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
            toast({
                title: "Cover Letter Duplicated",
                description: "A copy of your cover letter has been created"
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to duplicate cover letter: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const generateCoverLetterMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/cover-letters/generate", {
                jobTitle,
                companyName,
                jobDescription,
                type: "complete"
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Cover Letter Generated",
                description: "AI has generated a cover letter for you"
            });
            setGeneratedContent(data.content);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to generate cover letter: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const generateSuggestionsMutation = useMutation({
        mutationFn: async () => {
            // For suggestions, only the job description is required
            const res = await apiRequest("POST", "/api/cover-letters/generate", {
                jobTitle: jobTitle || "Not specified",
                companyName: companyName || "Not specified",
                jobDescription,
                type: "suggestions"
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Suggestions Generated",
                description: "Writing suggestions for your cover letter have been generated"
            });
            setGeneratedContent(data.suggestions || data.content);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to generate suggestions: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const analyzeCoverLetterMutation = useMutation({
        mutationFn: async () => {
            if (!analyzeJobDescription || !analyzeCoverLetterText) {
                throw new Error("Both job description and cover letter are required");
            }
            const res = await apiRequest("POST", "/api/cover-letters/analyze", {
                coverLetter: analyzeCoverLetterText,
                jobDescription: analyzeJobDescription
            });
            return res.json();
        },
        onSuccess: (data) => {
            setAnalysisResult(data);
            toast({
                title: "Analysis Complete",
                description: "Your cover letter has been analyzed successfully"
            });
        },
        onError: (error) => {
            toast({
                title: "Analysis Failed",
                description: `Error analyzing cover letter: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const handleDeleteLetter = (coverLetterId) => {
        if (confirm("Are you sure you want to delete this cover letter?")) {
            deleteCoverLetterMutation.mutate(coverLetterId);
        }
    };
    const handleSaveGenerated = () => {
        if (!generatedContent)
            return;

        // Initialize user data with empty values
        const userData = {
            fullName: "",
            email: "",
            phone: "",
            // Use LinkedIn URL if available, otherwise default to empty location
            location: window.linkedInProfile || ""
        };
        try {
            // Safely attempt to get user data if available in the component
            if (user) {

                userData.fullName = user.name || "";
                userData.email = user.email || "";
                // User phone might come from a profile object or contact info
                // For now, keep any existing userData.phone value if it exists
                // Only use location if LinkedIn isn't available
                if (!userData.location) {
                    userData.location = user.location || "";
                }
            }
        }
        catch (err) {
            console.error("Error retrieving user data for cover letter:", err);

        }
        // Process content to remove any AI commentary or formatting issues
        const processedContent = cleanAIOutput(generatedContent);

        // Create a properly formatted cover letter with the generated content
        const newCoverLetter = {
            name: `${jobTitle} at ${companyName}`,
            jobTitle: jobTitle, // Add job title at the root level
            template: "standard",
            content: {
                header: {
                    fullName: userData.fullName,
                    email: userData.email,
                    phone: userData.phone,
                    location: userData.location,
                    date: new Date().toLocaleDateString()
                },
                recipient: {
                    name: "",
                    company: companyName,
                    position: "Hiring Manager",
                    address: ""
                },
                body: processedContent,
                closing: "Sincerely,"
            }
        };
        // Create a new cover letter with the mutation
        apiRequest("POST", "/api/cover-letters", newCoverLetter)
            .then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
            toast({
                title: "✅ Cover letter saved",
                description: "Your cover letter has been saved to 'My Cover Letters'"
            });
            setGeneratedContent("");
            setJobTitle("");
            setCompanyName("");
            setJobDescription("");
            // Redirect to main tab would go here if needed
        })
            .catch((error) => {
            console.error("Error saving cover letter:", error);
            toast({
                title: "Error saving cover letter",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            });
        });
    };
    const filteredLetters = () => {
        if (!coverLetters || !Array.isArray(coverLetters))
            return [];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return coverLetters.filter((coverLetter) => coverLetter.name.toLowerCase().includes(query));
        }
        return coverLetters;
    };
    // Helper function to clean AI output by removing meta commentary
    const cleanAIOutput = (text) => {
        if (!text)
            return "";
        // Check for separator like "---" and cut content after it
        const cutoff = text.indexOf("---");
        if (cutoff !== -1)
            return text.slice(0, cutoff).trim();
        // Filter out lines with common AI meta-commentary
        const lines = text.split("\n");
        const filteredLines = lines.filter((line) => {
            const lowerLine = line.toLowerCase();
            return (!lowerLine.startsWith("this cover letter") &&
                !lowerLine.startsWith("overall") &&
                !lowerLine.startsWith("the above text") &&
                !lowerLine.startsWith("in summary") &&
                !lowerLine.startsWith("this version") &&
                !lowerLine.includes("aligns your experience") &&
                !lowerLine.includes("demonstrates your qualifications") &&
                !lowerLine.includes("effectively showcases") &&
                !lowerLine.includes("feel free to customize"));
        });
        return filteredLines.join("\n").trim();
    };
    // This function has been moved to a utility file, we're keeping it here for backwards compatibility
    // with other parts of the code
    const directPdfExport = (coverLetter) => {
        // First set the preview letter so the proper content is in the DOM
        setPreviewLetter(coverLetter);
        // Use a timeout to ensure the DOM is updated before export
        setTimeout(() => {
            // Call the utility directly (no parameters needed)
            exportCoverLetterToPDF();

        }, 100);
        try {
            // Create a temporary div for PDF export with professional styling
            const container = document.createElement("div");
            container.id = "coverLetterPreview";
            container.className = "pdf-export";
            // Apply professional PDF styling
            container.style.width = "8.5in";
            container.style.minHeight = "11in";
            container.style.padding = "1in";
            container.style.fontFamily = "Georgia, serif";
            container.style.fontSize = "12pt";
            container.style.lineHeight = "1.6";
            container.style.color = "#000";
            container.style.backgroundColor = "white";
            container.style.boxSizing = "border-box";
            // Create inner container for proper alignment
            const innerContainer = document.createElement("div");
            innerContainer.className = "pdf-inner";
            innerContainer.style.maxWidth = "6.5in";
            innerContainer.style.margin = "0 auto";
            innerContainer.style.textAlign = "left";
            // Get letter data
            const letter = coverLetter;
            // Process body content
            let bodyContent = "";
            if (letter.content.body) {
                bodyContent = letter.content.body
                    .split("\n")
                    .filter((para) => para.trim().length > 0)
                    .map((para) => `<p style="margin-bottom: 12px;">${para}</p>`)
                    .join("");
            }
            else {
                bodyContent =
                    '<p style="margin-bottom: 12px;">No content available.</p>';
            }
            // Create professional letter content with proper formatting
            innerContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 36px;">
          <h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 8px; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;">${letter.content.header.fullName || "[Your Name]"}</h1>
          <p style="margin-bottom: 12px;">${letter.content.header.date || new Date().toLocaleDateString()}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <p style="margin-bottom: 4px;">Hiring Manager</p>
          <p style="margin-bottom: 4px;">${letter.content.recipient.company || "Company Name"}</p>
        </div>

        <p style="margin-bottom: 24px;">Dear Hiring Manager,</p>

        <div style="margin-bottom: 24px; text-align: justify;">
          ${bodyContent}
        </div>

        <div style="margin-top: 36px;">
          <p style="margin-bottom: 24px;">${letter.content.closing || "Sincerely,"}</p>
          <p>${letter.content.header.fullName || "[Your Name]"}</p>
        </div>
      `;
            // Append the inner container to the main container
            container.appendChild(innerContainer);
            // Attach to document but position off-screen
            container.style.position = "fixed";
            container.style.top = "0";
            container.style.left = "-9999px";
            container.style.zIndex = "-1000";
            document.body.appendChild(container);
            // Generate filename from letter name
            const filename = `${letter.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
            // Configure PDF export options for better quality and formatting
            const options = {
                margin: 0, // No margins since we've already applied them in the container
                filename: filename,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    allowTaint: true,
                    backgroundColor: "#ffffff"
                },
                jsPDF: {
                    unit: "in",
                    format: "letter",
                    orientation: "portrait",
                    compress: true
                }
            };

            // Add delay to ensure DOM rendering is complete
            setTimeout(() => {
                window
                    .html2pdf()
                    .from(container)
                    .set(options)
                    .save()
                    .then(() => {

                    toast({
                        title: "PDF Downloaded",
                        description: `Your cover letter "${letter.name}" has been saved as a PDF.`
                    });
                    // Clean up
                    document.body.removeChild(container);
                })
                    .catch((err) => {
                    console.error("Professional PDF generation failed:", err);
                    toast({
                        title: "Error",
                        description: "PDF generation failed. Trying alternative method...",
                        variant: "destructive"
                    });
                    // Clean up
                    document.body.removeChild(container);
                    // Fall back to direct jsPDF generation if HTML method fails
                    try {
                        // Get a direct reference to the jsPDF library
                        const { jsPDF } = window.html2pdf().worker;
                        // Create a new PDF document
                        const doc = new jsPDF({
                            orientation: "portrait",
                            unit: "pt",
                            format: "letter"
                        });
                        // Set up basic configurations
                        doc.setFont("Georgia");
                        doc.setFontSize(12);
                        // Define page dimensions
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const pageHeight = doc.internal.pageSize.getHeight();
                        const margin = 72; // 1 inch margins in points
                        const textWidth = pageWidth - margin * 2;
                        // Define starting positions
                        let y = margin;
                        const x = margin;
                        // Header section - centered
                        doc.setFontSize(16);
                        doc.setFont("Georgia", "bold");
                        // Full name
                        const fullName = letter.content.header.fullName || "[Your Name]";
                        const fullNameWidth = (doc.getStringUnitWidth(fullName) *
                            16 *
                            doc.internal.scaleFactor) /
                            72;
                        doc.text(fullName, (pageWidth - fullNameWidth) / 2, y);
                        y += 24;
                        // Date
                        doc.setFontSize(12);
                        doc.setFont("Georgia", "normal");
                        const date = letter.content.header.date || new Date().toLocaleDateString();
                        const dateWidth = (doc.getStringUnitWidth(date) * 12 * doc.internal.scaleFactor) /
                            72;
                        doc.text(date, (pageWidth - dateWidth) / 2, y);
                        y += 40;
                        // Recipient section
                        doc.text("Hiring Manager", x, y);
                        y += 20;
                        doc.text(letter.content.recipient.company || "Company Name", x, y);
                        y += 40;
                        // Greeting
                        doc.text("Dear Hiring Manager,", x, y);
                        y += 40;
                        // Body content
                        if (letter.content.body) {
                            // Process the body text by splitting into paragraphs
                            const paragraphs = letter.content.body
                                .split("\n")
                                .filter((para) => para.trim().length > 0);
                            // Add each paragraph with spacing
                            for (const paragraph of paragraphs) {
                                // Word wrapping with split text function
                                const splitText = doc.splitTextToSize(paragraph, textWidth);
                                doc.text(splitText, x, y);
                                y += 20 * splitText.length; // Add spacing based on number of wrapped lines
                                y += 20; // Space between paragraphs
                            }
                        }
                        else {
                            doc.text("No content available.", x, y);
                            y += 20;
                        }
                        // Add closing
                        y += 20;
                        doc.text(letter.content.closing || "Sincerely,", x, y);
                        y += 40;
                        doc.text(letter.content.header.fullName || "[Your Name]", x, y);
                        // Save the PDF
                        doc.save(filename);
                        // Show success notification
                        toast({
                            title: "PDF Downloaded",
                            description: `Your cover letter "${letter.name}" has been saved as a PDF.`
                        });
                    }
                    catch (finalError) {
                        console.error("All PDF generation methods failed:", finalError);
                        toast({
                            title: "Error",
                            description: "All PDF generation methods failed. Please try again later.",
                            variant: "destructive"
                        });
                    }
                });
            }, 500); // Increased delay to ensure rendering
        }
        catch (error) {
            console.error("Error in PDF export setup:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred while preparing the PDF.",
                variant: "destructive"
            });
        }
    };
    // Handle PDF downloads for any cover letter content
    const handleDownloadPDF = (elementId) => {

        // For cover letter card buttons - extract the letter ID and use it for direct export
        if (elementId.startsWith("previewLetter-")) {
            const letterId = parseInt(elementId.replace("previewLetter-", ""), 10);

            // Find the letter in the cover letters array
            const letterToExport = coverLetters.find((letter) => letter.id === letterId);
            if (letterToExport) {

                // Set the preview letter so our export function can access it
                setPreviewLetter(letterToExport);
                // Use setTimeout to ensure state is updated before exporting
                setTimeout(() => {

                    exportCoverLetterToPDF();
                }, 50);
                return;
            }
            else {
                // If letter not found, show a toast
                toast({
                    title: "Error",
                    description: `Could not find cover letter with ID ${letterId}`,
                    variant: "destructive"
                });
                return;
            }
        }
        // For generated content case
        if (elementId === "generatedContent") {
            const filename = `Generated_Cover_Letter_${new Date().toISOString().split("T")[0]}.pdf`;
            exportPDF(elementId, filename);
            return;
        }
        // For optimized content case
        if (elementId === "optimizedCoverLetterContent") {
            const filename = `Optimized_Cover_Letter_${new Date().toISOString().split("T")[0]}.pdf`;
            exportPDF(elementId, filename);
            return;
        }
        // Default case - just use the element ID as part of filename
        const filename = `${elementId.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
        exportPDF(elementId, filename);
    };
    // Helper function to replace placeholder tags with user information
    const replaceUserPlaceholders = (text) => {
        if (!user)
            return text;
        // Fetch career data from the cache if possible
        const queryClient = useQueryClient();
        const careerData = queryClient.getQueryData(["/api/career-data"]);
        // Validate field length for proper fallbacks
        const nameToDisplay = user.name && user.name.length >= 2 ? user.name : "[Your Name]";
        const emailToDisplay = user.email && user.email.length >= 5 ? user.email : "[Email Address]";
        // We'll use a default value since phone may not be in the user object
        const phoneToDisplay = "[Phone Number]";
        // Check if we have a LinkedIn URL to use instead of just the location
        const linkedInUrl = careerData?.linkedInUrl;
        // Store the LinkedIn URL separately for the preview dialog
        if (linkedInUrl) {

            window.linkedInProfile = linkedInUrl;
        }
        else {
            window.linkedInProfile = null;
        }
        // First, modify the text to replace "City, State" in the contact line with "LinkedIn"
        if (linkedInUrl) {
            // Common contact line formats in cover letters
            text = text.replace(/(vincentholm@gmail\.com\s*\|\s*)City,\s*State(\s*\|\s*555-555-5555)/gi, "$1LinkedIn$2");
            text = text.replace(/(.*@.*\.com\s*\|\s*)City,\s*State(\s*\|\s*.*)/gi, "$1LinkedIn$2");
            // Also replace standalone "City, State" anywhere in the document
            text = text.replace(/\bCity,\s*State\b/gi, "LinkedIn");
            // Replace any standalone "LinkedIn" text that's not part of a longer word
            // This is used for DOM replacement in the UI with a hyperlink
            text = text.replace(/\bLinkedIn\b/gi, "{{LINKEDIN_URL}}");
        }
        else {
            // Use location when LinkedIn is not available or empty string if not available
            const locationToDisplay = user.location && user.location.length >= 2 ? user.location : "";
            text = text.replace(/\bCity,\s*State\b/gi, locationToDisplay);
        }
        return (text
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
            // Location/Address replacements (for any standard placeholders)
            // Instead of replacing with [Your Address] placeholder, use empty string
            .replace(/\[Your Location\]/g, linkedInUrl ? "LinkedIn" : user.location || "")
            .replace(/\[your location\]/g, linkedInUrl
            ? "linkedin"
            : typeof user.location === "string" && user.location
                ? user.location.toLowerCase()
                : "")
            .replace(/\[YOUR LOCATION\]/g, linkedInUrl
            ? "LINKEDIN"
            : typeof user.location === "string" && user.location
                ? user.location.toUpperCase()
                : "")
            .replace(/\[Your Address\]/g, linkedInUrl ? "LinkedIn" : user.location || "")
            .replace(/\[your address\]/g, linkedInUrl
            ? "linkedin"
            : typeof user.location === "string" && user.location
                ? user.location.toLowerCase()
                : "")
            .replace(/\[YOUR ADDRESS\]/g, linkedInUrl
            ? "LINKEDIN"
            : typeof user.location === "string" && user.location
                ? user.location.toUpperCase()
                : ""));
    };
    // Function to copy content to clipboard
    const handleCopyToClipboard = () => {
        // Process content: clean AI commentary and replace user placeholders
        const processedContent = replaceUserPlaceholders(cleanAIOutput(generatedContent));
        navigator.clipboard
            .writeText(processedContent)
            .then(() => {
            setCopySuccess(true);
            toast({
                title: "✅ Copied to clipboard",
                description: "The cover letter content has been copied"
            });
            // Reset copy success after 3 seconds
            setTimeout(() => setCopySuccess(false), 3000);
        })
            .catch((error) => {
            toast({
                title: "Copy failed",
                description: "Failed to copy content to clipboard",
                variant: "destructive"
            });
            console.error("Copy failed:", error);
        });
        // Create an element to scroll to the generated content to provide feedback
        const contentElement = document.getElementById("generatedContent");
        if (contentElement) {
            contentElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    };
    const generateCoverLetter = () => {
        if (!jobDescription) {
            toast({
                title: "Missing Information",
                description: "Please provide a job description to generate a cover letter",
                variant: "destructive"
            });
            return;
        }
        generateCoverLetterMutation.mutate();
        setGenerationTimestamp(new Date());
    };
    const generateSuggestions = () => {
        if (!jobDescription) {
            toast({
                title: "Missing Information",
                description: "Please provide a job description to generate suggestions",
                variant: "destructive"
            });
            return;
        }
        generateSuggestionsMutation.mutate();
        setGenerationTimestamp(new Date());
    };
    const handleAnalyzeCoverLetter = () => {
        if (!analyzeJobDescription || !analyzeCoverLetterText) {
            toast({
                title: "Missing Information",
                description: "Please provide both a job description and cover letter to analyze",
                variant: "destructive"
            });
            return;
        }
        analyzeCoverLetterMutation.mutate();
    };
    // Function to copy optimized cover letter content to clipboard
    const handleCopyOptimizedCoverLetter = async () => {
        if (!analysisResult?.optimizedCoverLetter) {
            toast({
                title: "Nothing to copy",
                description: "No optimized cover letter content available",
                variant: "destructive"
            });
            return;
        }
        try {
            // First, clean the optimized letter content using the new API endpoint
            setIsCleaning(true);
            const response = await fetch("/api/strip-optimized-cover-letter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    optimizedLetter: analysisResult.optimizedCoverLetter
                })
            });
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const data = await response.json();
            // Get the cleaned version of the letter
            let contentToCopy = data.cleanedLetterBody;
            // If cleaning failed, fall back to the original content with placeholder replacement
            if (!contentToCopy) {
                contentToCopy = replaceUserPlaceholders(analysisResult.optimizedCoverLetter);
            }
            // Copy to clipboard
            await navigator.clipboard.writeText(contentToCopy);
            // Show success toast
            setOptimizedCopySuccess(true);
            toast({
                title: "✅ Copied to clipboard",
                description: "The optimized cover letter body has been copied"
            });
            // Reset copy success after 3 seconds
            setTimeout(() => setOptimizedCopySuccess(false), 3000);
        }
        catch (error) {
            console.error("Error during optimized letter copy:", error);
            // Fall back to the original approach if the API fails
            const processedContent = replaceUserPlaceholders(analysisResult.optimizedCoverLetter);
            try {
                await navigator.clipboard.writeText(processedContent);
                setOptimizedCopySuccess(true);
                toast({
                    title: "✅ Copied to clipboard",
                    description: "The optimized cover letter has been copied"
                });
                setTimeout(() => setOptimizedCopySuccess(false), 3000);
            }
            catch (clipboardError) {
                toast({
                    title: "Copy failed",
                    description: "Failed to copy content to clipboard",
                    variant: "destructive"
                });
                console.error("Copy failed:", clipboardError);
            }
        }
        finally {
            setIsCleaning(false);
        }
        // Create an element to scroll to the optimized content to provide feedback
        const contentElement = document.getElementById("optimizedCoverLetterContent");
        if (contentElement) {
            contentElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    };
    const handleSaveOptimizedCoverLetter = async () => {
        if (!analysisResult?.optimizedCoverLetter)
            return;
        // Show loading state
        setIsCleaning(true);
        try {
            // Create a local variable to hold the cleaned content
            let cleanedContent = analysisResult.optimizedCoverLetter;
            // Get job-related info for improved cleaning
            let jobTitle = analysisResult.jobDetails?.jobTitle || "Position";
            let companyName = analysisResult.jobDetails?.companyName || "Company";
            const userEmail = user?.email || "";
            try {
                // Use the new enhanced cleaning endpoint with better AI context
                const response = await fetch("/api/save-cleaned-cover-letter", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        optimizedLetter: analysisResult.optimizedCoverLetter,
                        jobTitle,
                        companyName,
                        userEmail
                    })
                });
                if (!response.ok) {

                    // Fall back to simpler endpoint if the enhanced one fails
                    const fallbackResponse = await fetch("/api/strip-optimized-cover-letter", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            optimizedLetter: analysisResult.optimizedCoverLetter
                        })
                    });
                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        if (fallbackData.cleanedLetterBody) {
                            cleanedContent = fallbackData.cleanedLetterBody;

                        }
                    }
                }
                else {
                    const responseText = await response.text();
                    try {
                        // Safely try to parse the JSON
                        const data = JSON.parse(responseText);
                        if (data.cleanedFinalBody) {
                            cleanedContent = data.cleanedFinalBody;

                        }
                        else if (data.cleanedLetterBody) {
                            // For backward compatibility
                            cleanedContent = data.cleanedLetterBody;

                        }
                    }
                    catch (parseError) {
                        console.error("Error parsing API response:", parseError);

                        // Continue with the process using original content
                    }
                }
            }
            catch (apiError) {
                console.error("API cleaning error:", apiError);
                // Continue with the original content if API cleaning fails
            }
            // Get user data if available
            const userData = {
                fullName: user?.name || "",
                email: user?.email || "",
                phone: "",
                location: window.linkedInProfile || user?.location || ""
            };
            // We already have these variables defined above, no need to redefine them
            // Create a new cover letter with the cleaned content
            const newCoverLetter = {
                name: `Optimized for ${jobTitle} at ${companyName}`,
                jobTitle: jobTitle || "Optimized Position",
                template: "standard",
                content: {
                    header: {
                        fullName: userData.fullName,
                        email: userData.email,
                        phone: userData.phone,
                        location: userData.location,
                        date: new Date().toLocaleDateString()
                    },
                    recipient: {
                        name: "",
                        company: companyName,
                        position: "Hiring Manager",
                        address: ""
                    },
                    body: cleanedContent,
                    closing: "Sincerely,"
                }
            };
            // Create a new cover letter with the mutation
            await apiRequest("POST", "/api/cover-letters", newCoverLetter);
            queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
            toast({
                title: "✅ Optimized Cover Letter Saved",
                description: "Your optimized cover letter has been saved to 'My Cover Letters'"
            });
            // Reset form fields
            setAnalysisResult(null);
            setAnalyzeJobDescription("");
            setAnalyzeCoverLetterText("");
        }
        catch (error) {
            console.error("Error saving optimized cover letter:", error);
            toast({
                title: "Error",
                description: error instanceof Error
                    ? error.message
                    : "An unexpected error occurred",
                variant: "destructive"
            });
        }
        finally {
            setIsCleaning(false);
        }
    };
    // This was removed to eliminate duplication (function is defined above)
    // We use the exportCoverLetterToPDF utility imported at the top of the file
    // Export cover letter as PDF using jsPDF for reliable generation
    const exportPDF = (elementId, filename = "cover-letter.pdf") => {
        try {
            // Special handling for previewLetter with direct data
            if (elementId.startsWith("previewLetter-") && previewLetter) {
                // Use our dedicated function for cover letter objects
                exportCoverLetterToPDF();
                return;
            }
            // Get the element to export
            const element = document.getElementById(elementId);
            if (!element) {
                toast({
                    title: "Error",
                    description: "Could not find the cover letter content to download",
                    variant: "destructive"
                });
                return;
            }
            // Extract the text content for reliable PDF generation
            let letterBody = "";
            // Different extraction based on element type
            if (elementId === "generatedContent" ||
                elementId === "optimizedCoverLetterContent") {
                // For AI-generated content, get the text and clean it
                letterBody = element.textContent || "";
                letterBody = cleanAIOutput(letterBody);
                letterBody = replaceUserPlaceholders(letterBody);
            }
            else {
                // For general content, just get the text
                letterBody = element.textContent || "";
            }
            if (!letterBody || letterBody.trim() === "") {
                toast({
                    title: "Empty Content",
                    description: "There is no content to export as PDF.",
                    variant: "destructive"
                });
                return;
            }

            // Create PDF document directly with jsPDF
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "letter"
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
            const textWidth = pageWidth - margin * 2;
            // Add a title based on context
            const title = elementId === "generatedContent"
                ? "Generated Cover Letter"
                : elementId === "optimizedCoverLetterContent"
                    ? "Optimized Cover Letter"
                    : "Cover Letter";
            // Add title at the top
            doc.setFontSize(16);
            doc.text(title, margin, margin);
            // Add a separator line
            doc.setLineWidth(0.5);
            doc.line(margin, margin + 5, pageWidth - margin, margin + 5);
            // Format user info if available
            const userName = user?.name || "[Your Name]";
            const recipientCompany = companyName || "[Company Name]";
            const currentDate = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
            // Get LinkedIn profile if available
            const careerData = queryClient.getQueryData(["/api/career-data"]);
            const linkedInUrl = careerData?.linkedInUrl;
            // Add header information
            doc.setFontSize(12);
            doc.text(`${userName}`, margin, margin + 12);
            // Add LinkedIn URL if available, with special formatting
            if (linkedInUrl) {
                // PDF supports clickable links
                const textWidth = (doc.getStringUnitWidth(linkedInUrl) * doc.getFontSize()) /
                    doc.internal.scaleFactor;
                doc.setTextColor(0, 0, 255); // Blue color for link
                doc.textWithLink(linkedInUrl, margin, margin + 18, { url: linkedInUrl });
                doc.setTextColor(0, 0, 0); // Reset back to black
                doc.text(`${currentDate}`, margin, margin + 24);
                doc.text(`To: ${recipientCompany}`, margin, margin + 34);
            }
            else {
                // Standard layout without LinkedIn
                doc.text(`${currentDate}`, margin, margin + 18);
                doc.text(`To: ${recipientCompany}`, margin, margin + 28);
            }
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
            const outputFilename = filename || `cover-letter-${new Date().toISOString().split("T")[0]}.pdf`;
            // Save the PDF
            doc.save(outputFilename);
            toast({
                title: "PDF Downloaded",
                description: "Your cover letter has been downloaded as a PDF."
            });
        }
        catch (error) {
            console.error("Error in PDF export:", error);
            toast({
                title: "Error Preparing PDF",
                description: "There was a problem formatting your cover letter for PDF export.",
                variant: "destructive"
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
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
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
    return (_jsxs(motion.div, { className: "container mx-auto", initial: "hidden", animate: "visible", variants: fadeIn, children: [_jsxs(motion.div, { className: "flex flex-col md:flex-row md:items-center justify-between mb-6", variants: subtleUp, children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-2 text-[#0C29AB]", children: "Cover Letters" }), _jsx("p", { className: "text-neutral-500", children: "Create targeted cover letters for your job applications" })] }), _jsxs(Button, { className: "mt-4 md:mt-0", onClick: () => {
                            setSelectedCoverLetter(null);
                            setIsAddLetterOpen(true);
                        }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Cover Letter"] })] }), _jsxs(Tabs, { defaultValue: "letters", className: "space-y-4", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsxs(TabsTrigger, { value: "letters", children: ["My Cover Letters", " ", Array.isArray(coverLetters) &&
                                        coverLetters.length > 0 &&
                                        `(${coverLetters.length})`] }), _jsx(TabsTrigger, { value: "suggestions", children: "Generate With AI" }), _jsx(TabsTrigger, { value: "analyze", children: "Upload & Analyze" })] }), _jsxs(TabsContent, { value: "letters", className: "space-y-6", children: [_jsxs("div", { className: "relative max-w-md", children: [_jsx(Input, { placeholder: "Search cover letters...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10" }), _jsx("div", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }) })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : Array.isArray(coverLetters) && coverLetters.length > 0 ? (_jsx(motion.div, { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 cover-letter-grid", variants: staggeredContainer, style: { alignItems: "stretch" }, children: filteredLetters().map((coverLetter, i) => (_jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: {
                                        transform: "translateZ(0)",
                                        backfaceVisibility: "hidden"
                                    }, children: _jsxs(Card, { className: "overflow-hidden h-full flex flex-col cover-letter-card min-h-[180px] transition-shadow duration-300", children: [_jsx(CardContent, { className: "p-0 flex-1", children: _jsx("div", { className: "bg-primary/5 pt-5 pb-4 px-6 flex items-center justify-between", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "h-10 w-10 text-primary mr-4" }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: coverLetter.name }), _jsxs("p", { className: "text-xs text-neutral-500 mt-1", children: ["Created:", " ", new Date(coverLetter.createdAt).toLocaleDateString()] }), _jsxs("p", { className: "text-xs text-neutral-400 mt-1", children: ["Last updated:", " ", new Date(coverLetter.updatedAt || coverLetter.createdAt).toLocaleDateString()] })] })] }) }) }), _jsxs(CardFooter, { className: "p-4 flex justify-between border-t bg-white mt-auto", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPreviewLetter(coverLetter), children: "Preview" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => {
                                                                    setSelectedCoverLetter(coverLetter);
                                                                    setIsAddLetterOpen(true);
                                                                }, children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => duplicateCoverLetterMutation.mutate(coverLetter), children: _jsx(Copy, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50", onClick: () => handleDeleteLetter(coverLetter.id), children: _jsx(Trash2, { className: "h-4 w-4" }) }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-8 flex items-center gap-1 text-xs", onClick: () => handleDownloadPDF(`previewLetter-${coverLetter.id}`), title: "Download letter as PDF", children: [_jsx(Download, { className: "h-3.5 w-3.5" }), _jsx("span", { children: "PDF" })] })] })] })] }) }, coverLetter.id))) })) : (_jsxs(motion.div, { className: "text-center py-16 px-6 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-md shadow-gray-200 border border-gray-100 w-full", variants: fadeIn, children: [_jsx("div", { className: "bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm", children: _jsx(FileText, { className: "h-10 w-10 text-blue-500" }) }), _jsx("h3", { className: "text-2xl font-medium mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "You haven't created any cover letters yet" }), _jsx("p", { className: "text-neutral-500 mb-6 max-w-md mx-auto", children: "Create your first professional cover letter to showcase your qualifications and experience to potential employers." }), _jsxs(Button, { onClick: () => {
                                            setSelectedCoverLetter(null);
                                            setIsAddLetterOpen(true);
                                        }, size: "lg", className: "shadow-sm hover:shadow-lg transition-all", children: [_jsx(Plus, { className: "mr-2 h-5 w-5" }), "Create First Cover Letter"] })] }))] }), _jsx(TabsContent, { value: "suggestions", className: "space-y-6", children: _jsxs(motion.div, { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 will-change-opacity will-change-transform card-grid-container", variants: subtleUp, style: { transform: "translateZ(0)", alignItems: "flex-start" }, children: [_jsx(Card, { className: "overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] generate-cover-letter-card shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-6 rounded-t-xl bg-transparent", children: [_jsxs("h3", { className: "text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center", children: [_jsx(FileUp, { className: "h-5 w-5 mr-2 text-blue-500" }), "Generate Cover Letter Content"] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "jobTitleSuggestions", className: "flex items-center", children: [_jsx("span", { className: "text-primary mr-1", children: "1." }), " Job Title"] }), _jsx(Input, { id: "jobTitleSuggestions", placeholder: "Marketing Manager", value: jobTitle, onChange: (e) => setJobTitle(e.target.value), disabled: generateCoverLetterMutation.isPending ||
                                                                            generateSuggestionsMutation.isPending, className: "border-2 border-primary/20 focus:border-primary/40" }), jobTitle && (_jsxs("p", { className: "text-xs text-green-600 flex items-center", children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1" }), "Added"] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "companyNameSuggestions", className: "flex items-center", children: [_jsx("span", { className: "text-primary mr-1", children: "2." }), " Company Name"] }), _jsx(Input, { id: "companyNameSuggestions", placeholder: "XYZ Corporation", value: companyName, onChange: (e) => setCompanyName(e.target.value), disabled: generateCoverLetterMutation.isPending ||
                                                                            generateSuggestionsMutation.isPending, className: "border-2 border-primary/20 focus:border-primary/40" }), companyName && (_jsxs("p", { className: "text-xs text-green-600 flex items-center", children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1" }), "Added"] }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "jobDescriptionSuggestions", className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-primary mr-1", children: "3." }), " Job Description ", _jsx("span", { className: "text-red-500 ml-1", children: "*" })] }), jobDescription.trim().length > 100 && (_jsxs("span", { className: "text-green-600 text-xs font-medium flex items-center", children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1" }), "Complete"] }))] }), _jsx(Textarea, { id: "jobDescriptionSuggestions", placeholder: "Paste the job description here...", className: `min-h-[180px] resize-y border-2 ${jobDescription.trim().length > 100
                                                                    ? "border-green-200 focus:border-green-300"
                                                                    : jobDescription.trim().length > 50
                                                                        ? "border-amber-200 focus:border-amber-300"
                                                                        : jobDescription.trim().length > 0
                                                                            ? "border-red-200 focus:border-red-300"
                                                                            : "border-primary/20 focus:border-primary/40"}`, value: jobDescription, onChange: (e) => setJobDescription(e.target.value), disabled: generateCoverLetterMutation.isPending ||
                                                                    generateSuggestionsMutation.isPending }), jobDescription.trim().length > 0 &&
                                                                jobDescription.trim().length < 50 && (_jsxs("div", { className: "p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4 mr-2 mt-0.5 shrink-0", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium mb-1", children: "Job Description Too Short" }), _jsx("div", { className: "text-xs", children: "Please provide a more detailed job description for better results. AI works best with comprehensive details." })] })] })), jobDescription.trim().length >= 50 &&
                                                                jobDescription.trim().length <= 100 && (_jsxs("div", { className: "p-3 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md flex items-start", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4 mr-2 mt-0.5 shrink-0", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium mb-1", children: "More Details Recommended" }), _jsx("div", { className: "text-xs", children: "Consider adding more details from the job posting to generate more targeted content." })] })] }))] }), _jsx("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-center justify-between", children: _jsxs(Button, { onClick: generateCoverLetter, disabled: !jobDescription ||
                                                                generateCoverLetterMutation.isPending ||
                                                                generateSuggestionsMutation.isPending, className: "w-full", children: [generateCoverLetterMutation.isPending ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : (_jsx(FileText, { className: "mr-2 h-4 w-4" })), "Generate Full Letter"] }) })] })] }) }), _jsx(Card, { className: "overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-6 rounded-t-xl bg-transparent", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsxs("h3", { className: "text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center", children: [_jsx(Sparkles, { className: "h-5 w-5 mr-2 text-blue-500" }), "AI-Generated Content"] }), generationTimestamp && (_jsxs("span", { className: "text-xs text-neutral-500 flex items-center", children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1 text-green-500" }), "Generated", " ", generationTimestamp.toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })] }))] }), !generatedContent ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full py-12 text-center border border-dashed border-slate-200 rounded-lg", children: [_jsx(Sparkles, { className: "h-12 w-12 text-neutral-300 mb-3" }), _jsx("p", { className: "text-neutral-500 max-w-xs", children: "Provide job details and click 'Generate' to create a tailored cover letter, or get writing suggestions." })] })) : (_jsxs("div", { className: "space-y-5", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 }, children: _jsx("div", { className: "p-4 bg-primary/5 rounded-lg border border-primary/10 whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-y-auto", id: "generatedContent", children: user ? (_jsx(_Fragment, { children: replaceUserPlaceholders(cleanAIOutput(generatedContent)) })) : (_jsx(_Fragment, { children: cleanAIOutput(generatedContent)
                                                                    .split(/(\[.*?\])/)
                                                                    .map((part, index) => {
                                                                    // Check if this part is a placeholder (surrounded by brackets)
                                                                    const isPlaceholder = /^\[.*\]$/.test(part);
                                                                    return isPlaceholder ? (_jsx("span", { className: "text-neutral-400", title: "Fill in your personal details in your profile", children: part }, index)) : (_jsx("span", { children: part }, index));
                                                                }) })) }) }), _jsxs("div", { className: "grid grid-cols-4 gap-2 mt-4 px-2", children: [_jsxs(Button, { variant: "outline", className: "col-span-1", onClick: () => {
                                                                    setGeneratedContent("");
                                                                    setGenerationTimestamp(null);
                                                                }, children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), "Reset"] }), _jsx(Button, { variant: "outline", className: "col-span-1", onClick: handleCopyToClipboard, children: copySuccess ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "mr-2 h-4 w-4 text-green-500" }), "Copied"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "mr-2 h-4 w-4" }), "Copy"] })) }), _jsxs(Button, { onClick: handleSaveGenerated, disabled: !generatedContent, className: "col-span-2", children: [_jsx(UploadCloud, { className: "mr-2 h-4 w-4" }), "Save Letter"] })] })] }))] }) })] }) }), _jsx(TabsContent, { value: "analyze", className: "space-y-6", children: _jsxs(motion.div, { className: "flex flex-col lg:flex-row gap-6 items-start will-change-opacity will-change-transform", variants: subtleUp, style: { transform: "translateZ(0)" }, children: [_jsx("div", { className: "lg:w-1/2", children: _jsx(Card, { className: "overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-6 rounded-t-xl bg-transparent", children: [_jsxs("h3", { className: "text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center", children: [_jsx(FileUp, { className: "h-5 w-5 mr-2 text-blue-500" }), "Analyze Your Cover Letter"] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "text-sm font-medium field-label", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-primary mr-1", children: "1." }), " Job Description", " ", _jsx("span", { className: "text-red-500 ml-1", children: "*" })] }), analyzeJobDescription.trim().length > 100 && (_jsxs("span", { className: "text-green-600 text-xs font-medium flex items-center field-status", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-3 w-3 mr-1", children: [_jsx("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }), _jsx("polyline", { points: "22 4 12 14.01 9 11.01" })] }), "Complete"] })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setAnalyzeJobDescription("We're hiring a marketing associate with strong writing and cross-functional collaboration skills. The ideal candidate has experience creating compelling content, managing social media campaigns, and analyzing performance metrics. You'll work with our creative team to develop marketing materials that align with our brand voice and drive customer engagement."), className: "h-6 text-xs text-primary ml-auto", children: "Paste Example" })] }), _jsx(Textarea, { placeholder: "We're hiring a marketing associate with strong writing and cross-functional collaboration skills...", value: analyzeJobDescription, onChange: (e) => setAnalyzeJobDescription(e.target.value), className: `min-h-[150px] resize-y border-2 ${analyzeJobDescription.trim().length > 100
                                                                        ? "border-green-200 focus:border-green-300"
                                                                        : analyzeJobDescription.trim().length > 50
                                                                            ? "border-amber-200 focus:border-amber-300"
                                                                            : analyzeJobDescription.trim().length > 0
                                                                                ? "border-red-200 focus:border-red-300"
                                                                                : "border-primary/20 focus:border-primary/40"}`, id: "jobDescription", disabled: analyzeCoverLetterMutation.isPending }), analyzeJobDescription.trim().length > 0 &&
                                                                    analyzeJobDescription.trim().length < 50 && (_jsxs("div", { className: "p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4 mr-2 mt-0.5 shrink-0", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium mb-1", children: "Job Description Too Short" }), _jsx("div", { className: "text-xs", children: "Please provide a more detailed job description (at least 50 characters) for accurate analysis." })] })] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "text-sm font-medium field-label", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-primary mr-1", children: "2." }), " Your Cover Letter", " ", _jsx("span", { className: "text-red-500 ml-1", children: "*" })] }), analyzeCoverLetterText.trim().length > 200 && (_jsxs("span", { className: "text-green-600 text-xs font-medium flex items-center field-status", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-3 w-3 mr-1", children: [_jsx("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }), _jsx("polyline", { points: "22 4 12 14.01 9 11.01" })] }), "Complete"] })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setAnalyzeCoverLetterText("Dear Hiring Manager,\n\nI'm writing to apply for the Marketing Associate position at your company. With my background in content creation and digital marketing, I believe I would be a valuable addition to your team. I have experience managing social media campaigns, creating engaging content, and analyzing performance metrics to optimize marketing strategies.\n\nThank you for considering my application. I look forward to the opportunity to discuss how my skills align with your needs.\n\nSincerely,\n[Your Name]"), className: "h-6 text-xs text-primary ml-auto", children: "Paste Example" })] }), _jsx(Textarea, { placeholder: "Dear [Hiring Manager], I'm writing to apply for the Marketing Associate position...", value: analyzeCoverLetterText, onChange: (e) => setAnalyzeCoverLetterText(e.target.value), className: `min-h-[200px] resize-y border-2 ${analyzeCoverLetterText.trim().length > 200
                                                                        ? "border-green-200 focus:border-green-300"
                                                                        : analyzeCoverLetterText.trim().length > 100
                                                                            ? "border-amber-200 focus:border-amber-300"
                                                                            : analyzeCoverLetterText.trim().length > 0
                                                                                ? "border-red-200 focus:border-red-300"
                                                                                : "border-primary/20 focus:border-primary/40"}`, id: "coverLetterInput", disabled: analyzeCoverLetterMutation.isPending }), analyzeCoverLetterText.trim().length > 0 &&
                                                                    analyzeCoverLetterText.trim().length < 100 && (_jsxs("div", { className: "p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4 mr-2 mt-0.5 shrink-0", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium mb-1", children: "Cover Letter Too Short" }), _jsx("div", { className: "text-xs", children: "Please provide a more complete cover letter (at least 100 characters) for meaningful analysis." })] })] }))] }), _jsx("div", { className: "relative", children: _jsx(Button, { className: "w-full relative transition-all duration-300", onClick: handleAnalyzeCoverLetter, disabled: analyzeCoverLetterMutation.isPending ||
                                                                    !analyzeJobDescription.trim() ||
                                                                    !analyzeCoverLetterText.trim() ||
                                                                    analyzeJobDescription.trim().length < 50 ||
                                                                    analyzeCoverLetterText.trim().length < 100, variant: analyzeCoverLetterMutation.isPending
                                                                    ? "outline"
                                                                    : "default", id: "analyzeBtn", title: "AI will assess how well your cover letter aligns with the job description and offer suggestions to improve clarity, tone, and relevance.", children: analyzeCoverLetterMutation.isPending ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Analyzing Cover Letter..."] })) : (_jsxs(_Fragment, { children: [_jsx(BarChart4, { className: "h-4 w-4 mr-2" }), !analyzeJobDescription.trim() ||
                                                                            !analyzeCoverLetterText.trim()
                                                                            ? "Analyze Cover Letter"
                                                                            : "Analyze Cover Letter"] })) }) })] })] }) }) }), _jsx("div", { className: "lg:w-1/2", children: analysisResult ? (_jsx(Card, { className: "overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-6 pb-1 rounded-t-xl bg-transparent", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsxs("h3", { className: "text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header", id: "analysisHeader", children: [_jsx(BarChart4, { className: "h-5 w-5 mr-2 text-blue-500" }), "AI Analysis Results"] }), _jsxs("span", { className: "text-xs text-neutral-500 flex items-center", children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1 text-green-500" }), "Analyzed", " ", new Date().toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })] })] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [_jsxs("div", { className: `flex flex-col items-center p-3 rounded-lg border score-box ${Math.round(analysisResult.overallScore) < 60
                                                                        ? "bg-red-50/70 border-red-100"
                                                                        : Math.round(analysisResult.overallScore) < 80
                                                                            ? "bg-amber-50/70 border-amber-100"
                                                                            : "bg-emerald-50/70 border-emerald-100"}`, title: "Overall score reflecting the quality of your cover letter", children: [_jsx("span", { className: "text-xl font-bold", children: Math.round(analysisResult.overallScore) }), _jsx("span", { className: "text-xs text-neutral-500", children: "Overall" }), _jsx("span", { className: "text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70", children: Math.round(analysisResult.overallScore) < 60
                                                                                ? "Needs Work"
                                                                                : Math.round(analysisResult.overallScore) < 80
                                                                                    ? "Good"
                                                                                    : "Excellent" })] }), _jsxs("div", { className: `flex flex-col items-center p-3 rounded-lg border score-box ${Math.round(analysisResult.alignment) < 60
                                                                        ? "bg-red-50/70 border-red-100"
                                                                        : Math.round(analysisResult.alignment) < 80
                                                                            ? "bg-amber-50/70 border-amber-100"
                                                                            : "bg-emerald-50/70 border-emerald-100"}`, title: "How well your letter aligns with the job requirements", children: [_jsx("span", { className: "text-xl font-bold", children: Math.round(analysisResult.alignment) }), _jsx("span", { className: "text-xs text-neutral-500", children: "Alignment" }), _jsx("span", { className: "text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70", children: Math.round(analysisResult.alignment) < 60
                                                                                ? "Misaligned"
                                                                                : Math.round(analysisResult.alignment) < 80
                                                                                    ? "Aligned"
                                                                                    : "Perfect Match" })] }), _jsxs("div", { className: `flex flex-col items-center p-3 rounded-lg border score-box ${Math.round(analysisResult.persuasiveness) < 60
                                                                        ? "bg-red-50/70 border-red-100"
                                                                        : Math.round(analysisResult.persuasiveness) < 80
                                                                            ? "bg-amber-50/70 border-amber-100"
                                                                            : "bg-emerald-50/70 border-emerald-100"}`, title: "How persuasive and compelling your letter is", children: [_jsx("span", { className: "text-xl font-bold", children: Math.round(analysisResult.persuasiveness) }), _jsx("span", { className: "text-xs text-neutral-500", children: "Persuasive" }), _jsx("span", { className: "text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70", children: Math.round(analysisResult.persuasiveness) < 60
                                                                                ? "Basic"
                                                                                : Math.round(analysisResult.persuasiveness) < 80
                                                                                    ? "Convincing"
                                                                                    : "Compelling" })] }), _jsxs("div", { className: `flex flex-col items-center p-3 rounded-lg border score-box ${Math.round(analysisResult.clarity) < 60
                                                                        ? "bg-red-50/70 border-red-100"
                                                                        : Math.round(analysisResult.clarity) < 80
                                                                            ? "bg-amber-50/70 border-amber-100"
                                                                            : "bg-emerald-50/70 border-emerald-100"}`, title: "Clarity and readability of your writing", children: [_jsx("span", { className: "text-xl font-bold", children: Math.round(analysisResult.clarity) }), _jsx("span", { className: "text-xs text-neutral-500", children: "Clarity" }), _jsx("span", { className: "text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70", children: Math.round(analysisResult.clarity) < 60
                                                                                ? "Unclear"
                                                                                : Math.round(analysisResult.clarity) < 80
                                                                                    ? "Clear"
                                                                                    : "Crystal Clear" })] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium mb-2 flex items-center", children: [_jsx("span", { className: "text-emerald-500 mr-1", children: "\u2713" }), " ", "Strengths"] }), _jsx("ul", { className: "list-disc pl-8 space-y-1 text-sm bg-emerald-50/50 p-4 rounded-md border border-emerald-100/50", id: "strengthsList", children: analysisResult.strengths.map((strength, index) => (_jsx("li", { className: "text-neutral-700", children: strength }, index))) })] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium mb-2 flex items-center", children: [_jsx("span", { className: "text-amber-500 mr-1", children: "\u26A0\uFE0F" }), " Areas to Improve"] }), _jsx("ul", { className: "list-disc pl-8 space-y-1 text-sm bg-amber-50/50 p-4 rounded-md border border-amber-100/50", id: "areasToImproveList", children: analysisResult.weaknesses.map((weakness, index) => (_jsx("li", { className: "text-neutral-700", children: weakness }, index))) })] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium mb-2 flex items-center", children: [_jsx("span", { className: "text-blue-500 mr-1", children: "\uD83D\uDCA1" }), " ", "Suggestions"] }), _jsx("ul", { className: "list-disc pl-8 space-y-1 text-sm bg-blue-50/50 p-4 rounded-md border border-blue-100/50", id: "suggestionsList", children: analysisResult.improvementSuggestions.map((suggestion, index) => (_jsx("li", { className: "text-neutral-700", children: suggestion }, index))) })] }), _jsxs("div", { className: "flex flex-col h-full", id: "optimizedCoverLetterSection", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("h4", { className: "text-sm font-medium flex items-center", children: [_jsx("span", { className: "text-primary mr-1", children: "\uD83D\uDCDD" }), " ", "Optimized Cover Letter"] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 px-2 text-xs", onClick: () => {
                                                                                const optimizedSection = document.getElementById("optimizedCoverLetterContent");
                                                                                const toggleButton = document.getElementById("toggleOptimizedBtn");
                                                                                if (optimizedSection && toggleButton) {
                                                                                    if (optimizedSection.classList.contains("hidden")) {
                                                                                        optimizedSection.classList.remove("hidden");
                                                                                        toggleButton.textContent = "Hide";
                                                                                    }
                                                                                    else {
                                                                                        optimizedSection.classList.add("hidden");
                                                                                        toggleButton.textContent = "Show";
                                                                                    }
                                                                                }
                                                                            }, id: "toggleOptimizedBtn", children: "Hide" })] }), _jsxs("div", { className: "bg-white rounded-lg border border-gray-200 shadow-sm mb-0 relative flex-grow", children: [generationTimestamp && (_jsxs("div", { className: "absolute top-1 right-2 text-xs text-slate-400 italic", children: ["Generated:", " ", new Intl.DateTimeFormat("en-US", {
                                                                                    month: "short",
                                                                                    day: "numeric",
                                                                                    hour: "2-digit",
                                                                                    minute: "2-digit"
                                                                                }).format(generationTimestamp)] })), _jsx("div", { className: "p-4 pb-0 max-h-[400px] overflow-y-auto text-sm whitespace-pre-wrap", id: "optimizedCoverLetterContent", children: analysisResult.optimizedCoverLetter && (_jsx(CleanedCoverLetterContent, { content: analysisResult.optimizedCoverLetter, cleanAIOutput: cleanAIOutput, replaceUserPlaceholders: replaceUserPlaceholders })) })] })] }), _jsxs("div", { className: "mt-6 mb-6 flex w-full justify-between gap-2 px-0", children: [_jsxs(Button, { variant: "outline", className: "flex-1 max-w-[160px] mb-6", onClick: () => {
                                                                        setAnalysisResult({
                                                                            ...analysisResult,
                                                                            optimizedCoverLetter: ""
                                                                        });
                                                                    }, title: "Reset optimized content", children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), "Reset"] }), _jsx(Button, { variant: "outline", className: "flex-1 max-w-[160px] mb-6", onClick: () => handleCopyOptimizedCoverLetter(), disabled: !analysisResult.optimizedCoverLetter || isCleaning, children: isCleaning ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Cleaning..."] })) : optimizedCopySuccess ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "mr-2 h-4 w-4 text-green-500" }), "Copied!"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "mr-2 h-4 w-4" }), "Copy"] })) }), _jsxs(Button, { variant: "default", className: "flex-1 mb-6", onClick: handleSaveOptimizedCoverLetter, title: "Save this optimized version as a new cover letter", disabled: !analysisResult.optimizedCoverLetter, children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Save Optimized Version"] })] })] })] }) })) : analyzeCoverLetterMutation.isPending ? (_jsx(Card, { className: "overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-6 rounded-t-xl bg-transparent", children: [_jsx("div", { className: "flex justify-between items-center mb-3", children: _jsxs("h3", { className: "text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header", id: "analysisHeader", children: [_jsx(BarChart4, { className: "h-5 w-5 mr-2 text-blue-500" }), "AI Analysis Results"] }) }), _jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 text-center", children: [_jsx("div", { className: "w-16 h-16 mb-6 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) }), _jsx("p", { className: "text-neutral-600 text-lg mb-2", children: "Analyzing your cover letter..." }), _jsx("p", { className: "text-neutral-500 mb-6", children: "This may take a few seconds." })] })] }) })) : (_jsx(Card, { className: "overflow-hidden border-slate-200 bg-gradient-to-b from-white to-blue-50 min-h-[350px] h-full shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-6 rounded-t-xl bg-transparent", children: [_jsxs("h3", { className: "text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header", id: "analysisHeader", children: [_jsx(BarChart4, { className: "h-5 w-5 mr-2 text-blue-500" }), "AI Analysis Results"] }), _jsxs("div", { className: "flex flex-col items-center justify-center py-10 px-4 text-center", children: [_jsx("div", { className: "w-16 h-16 mb-6 text-neutral-200", children: _jsxs("svg", { width: "64", height: "64", viewBox: "0 0 64 64", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M32 12L35.3 18.76L42.64 19.84L37.32 25.04L38.64 32.36L32 28.88L25.36 32.36L26.68 25.04L21.36 19.84L28.7 18.76L32 12Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M32 12L35.3 18.76L42.64 19.84L37.32 25.04L38.64 32.36L32 28.88L25.36 32.36L26.68 25.04L21.36 19.84L28.7 18.76L32 12Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M44 42L46 46L50 47L47 50L48 54L44 52L40 54L41 50L38 47L42 46L44 42Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M20 44L18 46L20 48L18 50L20 52L22 50L24 52L22 48L24 46L22 44L20 44Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })] }) }), _jsx("p", { className: "text-neutral-600 text-lg mb-2", children: "Submit your cover letter and job description" }), _jsx("p", { className: "text-neutral-500 mb-6", children: "to see AI-powered analysis and suggestions." })] })] }) })) })] }) })] }), _jsx(Dialog, { open: isAddLetterOpen, onOpenChange: setIsAddLetterOpen, children: _jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: selectedCoverLetter
                                    ? "Edit Cover Letter"
                                    : "Create New Cover Letter" }) }), _jsx(CoverLetterForm, { coverLetter: selectedCoverLetter, onSuccess: () => setIsAddLetterOpen(false) })] }) }), previewLetter && (_jsx(Dialog, { open: !!previewLetter, onOpenChange: () => setPreviewLetter(null), children: _jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex justify-between items-center", children: [_jsx("span", { children: previewLetter.name }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                    // Extract the complete content from the preview dialog
                                                    const contentElement = document.getElementById("pdf-export-content");
                                                    if (contentElement) {
                                                        const fullText = contentElement.innerText;
                                                        // Copy to clipboard
                                                        navigator.clipboard
                                                            .writeText(fullText)
                                                            .then(() => {
                                                            toast({
                                                                title: "✅ Copied to clipboard",
                                                                description: "The full cover letter has been copied"
                                                            });
                                                        })
                                                            .catch((error) => {
                                                            toast({
                                                                title: "Copy failed",
                                                                description: "Failed to copy content to clipboard",
                                                                variant: "destructive"
                                                            });
                                                            console.error("Copy failed:", error);
                                                        });
                                                    }
                                                }, title: "Copy full letter text to clipboard", className: "flex items-center gap-2 text-xs", children: [_jsx(Copy, { className: "h-3.5 w-3.5" }), _jsx("span", { children: "Copy" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportCoverLetterToPDF(), title: "Download letter body text as PDF", className: "flex items-center gap-2 text-xs", children: [_jsx(Download, { className: "h-3.5 w-3.5" }), _jsx("span", { children: "Download Body" })] })] })] }) }), _jsxs("div", { className: "space-y-6 p-4 bg-white font-normal text-base text-neutral-800 leading-relaxed font-sans", id: "pdf-export-content", children: [_jsxs("div", { className: "text-base font-normal text-neutral-900 leading-relaxed", children: [_jsx("p", { className: "font-semibold", children: previewLetter.content.header.fullName || "[Your Name]" }), _jsx("p", { children: previewLetter.jobTitle ||
                                                previewLetter.content.recipient.position ||
                                                "" }), _jsxs("p", { className: "text-neutral-700", children: [previewLetter.content.header.email, window.linkedInProfile && (_jsxs(_Fragment, { children: [" ", "|", " ", _jsx("a", { href: window.linkedInProfile, target: "_blank", rel: "noopener noreferrer", className: "underline", children: "LinkedIn" })] })), previewLetter.content.header.phone &&
                                                    previewLetter.content.header.phone
                                                        .replace(/\[Your Address\]|\[Address\]/g, "")
                                                        .trim() && (_jsxs(_Fragment, { children: [" ", "|", " ", previewLetter.content.header.phone
                                                            .replace(/\[Your Address\]|\[Address\]/g, "")
                                                            .trim()] }))] }), _jsx("p", { children: previewLetter.content.header.date ||
                                                new Date().toLocaleDateString() }), previewLetter.content.recipient.company && (_jsx("p", { children: previewLetter.content.recipient.company })), _jsxs("p", { children: ["Dear", " ", previewLetter.content.recipient.name || "Hiring Manager", ","] })] }), _jsx("div", { className: "whitespace-pre-wrap text-base font-normal", children: window.linkedInProfile
                                        ? previewLetter.content.body
                                            .split(/(\{\{LINKEDIN_URL\}\})/)
                                            .map((part, i) => part === "{{LINKEDIN_URL}}" ? (_jsx("a", { href: window.linkedInProfile || "", target: "_blank", rel: "noopener noreferrer", className: "text-neutral-800 hover:text-blue-600 hover:underline", children: "LinkedIn" }, i)) : (part))
                                        : previewLetter.content.body }), _jsxs("div", { className: "space-y-4 text-base font-normal", children: [_jsx("p", { children: previewLetter.content.closing || "Sincerely," }), _jsx("p", { children: previewLetter.content.header.fullName
                                                ? previewLetter.content.header.fullName.replace(/\[Your Name\]|\[Name\]/g, "")
                                                : window.userName || "" })] })] })] }) }))] }));
}
