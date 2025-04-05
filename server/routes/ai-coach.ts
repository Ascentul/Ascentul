import { Router } from "express";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getCareerAdvice } from "../openai";
import { storage } from "../storage";

export const aiCoachRouter = Router();

interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface UserContext {
  goals?: any[];
  workHistory?: any[];
  skills?: string[];
  interviewProcesses?: any[];
  userName?: string;
  resumeDetails?: string;
  interviewPrep?: string;
  achievements?: any[]; // Added achievements to the interface
}

// Get all AI coach conversations for the current user
aiCoachRouter.get("/conversations", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const conversations = await storage.getAiCoachConversations(req.session.userId);
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching AI coach conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Create a new AI coach conversation
aiCoachRouter.post("/conversations", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const { title } = req.body;
    
    const conversationId = await storage.createAiCoachConversation(
      req.session.userId,
      title || "New Conversation"
    );
    
    res.status(201).json({ conversationId });
  } catch (error) {
    console.error("Error creating AI coach conversation:", error);
    res.status(500).json({ message: "Failed to create conversation" });
  }
});

// Get messages for a specific AI coach conversation
aiCoachRouter.get("/conversations/:id/messages", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const conversationId = parseInt(req.params.id);
    
    // First check if the conversation belongs to the user
    const conversation = await storage.getAiCoachConversation(conversationId);
    
    if (!conversation || conversation.userId !== req.session.userId) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }
    
    const messages = await storage.getAiCoachMessages(conversationId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching AI coach messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Add a message to an AI coach conversation and get AI response
aiCoachRouter.post("/conversations/:id/messages", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const conversationId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }
    
    // Verify conversation ownership
    const conversation = await storage.getAiCoachConversation(conversationId);
    
    if (!conversation || conversation.userId !== req.session.userId) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }
    
    // Add user message
    await storage.addAiCoachMessage({
      conversationId,
      isUser: true,
      message: content
    });
    
    // Get user data for context
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get user context data
    const workHistory = await storage.getWorkHistory(req.session.userId);
    const goals = await storage.getGoals(req.session.userId);
    const interviewProcesses = await storage.getInterviewProcesses(req.session.userId);
    const achievements = await storage.getUserPersonalAchievements(req.session.userId);
    
    // Extract skills from work history descriptions or achievements if available
    const skills = workHistory
      .flatMap(job => {
        // Extract skills from achievements if available
        const achievementSkills = (job.achievements || [])
          .flatMap((achievement: string) => 
            achievement.match(/\b[A-Za-z]+ ?[A-Za-z]+\b/g) || []
          );
        
        // Extract skills from description if available
        const descriptionSkills = job.description 
          ? (job.description.match(/\b[A-Za-z]+ ?[A-Za-z]+\b/g) || [])
          : [];
          
        return [...achievementSkills, ...descriptionSkills];
      })
      .filter((skill, index, self) => skill && self.indexOf(skill) === index);
    
    // Also extract skills from personal achievements if available
    if (achievements && achievements.length > 0) {
      const achievementSkills: string[] = [];
      
      // Safely extract skills from achievements, handling null values
      achievements.forEach((achievement) => {
        // Only process achievements with non-null skills
        if (achievement.skills && typeof achievement.skills === 'string') {
          // Split by comma and add each trimmed skill
          achievement.skills.split(',')
            .map(skill => skill.trim())
            .forEach(skill => {
              if (skill) {
                achievementSkills.push(skill);
              }
            });
        }
      });
      
      // Add unique skills to the skills array
      achievementSkills.forEach((skill: string) => {
        if (skill && !skills.includes(skill)) {
          skills.push(skill);
        }
      });
    }
    
    // Prepare context for AI
    const userContext: UserContext = {
      userName: user.name,
      workHistory,
      goals,
      skills,
      interviewProcesses,
      achievements // Include the achievements in the context
    };
    
    // Get previous messages for context (limit to last 10 for performance)
    const previousMessages = await storage.getAiCoachMessages(conversationId);
    
    // Convert to format expected by OpenAI
    const chatHistory: ChatCompletionMessageParam[] = previousMessages
      .slice(-10)
      .map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));
    
    // Generate AI response
    const aiResponse = await getCareerAdvice(content, userContext, chatHistory);
    
    // Save AI response to database
    const savedMessage = await storage.addAiCoachMessage({
      conversationId,
      isUser: false,
      message: aiResponse
    });
    
    res.json(savedMessage);
  } catch (error) {
    console.error("Error in AI coach conversation:", error);
    res.status(500).json({ message: "Failed to process message" });
  }
});