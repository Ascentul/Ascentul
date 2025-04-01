import { useState, useRef, useEffect } from 'react';
import { Bot, Send, PlusCircle, MessageSquare, Plus, Calendar, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types for mentor chat
interface Message {
  id: number;
  conversationId: number;
  isUser: boolean;
  message: string;
  timestamp: string;
  role: string;
}

interface Conversation {
  id: number;
  title: string;
  category: string;
  mentorPersona: string;
  createdAt: string;
  updatedAt?: string;
}

// Message component for chat
function MentorChatMessage({ 
  isUser, 
  message, 
  timestamp, 
  mentorPersona = 'career_coach',
  userName = 'You' 
}: { 
  isUser: boolean; 
  message: string; 
  timestamp: string;
  mentorPersona?: string;
  userName?: string;
}) {
  // Get display name for mentor persona
  const getMentorName = (persona: string) => {
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

  return (
    <div
      className={cn(
        'p-3 rounded-lg max-w-[80%] mb-4',
        isUser 
          ? 'ml-auto border-r-3 border-secondary/50 bg-secondary/10' 
          : 'border-l-3 border-primary/50 bg-primary/10'
      )}
    >
      <div className="flex items-start gap-3">
        {!isUser && (
          <Avatar className="w-8 h-8 bg-primary/10 text-primary">
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            {isUser ? userName : getMentorName(mentorPersona)}
          </p>
          <div className="text-sm space-y-2">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>
                {message}
              </ReactMarkdown>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {format(new Date(timestamp), 'h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CareerMentor() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newConversationCategory, setNewConversationCategory] = useState('general');
  const [newConversationPersona, setNewConversationPersona] = useState('career_coach');
  
  // Fetch conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/mentor-chat/conversations'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch messages for active conversation
  const { 
    data: messages = [], 
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery<Message[]>({
    queryKey: ['/api/mentor-chat/conversations', activeConversation, 'messages'],
    enabled: !!activeConversation,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Create a new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (newConversation: { 
      title: string; 
      category: string;
      mentorPersona: string;
    }) => {
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
    mutationFn: async ({ 
      conversationId, 
      message 
    }: { 
      conversationId: number; 
      message: string 
    }) => {
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
    if (!newMessage.trim() || !activeConversation) return;
    
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
  const activeConversationObj = conversations.find((conv: Conversation) => conv.id === activeConversation);
  
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
  
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Career Mentor</h1>
        <p className="text-muted-foreground">
          Get personalized career advice from your AI mentor.
        </p>
      </div>
      
      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Conversation sidebar */}
        <div className="col-span-12 md:col-span-3 xl:col-span-3 flex flex-col space-y-4 md:border-r md:pr-6 h-full">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Conversations</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowNewConversationDialog(true)}
              aria-label="New Conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            {isLoadingConversations ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowNewConversationDialog(true)}
                >
                  Start a conversation
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {conversations.map((conversation: Conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      activeConversation === conversation.id ? 'border-primary bg-accent/50' : ''
                    }`}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm truncate">{conversation.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conversation.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Main chat area */}
        <div className="col-span-12 md:col-span-9 xl:col-span-9 flex flex-col h-full">
          {activeConversation ? (
            <>
              <div className="px-4 py-2 border-b">
                <div className="flex items-center">
                  <Avatar className="w-8 h-8 bg-primary/10 text-primary mr-2">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">
                      {activeConversationObj?.title || 'Career Mentor Chat'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeConversationObj?.category === 'general' ? 'General Advice' : 
                        (activeConversationObj?.category ? 
                          activeConversationObj.category.charAt(0).toUpperCase() + 
                          activeConversationObj.category.slice(1).replace('_', ' ') 
                          : 'Career Advice')}
                    </p>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center flex-col">
                    <Bot className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center">
                      No messages yet. Start the conversation by saying hello!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: Message) => (
                      <MentorChatMessage
                        key={message.id}
                        isUser={message.isUser}
                        message={message.message}
                        timestamp={message.timestamp}
                        mentorPersona={activeConversationObj?.mentorPersona}
                        userName={user?.name}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                    {sendMessageMutation.isPending && (
                      <div className="p-3 rounded-lg border-l-3 border-primary/50 bg-primary/10 max-w-[80%]">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8 bg-primary/10 text-primary">
                            <AvatarFallback>
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">
                              Career Mentor
                            </p>
                            <div className="flex space-x-1 items-center">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150"></div>
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-300"></div>
                              <span className="text-sm ml-1">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || !newMessage.trim()}
                    aria-label="Send message"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center flex-col p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="max-w-md mx-auto shadow-lg">
                  <CardHeader>
                    <CardTitle>Start a Conversation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center">
                      <Bot className="h-16 w-16 text-primary/80" />
                    </div>
                    <p className="text-center text-muted-foreground">
                      Your career mentor is ready to help you with personalized guidance to accelerate your professional growth.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowNewConversationDialog(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Conversation
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </div>
      
      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a New Conversation</DialogTitle>
            <DialogDescription>
              Choose a topic and mentor type to begin your career discussion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Conversation Title</label>
              <Input
                placeholder="e.g., Career transition advice"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic Category</label>
              <Select 
                value={newConversationCategory} 
                onValueChange={setNewConversationCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mentor Type</label>
              <Select 
                value={newConversationPersona} 
                onValueChange={setNewConversationPersona}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mentor type" />
                </SelectTrigger>
                <SelectContent>
                  {personaOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewConversationDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateConversation}
              disabled={createConversationMutation.isPending || !newConversationTitle.trim()}
            >
              {createConversationMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Creating...
                </>
              ) : (
                'Start Conversation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}