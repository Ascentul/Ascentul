import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  RefreshCw, 
  Cpu, 
  BrainCircuit, 
  Target, 
  Briefcase, 
  GraduationCap,
  School,
  CheckCircle,
  BarChart3,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import AICoachMessage from '@/components/AICoachMessage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ModelSelector from '@/components/ModelSelector';
import { ModelNotificationContainer } from '@/components/ModelNotification';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Types for the simplified AI Coach
type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

export default function AICoach() {
  const { user } = useUser();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o'); // Default to gpt-4o
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your AI Career Coach. I can help you with:\n\n• Career planning and skill development\n• Resume and cover letter feedback\n• Interview preparation and practice\n• Job search strategies and networking advice\n• Career transitions and industry insights\n\nHow can I assist with your career goals today?',
      timestamp: new Date()
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  
  // Fetch user data for context
  const { data: workHistory = [] } = useQuery<any[]>({ 
    queryKey: ['/api/work-history'],
    enabled: !!user
  });
  
  const { data: goals = [] } = useQuery<any[]>({ 
    queryKey: ['/api/goals'],
    enabled: !!user
  });
  
  const { data: interviewProcesses = [] } = useQuery<any[]>({ 
    queryKey: ['/api/interview/processes'],
    enabled: !!user
  });
  
  const { data: personalAchievements = [] } = useQuery<any[]>({
    queryKey: ['/api/personal-achievements'],
    enabled: !!user
  });
  
  // Generate AI response mutation
  const generateResponseMutation = useMutation({
    mutationFn: async (query: string) => {
      // Format the conversation history for the API
      const formattedMessages = messages.map(message => ({
        role: message.role,
        content: message.content
      }));
      
      // Add the new user message
      formattedMessages.push({
        role: 'user',
        content: query
      });
      
      const res = await apiRequest("POST", "/api/ai-coach/generate-response", {
        query,
        conversationHistory: formattedMessages,
        selectedModel
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate AI response');
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      // Add the AI response to the messages
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: data.response, 
          timestamp: new Date() 
        }
      ]);
      
      setIsSending(false);
    },
    onError: (error: any) => {
      setIsSending(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate AI response',
        variant: 'destructive'
      });
      
      // Add a fallback error message
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error while processing your request. Please try again.", 
          timestamp: new Date() 
        }
      ]);
    }
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || isSending) return;
    
    // Add the user's message to the chat
    const userMessage = {
      role: 'user' as const,
      content: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);
    
    // Clear the input
    setNewMessage('');
    
    // Generate AI response
    generateResponseMutation.mutate(userMessage.content);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleReset = () => {
    // Reset the conversation
    setMessages([{ 
      role: 'assistant', 
      content: 'Hello! I\'m your AI Career Coach. I can help you with:\n\n• Career planning and skill development\n• Resume and cover letter feedback\n• Interview preparation and practice\n• Job search strategies and networking advice\n• Career transitions and industry insights\n\nHow can I assist with your career goals today?',
      timestamp: new Date()
    }]);
    
    toast({
      title: 'Conversation Reset',
      description: 'Your conversation has been reset'
    });
  };
  
  // Context options for the AI coach
  const [contextType, setContextType] = useState<string>("career-direction");
  
  // Context options
  const contextOptions = [
    { id: "career-direction", label: "Career Direction", icon: <Target className="h-4 w-4" /> },
    { id: "job-applications", label: "Job Applications", icon: <Briefcase className="h-4 w-4" /> },
    { id: "interview-prep", label: "Interview Prep", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "skill-planning", label: "Skill Planning", icon: <GraduationCap className="h-4 w-4" /> },
  ];
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Model notification alert specific to AI Coach page */}
      <ModelNotificationContainer />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          AI Career Coach
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Get personalized career guidance powered by AI with tailored advice for your specific situation
        </p>
      
        <Card className="p-6 shadow-lg border-primary/10 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-blue-950/20">
          {/* Model selector in header */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium mr-2">AI Model:</span>
              <ModelSelector 
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={isSending}
              />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleReset}
                className="ml-2 p-1.5 h-8 w-8 rounded-full text-gray-500 hover:text-primary"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Reset Conversation</span>
              </Button>
            </div>
          </div>
            
          {/* Full-width Chat Area */}
          <div className="w-full">
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="h-[550px] border border-gray-200 dark:border-gray-800 rounded-lg relative bg-white dark:bg-gray-950">
                  <ScrollArea className="h-full p-4 md:px-8">
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <AICoachMessage
                          key={index}
                          isUser={message.role === 'user'}
                          message={message.content}
                          timestamp={message.timestamp || new Date()}
                          userName={user?.name}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                      
                      {isSending && (
                        <div className="flex items-center gap-2 p-4 text-gray-600 dark:text-gray-400">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                            <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" style={{ animationDuration: '2s' }}></div>
                          </div>
                          <span>AI Coach is thinking...</span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
              
              <div className="mt-4">
                <div className="flex w-full gap-2">
                  <Input
                    placeholder="Ask your career coach anything..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    className="border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-lg py-6 px-4 text-base shadow-sm"
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="h-14 px-5 shadow-md bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/80 border-t-transparent"></div>
                      ) : (
                        <>
                          <MessageSquare className="h-5 w-5 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
}