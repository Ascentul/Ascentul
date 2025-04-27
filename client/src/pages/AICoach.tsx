import { useState, useRef, useEffect } from 'react';
import { Bot, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import AICoachMessage from '@/components/AICoachMessage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
        conversationHistory: formattedMessages
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
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">AI Career Coach</h1>
          <p className="text-neutral-500">Get personalized career guidance and feedback</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 md:mt-0"
          onClick={handleReset}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Conversation
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Chat Area */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <CardTitle className="text-xl">AI Career Coach</CardTitle>
            </div>
            <p className="text-sm text-neutral-500 mt-1">Ask questions about your career path, resume, interviews, or job search</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] border-y relative">
              <ScrollArea className="h-full p-4">
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
                    <div className="flex items-center gap-2 p-3 text-neutral-500 italic">
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary"></div>
                      <span>AI Coach is thinking...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter className="p-4">
            <div className="flex w-full gap-2">
              <Input
                placeholder="Type your career question here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                className="border-primary/20 focus:border-primary rounded-lg py-6 px-4 text-base"
              />
              <Button 
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="h-12 w-12 rounded-full"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}