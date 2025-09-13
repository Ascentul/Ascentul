import React, { useState, useEffect } from "react"
import {
  useUser,
  useIsSubscriptionActive,
  useUpdateUserSubscription
} from "@/lib/useUserData"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useCareerData } from "@/hooks/use-career-data"
import { useLocation } from "wouter"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Import the form modals
import { WorkHistoryFormModal } from "@/components/modals/WorkHistoryFormModal"
import { EducationFormModal } from "@/components/modals/EducationFormModal"
import { SkillFormModal } from "@/components/modals/SkillFormModal"
import { CertificationFormModal } from "@/components/modals/CertificationFormModal"
import { CareerSummaryFormModal } from "@/components/modals/CareerSummaryFormModal"
import { LinkedInProfileFormModal } from "@/components/modals/LinkedInProfileFormModal"
import { DeleteConfirmationDialog } from "@/components/modals/DeleteConfirmationDialog"
import { AddSectionButton } from "@/components/AddSectionButton"

import {
  Loader2,
  CreditCard,
  User,
  LogOut,
  Mail,
  CheckCircle,
  Circle,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  RefreshCw,
  HelpCircle,
  Linkedin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"

// Color pickers removed as per branding decision

// Schema for validating the profile form
const profileFormSchema = z.object({
  name: z.string().nonempty({ message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  currentPassword: z.string().optional().or(z.literal("")), // Optional current password (required for email/password change)
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .optional()
    .or(z.literal("")) // Allow empty string for no password change
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function AccountSettings() {
  const { user, isLoading: userLoading, logout, updateProfile } = useUser()
  const isSubscriptionActive = useIsSubscriptionActive()
  const { toast } = useToast()
  const [, navigate] = useLocation()
  const updateUserSubscription = useUpdateUserSubscription()
  // Theme color customization removed as per branding decision
  const careerQuery = useCareerData()
  const {
    careerData,
    isLoading: careerDataLoading,
    refetch: refetchCareerData
  } = careerQuery

  // Debug logging for career data
  useEffect(() => {

}
