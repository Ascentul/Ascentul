import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Interfaces
interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICoachProps {
  conversationId?: number;
  initialMessages?: Message[];
  compact?: boolean;
}

export default function AICoachMessage({ 
  conversationId: initialConversationId, 
  initialMessages = [], 
  compact = false 
}: AICoachProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<number | undefined>(initialConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isFirstMessage, setIsFirstMessage] = useState(initialMessages.length === 0);

  // Create a conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest('POST', '/api/ai-coach/conversations', {
        title: 'Dashboard Conversation',
        message
      });
      return res.json();
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      // Add the initial message the user sent
      const userMessage: Message = {
        role: 'user',
        content: newMessage,
        timestamp: new Date()
      };
      // Add the response from the AI
      const aiMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      setMessages([userMessage, aiMessage]);
      setNewMessage('');
      setIsFirstMessage(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/ai-coach/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start conversation: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!conversationId) throw new Error('No conversation ID');
      const res = await apiRequest('POST', `/api/ai-coach/conversations/${conversationId}/messages`, {
        message
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Add the user message
      const userMessage: Message = {
        role: 'user',
        content: newMessage,
        timestamp: new Date()
      };
      // Add the AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      setMessages([...messages, userMessage, aiMessage]);
      setNewMessage('');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ai-coach/conversations', conversationId, 'messages'] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (isFirstMessage || !conversationId) {
      createConversationMutation.mutate(newMessage);
    } else {
      sendMessageMutation.mutate(newMessage);
    }
  };

  const isPending = createConversationMutation.isPending || sendMessageMutation.isPending;

  return (
    <div className={`flex flex-col ${compact ? 'h-[400px]' : 'h-[calc(100vh-12rem)]'}`}>
      <ScrollArea className="flex-1 px-2 pt-2">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-start p-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">Career Coach</p>
                <p className="text-sm text-neutral-600 mt-1">
                  Welcome to CareerTracker! I'm your AI career coach. I can see your profile data 
                  and can help with personalized career advice. What would you like to know?
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex items-start ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                
                <Card 
                  className={`
                    max-w-[80%] p-3 
                    ${msg.role === 'user' 
                      ? 'ml-2 bg-primary/10' 
                      : 'ml-2 border border-neutral-200'
                    }
                  `}
                >
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <p className="text-sm font-medium">
                      {msg.role === 'user' ? 'You' : 'Career Coach'}
                    </p>
                    <div className="text-sm mt-1 prose prose-sm max-w-none">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </Card>
              </div>
            ))
          )}
          
          {isPending && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <Card className="ml-2 p-3 border border-neutral-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-300"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-2 mt-auto border-t">
        <div className="flex space-x-2">
          <Input
            placeholder="Ask a career question..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isPending}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isPending || !newMessage.trim()}
            aria-label="Send message"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}