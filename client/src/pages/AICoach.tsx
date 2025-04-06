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
      content: 'Hello! I\'m your AI Career Coach. I can help you with career advice, resume feedback, interview preparation, and more. How can I assist you today?',
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

      try {
        const res = await apiRequest("POST", "/api/ai-coach/generate-response", {
          query,
          conversationHistory: formattedMessages
        }, {signal: controller.signal});

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error('Failed to generate AI response');
        }

        return await res.json();
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('AI Coach request timed out');
        }
        throw error;
      }
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
      content: 'Hello! I\'m your AI Career Coach. I can help you with career advice, resume feedback, interview preparation, and more. How can I assist you today?',
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Context Card */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Data</CardTitle>
              <p className="text-sm text-neutral-500">AI Coach uses this data for personalized responses</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">Work History</div>
                  <p className="text-neutral-500">
                    {Array.isArray(workHistory) && workHistory.length > 0 
                      ? `${workHistory.length} job(s) tracked` 
                      : "No work history added yet"}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Career Goals</div>
                  <p className="text-neutral-500">
                    {Array.isArray(goals) && goals.length > 0 
                      ? `${goals.length} goal(s) set` 
                      : "No goals added yet"}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Interview Processes</div>
                  <p className="text-neutral-500">
                    {Array.isArray(interviewProcesses) && interviewProcesses.length > 0 
                      ? `${interviewProcesses.length} process(es) tracked` 
                      : "No interviews tracked yet"}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Personal Achievements</div>
                  <p className="text-neutral-500">
                    {Array.isArray(personalAchievements) && personalAchievements.length > 0 
                      ? `${personalAchievements.length} achievement(s) added` 
                      : "No achievements added yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Topics I Can Help With</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">Career Planning</div>
                  <p className="text-neutral-500">
                    Career path exploration, skill development, industry transitions
                  </p>
                </div>
                <div>
                  <div className="font-medium">Resume & Cover Letters</div>
                  <p className="text-neutral-500">
                    Tailoring documents, highlighting achievements, professional writing
                  </p>
                </div>
                <div>
                  <div className="font-medium">Interview Preparation</div>
                  <p className="text-neutral-500">
                    Common questions, STAR method, behavioral interviews, technical interviews
                  </p>
                </div>
                <div>
                  <div className="font-medium">Job Search Strategy</div>
                  <p className="text-neutral-500">
                    Finding opportunities, networking, salary negotiation, personal branding
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Career Coach</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] border-y relative">
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
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
              <Button 
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}