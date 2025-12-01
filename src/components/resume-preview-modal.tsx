'use client';

import { Download } from 'lucide-react';
import React from 'react';

import { type ResumeData, ResumeDocument } from '@/components/resume/ResumeDocument';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { generateResumePDF } from '@/lib/resume-pdf-generator';

interface ResumePreviewModalProps {
  open: boolean;
  onClose: () => void;
  resume: {
    _id: string;
    title: string;
    content: any;
    source?: 'manual' | 'ai_generated' | 'ai_optimized' | 'pdf_upload';
  };
  userName?: string;
  userEmail?: string;
}

export function ResumePreviewModal({
  open,
  onClose,
  resume,
  userName,
  userEmail,
}: ResumePreviewModalProps) {
  const { toast } = useToast();

  const content = resume.content || {};

  // Normalize data to ResumeData format
  // Support both data shapes: AI-generated (personalInfo/experience) and editor (contactInfo/experiences)
  const rawPersonalInfo = content.contactInfo || content.personalInfo || {};
  const resumeData: ResumeData = {
    contactInfo: {
      name: rawPersonalInfo.name || userName || 'Your Name',
      email: rawPersonalInfo.email || userEmail || '',
      phone: rawPersonalInfo.phone || '',
      location: rawPersonalInfo.location || '',
      linkedin: rawPersonalInfo.linkedin || '',
      github: rawPersonalInfo.github || '',
      website: rawPersonalInfo.website || '',
    },
    summary: content.summary || '',
    skills: Array.isArray(content.skills) ? content.skills : [],
    experience: Array.isArray(content.experiences)
      ? content.experiences
      : Array.isArray(content.experience)
        ? content.experience
        : [],
    education: Array.isArray(content.education) ? content.education : [],
    projects: Array.isArray(content.projects) ? content.projects : [],
    achievements: Array.isArray(content.achievements) ? content.achievements : [],
  };

  const exportPDF = async () => {
    try {
      const fileName = `${resume.title.replace(/\s+/g, '_')}.pdf`;
      await generateResumePDF(resumeData, fileName);

      toast({
        title: 'Exported',
        description: 'Resume PDF downloaded successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
    }
  };

  const getSourceBadge = () => {
    switch (resume.source) {
      case 'ai_generated':
        return (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
            AI Generated
          </span>
        );
      case 'ai_optimized':
        return (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">AI Optimized</span>
        );
      case 'pdf_upload':
        return (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">PDF Upload</span>
        );
      case 'manual':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Manual</span>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>{resume.title}</DialogTitle>
              {getSourceBadge()}
            </div>
            <div className="flex gap-2">
              <Button onClick={exportPDF} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Use unified ResumeDocument component for preview */}
        <ResumeDocument data={resumeData} className="border rounded-lg shadow-sm" />
      </DialogContent>
    </Dialog>
  );
}
