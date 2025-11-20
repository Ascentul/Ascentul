"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  User,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Conversation {
  id: string | number;
  title: string;
  createdAt: string;
  userId: string;
}

interface Message {
  id: string | number;
  conversationId: string | number;
  isUser: boolean;
  message: string;
  timestamp: string;
}

export default function AICoachPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | number | null
  >(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/ai-coach/conversations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ai-coach/conversations");
      return await response.json();
    },
    enabled: !!user?.clerkId,
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/ai-coach/messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const response = await apiRequest(
        "GET",
        `/api/ai-coach/conversations/${selectedConversationId}/messages`,
      );
      return await response.json();
    },
    enabled: !!selectedConversationId && !!user?.clerkId,
  });

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/ai-coach/conversations", {
        title,
      });
      return await response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/ai-coach/conversations"],
      });
      setSelectedConversationId(newConversation.id);
      toast({
        title: "New conversation created",
        description: "Start chatting with your AI career coach!",
        variant: "success",
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      conversationId: string | number;
      content: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/ai-coach/conversations/${data.conversationId}/messages`,
        {
          content: data.content,
        },
      );
      const result = await response.json();
      return result;
    },
    onSuccess: (newMessages) => {
      if (Array.isArray(newMessages)) {
        queryClient.invalidateQueries({
          queryKey: ["/api/ai-coach/messages", selectedConversationId],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/ai-coach/conversations"],
        });
      } else {
        toast({
          title: "Error",
          description: "Unexpected response format from server",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversationId) return;

    setIsLoading(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.log("Message send error handled by mutation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConversation = () => {
    createConversationMutation.mutate("New Conversation");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isLoaded || !clerkUser || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect university admins to the University dashboard
  if (user.role === "university_admin") {
    router.replace("/university");
    return null;
  }

  return (
    <div className="w-full">
      <div className="w-full rounded-3xl bg-white p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">
                Career Coach
              </h1>
              <p className="text-sm text-muted-foreground">
                Get personalized career guidance powered by AI
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateConversation}
            disabled={createConversationMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-240px)]">
        {/* Conversations sidebar */}
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground mb-3">
              Your Conversations
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Click "New Chat" to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation: Conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedConversationId === conversation.id
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "hover:bg-gray-50 border-2 border-transparent"
                    }`}
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            conversation.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Chat area */}
        <Card className="flex-1 flex flex-col">
          {selectedConversationId ? (
            <>
              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Bot className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        AI Career Coach
                      </h3>
                      <p className="text-sm max-w-md mx-auto">
                        Ask me anything about your career journey, job search
                        strategies, resume tips, interview preparation, or
                        career development
                      </p>
                    </div>
                  ) : (
                    messages.map((msg: Message) => (
                      <div
                        key={msg.id}
                        className={`flex gap-4 ${msg.isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!msg.isUser && (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600">
                              <Bot className="h-5 w-5 text-white" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            msg.isUser
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-900 shadow-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </p>
                          <p
                            className={`text-xs mt-2 ${msg.isUser ? "text-blue-100" : "text-gray-500"}`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {msg.isUser && (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-gray-200">
                              <User className="h-5 w-5 text-gray-600" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}

                  {(sendMessageMutation.isPending || isLoading) && (
                    <div className="flex justify-start gap-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600">
                          <Bot className="h-5 w-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message input */}
              <div className="p-4 border-t bg-gray-50">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Ask your AI career coach anything... (Press Enter to send, Shift+Enter for new line)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="resize-none bg-white"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isLoading}
                      className="self-end h-10 px-6"
                      size="lg"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    AI responses are generated and may not always be accurate.
                    Use your judgment.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                  Welcome to AI Career Coach
                </h3>
                <p className="text-muted-foreground mb-6">
                  Select an existing conversation from the sidebar or create a
                  new one to start getting personalized career guidance
                </p>
                <Button onClick={handleCreateConversation} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
    </div>
  );
}
