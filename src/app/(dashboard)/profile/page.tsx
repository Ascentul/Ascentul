"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Edit,
  Loader2,
  Camera,
  Briefcase,
  GraduationCap,
  Target,
  Award,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  MapPin,
  Mail,
  Globe,
  CheckCircle2,
  Circle,
  Linkedin,
  Plus,
  Trash2,
  Pencil,
  Phone,
} from "lucide-react";

// Career Profile Form Schema
const careerProfileSchema = z.object({
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  phone_number: z.string().optional(),
  city: z.string().optional(),
  linkedin_url: z
    .string()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  major: z.string().optional(),
  university_name: z.string().optional(),
  graduation_year: z.string().optional(),
  current_position: z.string().optional(),
  current_company: z.string().optional(),
  experience_level: z.string().optional(),
  industry: z.string().optional(),
  skills: z.string().optional(),
  career_goals: z
    .string()
    .max(1000, "Career goals must be 1000 characters or less")
    .optional(),
});

type CareerProfileFormValues = z.infer<typeof careerProfileSchema>;

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const viewingUserId = searchParams.get("userId"); // If viewing another user's profile

  const { user: clerkUser } = useUser();
  const { user: userProfile, isAdmin } = useAuth();
  const { toast } = useToast();
  const updateUser = useMutation(api.users.updateUser);

  // Determine which user we're viewing
  const targetUserId = viewingUserId || clerkUser?.id;
  const isViewingOwnProfile = !viewingUserId || viewingUserId === clerkUser?.id;

  // Query the target user's data
  const targetUserProfile = useQuery(
    api.users.getUserByClerkId,
    viewingUserId ? { clerkId: viewingUserId } : "skip",
  );

  // Use target user's data or fallback to current user
  const displayProfile = viewingUserId ? targetUserProfile : userProfile;

  // Check if current user can view this profile
  const canView =
    isViewingOwnProfile ||
    isAdmin ||
    displayProfile?.role === "university_admin";

  // Queries for user data
  const goals = useQuery(
    api.goals.getUserGoals,
    targetUserId ? { clerkId: targetUserId } : "skip",
  );
  const applications = useQuery(
    api.applications.getUserApplications,
    targetUserId ? { clerkId: targetUserId } : "skip",
  );
  const contacts = useQuery(
    api.contacts.getUserContacts,
    targetUserId ? { clerkId: targetUserId } : "skip",
  );
  const projects = useQuery(
    api.projects.getUserProjects,
    targetUserId ? { clerkId: targetUserId } : "skip",
  );

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // Work History Management
  const [isAddingWorkHistory, setIsAddingWorkHistory] = useState(false);
  const [editingWorkHistoryId, setEditingWorkHistoryId] = useState<string | null>(null);
  const [workHistoryForm, setWorkHistoryForm] = useState({
    role: "",
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    is_current: false,
    summary: "",
  });

  // Achievements Management
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);
  const [achievementForm, setAchievementForm] = useState({
    title: "",
    organization: "",
    date: "",
    description: "",
  });

  // Avatar mutations
  const generateAvatarUploadUrl = useMutation(
    api.avatar.generateAvatarUploadUrl,
  );
  const updateUserAvatar = useMutation(api.avatar.updateUserAvatar);

  // Career profile form - reset values when displayProfile changes
  const profileForm = useForm<CareerProfileFormValues>({
    resolver: zodResolver(careerProfileSchema),
    defaultValues: {
      bio: displayProfile?.bio || "",
      email: displayProfile?.email || "",
      phone_number: displayProfile?.phone_number || "",
      city: displayProfile?.city || "",
      linkedin_url: displayProfile?.linkedin_url || "",
      major: displayProfile?.major || "",
      university_name: displayProfile?.university_name || "",
      graduation_year: displayProfile?.graduation_year || "",
      current_position: displayProfile?.current_position || "",
      current_company: displayProfile?.current_company || "",
      experience_level: displayProfile?.experience_level || "",
      industry: displayProfile?.industry || "",
      skills: displayProfile?.skills || "",
      career_goals: displayProfile?.career_goals || "",
    },
  });

  // Reset form when displayProfile changes or dialog opens
  React.useEffect(() => {
    if (displayProfile && isEditingProfile) {
      profileForm.reset({
        bio: displayProfile.bio || "",
        email: displayProfile.email || "",
        phone_number: displayProfile.phone_number || "",
        city: displayProfile.city || "",
        linkedin_url: displayProfile.linkedin_url || "",
        major: displayProfile.major || "",
        university_name: displayProfile.university_name || "",
        graduation_year: displayProfile.graduation_year || "",
        current_position: displayProfile.current_position || "",
        current_company: displayProfile.current_company || "",
        experience_level: displayProfile.experience_level || "",
        industry: displayProfile.industry || "",
        skills: displayProfile.skills || "",
        career_goals: displayProfile.career_goals || "",
      });
    }
  }, [displayProfile, isEditingProfile, profileForm]);

  // Calculate profile completion based on the 5 main sections
  const calculateProfileCompletion = () => {
    const sections = [
      !!displayProfile?.bio, // Career Summary
      !!displayProfile?.linkedin_url, // LinkedIn Profile
      Array.isArray((displayProfile as any)?.work_history) && (displayProfile as any).work_history.length > 0, // Work History
      // Check for education in either new format (education_history array) OR legacy format (major/university_name)
      (Array.isArray((displayProfile as any)?.education_history) && (displayProfile as any).education_history.length > 0) ||
      (!!displayProfile?.major || !!displayProfile?.university_name), // Education
      !!displayProfile?.skills, // Skills
    ];
    const completed = sections.filter(Boolean).length;
    return Math.round((completed / sections.length) * 100);
  };

  const handleProfileUpdate = async (data: CareerProfileFormValues) => {
    setIsLoading(true);
    try {
      if (!clerkUser) throw new Error("No user found");

      // Build updates object, only including non-empty values to let Convex handle filtering
      const updates: any = {};
      if (data.bio) updates.bio = data.bio;
      if (data.email) updates.email = data.email;
      if (data.phone_number) updates.phone_number = data.phone_number;
      if (data.city) updates.city = data.city;
      if (data.linkedin_url) updates.linkedin_url = data.linkedin_url;
      if (data.major) updates.major = data.major;
      if (data.university_name) updates.university_name = data.university_name;
      if (data.graduation_year) updates.graduation_year = data.graduation_year;
      if (data.current_position) updates.current_position = data.current_position;
      if (data.current_company) updates.current_company = data.current_company;
      if (data.experience_level) updates.experience_level = data.experience_level;
      if (data.industry) updates.industry = data.industry;
      if (data.skills) updates.skills = data.skills;
      if (data.career_goals) updates.career_goals = data.career_goals;

      await updateUser({
        clerkId: clerkUser.id,
        updates,
      });

      // Update form with new data to refresh the display and completion percentage
      // This ensures the completion percentage recalculates immediately after update
      profileForm.reset({
        bio: data.bio || displayProfile?.bio || "",
        email: data.email || displayProfile?.email || "",
        phone_number: data.phone_number || displayProfile?.phone_number || "",
        city: data.city || displayProfile?.city || "",
        linkedin_url: data.linkedin_url || displayProfile?.linkedin_url || "",
        major: data.major || displayProfile?.major || "",
        university_name: data.university_name || displayProfile?.university_name || "",
        graduation_year: data.graduation_year || displayProfile?.graduation_year || "",
        current_position: data.current_position || displayProfile?.current_position || "",
        current_company: data.current_company || displayProfile?.current_company || "",
        experience_level: data.experience_level || displayProfile?.experience_level || "",
        industry: data.industry || displayProfile?.industry || "",
        skills: data.skills || displayProfile?.skills || "",
        career_goals: data.career_goals || displayProfile?.career_goals || "",
      });

      toast({
        title: "Profile updated",
        description: "Your career profile has been updated successfully.",
        variant: "success",
      });
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      const errorMessage = error?.message || "Failed to update profile. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: "avatar" | "cover") => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const uploadUrl = await generateAvatarUploadUrl();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResult.ok) throw new Error("Failed to upload image");

      const { storageId } = await uploadResult.json();

      if (clerkUser?.id) {
        if (type === "avatar") {
          await updateUserAvatar({
            clerkId: clerkUser.id,
            storageId,
          });
          toast({
            title: "Profile picture updated",
            description: "Your profile picture has been updated successfully",
          });
        } else {
          await updateUser({
            clerkId: clerkUser.id,
            updates: { cover_image: storageId },
          });
          toast({
            title: "Cover image updated",
            description: "Your cover image has been updated successfully",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Work History Management Functions
  const handleAddWorkHistory = async () => {
    if (!clerkUser || !workHistoryForm.role || !workHistoryForm.company) {
      toast({
        title: "Missing fields",
        description: "Please fill in role and company",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentWorkHistory = userProfile?.work_history || [];
      const newWorkHistory = {
        id: Date.now().toString(),
        role: workHistoryForm.role,
        company: workHistoryForm.company,
        location: workHistoryForm.location || undefined,
        start_date: workHistoryForm.start_date || undefined,
        end_date: workHistoryForm.is_current ? undefined : (workHistoryForm.end_date || undefined),
        is_current: workHistoryForm.is_current,
        summary: workHistoryForm.summary || undefined,
      };

      await updateUser({
        clerkId: clerkUser.id,
        updates: {
          work_history: [...currentWorkHistory, newWorkHistory],
        },
      });

      toast({
        title: "Work experience added",
        description: "Your work history has been updated",
      });

      // Reset form
      setWorkHistoryForm({
        role: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        is_current: false,
        summary: "",
      });
      setIsAddingWorkHistory(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add work history",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWorkHistory = async () => {
    if (!clerkUser || !editingWorkHistoryId) return;

    try {
      const currentWorkHistory = userProfile?.work_history || [];
      const updatedWorkHistory = currentWorkHistory.map((item) =>
        item.id === editingWorkHistoryId
          ? {
              ...item,
              role: workHistoryForm.role,
              company: workHistoryForm.company,
              location: workHistoryForm.location || undefined,
              start_date: workHistoryForm.start_date || undefined,
              end_date: workHistoryForm.is_current ? undefined : (workHistoryForm.end_date || undefined),
              is_current: workHistoryForm.is_current,
              summary: workHistoryForm.summary || undefined,
            }
          : item
      );

      await updateUser({
        clerkId: clerkUser.id,
        updates: {
          work_history: updatedWorkHistory,
        },
      });

      toast({
        title: "Work experience updated",
        description: "Your work history has been updated",
      });

      // Reset form
      setWorkHistoryForm({
        role: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        is_current: false,
        summary: "",
      });
      setEditingWorkHistoryId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update work history",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkHistory = async (id: string) => {
    if (!clerkUser) return;

    try {
      const currentWorkHistory = userProfile?.work_history || [];
      const updatedWorkHistory = currentWorkHistory.filter((item) => item.id !== id);

      await updateUser({
        clerkId: clerkUser.id,
        updates: {
          work_history: updatedWorkHistory,
        },
      });

      toast({
        title: "Work experience deleted",
        description: "Your work history has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete work history",
        variant: "destructive",
      });
    }
  };

  const handleEditWorkHistory = (item: any) => {
    setWorkHistoryForm({
      role: item.role || "",
      company: item.company || "",
      location: item.location || "",
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      is_current: item.is_current || false,
      summary: item.summary || "",
    });
    setEditingWorkHistoryId(item.id);
  };

  // Achievements Management Functions
  const handleAddAchievement = async () => {
    if (!clerkUser || !achievementForm.title) {
      toast({
        title: "Missing fields",
        description: "Please fill in the achievement title",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentAchievements = (userProfile as any)?.achievements_history || [];
      const newAchievement = {
        id: Date.now().toString(),
        title: achievementForm.title,
        organization: achievementForm.organization || undefined,
        date: achievementForm.date || undefined,
        description: achievementForm.description || undefined,
      };

      await updateUser({
        clerkId: clerkUser.id,
        updates: {
          achievements_history: [...currentAchievements, newAchievement],
        },
      });

      toast({
        title: "Achievement added",
        description: "Your achievement has been added successfully",
      });

      // Reset form
      setAchievementForm({
        title: "",
        organization: "",
        date: "",
        description: "",
      });
      setIsAddingAchievement(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add achievement",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAchievement = async () => {
    if (!clerkUser || !editingAchievementId) return;

    try {
      const currentAchievements = (userProfile as any)?.achievements_history || [];
      const updatedAchievements = currentAchievements.map((item: any) =>
        item.id === editingAchievementId
          ? {
              ...item,
              title: achievementForm.title,
              organization: achievementForm.organization || undefined,
              date: achievementForm.date || undefined,
              description: achievementForm.description || undefined,
            }
          : item
      );

      await updateUser({
        clerkId: clerkUser.id,
        updates: {
          achievements_history: updatedAchievements,
        },
      });

      toast({
        title: "Achievement updated",
        description: "Your achievement has been updated successfully",
      });

      // Reset form
      setAchievementForm({
        title: "",
        organization: "",
        date: "",
        description: "",
      });
      setEditingAchievementId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update achievement",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!clerkUser) return;

    try {
      const currentAchievements = (userProfile as any)?.achievements_history || [];
      const updatedAchievements = currentAchievements.filter((item: any) => item.id !== id);

      await updateUser({
        clerkId: clerkUser.id,
        updates: {
          achievements_history: updatedAchievements,
        },
      });

      toast({
        title: "Achievement deleted",
        description: "Your achievement has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete achievement",
        variant: "destructive",
      });
    }
  };

  const handleEditAchievement = (item: any) => {
    setAchievementForm({
      title: item.title || "",
      organization: item.organization || "",
      date: item.date || "",
      description: item.description || "",
    });
    setEditingAchievementId(item.id);
  };

  if (!clerkUser || !userProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Authorization check for viewing other profiles
  if (!canView) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to view this profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!displayProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();
  const completedSections = {
    careerSummary: !!displayProfile?.bio,
    linkedinProfile: !!displayProfile?.linkedin_url,
    workHistory: Array.isArray((displayProfile as any)?.work_history) && (displayProfile as any).work_history.length > 0,
    // Check for education in either new format (education_history array) OR legacy format (major/university_name)
    education: (Array.isArray((displayProfile as any)?.education_history) && (displayProfile as any).education_history.length > 0) ||
      (!!displayProfile?.major || !!displayProfile?.university_name),
    skills: !!displayProfile?.skills,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-[#0C29AB] to-[#1e40af] rounded-t-lg">
        {displayProfile?.cover_image && (
          <Image
            src={displayProfile.cover_image}
            alt="Cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 1536px, 1536px"
            priority
            className="object-cover rounded-t-lg"
          />
        )}
        {isViewingOwnProfile && (
          <input
            type="file"
            id="cover-upload"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "cover");
            }}
          />
        )}
        {isViewingOwnProfile && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4"
            onClick={() => document.getElementById("cover-upload")?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Edit Cover
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <Card className="rounded-t-none -mt-16 relative">
        <CardContent className="pt-20 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Picture */}
            <div className="relative -mt-32">
              <Avatar className="w-32 h-32 border-4 border-white">
                <AvatarImage
                  src={
                    profilePreview ||
                    displayProfile.profile_image ||
                    clerkUser?.imageUrl
                  }
                />
                <AvatarFallback className="text-2xl">
                  {displayProfile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isViewingOwnProfile && (
                <>
                  <input
                    type="file"
                    id="profile-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "avatar");
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full p-2"
                    onClick={() =>
                      document.getElementById("profile-upload")?.click()
                    }
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#0C29AB]">
                    {displayProfile.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mt-1">
                    {displayProfile.current_position ||
                      displayProfile.major ||
                      "Student"}
                    {displayProfile.current_company &&
                      ` at ${displayProfile.current_company}`}
                  </p>
                  {displayProfile.city && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {displayProfile.city}
                    </p>
                  )}
                </div>
                {isViewingOwnProfile && (
                  <Button onClick={() => setIsEditingProfile(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Quick Links */}
              <div className="flex gap-3 mt-4 flex-wrap">
                {displayProfile.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${displayProfile.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      {displayProfile.email}
                    </a>
                  </Button>
                )}
                {displayProfile.phone_number && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${displayProfile.phone_number}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {displayProfile.phone_number}
                    </a>
                  </Button>
                )}
                {displayProfile.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={displayProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {displayProfile.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={displayProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Profile Completion
              </CardTitle>
              <CardDescription>
                Complete your career profile to maximize opportunities
              </CardDescription>
            </div>
            <div className="text-3xl font-bold text-[#0C29AB]">
              {profileCompletion}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={profileCompletion} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(completedSections).map(([key, completed]) => (
              <div key={key} className="flex items-center gap-2">
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-[#0C29AB]" />
              <div className="text-3xl font-bold">{goals?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Goals</div>
              <div className="text-xs text-muted-foreground mt-1">
                {goals?.filter((g) => g.status === "active").length || 0} active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-[#0C29AB]" />
              <div className="text-3xl font-bold">
                {applications?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Applications</div>
              <div className="text-xs text-muted-foreground mt-1">
                {applications?.filter((a) => a.status === "applied").length ||
                  0}{" "}
                in progress
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-[#0C29AB]" />
              <div className="text-3xl font-bold">{contacts?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Contacts</div>
              <div className="text-xs text-muted-foreground mt-1">
                {contacts?.filter((c) => c.relationship === "Strong").length ||
                  0}{" "}
                strong
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-[#0C29AB]" />
              <div className="text-3xl font-bold">{projects?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
              <div className="text-xs text-muted-foreground mt-1">
                {projects?.length || 0} total
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Career Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Career Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {displayProfile.bio ||
                "No career summary added yet. Click Edit Profile to add one."}
            </p>
          </CardContent>
        </Card>

        {/* LinkedIn Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5" />
              LinkedIn Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayProfile.linkedin_url ? (
              <a
                href={displayProfile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#0C29AB] hover:underline break-all"
              >
                {displayProfile.linkedin_url}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                No LinkedIn profile added yet. Click Edit Profile to add one.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayProfile.major || displayProfile.university_name ? (
              <div>
                {displayProfile.major && (
                  <p className="font-medium">{displayProfile.major}</p>
                )}
                {displayProfile.university_name && (
                  <p className="text-sm text-muted-foreground">
                    {displayProfile.university_name}
                  </p>
                )}
                {displayProfile.graduation_year && (
                  <p className="text-sm text-muted-foreground">
                    Class of {displayProfile.graduation_year}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No education information added yet. Click Edit Profile to add.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Work History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work History
              </CardTitle>
              {isViewingOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingWorkHistory(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {displayProfile.work_history && displayProfile.work_history.length > 0 ? (
              <div className="space-y-6">
                {displayProfile.work_history.map((job, index) => (
                  <div key={job.id || index} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{job.role}</h3>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        {job.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.start_date || "Start date not specified"} -{" "}
                          {job.is_current ? "Present" : (job.end_date || "End date not specified")}
                        </p>
                        {job.summary && (
                          <p className="text-sm mt-2">{job.summary}</p>
                        )}
                      </div>
                      {isViewingOwnProfile && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditWorkHistory(job)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWorkHistory(job.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No work history added yet. {isViewingOwnProfile && "Click 'Add Experience' to add your work history."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayProfile.skills ? (
              <div className="flex flex-wrap gap-2">
                {displayProfile.skills.split(",").map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No skills added yet. Click Edit Profile to add your skills.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Career Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Career Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {displayProfile.career_goals ||
                "No career goals added yet. Click Edit Profile to add your goals."}
            </p>
          </CardContent>
        </Card>

        {/* Awards & Achievements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Awards & Achievements
              </CardTitle>
              {isViewingOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingAchievement(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Achievement
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(displayProfile as any).achievements_history && (displayProfile as any).achievements_history.length > 0 ? (
              <div className="space-y-4">
                {(displayProfile as any).achievements_history.map((achievement: any, index: number) => (
                  <div key={achievement.id || index} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{achievement.title}</h3>
                        {achievement.organization && (
                          <p className="text-sm text-muted-foreground">{achievement.organization}</p>
                        )}
                        {achievement.date && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {achievement.date}
                          </p>
                        )}
                        {achievement.description && (
                          <p className="text-sm mt-2">{achievement.description}</p>
                        )}
                      </div>
                      {isViewingOwnProfile && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAchievement(achievement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAchievement(achievement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No awards or achievements added yet. {isViewingOwnProfile && "Click 'Add Achievement' to showcase your accomplishments."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Career Profile</DialogTitle>
            <DialogDescription>
              Update your career information to help advisors better assist you
            </DialogDescription>
          </DialogHeader>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
              className="space-y-4"
            >
              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Career Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief professional summary..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief summary of your professional background and
                      aspirations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="San Francisco, CA"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://linkedin.com/in/yourprofile"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="major"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Major</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="graduation_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graduation Year</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="university_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Stanford University"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="current_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Position</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Software Engineer Intern"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="current_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Company</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Google" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="experience_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Entry Level, Mid-Level"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Technology, Finance"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. JavaScript, Python, React (comma-separated)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your skills separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="career_goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Career Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What are your career aspirations?"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share your short and long-term career objectives
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Work History Dialog */}
      <Dialog
        open={isAddingWorkHistory || !!editingWorkHistoryId}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingWorkHistory(false);
            setEditingWorkHistoryId(null);
            setWorkHistoryForm({
              role: "",
              company: "",
              location: "",
              start_date: "",
              end_date: "",
              is_current: false,
              summary: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWorkHistoryId ? "Edit Work Experience" : "Add Work Experience"}
            </DialogTitle>
            <DialogDescription>
              Add details about your work experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title *</label>
                <Input
                  placeholder="e.g. Software Engineer"
                  value={workHistoryForm.role}
                  onChange={(e) =>
                    setWorkHistoryForm({ ...workHistoryForm, role: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company *</label>
                <Input
                  placeholder="e.g. Google"
                  value={workHistoryForm.company}
                  onChange={(e) =>
                    setWorkHistoryForm({ ...workHistoryForm, company: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="e.g. San Francisco, CA"
                value={workHistoryForm.location}
                onChange={(e) =>
                  setWorkHistoryForm({ ...workHistoryForm, location: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="month"
                  value={workHistoryForm.start_date}
                  onChange={(e) =>
                    setWorkHistoryForm({ ...workHistoryForm, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="month"
                  value={workHistoryForm.end_date}
                  onChange={(e) =>
                    setWorkHistoryForm({ ...workHistoryForm, end_date: e.target.value })
                  }
                  disabled={workHistoryForm.is_current}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_current"
                checked={workHistoryForm.is_current}
                onChange={(e) =>
                  setWorkHistoryForm({ ...workHistoryForm, is_current: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="is_current" className="text-sm font-medium">
                I currently work here
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your responsibilities and achievements..."
                value={workHistoryForm.summary}
                onChange={(e) =>
                  setWorkHistoryForm({ ...workHistoryForm, summary: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingWorkHistory(false);
                setEditingWorkHistoryId(null);
                setWorkHistoryForm({
                  role: "",
                  company: "",
                  location: "",
                  start_date: "",
                  end_date: "",
                  is_current: false,
                  summary: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingWorkHistoryId ? handleUpdateWorkHistory : handleAddWorkHistory}
            >
              {editingWorkHistoryId ? "Update" : "Add"} Experience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Achievement Dialog */}
      <Dialog
        open={isAddingAchievement || !!editingAchievementId}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingAchievement(false);
            setEditingAchievementId(null);
            setAchievementForm({
              title: "",
              organization: "",
              date: "",
              description: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAchievementId ? "Edit Achievement" : "Add Achievement"}
            </DialogTitle>
            <DialogDescription>
              Add details about your award or achievement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Achievement Title *</label>
              <Input
                placeholder="e.g. Dean's List, Employee of the Year"
                value={achievementForm.title}
                onChange={(e) =>
                  setAchievementForm({ ...achievementForm, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
              <Input
                placeholder="e.g. Stanford University, Company Name"
                value={achievementForm.organization}
                onChange={(e) =>
                  setAchievementForm({ ...achievementForm, organization: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="month"
                value={achievementForm.date}
                onChange={(e) =>
                  setAchievementForm({ ...achievementForm, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your achievement and its significance..."
                value={achievementForm.description}
                onChange={(e) =>
                  setAchievementForm({ ...achievementForm, description: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingAchievement(false);
                setEditingAchievementId(null);
                setAchievementForm({
                  title: "",
                  organization: "",
                  date: "",
                  description: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingAchievementId ? handleUpdateAchievement : handleAddAchievement}
            >
              {editingAchievementId ? "Update" : "Add"} Achievement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
