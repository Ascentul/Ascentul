import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/lib/useUserData";
import { apiRequest } from "@/lib/queryClient";
import { ChevronRight, ChevronLeft, Briefcase, GraduationCap, Target, BarChart, FileText, MessageSquare, Check, AlertCircle, Loader2, Users, UserCog, Crown } from "lucide-react";
import StepDiscordInvite from "./onboarding/StepDiscordInvite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
const defaultOnboardingData = {
    careerStage: null,
    studentInfo: {
        isCollegeStudent: false,
        school: "",
        graduationYear: "",
        isGraduateStudent: "none"
    },
    professionalInfo: {
        industry: "",
        role: null
    },
    interests: []
};
const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Manufacturing",
    "Retail",
    "Media",
    "Government",
    "Non-profit",
    "Construction",
    "Agriculture",
    "Transportation",
    "Energy",
    "Entertainment",
    "Legal",
    "Consulting",
    "Marketing",
    "Real Estate",
    "Hospitality",
    "Automotive",
    "Telecommunications",
    "Other"
];
const features = [
    {
        id: "resume-builder",
        title: "Resume Builder",
        description: "Create and customize professional resumes",
        icon: FileText
    },
    {
        id: "cover-letter",
        title: "Cover Letter Generator",
        description: "Generate tailored cover letters",
        icon: FileText
    },
    {
        id: "interview-prep",
        title: "Interview Preparation",
        description: "Practice with AI-generated questions",
        icon: BarChart
    },
    {
        id: "goal-tracking",
        title: "Goal Tracking",
        description: "Set and track professional goals",
        icon: Target
    },
    {
        id: "ai-coach",
        title: "AI Career Coach",
        description: "Get personalized career advice",
        icon: MessageSquare
    },
    {
        id: "work-history",
        title: "Work History Tracker",
        description: "Organize your work experience",
        icon: Briefcase
    }
];
export default function OnboardingFlow() {
    const { user, isLoading, refetchUser } = useUser();
    const [, setLocation] = useLocation();
    // Check if user is authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            // Redirect to sign in if not authenticated
            setLocation("/sign-in");
        }
    }, [user, isLoading, setLocation]);
    // Show loading state while checking authentication
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    // If no user after loading is complete, show a message (this is a fallback)
    if (!user) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: "Redirecting to sign in..." }));
    }
    // If the user needs to set a username, we start at step 0 (username selection)
    // Otherwise, start at step 1 (career stage)
    const needsUsername = user?.needsUsername || false;
    const [step, setStep] = useState(needsUsername ? 0 : 1);
    const [data, setData] = useState(defaultOnboardingData);
    const [progress, setProgress] = useState(needsUsername ? 15 : 25);
    // Username state
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
    const { toast } = useToast();
    // Update progress bar based on current step and check if user needs to set username
    useEffect(() => {
        // We don't need to check user data here anymore as we get it from useUser() hook
        // The useEffect is only needed for updating progress bar
        // If the user needs to set a username, we'll add a step (so 5 steps total including Discord)
        // Without username: 5 steps total [career, details, interests, discord, plan]
        if (needsUsername) {
            setProgress(Math.floor((step / 6) * 100)); // 6 steps total (0, 1, 2, 3, 4, 5)
        }
        else {
            setProgress(Math.floor((step / 5) * 100)); // 5 steps total (1, 2, 3, 4, 5)
        }
    }, [step, needsUsername]);
    const handleCareerStageSelect = (stage) => {
        // If selecting the same career stage again, do nothing
        if (data.careerStage === stage) {
            return;
        }
        // Update the career stage
        setData({
            ...data,
            careerStage: stage,
            // Reset relevant stage-specific data when changing career stage
            studentInfo: stage !== "student"
                ? defaultOnboardingData.studentInfo
                : data.studentInfo,
            professionalInfo: stage === "student"
                ? defaultOnboardingData.professionalInfo
                : data.professionalInfo
        });
        // Move to step 2
        setStep(2);
    };
    const handleStudentInfoChange = (key, value) => {
        console.log(`handleStudentInfoChange: Setting ${key} to ${value}`);
        setData((prevData) => {
            const newData = {
                ...prevData,
                studentInfo: {
                    ...prevData.studentInfo,
                    [key]: value
                }
            };
            console.log("Updated student info:", newData.studentInfo);
            return newData;
        });
    };
    const handleProfessionalInfoChange = (key, value) => {
        setData({
            ...data,
            professionalInfo: {
                ...data.professionalInfo,
                [key]: value
            }
        });
    };
    const handleInterestToggle = (featureId) => {
        const interests = [...data.interests];
        const index = interests.indexOf(featureId);
        if (index === -1) {
            interests.push(featureId);
        }
        else {
            interests.splice(index, 1);
        }
        setData({ ...data, interests });
    };
    // Check if username is available
    const checkUsernameAvailability = async (username) => {
        if (username.length < 3) {
            setUsernameError("Username must be at least 3 characters long");
            setUsernameAvailable(false);
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setUsernameError("Username can only contain letters, numbers, and underscores");
            setUsernameAvailable(false);
            return;
        }
        setUsernameChecking(true);
        setUsernameError("");
        try {
            // Use apiRequest from queryClient for consistency with the rest of the app
            const response = await apiRequest("GET", `/api/users/check-username?username=${username}`);
            const data = await response.json();
            if (response.ok) {
                setUsernameAvailable(data.available);
                if (!data.available) {
                    setUsernameError("This username is already taken");
                }
            }
            else {
                setUsernameError(data.message || "Error checking username");
                setUsernameAvailable(false);
            }
        }
        catch (error) {
            console.error("Error checking username:", error);
            setUsernameError("Error checking username availability");
            setUsernameAvailable(false);
        }
        finally {
            setUsernameChecking(false);
        }
    };
    // Update username
    const updateUsername = async () => {
        if (!username || !usernameAvailable)
            return;
        try {
            // Use apiRequest from queryClient for consistency with the rest of the app
            const response = await apiRequest("POST", "/api/users/update-username", {
                username
            });
            if (!response.ok) {
                const responseData = await response.json();
                throw new Error(responseData.message || "Failed to update username");
            }
            // Set username in onboarding data (fix: use the correct data state, not the API response)
            setData((prevData) => ({ ...prevData, username }));
            // Username is set, proceed with career stage selection
            setStep(1);
            toast({
                title: "Username set successfully",
                description: `You'll be known as @${username} on CareerTracker.io`
            });
            return true;
        }
        catch (error) {
            console.error("Error updating username:", error);
            toast({
                title: "Failed to set username",
                description: error instanceof Error
                    ? error.message
                    : "Please try a different username",
                variant: "destructive"
            });
            return false;
        }
    };
    const handleNext = async () => {
        if (needsUsername && step === 0) {
            // If username is needed, we handle it separately
            await updateUsername();
        }
        else if (step === 3) {
            // After interests selection, move to Discord invite
            setStep(4);
        }
        else if (step === 4) {
            // After Discord invite step, just proceed to plan selection step
            setStep(5);
        }
        else if (step === 5) {
            // When we're on the final step (Plan Selection)
            // Save onboarding data to user profile and wait for it to complete
            const success = await saveOnboardingData();
            if (success) {
                // We don't need to navigate anywhere here since step 5 is already
                // the plan selection step which is displayed in the component
                console.log("Successfully saved onboarding data");
            }
            else {
                // Show error toast if saving failed
                toast({
                    title: "Error saving onboarding data",
                    description: "There was an error saving your profile information. Please try again.",
                    variant: "destructive"
                });
            }
        }
        else if ((needsUsername && step < 6) || (!needsUsername && step < 5)) {
            setStep(step + 1);
        }
    };
    const handleBack = () => {
        if (step > (needsUsername ? 0 : 1)) {
            setStep(step - 1);
        }
    };
    const saveOnboardingData = async () => {
        try {
            setIsSavingOnboarding(true);
            console.log("=== SAVING ONBOARDING DATA ===");
            console.log("Current data state:", JSON.stringify(data, null, 2));
            console.log("User type:", user?.userType);
            console.log("Student info:", data.studentInfo);
            // Use apiRequest from queryClient for consistency with the rest of the app
            const response = await apiRequest("PUT", "/api/users/profile", {
                onboardingCompleted: true,
                onboardingData: data
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Server response error:", errorData);
                throw new Error(errorData.message || "Failed to save onboarding data");
            }
            console.log("Onboarding data saved successfully");
            // Clear the cache to force a fresh fetch
            console.log("Clearing user cache and forcing refetch...");
            queryClient.removeQueries({ queryKey: ["/api/users/me"] });
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
            // Refresh user data to ensure the UI and route guards see the updated data
            const updatedUser = await refetchUser();
            console.log("Updated user data after refetch:", {
                onboardingCompleted: updatedUser?.onboardingCompleted,
                userType: updatedUser?.userType,
                needsUsername: updatedUser?.needsUsername
            });
            // Wait a bit more to ensure the cache is properly updated
            await new Promise((resolve) => setTimeout(resolve, 500));
            return true;
        }
        catch (error) {
            console.error("Error saving onboarding data:", error);
            toast({
                title: "Error saving profile data",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive"
            });
            return false;
        }
        finally {
            setIsSavingOnboarding(false);
        }
    };
    const renderStep = () => {
        switch (step) {
            case 0:
                // This is only shown if the user needs to set a username
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-2xl", children: "Create your username" }), _jsx(CardDescription, { children: "Choose a unique username that will identify you on CareerTracker.io." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "username", children: "Username" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "username", placeholder: "e.g., johndoe, career_pro", value: username, onChange: (e) => {
                                                            setUsername(e.target.value);
                                                            if (e.target.value.length >= 3) {
                                                                checkUsernameAvailability(e.target.value);
                                                            }
                                                            else {
                                                                setUsernameAvailable(null);
                                                            }
                                                        }, className: `pr-10 ${usernameAvailable === true
                                                            ? "border-green-500 focus-visible:ring-green-500"
                                                            : usernameAvailable === false
                                                                ? "border-red-500 focus-visible:ring-red-500"
                                                                : ""}` }), usernameChecking && (_jsx(Loader2, { className: "h-4 w-4 animate-spin absolute right-3 top-3 text-muted-foreground" })), !usernameChecking && usernameAvailable === true && (_jsx(Check, { className: "h-4 w-4 absolute right-3 top-3 text-green-500" })), !usernameChecking && usernameAvailable === false && (_jsx(AlertCircle, { className: "h-4 w-4 absolute right-3 top-3 text-red-500" }))] }), usernameError && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: usernameError })), usernameAvailable === true && (_jsx("p", { className: "text-sm text-green-500 mt-1", children: "Username is available!" }))] }), _jsxs("div", { className: "bg-muted/50 p-4 rounded-lg", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Username requirements:" }), _jsxs("ul", { className: "text-sm text-muted-foreground space-y-1", children: [_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: `h-4 w-4 rounded-full flex items-center justify-center ${username.length >= 3
                                                                    ? "bg-green-500"
                                                                    : "bg-muted-foreground/30"}`, children: username.length >= 3 && (_jsx(Check, { className: "h-3 w-3 text-white" })) }), "At least 3 characters long"] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: `h-4 w-4 rounded-full flex items-center justify-center ${/^[a-zA-Z0-9_]+$/.test(username)
                                                                    ? "bg-green-500"
                                                                    : "bg-muted-foreground/30"}`, children: /^[a-zA-Z0-9_]+$/.test(username) && (_jsx(Check, { className: "h-3 w-3 text-white" })) }), "Only letters, numbers, and underscores"] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: `h-4 w-4 rounded-full flex items-center justify-center ${usernameAvailable === true
                                                                    ? "bg-green-500"
                                                                    : "bg-muted-foreground/30"}`, children: usernameAvailable === true && (_jsx(Check, { className: "h-3 w-3 text-white" })) }), "Unique and available"] })] })] })] }) }), _jsx(CardFooter, { children: _jsxs(Button, { onClick: handleNext, disabled: !usernameAvailable || username.length < 3, className: "w-full", children: ["Continue ", _jsx(ChevronRight, { className: "ml-2 h-4 w-4" })] }) })] }));
            case 1:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-2xl", children: "Where are you in your career?" }), _jsx(CardDescription, { children: "Help us personalize your experience by telling us about your current situation." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.careerStage === "student" ? "border-primary" : ""}`, onClick: () => handleCareerStageSelect("student"), children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(GraduationCap, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "Student" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Current undergraduate or graduate student" }) })] }), _jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.careerStage === "early-career" ? "border-primary" : ""}`, onClick: () => handleCareerStageSelect("early-career"), children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(Briefcase, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "Early-Career Professional" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "0-5 years of professional experience" }) })] }), _jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.careerStage === "mid-senior" ? "border-primary" : ""}`, onClick: () => handleCareerStageSelect("mid-senior"), children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(Target, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "Mid-to-Senior Career Professional" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "5+ years of professional experience" }) })] })] }) })] }));
            case 2:
                return data.careerStage === "student" ? (_jsxs("div", { className: "space-y-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-2xl", children: "Are you a college student, a graduate student, or an intern?" }), _jsx(CardDescription, { children: "This helps us tailor Ascentul to your specific educational journey." })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.studentInfo.isGraduateStudent === "undergraduate"
                                                ? "border-primary"
                                                : ""}`, onClick: () => {
                                                handleStudentInfoChange("isCollegeStudent", true);
                                                handleStudentInfoChange("isGraduateStudent", "undergraduate");
                                                handleNext();
                                            }, children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(GraduationCap, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "College Student" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Currently pursuing a bachelor's degree" }) })] }), _jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.studentInfo.isGraduateStudent === "graduate"
                                                ? "border-primary"
                                                : ""}`, onClick: () => {
                                                handleStudentInfoChange("isCollegeStudent", true);
                                                handleStudentInfoChange("isGraduateStudent", "graduate");
                                                handleNext();
                                            }, children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(GraduationCap, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "Graduate Student" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Currently pursuing a master's or doctorate degree" }) })] }), _jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.studentInfo.isGraduateStudent === "none" &&
                                                data.studentInfo.isCollegeStudent
                                                ? "border-primary"
                                                : ""}`, onClick: () => {
                                                handleStudentInfoChange("isCollegeStudent", true);
                                                handleStudentInfoChange("isGraduateStudent", "none");
                                                handleNext();
                                            }, children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(Briefcase, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "Intern" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Currently in an internship program" }) })] })] }), data.studentInfo.isCollegeStudent && (_jsxs("div", { className: "mt-6 space-y-4 p-4 border rounded-lg bg-muted/20", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "school", children: "What school do you attend?" }), _jsx(Input, { id: "school", placeholder: "Enter your school name", value: data.studentInfo.school, onChange: (e) => handleStudentInfoChange("school", e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "grad-year", children: "Expected graduation year" }), _jsxs(Select, { value: data.studentInfo.graduationYear, onValueChange: (value) => handleStudentInfoChange("graduationYear", value), children: [_jsx(SelectTrigger, { id: "grad-year", children: _jsx(SelectValue, { placeholder: "Select graduation year" }) }), _jsx(SelectContent, { children: [
                                                                new Date().getFullYear(),
                                                                new Date().getFullYear() + 1,
                                                                new Date().getFullYear() + 2,
                                                                new Date().getFullYear() + 3,
                                                                new Date().getFullYear() + 4,
                                                                new Date().getFullYear() + 5
                                                            ].map((year) => (_jsx(SelectItem, { value: year.toString(), children: year }, year))) })] })] })] }))] }), _jsx(CardFooter, { className: "flex justify-start", children: _jsxs(Button, { variant: "outline", onClick: handleBack, children: [_jsx(ChevronLeft, { className: "mr-2 h-4 w-4" }), " Back"] }) })] })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-2xl", children: "Tell us about your professional background" }), _jsx(CardDescription, { children: "This helps us tailor CareerTracker.io to your specific professional needs." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "industry", children: "I work in:" }), _jsxs(Select, { value: data.professionalInfo.industry, onValueChange: (value) => handleProfessionalInfoChange("industry", value), children: [_jsx(SelectTrigger, { id: "industry", children: _jsx(SelectValue, { placeholder: "Select your industry" }) }), _jsx(SelectContent, { children: industries.map((industry) => (_jsx(SelectItem, { value: industry, children: industry }, industry))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "My role is:" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mt-2", children: [_jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.professionalInfo.role === "team-member"
                                                            ? "border-primary"
                                                            : ""}`, onClick: () => handleProfessionalInfoChange("role", "team-member"), children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(Users, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "Team Member" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Individual contributor" }) })] }), _jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.professionalInfo.role === "manager"
                                                            ? "border-primary"
                                                            : ""}`, onClick: () => handleProfessionalInfoChange("role", "manager"), children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(UserCog, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "Manager" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Team or project manager" }) })] }), _jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.professionalInfo.role === "director"
                                                            ? "border-primary"
                                                            : ""}`, onClick: () => handleProfessionalInfoChange("role", "director"), children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(Briefcase, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "Director" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Department or division head" }) })] }), _jsxs(Card, { className: `cursor-pointer hover:bg-muted/50 ${data.professionalInfo.role === "executive"
                                                            ? "border-primary"
                                                            : ""}`, onClick: () => handleProfessionalInfoChange("role", "executive"), children: [_jsxs(CardHeader, { className: "text-center pt-6", children: [_jsx("div", { className: "mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center", children: _jsx(Crown, { className: "h-6 w-6 text-primary" }) }), _jsx(CardTitle, { className: "text-lg", children: "CEO or Owner" })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Executive leadership" }) })] })] })] })] }) }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsxs(Button, { variant: "outline", onClick: handleBack, children: [_jsx(ChevronLeft, { className: "mr-2 h-4 w-4" }), " Back"] }), _jsxs(Button, { onClick: handleNext, disabled: !data.professionalInfo.industry || !data.professionalInfo.role, children: ["Next ", _jsx(ChevronRight, { className: "ml-2 h-4 w-4" })] })] })] }));
            case 3:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-2xl", children: "Which features are you most interested in?" }), _jsx(CardDescription, { children: "Select the features you're most excited to use in Ascentul." })] }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: features.map((feature) => {
                                    const Icon = feature.icon;
                                    const isSelected = data.interests.includes(feature.id);
                                    return (_jsxs(Card, { className: `cursor-pointer ${isSelected
                                            ? "border-primary bg-primary/5"
                                            : "hover:bg-muted/50"}`, onClick: () => handleInterestToggle(feature.id), children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center", children: _jsx(Icon, { className: "h-5 w-5 text-primary" }) }), _jsx(Checkbox, { checked: isSelected })] }), _jsx(CardTitle, { className: "text-base mt-2", children: feature.title })] }), _jsx(CardContent, { children: _jsx("p", { className: "text-muted-foreground text-sm", children: feature.description }) })] }, feature.id));
                                }) }) }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsxs(Button, { variant: "outline", onClick: handleBack, children: [_jsx(ChevronLeft, { className: "mr-2 h-4 w-4" }), " Back"] }), _jsxs(Button, { onClick: handleNext, disabled: data.interests.length === 0, children: ["Join Discord ", _jsx(ChevronRight, { className: "ml-2 h-4 w-4" })] })] })] }));
            case 4:
                // Discord invite step
                return (_jsx("div", { className: "space-y-6", children: _jsx(CardContent, { className: "pt-6", children: _jsx(StepDiscordInvite, { onNext: handleNext, onSkip: handleNext }) }) }));
            case 5:
                // Plan selection step
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-2xl", children: "Choose your plan" }), _jsx(CardDescription, { children: "Select the plan that best fits your needs and goals." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "border rounded-md p-6 hover:shadow-md transition-shadow", children: [_jsx("h3", { className: "text-lg font-semibold mb-1", children: "Free Plan" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Basic features for personal use" }), _jsxs("p", { className: "text-3xl font-bold mb-4", children: ["$0", _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/mo" })] }), _jsxs("ul", { className: "space-y-2 mb-6", children: [_jsxs("li", { className: "flex items-center", children: [_jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }), _jsx("span", { className: "text-sm", children: "Basic career tracking" })] }), _jsxs("li", { className: "flex items-center", children: [_jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }), _jsx("span", { className: "text-sm", children: "Limited AI suggestions" })] }), _jsxs("li", { className: "flex items-center", children: [_jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }), _jsx("span", { className: "text-sm", children: "Job application tracker" })] })] }), _jsx(Button, { onClick: async () => {
                                                    const success = await saveOnboardingData();
                                                    if (success) {
                                                        // Redirect based on user type using React Router navigation
                                                        const redirectUrl = user?.userType === "university_student"
                                                            ? "/university"
                                                            : "/dashboard";
                                                        console.log(`Redirecting to: ${redirectUrl}`);
                                                        setLocation(redirectUrl);
                                                    }
                                                }, variant: "outline", className: "w-full", disabled: isSavingOnboarding, children: isSavingOnboarding ? "Saving..." : "Get Started" })] }), _jsxs("div", { className: "border border-primary rounded-md p-6 bg-primary/5 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Pro Plan" }), _jsx("span", { className: "bg-[#1333c2] text-white text-xs px-2 py-1 rounded-full", children: "RECOMMENDED" })] }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Advanced features for career growth" }), _jsxs("p", { className: "text-3xl font-bold mb-4", children: ["$9.99", _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/mo" })] }), _jsxs("ul", { className: "space-y-2 mb-6", children: [_jsxs("li", { className: "flex items-center", children: [_jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }), _jsx("span", { className: "text-sm", children: "Everything in Free plan" })] }), _jsxs("li", { className: "flex items-center", children: [_jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }), _jsx("span", { className: "text-sm", children: "Unlimited AI career suggestions" })] }), _jsxs("li", { className: "flex items-center", children: [_jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }), _jsx("span", { className: "text-sm", children: "Advanced network management" })] }), _jsxs("li", { className: "flex items-center", children: [_jsx(Check, { className: "h-4 w-4 mr-2 text-green-500" }), _jsx("span", { className: "text-sm", children: "Priority support" })] })] }), _jsx(Button, { onClick: async () => {
                                                    const success = await saveOnboardingData();
                                                    if (success) {
                                                        // Redirect based on user type using React Router navigation
                                                        const redirectUrl = user?.userType === "university_student"
                                                            ? "/university"
                                                            : "/dashboard";
                                                        console.log(`Redirecting to: ${redirectUrl}`);
                                                        setLocation(redirectUrl);
                                                    }
                                                }, className: "w-full bg-[#1333c2] hover:bg-[#0f2aae]", disabled: isSavingOnboarding, children: isSavingOnboarding ? "Saving..." : "Start Pro Plan" })] })] }) })] }));
            default:
                return null;
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-muted/30 py-10", children: _jsxs("div", { className: "container max-w-4xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("h1", { className: "text-3xl font-bold mb-2 text-[#0C29AB]", children: "Welcome to Ascentul" }), _jsx("p", { className: "text-muted-foreground", children: "Help us personalize your experience with a few questions" })] }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsxs("span", { children: ["Step ", step, " of ", needsUsername ? "6" : "5"] }), _jsxs("span", { children: [progress, "%"] })] }), _jsx(Progress, { value: progress, className: "h-2" })] }), _jsx(Card, { className: "w-full bg-card", children: renderStep() })] }) }));
}
