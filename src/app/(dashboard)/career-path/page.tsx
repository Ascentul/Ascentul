"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Sparkles, Trash2, Edit3 } from 'lucide-react';
import { CareerPathExplorer } from '@/components/career-path/CareerPathExplorer';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CareerPathPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [profileData, setProfileData] = useState({
    currentRole: '',
    yearsExperience: '',
    skills: '',
    interests: '',
    targetIndustry: ''
  });

  // Fetch saved career paths
  const { data: savedPaths, isLoading } = useQuery({
    queryKey: ['/api/career-paths'],
    queryFn: () => apiRequest('GET', '/api/career-paths'),
    enabled: !!user
  });

  // Generate new career path
  const generatePath = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest('POST', '/api/career-paths/generate', {
        profileData
      });

      toast({
        title: "Career Path Generated",
        description: "Your new career path has been generated and saved!",
        variant: "success"
      });

      // Refresh saved paths
      queryClient.invalidateQueries({ queryKey: ['/api/career-paths'] });
      setShowGenerator(false);

      return response;
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate career path. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete career path
  const deletePathMutation = useMutation({
    mutationFn: async (pathId: string) => {
      return apiRequest('DELETE', `/api/career-paths/${pathId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/career-paths'] });
      toast({
        title: "Career Path Deleted",
        description: "The career path has been deleted successfully.",
        variant: "success"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete career path.",
        variant: "destructive"
      });
    }
  });

  const paths = (savedPaths as any)?.paths || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0C29AB]">Career Path Explorer</h1>
          <p className="text-neutral-500 mt-2">
            Visualize potential progressions and explore roles tailored to your experience.
          </p>
        </div>
        <Button
          onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Generate New Path
        </Button>
      </div>

      {/* Career Path Generator */}
      {showGenerator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Career Path
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentRole">Current Role</Label>
                <Input
                  id="currentRole"
                  placeholder="e.g., Software Engineer, Product Manager"
                  value={profileData.currentRole}
                  onChange={(e) => setProfileData({ ...profileData, currentRole: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  placeholder="e.g., 3-5 years"
                  value={profileData.yearsExperience}
                  onChange={(e) => setProfileData({ ...profileData, yearsExperience: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="skills">Key Skills</Label>
              <Textarea
                id="skills"
                placeholder="List your key skills, separated by commas"
                value={profileData.skills}
                onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="interests">Career Interests</Label>
              <Textarea
                id="interests"
                placeholder="What areas of work interest you most?"
                value={profileData.interests}
                onChange={(e) => setProfileData({ ...profileData, interests: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="targetIndustry">Target Industry (Optional)</Label>
              <Input
                id="targetIndustry"
                placeholder="e.g., Technology, Healthcare, Finance"
                value={profileData.targetIndustry}
                onChange={(e) => setProfileData({ ...profileData, targetIndustry: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={generatePath}
                disabled={isGenerating || !profileData.currentRole}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Career Path'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGenerator(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your career paths...</span>
        </div>
      )}

      {/* Saved Career Paths */}
      {!isLoading && paths.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Your Career Paths</h2>
          {paths.map((pathData: any) => (
            <Card key={pathData.docId} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{pathData.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {pathData.nodes?.length || 0} steps
                      </Badge>
                      {pathData.savedAt && (
                        <span className="text-xs text-muted-foreground">
                          Saved {new Date(pathData.savedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Career Path</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{pathData.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePathMutation.mutate(pathData.docId)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CareerPathExplorer pathData={pathData} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && paths.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Career Paths Yet</h3>
            <p className="text-gray-500 mb-6">
              Generate your first career path to start exploring your professional journey.
            </p>
            <Button
              onClick={() => setShowGenerator(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Your First Path
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
