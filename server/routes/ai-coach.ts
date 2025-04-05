import { Request, Response } from 'express';
import { Express } from 'express';
import { getCareerAdvice } from '../openai';
import { storage } from '../storage';

// This interface should be defined in schemas file but we are adding it here for simplicity
interface Conversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
}

interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface UserContext {
  goals?: any[];
  workHistory?: any[];
  skills?: string[];
  interviewProcesses?: any[];
  userName?: string;
  resumeDetails?: string;
  interviewPrep?: string;
  achievements?: any[];
}

// We will use the storage interface for conversations and messages

export function registerAICoachRoutes(app: Express) {
  // Get all conversations for the current user
  app.get('/api/ai-coach/conversations', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get conversations from the storage
      const userConversations = await storage.getAiCoachConversations(req.session.userId);
      
      res.json(userConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // Create a new conversation
  app.post('/api/ai-coach/conversations', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { title } = req.body;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Create a new conversation using the storage interface
      const newConversation = await storage.createAiCoachConversation(req.session.userId, {
        title
      });

      res.status(201).json(newConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  // Get all messages for a conversation
  app.get('/api/ai-coach/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const conversationId = parseInt(req.params.id);
      
      // Check if the conversation exists and belongs to the user
      const conversation = await storage.getAiCoachConversation(conversationId);
      
      if (!conversation || conversation.userId !== req.session.userId) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Get all messages for this conversation
      const conversationMessages = await storage.getAiCoachMessages(conversationId);
      
      res.json(conversationMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Send a message to a conversation
  app.post('/api/ai-coach/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Check if the conversation exists and belongs to the user
      const conversation = await storage.getAiCoachConversation(conversationId);
      
      if (!conversation || conversation.userId !== req.session.userId) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Create a new user message
      const userMessage = await storage.addAiCoachMessage({
        conversationId,
        role: 'user',
        content,
        createdAt: new Date()
      });

      // Fetch user context data to provide to OpenAI
      const userContext = await getUserContext(req.session.userId);

      // Get the conversation history
      const messages = await storage.getAiCoachMessages(conversationId);
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Generate AI response using OpenAI
      const aiResponse = await getCareerAdvice(content, userContext, conversationHistory);

      // Create a new assistant message
      const assistantMessage = await storage.addAiCoachMessage({
        conversationId,
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date()
      });

      // Return both messages
      res.status(201).json([userMessage, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Generate a response for the AI Coach
  app.post('/api/ai-coach/generate-response', async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { query, conversationHistory = [] } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      // Fetch user context data
      const userContext = await getUserContext(req.session.userId);

      // Generate AI response
      const response = await getCareerAdvice(query, userContext, conversationHistory);
      
      res.json({ response });
    } catch (error) {
      console.error('Error generating AI response:', error);
      res.status(500).json({ error: 'Failed to generate AI response' });
    }
  });
}

// Helper function to fetch user context data
async function getUserContext(userId: number): Promise<UserContext> {
  try {
    // Fetch work history
    const workHistory = await storage.getWorkHistory(userId);

    // Fetch goals
    const goals = await storage.getGoals(userId);

    // Fetch interview processes
    const interviewProcesses = await storage.getInterviewProcesses(userId);

    // Fetch personal achievements
    const achievements = await storage.getUserPersonalAchievements(userId);

    // Fetch user
    const user = await storage.getUser(userId);

    return {
      workHistory,
      goals,
      interviewProcesses,
      achievements,
      userName: user?.name
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return {};
  }
}