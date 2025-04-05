import { useState, useRef, useEffect } from 'react';
import { Bot, Send, PlusCircle, MessageSquare, Calendar, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import AICoachMessage from '@/components/AICoachMessage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Types for AI Coach data
type Message = {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type Conversation = {
  id: number;
  title: string;
  createdAt: string;
};

// No message map needed with real API

export default function AICoach() {
  const { user } = useUser();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  
  // State for conversations and messages
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Fetch conversations from API
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/ai-coach/conversations'],
    enabled: !!user,
  });
  
  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/ai-coach/conversations", { title });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate the conversations query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['/api/ai-coach/conversations'] });
      setIsCreatingConversation(false);
      setNewConversationTitle('');
      toast({
        title: 'Conversation Created',
        description: 'Your new conversation has been started'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create conversation',
        variant: 'destructive'
      });
    }
  });
  
  // Messages for the active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/ai-coach/conversations', activeConversation, 'messages'],
    enabled: !!activeConversation,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number, content: string }) => {
      const res = await apiRequest("POST", `/api/ai-coach/conversations/${conversationId}/messages`, { content });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate messages query to refetch with the new message and AI response
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['/api/ai-coach/conversations', activeConversation, 'messages'] });
      }
      setIsSending(false);
    },
    onError: (error: any) => {
      setIsSending(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      });
    }
  });
  
  // Auto-create conversation and send first message
  const createAndStartConversation = useMutation({
    mutationFn: async (firstMessage: string) => {
      // Generate a title based on the first message
      let title = firstMessage;
      if (title.length > 30) {
        title = title.substring(0, 30) + "...";
      }
      
      // 1. Create conversation
      const createRes = await apiRequest("POST", "/api/ai-coach/conversations", { title });
      const newConversation = await createRes.json();
      
      // 2. Send the message to the new conversation
      const sendRes = await apiRequest("POST", `/api/ai-coach/conversations/${newConversation.id}/messages`, { 
        content: firstMessage 
      });
      
      return { conversation: newConversation, messages: await sendRes.json() };
    },
    onSuccess: (data) => {
      // Set the new conversation as active
      setActiveConversation(data.conversation.id);
      
      // Invalidate both conversations and messages queries
      queryClient.invalidateQueries({ queryKey: ['/api/ai-coach/conversations'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ai-coach/conversations', data.conversation.id, 'messages'] 
      });
      
      setIsSending(false);
    },
    onError: (error: any) => {
      setIsSending(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start conversation',
        variant: 'destructive'
      });
    }
  });
  
  // Fetch user data for context
  const { data: workHistory } = useQuery({ 
    queryKey: ['/api/work-history'],
    enabled: !!user
  });
  
  const { data: goals } = useQuery({ 
    queryKey: ['/api/goals'],
    enabled: !!user
  });
  
  const { data: interviewProcesses } = useQuery({ 
    queryKey: ['/api/interview/processes'],
    enabled: !!user
  });
  
  const { data: personalAchievements } = useQuery({
    queryKey: ['/api/personal-achievements'],
    enabled: !!user
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
  }, [activeConversation, messages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    
    // Clear the input
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // If there's no active conversation, create one and send message in one operation
    if (!activeConversation) {
      createAndStartConversation.mutate(messageContent);
    } else {
      // Otherwise use the regular send message mutation
      sendMessageMutation.mutate({
        conversationId: activeConversation,
        content: messageContent
      });
    }
  };
  
  const handleCreateConversation = () => {
    if (!newConversationTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for the conversation',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    // Use the create conversation mutation
    createConversationMutation.mutate(newConversationTitle.trim());
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format messages for display
  const getFormattedMessages = (): {id: number; isUser: boolean; message: string; timestamp: Date}[] => {
    if (!activeConversation || !messages || messages.length === 0) return [];
    
    return messages.map((message: Message) => ({
      id: message.id,
      isUser: message.role === "user",
      message: message.content,
      timestamp: new Date(message.createdAt),
    }));
  };
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">AI Career Coach</h1>
          <p className="text-neutral-500">Get personalized career guidance and feedback</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List & Suggestions */}
        <div className="space-y-5">
          {/* User Context Card */}
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
        
          {/* Conversations */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsCreatingConversation(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3">
              {isCreatingConversation ? (
                <div className="space-y-2 p-3">
                  <Input
                    placeholder="Enter conversation title..."
                    value={newConversationTitle}
                    onChange={(e) => setNewConversationTitle(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsCreatingConversation(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleCreateConversation}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : conversations.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1 pr-3">
                    {conversations.map((conversation) => (
                      <Button
                        key={conversation.id}
                        variant={activeConversation === conversation.id ? "secondary" : "ghost"}
                        className="w-full justify-start text-left"
                        onClick={() => setActiveConversation(conversation.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <div className="flex-1 truncate">{conversation.title}</div>
                        <div className="text-xs text-neutral-500 shrink-0">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-6">
                  <Bot className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-500">No conversations yet</p>
                  <Button 
                    variant="link" 
                    className="mt-1"
                    onClick={() => setIsCreatingConversation(true)}
                  >
                    Start your first chat
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
        
        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {activeConversation && conversations
                ? conversations.find((c) => c.id === activeConversation)?.title || "Conversation"
                : "Career Coach"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] border-y relative">
              {!activeConversation ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md px-6">
                    <Bot className="mx-auto h-12 w-12 text-primary/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">AI Career Coach</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      I'm here to help with your career questions, resume feedback, interview preparation, and more. Just type your question below to start a conversation!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" onClick={() => setIsCreatingConversation(true)}>
                        Create Named Conversation
                      </Button>
                    </div>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      getFormattedMessages().map((message) => (
                        <AICoachMessage
                          key={message.id}
                          isUser={message.isUser}
                          message={message.message}
                          timestamp={message.timestamp}
                          userName={user?.name}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                    
                    {isSending && (
                      <div className="flex items-center gap-2 p-3 text-neutral-500 italic">
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary"></div>
                        <span>AI Coach is thinking...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4">
            <div className="flex w-full gap-2">
              <Input
                placeholder={activeConversation ? "Type your message here..." : "Type a question to start a new conversation"}
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