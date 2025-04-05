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

type MessagesMap = {
  [key: number]: Message[];
};

// Mock data for visual demonstration
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    title: "Career Growth Strategies",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
  },
  {
    id: 2,
    title: "Resume Feedback",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
  },
  {
    id: 3,
    title: "Interview Preparation",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
  }
];

const MOCK_MESSAGES: MessagesMap = {
  1: [
    {
      id: 1,
      conversationId: 1,
      role: "user",
      content: "I'm feeling stuck in my current role. What strategies can I use to grow my career?",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    },
    {
      id: 2,
      conversationId: 1,
      role: "assistant",
      content: "I understand that feeling of stagnation. Here are some strategies you could consider:\n\n1. **Identify your goals**: Define what career growth means to you. Is it more responsibility, leadership, technical expertise, or a change in direction?\n\n2. **Skill development**: Look for gaps between your current skills and where you want to be. Create a learning plan with online courses, certifications, or books.\n\n3. **Seek feedback**: Schedule a meeting with your manager to discuss your performance and growth opportunities.\n\n4. **Expand your network**: Connect with professionals in roles you aspire to, attend industry events, and join relevant communities.\n\n5. **Take on new challenges**: Volunteer for projects outside your comfort zone to demonstrate initiative and build new skills.\n\nWould you like me to elaborate on any of these strategies?",
      createdAt: new Date(Date.now() - 3600000 * 1.9).toISOString(), // 1.9 hours ago
    }
  ],
  2: [
    {
      id: 3,
      conversationId: 2,
      role: "user",
      content: "Could you give me some tips on improving my resume for a senior software developer position?",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    },
    {
      id: 4,
      conversationId: 2,
      role: "assistant",
      content: "For a senior software developer resume, focus on these key improvements:\n\n1. **Highlight technical leadership**: Showcase instances where you led projects, mentored junior developers, or made architectural decisions.\n\n2. **Quantify achievements**: Use metrics to demonstrate impact (e.g., \"Reduced page load time by 40%\" or \"Led a team of 5 developers\").\n\n3. **Showcase problem-solving**: Include complex challenges you've overcome and how your solutions benefited the company.\n\n4. **Focus on modern skills**: Emphasize experience with current technologies, frameworks, and methodologies that are relevant to your target positions.\n\n5. **Include a technical skills section**: List programming languages, frameworks, tools, and methodologies you've mastered, with years of experience for each.\n\nWould you like a more detailed review if you share your current resume content?",
      createdAt: new Date(Date.now() - 86400000 * 7 + 1800000).toISOString(), // 7 days ago + 30 min
    }
  ],
  3: [
    {
      id: 5,
      conversationId: 3,
      role: "user",
      content: "I have an interview for a product manager role next week. What should I prepare?",
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    },
    {
      id: 6,
      conversationId: 3,
      role: "assistant",
      content: "Congratulations on your interview! For a product manager role, prepare for these areas:\n\n1. **Product sense**: Be ready to discuss how you'd improve existing products, validate ideas, and prioritize features.\n\n2. **Analytical skills**: Prepare to talk about how you use data to make decisions and measure success.\n\n3. **Leadership & communication**: Highlight how you align stakeholders, resolve conflicts, and communicate effectively with different teams.\n\n4. **Technical knowledge**: While you don't need to code, understand the technical aspects of product development to collaborate with engineers.\n\n5. **Business acumen**: Show you understand market dynamics, competitive analysis, and how your product creates value.\n\nPractice the STAR method (Situation, Task, Action, Result) for behavioral questions about past experiences. Also, research the company's products thoroughly.\n\nWould you like some specific example questions to practice with?",
      createdAt: new Date(Date.now() - 86400000 * 10 + 1800000).toISOString(), // 10 days ago + 30 min
    }
  ]
};

