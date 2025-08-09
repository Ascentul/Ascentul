import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { RefreshCw, Cpu, Target, Briefcase, GraduationCap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/lib/useUserData";
import { useToast } from "@/hooks/use-toast";
import AICoachMessage from "@/components/AICoachMessage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ModelSelector from "@/components/ModelSelector";
import { ModelNotificationContainer } from "@/components/ModelNotification";
import { motion } from "framer-motion";
export default function AICoach() {
    const { user } = useUser();
    const { toast } = useToast();
    const messagesEndRef = useRef(null);
    const [newMessage, setNewMessage] = useState("");
    const [selectedModel, setSelectedModel] = useState("gpt-4o-mini"); // Default to gpt-4o-mini for better performance
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hello! I'm your AI Career Coach. I can help you with:\n\n• Career planning and skill development\n• Resume and cover letter feedback\n• Interview preparation and practice\n• Job search strategies and networking advice\n• Career transitions and industry insights\n\nHow can I assist with your career goals today?",
            timestamp: new Date()
        }
    ]);
    const [isSending, setIsSending] = useState(false);
    // Fetch user data for context
    const { data: workHistory = [] } = useQuery({
        queryKey: ["/api/work-history"],
        enabled: !!user
    });
    const { data: goals = [] } = useQuery({
        queryKey: ["/api/goals"],
        enabled: !!user
    });
    const { data: interviewProcesses = [] } = useQuery({
        queryKey: ["/api/interview/processes"],
        enabled: !!user
    });
    const { data: personalAchievements = [] } = useQuery({
        queryKey: ["/api/personal-achievements"],
        enabled: !!user
    });
    // Generate AI response mutation
    const generateResponseMutation = useMutation({
        mutationFn: async (query) => {
            // Format the conversation history for the API
            const formattedMessages = messages.map((message) => ({
                role: message.role,
                content: message.content
            }));
            // Add the new user message
            formattedMessages.push({
                role: "user",
                content: query
            });
            const res = await apiRequest("POST", "/api/ai-coach/generate-response", {
                query,
                conversationHistory: formattedMessages,
                selectedModel
            });
            if (!res.ok) {
                throw new Error("Failed to generate AI response");
            }
            return await res.json();
        },
        onSuccess: (data) => {
            // Add the AI response to the messages
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.response,
                    timestamp: new Date()
                }
            ]);
            setIsSending(false);
        },
        onError: (error) => {
            setIsSending(false);
            toast({
                title: "Error",
                description: error.message || "Failed to generate AI response",
                variant: "destructive"
            });
            // Add a fallback error message
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "I'm sorry, I encountered an error while processing your request. Please try again.",
                    timestamp: new Date()
                }
            ]);
        }
    });
    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    const handleSendMessage = () => {
        if (!newMessage.trim() || isSending)
            return;
        // Add the user's message to the chat
        const userMessage = {
            role: "user",
            content: newMessage.trim(),
            timestamp: new Date()
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsSending(true);
        // Clear the input
        setNewMessage("");
        // Generate AI response
        generateResponseMutation.mutate(userMessage.content);
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const handleReset = () => {
        // Reset the conversation
        setMessages([
            {
                role: "assistant",
                content: "Hello! I'm your AI Career Coach. I can help you with:\n\n• Career planning and skill development\n• Resume and cover letter feedback\n• Interview preparation and practice\n• Job search strategies and networking advice\n• Career transitions and industry insights\n\nHow can I assist with your career goals today?",
                timestamp: new Date()
            }
        ]);
        toast({
            title: "Conversation Reset",
            description: "Your conversation has been reset"
        });
    };
    // Context options for the AI coach
    const [contextType, setContextType] = useState("career-direction");
    // Context options
    const contextOptions = [
        {
            id: "career-direction",
            label: "Career Direction",
            icon: _jsx(Target, { className: "h-4 w-4" })
        },
        {
            id: "job-applications",
            label: "Job Applications",
            icon: _jsx(Briefcase, { className: "h-4 w-4" })
        },
        {
            id: "interview-prep",
            label: "Interview Prep",
            icon: _jsx(MessageSquare, { className: "h-4 w-4" })
        },
        {
            id: "skill-planning",
            label: "Skill Planning",
            icon: _jsx(GraduationCap, { className: "h-4 w-4" })
        }
    ];
    return (_jsxs("div", { className: "container max-w-6xl mx-auto py-8 px-4", children: [_jsx(ModelNotificationContainer, {}), _jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent", children: "AI Career Coach" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-6", children: "Get personalized career guidance powered by AI with tailored advice for your specific situation" }), _jsx("div", { className: "relative mb-8", children: _jsx("div", { className: "absolute -bottom-3 right-4 z-20 translate-y-[-100%]", children: _jsxs("div", { className: "flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/90 dark:bg-blue-900/50 border border-blue-100 dark:border-blue-800/40 shadow-md hover:shadow-lg transition-shadow", children: [_jsx(Cpu, { className: "h-4 w-4 text-primary" }), _jsx("span", { className: "text-sm font-medium mr-1", children: "AI Model:" }), _jsx(ModelSelector, { selectedModel: selectedModel, onModelChange: setSelectedModel, disabled: isSending }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: handleReset, className: "ml-1 p-1.5 h-8 w-8 rounded-full text-gray-500 hover:text-primary", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Reset Conversation" })] })] }) }) }), _jsx(Card, { className: "p-6 shadow-lg border-primary/10 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-blue-950/20", children: _jsx("div", { className: "w-full", children: _jsxs(Card, { className: "border-0 shadow-none bg-transparent", children: [_jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "h-[550px] border border-gray-200 dark:border-gray-800 rounded-lg relative bg-white dark:bg-gray-950", children: _jsx(ScrollArea, { className: "h-full p-4 md:px-8", children: _jsxs("div", { className: "space-y-4", children: [messages.map((message, index) => (_jsx(AICoachMessage, { isUser: message.role === "user", message: message.content, timestamp: message.timestamp || new Date(), userName: user?.name }, index))), _jsx("div", { ref: messagesEndRef }), isSending && (_jsxs("div", { className: "flex items-center gap-2 p-4 text-gray-600 dark:text-gray-400", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" }), _jsx("div", { className: "absolute inset-0 rounded-full animate-ping bg-primary/20", style: { animationDuration: "2s" } })] }), _jsx("span", { children: "AI Coach is thinking..." })] }))] }) }) }) }), _jsx("div", { className: "mt-4", children: _jsxs("div", { className: "flex items-center space-x-2 h-12", children: [_jsx("div", { className: "relative flex-1", children: _jsx(Input, { placeholder: "Ask your career coach anything...", value: newMessage, onChange: (e) => setNewMessage(e.target.value), onKeyDown: handleKeyDown, disabled: isSending, className: "h-full w-full border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-lg py-3 px-4 text-base shadow-sm" }) }), _jsx(motion.div, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, transition: { duration: 0.2 }, children: _jsx(Button, { onClick: handleSendMessage, disabled: !newMessage.trim() || isSending, className: "h-12 min-w-[48px] px-3 flex items-center justify-center rounded-lg shadow-sm bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700", children: isSending ? (_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-2 border-white/80 border-t-transparent" })) : (_jsx(MessageSquare, { className: "h-5 w-5" })) }) })] }) })] }) }) })] })] }));
}
