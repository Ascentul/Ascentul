import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useAuth } from "@/hooks/use-auth"
import { exportCoverLetterToPDF } from "@/utils/exportPDF"
import { jsPDF } from "jspdf"
import CleanedCoverLetterContent from "@/components/CleanedCoverLetterContent"

// Add html2pdf type for TypeScript
declare global {
  interface Window {
    html2pdf: any
    linkedInProfile?: string | null
    userName?: string
  }
}
// Define CoverLetter type interface
interface CoverLetterType {
  id: number
  name: string
  jobTitle?: string
  template: string
  content: {
    header: {
      fullName: string
      email: string
      phone?: string
      location?: string
      date: string
    }
    recipient: {
      name: string
      company: string
      position: string
      address?: string
    }
    body: string
    closing: string
  }
  createdAt?: string
  updatedAt?: string
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import CoverLetterForm from "@/components/CoverLetterForm"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

export default function CoverLetter() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddLetterOpen, setIsAddLetterOpen] = useState(false)
  const [selectedCoverLetter, setSelectedCoverLetter] =
    useState<CoverLetterType | null>(null)
  const [previewLetter, setPreviewLetter] = useState<CoverLetterType | null>(
    null
  )
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [copySuccess, setCopySuccess] = useState(false)
  const [optimizedCopySuccess, setOptimizedCopySuccess] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [generationTimestamp, setGenerationTimestamp] = useState<Date | null>(
    null
  )

  // Fetch user's cover letters
  const { data: coverLetters = [] as CoverLetterType[], isLoading } = useQuery<
    CoverLetterType[]
  >({
    queryKey: ["/api/cover-letters"]
  })

  // AI generation form fields
  const [jobTitle, setJobTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")

  // Analysis form fields
  const [analyzeJobDescription, setAnalyzeJobDescription] = useState("")
  const [analyzeCoverLetterText, setAnalyzeCoverLetterText] = useState("")
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const deleteCoverLetterMutation = useMutation({
    mutationFn: async (letterId: number) => {
      return apiRequest("DELETE", `/api/cover-letters/${letterId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] })
      toast({
        title: "Cover Letter Deleted",
        description: "Your cover letter has been deleted successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete cover letter: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  // Create a type for the cover letter when preparing for creation or duplication
  type CoverLetterCreateType = Omit<
    CoverLetterType,
    "id" | "createdAt" | "updatedAt"
  >

  const duplicateCoverLetterMutation = useMutation({
    mutationFn: async (coverLetter: CoverLetterType) => {
      // Create a new object without the id, createdAt, and updatedAt properties
      const { id, createdAt, updatedAt, ...restOfLetter } = coverLetter
      const newCoverLetter: CoverLetterCreateType = {
        ...restOfLetter,
        name: `${coverLetter.name} (Copy)`
      }

      return apiRequest("POST", "/api/cover-letters", newCoverLetter)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] })
      toast({
        title: "Cover Letter Duplicated",
        description: "A copy of your cover letter has been created"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to duplicate cover letter: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  const generateCoverLetterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cover-letters/generate", {
        jobTitle,
        companyName,
        jobDescription,
        type: "complete"
      })
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Cover Letter Generated",
        description: "AI has generated a cover letter for you"
      })
      setGeneratedContent(data.content)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to generate cover letter: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      // For suggestions, only the job description is required
      const res = await apiRequest("POST", "/api/cover-letters/generate", {
        jobTitle: jobTitle || "Not specified",
        companyName: companyName || "Not specified",
        jobDescription,
        type: "suggestions"
      })
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Suggestions Generated",
        description:
          "Writing suggestions for your cover letter have been generated"
      })
      setGeneratedContent(data.suggestions || data.content)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to generate suggestions: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  const analyzeCoverLetterMutation = useMutation({
    mutationFn: async () => {
      if (!analyzeJobDescription || !analyzeCoverLetterText) {
        throw new Error("Both job description and cover letter are required")
      }

      const res = await apiRequest("POST", "/api/cover-letters/analyze", {
        coverLetter: analyzeCoverLetterText,
        jobDescription: analyzeJobDescription
      })

      return res.json()
    },
    onSuccess: (data) => {
      setAnalysisResult(data)
      toast({
        title: "Analysis Complete",
        description: "Your cover letter has been analyzed successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: `Error analyzing cover letter: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  const handleDeleteLetter = (coverLetterId: number) => {
    if (confirm("Are you sure you want to delete this cover letter?")) {
      deleteCoverLetterMutation.mutate(coverLetterId)
    }
  }

  const handleSaveGenerated = () => {
    if (!generatedContent) return

          .map((para: string) => `<p style="margin-bottom: 12px;">${para}</p>`)
          .join("")
      } else {
        bodyContent =
          '<p style="margin-bottom: 12px;">No content available.</p>'
      }

      // Create professional letter content with proper formatting
      innerContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 36px;">
          <h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 8px; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;">${
            letter.content.header.fullName || "[Your Name]"
          }</h1>
          <p style="margin-bottom: 12px;">${
            letter.content.header.date || new Date().toLocaleDateString()
          }</p>
        </div>

        <div style="margin-bottom: 24px;">
          <p style="margin-bottom: 4px;">Hiring Manager</p>
          <p style="margin-bottom: 4px;">${
            letter.content.recipient.company || "Company Name"
          }</p>
        </div>

        <p style="margin-bottom: 24px;">Dear Hiring Manager,</p>

        <div style="margin-bottom: 24px; text-align: justify;">
          ${bodyContent}
        </div>

        <div style="margin-top: 36px;">
          <p style="margin-bottom: 24px;">${
            letter.content.closing || "Sincerely,"
          }</p>
          <p>${letter.content.header.fullName || "[Your Name]"}</p>
        </div>
      `

      // Append the inner container to the main container
      container.appendChild(innerContainer)

      // Attach to document but position off-screen
      container.style.position = "fixed"
      container.style.top = "0"
      container.style.left = "-9999px"
      container.style.zIndex = "-1000"
      document.body.appendChild(container)

      // Generate filename from letter name
      const filename = `${letter.name.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.pdf`

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
      }

}
