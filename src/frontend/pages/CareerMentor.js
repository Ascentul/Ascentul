import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, PlusCircle, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
// Message component for chat
function MentorChatMessage({ isUser, message, timestamp, mentorPersona = 'career_coach', userName = 'You' }) {
    // Get display name for mentor persona
    const getMentorName = (persona) => {
        switch (persona) {
            case 'career_coach':
                return 'Career Coach';
            case 'industry_expert':
                return 'Industry Expert';
            case 'interviewer':
                return 'Interview Specialist';
            case 'resume_expert':
                return 'Resume Expert';
            default:
                return 'Career Mentor';
        }
    };
    return (_jsx("div", { className: cn('p-3 rounded-lg max-w-[80%] mb-4', isUser
            ? 'ml-auto border-r-3 border-secondary/50 bg-secondary/10'
            : 'border-l-3 border-primary/50 bg-primary/10'), children: _jsxs("div", { className: "flex items-start gap-3", children: [!isUser && (_jsx(Avatar, { className: "w-8 h-8 bg-primary/10 text-primary", children: _jsx(AvatarFallback, { children: _jsx(Bot, { className: "h-4 w-4" }) }) })), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium mb-1", children: isUser ? userName : getMentorName(mentorPersona) }), _jsx("div", { className: "text-sm space-y-2", children: _jsx("div", { className: "prose prose-sm max-w-none", children: _jsx(ReactMarkdown, { children: message }) }) }), _jsx("p", { className: "text-xs text-neutral-400 mt-1", children: format(new Date(timestamp), 'h:mm a') })] })] }) }));
}
export default function CareerMentor() {
    const { user } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);
    const [activeConversation, setActiveConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
    const [newConversationTitle, setNewConversationTitle] = useState('');
    const [newConversationCategory, setNewConversationCategory] = useState('general');
    const [newConversationPersona, setNewConversationPersona] = useState('career_coach');
    // Fetch conversations
    const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
        queryKey: ['/api/mentor-chat/conversations'],
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
    // Fetch messages for active conversation
    const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
        queryKey: ['/api/mentor-chat/conversations', activeConversation, 'messages'],
        enabled: !!activeConversation,
        staleTime: 1000 * 60, // 1 minute
    });
    // Create a new conversation mutation
    const createConversationMutation = useMutation({
        mutationFn: async (newConversation) => {
            const res = await apiRequest('POST', '/api/mentor-chat/conversations', newConversation);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/mentor-chat/conversations'] });
            setActiveConversation(data.id);
            setShowNewConversationDialog(false);
            toast({
                title: "Conversation created",
                description: "Your new chat has been started",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to create conversation: ${error.message}`,
                variant: "destructive",
            });
        }
    });
    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ conversationId, message }) => {
            const res = await apiRequest('POST', `/api/mentor-chat/conversations/${conversationId}/messages`, { message });
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['/api/mentor-chat/conversations', activeConversation, 'messages']
            });
            setNewMessage('');
            // Force refetch to ensure we get the latest messages including the AI response
            setTimeout(() => {
                refetchMessages();
            }, 500);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to send message: ${error.message}`,
                variant: "destructive",
            });
        }
    });
    // Set first conversation as active on initial load if none is selected
    useEffect(() => {
        if (conversations.length > 0 && !activeConversation) {
            setActiveConversation(conversations[0].id);
        }
    }, [conversations, activeConversation]);
    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    const handleSendMessage = () => {
        if (!newMessage.trim() || !activeConversation)
            return;
        sendMessageMutation.mutate({
            conversationId: activeConversation,
            message: newMessage
        });
    };
    const handleCreateConversation = () => {
        if (!newConversationTitle.trim()) {
            toast({
                title: "Missing information",
                description: "Please provide a title for your conversation",
                variant: "destructive",
            });
            return;
        }
        createConversationMutation.mutate({
            title: newConversationTitle,
            category: newConversationCategory,
            mentorPersona: newConversationPersona
        });
    };
    // Find the active conversation object
    const activeConversationObj = conversations.find((conv) => conv.id === activeConversation);
    // Categories for new conversations
    const categoryOptions = [
        { value: 'general', label: 'General Career Advice' },
        { value: 'interview', label: 'Interview Preparation' },
        { value: 'resume', label: 'Resume & Cover Letter' },
        { value: 'career_change', label: 'Career Change' },
        { value: 'salary', label: 'Salary Negotiation' },
        { value: 'skills', label: 'Skill Development' },
    ];
    // Mentor personas for new conversations
    const personaOptions = [
        { value: 'career_coach', label: 'Career Coach' },
        { value: 'industry_expert', label: 'Industry Expert' },
        { value: 'interviewer', label: 'Interview Specialist' },
        { value: 'resume_expert', label: 'Resume Expert' },
    ];
    return (_jsxs("div", { className: "flex flex-col h-[calc(100vh-7rem)]", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Career Mentor" }), _jsx("p", { className: "text-muted-foreground", children: "Get personalized career advice from your AI mentor." })] }), _jsxs("div", { className: "grid grid-cols-12 gap-6 flex-1 overflow-hidden", children: [_jsxs("div", { className: "col-span-12 md:col-span-3 xl:col-span-3 flex flex-col space-y-4 md:border-r md:pr-6 h-full", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "font-semibold", children: "Conversations" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setShowNewConversationDialog(true), "aria-label": "New Conversation", children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsx(ScrollArea, { className: "flex-1", children: isLoadingConversations ? (_jsxs("div", { className: "p-4 text-center", children: [_jsx("div", { className: "animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Loading conversations..." })] })) : conversations.length === 0 ? (_jsxs("div", { className: "p-4 text-center", children: [_jsx(MessageSquare, { className: "h-8 w-8 mx-auto mb-2 text-muted-foreground" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "No conversations yet" }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => setShowNewConversationDialog(true), children: "Start a conversation" })] })) : (_jsx("div", { className: "space-y-2 pr-2", children: conversations.map((conversation) => (_jsx(Card, { className: `cursor-pointer transition-colors hover:bg-accent ${activeConversation === conversation.id ? 'border-primary bg-accent/50' : ''}`, onClick: () => setActiveConversation(conversation.id), children: _jsx(CardContent, { className: "p-3", children: _jsx("div", { className: "flex justify-between items-start", children: _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm truncate", children: conversation.title }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: format(new Date(conversation.createdAt), 'MMM d, yyyy') })] }) }) }) }, conversation.id))) })) })] }), _jsx("div", { className: "col-span-12 md:col-span-9 xl:col-span-9 flex flex-col h-full", children: activeConversation ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "px-4 py-2 border-b", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Avatar, { className: "w-8 h-8 bg-primary/10 text-primary mr-2", children: _jsx(AvatarFallback, { children: _jsx(Bot, { className: "h-4 w-4" }) }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm", children: activeConversationObj?.title || 'Career Mentor Chat' }), _jsx("p", { className: "text-xs text-muted-foreground", children: activeConversationObj?.category === 'general' ? 'General Advice' :
                                                            (activeConversationObj?.category ?
                                                                activeConversationObj.category.charAt(0).toUpperCase() +
                                                                    activeConversationObj.category.slice(1).replace('_', ' ')
                                                                : 'Career Advice') })] })] }) }), _jsx(ScrollArea, { className: "flex-1 p-4", children: isLoadingMessages ? (_jsx("div", { className: "h-full flex items-center justify-center", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) })) : messages.length === 0 ? (_jsxs("div", { className: "h-full flex items-center justify-center flex-col", children: [_jsx(Bot, { className: "h-12 w-12 text-muted-foreground mb-2" }), _jsx("p", { className: "text-muted-foreground text-center", children: "No messages yet. Start the conversation by saying hello!" })] })) : (_jsxs("div", { className: "space-y-4", children: [messages.map((message) => (_jsx(MentorChatMessage, { isUser: message.isUser, message: message.message, timestamp: message.timestamp, mentorPersona: activeConversationObj?.mentorPersona, userName: user?.name }, message.id))), _jsx("div", { ref: messagesEndRef }), sendMessageMutation.isPending && (_jsx("div", { className: "p-3 rounded-lg border-l-3 border-primary/50 bg-primary/10 max-w-[80%]", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Avatar, { className: "w-8 h-8 bg-primary/10 text-primary", children: _jsx(AvatarFallback, { children: _jsx(Bot, { className: "h-4 w-4" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "Career Mentor" }), _jsxs("div", { className: "flex space-x-1 items-center", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse" }), _jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse delay-150" }), _jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse delay-300" }), _jsx("span", { className: "text-sm ml-1", children: "Thinking..." })] })] })] }) }))] })) }), _jsx("div", { className: "p-4 border-t", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Input, { placeholder: "Type your message...", value: newMessage, onChange: (e) => setNewMessage(e.target.value), onKeyDown: (e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }, disabled: sendMessageMutation.isPending }), _jsx(Button, { onClick: handleSendMessage, disabled: sendMessageMutation.isPending || !newMessage.trim(), "aria-label": "Send message", children: sendMessageMutation.isPending ? (_jsx("div", { className: "animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" })) : (_jsx(Send, { className: "h-4 w-4" })) })] }) })] })) : (_jsx("div", { className: "h-full flex items-center justify-center flex-col p-6", children: _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: _jsxs(Card, { className: "max-w-md mx-auto shadow-lg", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Start a Conversation" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx(Bot, { className: "h-16 w-16 text-primary/80" }) }), _jsx("p", { className: "text-center text-muted-foreground", children: "Your career mentor is ready to help you with personalized guidance to accelerate your professional growth." })] }), _jsx(CardFooter, { children: _jsxs(Button, { className: "w-full", onClick: () => setShowNewConversationDialog(true), children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "New Conversation"] }) })] }) }) })) })] }), _jsx(Dialog, { open: showNewConversationDialog, onOpenChange: setShowNewConversationDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Start a New Conversation" }), _jsx(DialogDescription, { children: "Choose a topic and mentor type to begin your career discussion." })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Conversation Title" }), _jsx(Input, { placeholder: "e.g., Career transition advice", value: newConversationTitle, onChange: (e) => setNewConversationTitle(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Topic Category" }), _jsxs(Select, { value: newConversationCategory, onValueChange: setNewConversationCategory, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a category" }) }), _jsx(SelectContent, { children: categoryOptions.map(option => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Mentor Type" }), _jsxs(Select, { value: newConversationPersona, onValueChange: setNewConversationPersona, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a mentor type" }) }), _jsx(SelectContent, { children: personaOptions.map(option => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowNewConversationDialog(false), children: "Cancel" }), _jsx(Button, { onClick: handleCreateConversation, disabled: createConversationMutation.isPending || !newConversationTitle.trim(), children: createConversationMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" }), "Creating..."] })) : ('Start Conversation') })] })] }) })] }));
}