export default function AICoach() {
  const { user } = useUser();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  
  // Mock state for visual demonstration
  const [mockConversations, setMockConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [mockMessages, setMockMessages] = useState<MessagesMap>(MOCK_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
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
    if (mockConversations.length > 0 && !activeConversation) {
      setActiveConversation(mockConversations[0].id);
    }
  }, [mockConversations, activeConversation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation, mockMessages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    setIsSending(true);
    
    // Create a new user message
    const userMessageId = Date.now();
    const userMessage = {
      id: userMessageId,
      conversationId: activeConversation,
      role: "user" as const,
      content: newMessage.trim(),
      createdAt: new Date().toISOString()
    } as Message;
    
    // Add the user message to the mock messages
    setMockMessages(prevMessages => ({
      ...prevMessages,
      [activeConversation]: [
        ...(prevMessages[activeConversation] || []),
        userMessage
      ]
    }));
    
    // Clear the input
    setNewMessage('');
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage = {
        id: userMessageId + 1,
        conversationId: activeConversation,
        role: "assistant" as const,
        content: getRandomResponse(),
        createdAt: new Date().toISOString()
      } as Message;
      
      // Add the AI response
      setMockMessages(prevMessages => ({
        ...prevMessages,
        [activeConversation]: [
          ...(prevMessages[activeConversation] || []),
          aiMessage
        ]
      }));
      
      setIsSending(false);
    }, 1500);
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
    
    // Simulate API call delay
    setTimeout(() => {
      const newId = mockConversations.length > 0 
        ? Math.max(...mockConversations.map(c => c.id)) + 1 
        : 1;
      
      const newConversation: Conversation = {
        id: newId,
        title: newConversationTitle.trim(),
        createdAt: new Date().toISOString()
      };
      
      setMockConversations(prev => [newConversation, ...prev]);
      setMockMessages(prev => ({
        ...prev,
        [newId]: []
      }));
      
      setIsCreatingConversation(false);
      setNewConversationTitle('');
      setActiveConversation(newId);
      setIsLoading(false);
      
      toast({
        title: 'Conversation Created',
        description: 'Your new conversation has been started',
      });
    }, 800);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format messages for display
  const getMessages = (): {id: number; isUser: boolean; message: string; timestamp: Date}[] => {
    if (!activeConversation || !mockMessages[activeConversation]) return [];
    
    return mockMessages[activeConversation].map((message: Message) => ({
      id: message.id,
      isUser: message.role === "user",
      message: message.content,
      timestamp: new Date(message.createdAt),
    }));
  };
  
  // Generate context-aware response based on user data
  const getRandomResponse = (): string => {
    // Extract user context from fetched data
    const userContext = {
      hasWorkHistory: Array.isArray(workHistory) && workHistory.length > 0,
      workHistoryCount: Array.isArray(workHistory) ? workHistory.length : 0,
      latestJob: Array.isArray(workHistory) && workHistory.length > 0 
        ? workHistory[0] 
        : null,
      hasGoals: Array.isArray(goals) && goals.length > 0,
      goalsCount: Array.isArray(goals) ? goals.length : 0,
      hasInterviews: Array.isArray(interviewProcesses) && interviewProcesses.length > 0,
      interviewCount: Array.isArray(interviewProcesses) ? interviewProcesses.length : 0,
      hasAchievements: Array.isArray(personalAchievements) && personalAchievements.length > 0,
      achievementsCount: Array.isArray(personalAchievements) ? personalAchievements.length : 0,
      recentAchievement: Array.isArray(personalAchievements) && personalAchievements.length > 0
        ? personalAchievements[0]
        : null,
      userName: user?.name || "there"
    };

    // Default responses if there's no context
    const defaultResponses = [
      "That's a great question! Career development is a journey that requires continuous learning and adaptability. I'd recommend focusing on building both technical and soft skills relevant to your field. What specific area are you most interested in developing?",
      "Based on current industry trends, I'd suggest focusing on data analysis skills and problem-solving methodologies. These are increasingly valuable across many sectors. Have you had any experience with data visualization or analytical tools?",
      "Networking is crucial for career advancement. Consider joining professional groups in your field, attending industry conferences, and connecting with peers on LinkedIn. Quality connections often lead to unexpected opportunities. What industry are you currently working in?",
      "For your resume, I'd recommend highlighting quantifiable achievements rather than just listing responsibilities. For example, 'Increased team productivity by 25% through implementation of new workflow processes' is more impactful than 'Responsible for team workflow.' Would you like more specific suggestions?",
    ];
    
    // Generate context-aware responses based on user data
    const contextResponses = [];
    
    // Add work history context responses
    if (userContext.hasWorkHistory) {
      const latestJob = userContext.latestJob;
      contextResponses.push(
        `Based on your work history at ${latestJob.company} as a ${latestJob.position}, I'd recommend focusing on highlighting your skills in ${latestJob.responsibilities}. These experiences are directly relevant to your career growth. Would you like more specific advice about leveraging this experience?`
      );
      
      if (userContext.workHistoryCount > 1) {
        contextResponses.push(
          `I notice you have experience across ${userContext.workHistoryCount} different positions. This diverse background can be a strength when positioning yourself for roles that require adaptability and breadth of experience. How are you currently highlighting this versatility?`
        );
      }
    }
    
    // Add goal context responses
    if (userContext.hasGoals) {
      contextResponses.push(
        `Considering your career goals, I'd suggest creating a strategic plan with specific milestones to track your progress. You currently have ${userContext.goalsCount} goals set. Are there any specific obstacles you're facing with these goals?`
      );
    } else {
      contextResponses.push(
        `I notice you haven't set any career goals yet. Setting SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) can significantly increase your chances of career advancement. Would you like some help defining your first goal?`
      );
    }
    
    // Add interview context responses
    if (userContext.hasInterviews) {
      contextResponses.push(
        `I see you're tracking ${userContext.interviewCount} interview processes. For your upcoming interviews, I recommend preparing specific examples that demonstrate your skills and achievements. Would you like help preparing for any particular interview question?`
      );
    }
    
    // Add achievements context responses
    if (userContext.hasAchievements) {
      if (userContext.recentAchievement) {
        const achievement = userContext.recentAchievement;
        contextResponses.push(
          `I notice you've documented achievements like "${achievement.title}". This is excellent material for your resume and interviews. Highlighting specific achievements with measurable outcomes can help you stand out to potential employers. Would you like suggestions on how to effectively showcase this in your next interview?`
        );
      }
      
      if (userContext.achievementsCount > 2) {
        contextResponses.push(
          `You've recorded ${userContext.achievementsCount} personal achievements - that's impressive! These achievements showcase your capabilities and accomplishments. Have you considered categorizing them by skill area to identify your strongest professional attributes?`
        );
      }
    } else {
      contextResponses.push(
        `I notice you haven't added any personal achievements yet. Documenting your accomplishments, even smaller ones, can help build your confidence and provide concrete examples for interviews and resume building. Would you like some guidance on identifying achievements from your past experiences?`
      );
    }
    
    // Select from context-aware responses if available, otherwise fall back to default
    const allResponses = contextResponses.length > 0 ? contextResponses : defaultResponses;
    return allResponses[Math.floor(Math.random() * allResponses.length)];
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
              ) : mockConversations.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1 pr-3">
                    {mockConversations.map((conversation) => (
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
              {activeConversation && mockConversations
                ? mockConversations.find((c) => c.id === activeConversation)?.title || "Conversation"
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
                      I'm here to help with your career questions, resume feedback, interview preparation, and more.
                    </p>
                    <Button
                      onClick={() => setIsCreatingConversation(true)}
                    >
                      Start New Conversation
                    </Button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {getMessages().map((message) => (
                      <AICoachMessage
                        key={message.id}
                        isUser={message.isUser}
                        message={message.message}
                        timestamp={message.timestamp}
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
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4">
            <div className="flex w-full gap-2">
              <Input
                placeholder={activeConversation ? "Type your message here..." : "Start a conversation to chat with the AI Coach"}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!activeConversation || isSending}
              />
              <Button 
                size="icon"
                onClick={handleSendMessage}
                disabled={!activeConversation || !newMessage.trim() || isSending}
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