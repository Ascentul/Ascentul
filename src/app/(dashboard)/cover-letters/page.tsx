'use client';

import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import {
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { CoverLetterPreviewModal } from '@/components/cover-letter-preview-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/ClerkAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { exportCoverLetterPDF } from '@/utils/exportCoverLetter';

export type CoverLetterDoc = {
  _id: string;
  name: string;
  job_title: string;
  company_name?: string;
  template: string;
  content?: string;
  closing: string;
  created_at: number;
  updated_at: number;
  source?: 'manual' | 'ai_generated' | 'ai_optimized' | 'pdf_upload';
};

type CoverLetterAnalysis = {
  summary: string;
  alignmentScore: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  optimizedLetter?: string;
};

export default function CoverLettersPage() {
  const router = useRouter();
  const { user } = useUser();
  const { user: profile } = useAuth();
  const clerkId = user?.id;
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-letters' | 'generate-ai' | 'upload-analyze'>(
    'my-letters',
  );

  // AI Generation state
  const [jobDescription, setJobDescription] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [generating, setGenerating] = useState(false);

  // Upload & Analyze state
  const [coverLetterDraft, setCoverLetterDraft] = useState('');
  const [analyzeJobDescription, setAnalyzeJobDescription] = useState('');
  const [analyzeRole, setAnalyzeRole] = useState('');
  const [analyzeCompany, setAnalyzeCompany] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CoverLetterAnalysis | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);
  const [savingOptimized, setSavingOptimized] = useState(false);

  const profileHighlights = useMemo(() => {
    if (!profile) return '';
    const parts: string[] = [];
    if (profile.job_title) parts.push(profile.job_title);
    if (profile.company) parts.push(`@ ${profile.company}`);
    return parts.join(' ');
  }, [profile]);

  const coverLetters = useQuery(
    api.cover_letters.getUserCoverLetters,
    clerkId ? { clerkId } : 'skip',
  ) as CoverLetterDoc[] | undefined;

  const createCoverLetter = useMutation(api.cover_letters.createCoverLetter);
  const deleteCoverLetter = useMutation(api.cover_letters.deleteCoverLetter);

  const loading = !coverLetters && !!clerkId;

  const sorted = useMemo(() => {
    return (coverLetters ?? []).slice().sort((a, b) => b.updated_at - a.updated_at);
  }, [coverLetters]);

  // Preview state
  const [previewLetter, setPreviewLetter] = useState<CoverLetterDoc | null>(null);

  const handleCreate = async () => {
    if (!clerkId) return;
    setCreating(true);
    try {
      const doc = await createCoverLetter({
        clerkId,
        name: 'Untitled Cover Letter',
        job_title: 'Position',
        company_name: undefined,
        template: 'standard',
        content: '',
        closing: 'Sincerely,',
        source: 'manual',
      });
      // navigate to detail page
      if (doc && (doc as any)._id) {
        router.push(`/cover-letters/${(doc as any)._id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const duplicateLetter = async (letterId: string, name: string) => {
    if (!clerkId) return;
    try {
      const original = coverLetters?.find((c) => c._id === letterId);
      if (!original) return;

      const doc = await createCoverLetter({
        clerkId,
        name: `${name} (Copy)`,
        job_title: original.job_title,
        company_name: original.company_name,
        template: original.template,
        content: original.content || '',
        closing: original.closing,
        source: original.source || 'manual',
      });

      toast({
        title: 'Cover Letter Copied',
        description: 'Your cover letter has been duplicated successfully',
        variant: 'success',
      });

      if (doc && (doc as any)._id) {
        router.push(`/cover-letters/${(doc as any)._id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy cover letter',
        variant: 'destructive',
      });
    }
  };

  const deleteLetter = async (letterId: string) => {
    if (!clerkId) return;
    if (!confirm('Are you sure you want to delete this cover letter?')) return;

    try {
      await deleteCoverLetter({ clerkId, coverLetterId: letterId as any });
      toast({
        title: 'Cover Letter Deleted',
        description: 'Your cover letter has been deleted successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete cover letter',
        variant: 'destructive',
      });
    }
  };

  const generateWithAI = async () => {
    if (!clerkId) return;
    if (!jobDescription.trim() || !jobRole.trim() || !jobCompany.trim()) {
      toast({
        title: 'Missing details',
        description:
          'Please provide the company, role, and job description so we can generate a truthful cover letter.',
        variant: 'destructive',
      });
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/cover-letters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          companyName: jobCompany,
          position: jobRole,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to generate');

      if (data.warning) {
        toast({ title: 'Heads up', description: data.warning });
      }

      toast({
        title: 'Cover letter ready',
        description: 'We used your career profile to generate a tailored draft.',
        variant: 'success',
      });
      const created = data.coverLetter;
      if (created && created._id) {
        router.push(`/cover-letters/${created._id}`);
      } else {
        // Fallback: save minimal letter with generated content
        const doc = await createCoverLetter({
          clerkId,
          name: `AI Cover Letter - ${jobCompany}`,
          job_title: jobRole,
          company_name: jobCompany || undefined,
          template: 'standard',
          content:
            data.generatedContent ||
            `Generated from job description: ${jobDescription.substring(0, 100)}...`,
          closing: 'Sincerely,',
          source: 'ai_generated',
        });
        if (doc && (doc as any)._id) router.push(`/cover-letters/${(doc as any)._id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate cover letter',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const analyzeLetter = async () => {
    if (!coverLetterDraft.trim() || !analyzeJobDescription.trim()) {
      toast({
        title: 'Missing details',
        description: 'Please paste both the cover letter and the job description for analysis.',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);
    setShowOptimized(false);
    try {
      const response = await fetch('/api/cover-letters/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: analyzeJobDescription,
          coverLetter: coverLetterDraft,
          optimize: true,
          roleTitle: analyzeRole || undefined,
          companyName: analyzeCompany || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to analyze cover letter');
      }

      const analysis = data.analysis as CoverLetterAnalysis | undefined;
      if (!analysis) {
        throw new Error('Analysis was not returned. Please try again.');
      }

      setAnalysisResult(analysis);
      toast({
        title: 'Analysis complete',
        description: 'Review the insights below to refine your cover letter.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to analyze cover letter',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveOptimizedLetter = async () => {
    if (!clerkId || !analysisResult?.optimizedLetter) return;
    setSavingOptimized(true);
    try {
      const doc = await createCoverLetter({
        clerkId,
        name: `Optimized Cover Letter - ${analyzeCompany || 'Saved'}`,
        job_title: analyzeRole || 'Target Role',
        company_name: analyzeCompany || undefined,
        template: 'standard',
        content: analysisResult.optimizedLetter,
        closing: 'Sincerely,',
        source: 'ai_optimized',
      });
      toast({
        title: 'Optimized letter saved',
        description: 'Your improved cover letter is now in My Cover Letters.',
        variant: 'success',
      });
      if (doc && (doc as any)._id) {
        router.push(`/cover-letters/${(doc as any)._id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save optimized letter',
        variant: 'destructive',
      });
    } finally {
      setSavingOptimized(false);
    }
  };

  const exportLetter = (letter: CoverLetterDoc) => {
    try {
      const exportUserName = user?.fullName || (profile as any)?.name || '';
      const exportUserEmail =
        user?.primaryEmailAddress?.emailAddress || (profile as any)?.email || '';
      exportCoverLetterPDF({
        letter,
        userName: exportUserName,
        userEmail: exportUserEmail,
      });
      toast({
        title: 'Exported',
        description: 'PDF downloaded successfully.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to export this cover letter.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          Cover Letter Coach
        </h1>
        <p className="text-muted-foreground">Create, manage, and optimize your cover letters</p>
      </div>

      {/* Three Toggle System */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={activeTab === 'my-letters' ? 'default' : 'outline'}
          onClick={() => setActiveTab('my-letters')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          My Cover Letters
        </Button>
        <Button
          variant={activeTab === 'generate-ai' ? 'default' : 'outline'}
          onClick={() => setActiveTab('generate-ai')}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
        <Button
          variant={activeTab === 'upload-analyze' ? 'default' : 'outline'}
          onClick={() => setActiveTab('upload-analyze')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload & Analyze
        </Button>
      </div>

      {/* My Cover Letters Tab */}
      {activeTab === 'my-letters' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Cover Letters</h2>
            <Button onClick={handleCreate} disabled={creating || !clerkId}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}{' '}
              New Cover Letter
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (sorted?.length ?? 0) === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No cover letters yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Create your first cover letter to get started.
                </p>
                <Button onClick={handleCreate} disabled={creating || !clerkId}>
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}{' '}
                  New Cover Letter
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {sorted!.map((c) => {
                const getSourceBadge = () => {
                  switch (c.source) {
                    case 'ai_generated':
                      return (
                        <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap">
                          AI Generated
                        </span>
                      );
                    case 'ai_optimized':
                      return (
                        <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                          AI Optimized
                        </span>
                      );
                    case 'pdf_upload':
                      return (
                        <span className="text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                          PDF Upload
                        </span>
                      );
                    case 'manual':
                      return (
                        <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded-full whitespace-nowrap">
                          Manual
                        </span>
                      );
                    default:
                      return null;
                  }
                };

                return (
                  <Card
                    key={c._id}
                    className="group relative overflow-hidden border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow cursor-pointer rounded-2xl"
                    onClick={() => setPreviewLetter(c)}
                  >
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className="flex-1 space-y-4 px-5 pt-5 pb-4 bg-gradient-to-br from-purple-50/80 via-white to-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 shadow-sm group-hover:bg-purple-200 transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm text-slate-900 truncate">
                                {c.name || 'Untitled Cover Letter'}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                Last updated {new Date(c.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">{getSourceBadge()}</div>
                        </div>

                        <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-4 py-2 text-xs text-slate-500">
                          <p>Created {new Date(c.created_at).toLocaleDateString()}</p>
                          <p className="mt-0.5 truncate">
                            {c.company_name ? `${c.job_title} @ ${c.company_name}` : c.job_title}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          className="justify-center gap-2 text-sm w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewLetter(c);
                          }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Preview
                        </Button>
                      </div>

                      <div
                        className="flex items-center justify-between gap-3 px-5 py-3 border-t bg-white/90 rounded-b-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 px-3 text-sm"
                          onClick={() => router.push(`/cover-letters/${c._id}`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-500 hover:text-slate-900"
                          onClick={() => duplicateLetter(c._id, c.name)}
                          title="Duplicate"
                          aria-label="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-500 hover:text-slate-900"
                          onClick={() => exportLetter(c)}
                          title="Export as PDF"
                          aria-label="Export as PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteLetter(c._id)}
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Generate with AI Tab */}
      {activeTab === 'generate-ai' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generate Cover Letter with AI</CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste a job description and AI will create a tailored cover letter for the role
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Name</label>
                  <Input
                    placeholder="e.g. Acme Corporation"
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    disabled={generating}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Role / Position</label>
                  <Input
                    placeholder="e.g. Senior Product Manager"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    disabled={generating}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Job Description</label>
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="resize-none"
                  disabled={generating}
                />
              </div>
              <div>
                <Button
                  onClick={generateWithAI}
                  disabled={
                    !jobDescription.trim() || !jobRole.trim() || !jobCompany.trim() || generating
                  }
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload & Analyze Tab */}
      {activeTab === 'upload-analyze' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upload & Analyze Cover Letter</CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste your cover letter and the target job description to understand fit and next
                steps
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Role (optional)</label>
                  <Input
                    placeholder="e.g. Product Marketing Manager"
                    value={analyzeRole}
                    onChange={(e) => setAnalyzeRole(e.target.value)}
                    disabled={analyzing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Company (optional)</label>
                  <Input
                    placeholder="e.g. Northwind Labs"
                    value={analyzeCompany}
                    onChange={(e) => setAnalyzeCompany(e.target.value)}
                    disabled={analyzing}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cover Letter</label>
                <Textarea
                  placeholder="Paste the cover letter you want to analyze..."
                  value={coverLetterDraft}
                  onChange={(e) => setCoverLetterDraft(e.target.value)}
                  rows={10}
                  className="resize-none"
                  disabled={analyzing}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  We analyze exactly what you paste here—no files required.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Job Description</label>
                <Textarea
                  placeholder="Paste the target job description..."
                  value={analyzeJobDescription}
                  onChange={(e) => setAnalyzeJobDescription(e.target.value)}
                  rows={8}
                  className="resize-none"
                  disabled={analyzing}
                />
              </div>
              <Button
                onClick={analyzeLetter}
                disabled={!coverLetterDraft.trim() || !analyzeJobDescription.trim() || analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Analyze Cover Letter
                  </>
                )}
              </Button>

              {analysisResult && (
                <div className="space-y-4">
                  {/* Analysis Section with Blue Background */}
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-blue-900">Strengths</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {analysisResult.strengths.length ? (
                        analysisResult.strengths.map((item, idx) => (
                          <li key={`strength-${idx}`} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Nothing highlighted yet.</span>
                        </li>
                      )}
                    </ul>

                    <div className="flex items-center gap-2 mt-6 mb-4">
                      <div className="h-6 w-1 bg-yellow-600 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-yellow-900">Areas to Improve</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {analysisResult.gaps.length ? (
                        analysisResult.gaps.map((item, idx) => (
                          <li key={`gap-${idx}`} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>No major gaps detected.</span>
                        </li>
                      )}
                    </ul>

                    <div className="flex items-center gap-2 mt-6 mb-4">
                      <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-purple-900">Suggestions</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {analysisResult.recommendations.length ? (
                        analysisResult.recommendations.map((item, idx) => (
                          <li key={`rec-${idx}`} className="flex items-start gap-2">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>Nothing to update right now.</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Optimized Cover Letter Section */}
                  {analysisResult.optimizedLetter && (
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-1 bg-green-600 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            📝 Optimized Cover Letter
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOptimized((prev) => !prev)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {showOptimized ? 'Hide' : 'Show'}
                        </Button>
                      </div>

                      {showOptimized && (
                        <>
                          <div className="rounded-md bg-white border border-gray-200 p-6 text-sm text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {analysisResult.optimizedLetter}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(analysisResult.optimizedLetter || '');
                                toast({
                                  title: 'Copied!',
                                  description: 'Optimized letter copied to clipboard',
                                  variant: 'success',
                                });
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveOptimizedLetter}
                              disabled={savingOptimized}
                              className="bg-primary-500 hover:bg-primary-700"
                            >
                              {savingOptimized ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Save Optimized Version
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {/* Cover Letter Preview Modal */}
      {previewLetter && (
        <CoverLetterPreviewModal
          open={!!previewLetter}
          onClose={() => setPreviewLetter(null)}
          letter={previewLetter}
          userName={user?.fullName || ''}
          userEmail={user?.primaryEmailAddress?.emailAddress || ''}
        />
      )}
    </div>
  );
}
