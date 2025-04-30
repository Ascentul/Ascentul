import { Express, Request, Response } from "express";
import { IStorage } from "./storage";
import { requireAuth } from "./auth";

/**
 * Registers API routes for retrieving and managing career data
 * (work history, education, skills, certifications, career summary)
 * This powers the Account Settings Profile and other components like the Resume Studio
 */
export function registerCareerDataRoutes(app: Express, storage: IStorage) {
  
  // DEBUG ENDPOINT: Get work history data with detailed debugging info
  app.get("/api/debug/work-history", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      
      // Get the raw work history items
      const workHistoryItems = await storage.getWorkHistory(userId);
      
      // Add debugging info
      const debugItems = workHistoryItems.map(item => {
        return {
          ...item,
          _debug: {
            startDateType: item.startDate ? typeof item.startDate : "undefined",
            endDateType: item.endDate ? typeof item.endDate : "undefined",
            startDateIsDate: item.startDate instanceof Date,
            endDateIsDate: item.endDate instanceof Date,
            startDateStr: item.startDate ? item.startDate.toString() : null,
            endDateStr: item.endDate ? item.endDate.toString() : null,
            hasCompany: Boolean(item.company),
            hasPosition: Boolean(item.position),
            formatExample: item.startDate ? `${new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : null
          }
        };
      });
      
      console.log(`DEBUG: Found ${workHistoryItems.length} work history items for user ${userId}`);
      res.status(200).json({
        count: workHistoryItems.length,
        items: debugItems
      });
    } catch (error) {
      console.error("DEBUG ERROR fetching work history:", error);
      res.status(500).json({ message: "Error fetching work history for debugging", error: String(error) });
    }
  });
  // Get all career data for the current user
  app.get("/api/career-data", requireAuth, async (req: Request, res: Response) => {
    try {
      // Ensure we have a valid user session
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      
      // Fetch all career data in parallel
      const [workHistory, educationHistory, skills, certifications, user] = await Promise.all([
        storage.getWorkHistory(userId),
        storage.getEducationHistory(userId),
        storage.getUserSkills(userId),
        storage.getCertifications(userId),
        storage.getUser(userId)
      ]);
      
      // Extract career summary from user profile
      const careerSummary = user?.careerSummary || "";
      
      // Serialize dates for work history items
      const serializedWorkHistory = workHistory.map(item => ({
        ...item,
        startDate: item.startDate instanceof Date ? item.startDate.toISOString() : item.startDate,
        endDate: item.endDate instanceof Date ? item.endDate.toISOString() : item.endDate,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt
      }));
      
      // Serialize dates for education history items
      const serializedEducationHistory = educationHistory.map(item => ({
        ...item,
        startDate: item.startDate instanceof Date ? item.startDate.toISOString() : item.startDate,
        endDate: item.endDate instanceof Date ? item.endDate.toISOString() : item.endDate,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt
      }));
      
      // Serialize dates for certifications
      const serializedCertifications = certifications.map(item => {
        // Create a shallow copy of the item
        const serialized = { ...item };
        
        // For safety, wrap date conversion in try/catch blocks
        try {
          // Only convert if createdAt exists and is a Date
          if (serialized.createdAt) {
            // Use Object.prototype.toString to check if it's a Date
            if (Object.prototype.toString.call(serialized.createdAt) === '[object Date]') {
              serialized.createdAt = new Date(serialized.createdAt).toISOString();
            }
          }
          
          // Check and convert issueDate if present
          if (serialized.issueDate) {
            if (Object.prototype.toString.call(serialized.issueDate) === '[object Date]') {
              serialized.issueDate = new Date(serialized.issueDate).toISOString();
            }
          }
          
          // Check and convert expirationDate if present
          if (serialized.expirationDate) {
            if (Object.prototype.toString.call(serialized.expirationDate) === '[object Date]') {
              serialized.expirationDate = new Date(serialized.expirationDate).toISOString();
            }
          }
        } catch (err) {
          console.error("Error serializing certification dates:", err);
          // Leave the original values on error
        }
        
        return serialized;
      });
      
      // Serialize dates for skills with a more robust approach
      const serializedSkills = skills.map(item => {
        const serialized = { ...item };
        
        // Use a safer approach with strict type checking
        try {
          if (serialized.createdAt) {
            // Check if it's an object that likely has Date properties
            if (typeof serialized.createdAt === 'object' && 
                serialized.createdAt !== null && 
                typeof (serialized.createdAt as any).getTime === 'function') {
              // It's a Date-like object, so convert to ISO string
              serialized.createdAt = new Date((serialized.createdAt as any).getTime()).toISOString();
            }
          }
        } catch (err) {
          console.error("Error serializing skill dates:", err);
          // Keep original value if there's an error
        }
        
        return serialized;
      });
      
      // Return all career data in a single response with serialized dates
      console.log(`Returning ${serializedWorkHistory.length} work history items, ${serializedEducationHistory.length} education items, ${serializedSkills.length} skills, and ${serializedCertifications.length} certifications`);
      
      res.status(200).json({
        workHistory: serializedWorkHistory,
        educationHistory: serializedEducationHistory,
        skills: serializedSkills,
        certifications: serializedCertifications,
        careerSummary
      });
    } catch (error) {
      console.error("Error fetching career data:", error);
      res.status(500).json({ message: "Error fetching career data" });
    }
  });
  
  // Work History CRUD endpoints
  app.post("/api/career-data/work-history", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      
      console.log("⭐️ POST /api/career-data/work-history - Request received for user:", userId);
      console.log("📦 Raw request body:", JSON.stringify(req.body, null, 2));
      
      // Process dates to ensure they're Date objects
      const formData = { ...req.body };
      
      // Convert string dates to Date objects
      if (formData.startDate && typeof formData.startDate === 'string') {
        formData.startDate = new Date(formData.startDate);
      }
      
      if (formData.endDate && typeof formData.endDate === 'string') {
        formData.endDate = new Date(formData.endDate);
      }
      
      console.log("🛠️ Creating work history with processed data:", {
        userId,
        company: formData.company,
        position: formData.position,
        startDate: formData.startDate,
        endDate: formData.endDate,
        currentJob: formData.currentJob,
        location: formData.location,
        startDateType: formData.startDate ? typeof formData.startDate : 'undefined',
        endDateType: formData.endDate ? typeof formData.endDate : 'undefined',
        isStartDateValid: formData.startDate instanceof Date && !isNaN(formData.startDate.getTime()),
        isEndDateValid: formData.endDate ? (formData.endDate instanceof Date && !isNaN(formData.endDate.getTime())) : true
      });
      
      // Check storage before creating
      const existingItems = await storage.getWorkHistory(userId);
      console.log(`📋 User ${userId} has ${existingItems.length} existing work history items before creation`);
      
      const workHistoryItem = await storage.createWorkHistoryItem(userId, formData);
      
      // Serialize dates to ISO strings in the response
      const serializedItem = {
        ...workHistoryItem,
        startDate: workHistoryItem.startDate instanceof Date ? workHistoryItem.startDate.toISOString() : workHistoryItem.startDate,
        endDate: workHistoryItem.endDate instanceof Date ? workHistoryItem.endDate.toISOString() : workHistoryItem.endDate,
        createdAt: workHistoryItem.createdAt instanceof Date ? workHistoryItem.createdAt.toISOString() : workHistoryItem.createdAt
      };
      
      console.log("✅ Work history item created successfully:", serializedItem);
      
      // Verify item was saved by retrieving again
      const updatedItems = await storage.getWorkHistory(userId);
      console.log(`📋 User ${userId} now has ${updatedItems.length} work history items after creation`);
      
      // Debug all work history items to check that the newly created item is there
      updatedItems.forEach((item, index) => {
        console.log(`  Item ${index + 1}: ID=${item.id}, Company=${item.company}, Position=${item.position}`);
      });
      
      res.status(201).json(serializedItem);
    } catch (error) {
      console.error("❌ Error creating work history item:", error);
      res.status(500).json({ message: "Error creating work history item" });
    }
  });
  
  app.put("/api/career-data/work-history/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      
      // Process dates to ensure they're Date objects
      const formData = { ...req.body };
      
      // Convert string dates to Date objects
      if (formData.startDate && typeof formData.startDate === 'string') {
        formData.startDate = new Date(formData.startDate);
      }
      
      if (formData.endDate && typeof formData.endDate === 'string') {
        formData.endDate = new Date(formData.endDate);
      }
      
      console.log("Updating work history with data:", {
        id,
        company: formData.company,
        position: formData.position,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startDateType: formData.startDate ? typeof formData.startDate : 'undefined',
        endDateType: formData.endDate ? typeof formData.endDate : 'undefined',
        isStartDateValid: formData.startDate instanceof Date && !isNaN(formData.startDate.getTime()),
        isEndDateValid: formData.endDate ? (formData.endDate instanceof Date && !isNaN(formData.endDate.getTime())) : true
      });
      
      const updatedItem = await storage.updateWorkHistoryItem(id, formData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Work history item not found" });
      }
      
      // Serialize dates to ISO strings in the response
      const serializedItem = {
        ...updatedItem,
        startDate: updatedItem.startDate instanceof Date ? updatedItem.startDate.toISOString() : updatedItem.startDate,
        endDate: updatedItem.endDate instanceof Date ? updatedItem.endDate.toISOString() : updatedItem.endDate,
        createdAt: updatedItem.createdAt instanceof Date ? updatedItem.createdAt.toISOString() : updatedItem.createdAt
      };
      
      console.log("Work history item updated successfully:", serializedItem);
      res.status(200).json(serializedItem);
    } catch (error) {
      console.error("Error updating work history item:", error);
      res.status(500).json({ message: "Error updating work history item" });
    }
  });
  
  app.delete("/api/career-data/work-history/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkHistoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Work history item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting work history item:", error);
      res.status(500).json({ message: "Error deleting work history item" });
    }
  });
  
  // Education History CRUD endpoints
  app.post("/api/career-data/education", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      
      // Process dates to ensure they're Date objects
      const formData = { ...req.body };
      
      // Convert string dates to Date objects
      if (formData.startDate && typeof formData.startDate === 'string') {
        formData.startDate = new Date(formData.startDate);
      }
      
      if (formData.endDate && typeof formData.endDate === 'string') {
        formData.endDate = new Date(formData.endDate);
      }
      
      const educationItem = await storage.createEducationHistoryItem(userId, formData);
      
      // Serialize dates to ISO strings in the response
      const serializedItem = {
        ...educationItem,
        startDate: educationItem.startDate instanceof Date ? educationItem.startDate.toISOString() : educationItem.startDate,
        endDate: educationItem.endDate instanceof Date ? educationItem.endDate.toISOString() : educationItem.endDate,
        createdAt: educationItem.createdAt instanceof Date ? educationItem.createdAt.toISOString() : educationItem.createdAt
      };
      
      res.status(201).json(serializedItem);
    } catch (error) {
      console.error("Error creating education item:", error);
      res.status(500).json({ message: "Error creating education item" });
    }
  });
  
  app.put("/api/career-data/education/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      
      // Process dates to ensure they're Date objects
      const formData = { ...req.body };
      
      // Convert string dates to Date objects
      if (formData.startDate && typeof formData.startDate === 'string') {
        formData.startDate = new Date(formData.startDate);
      }
      
      if (formData.endDate && typeof formData.endDate === 'string') {
        formData.endDate = new Date(formData.endDate);
      }
      
      const updatedItem = await storage.updateEducationHistoryItem(id, formData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Education item not found" });
      }
      
      // Serialize dates to ISO strings in the response
      const serializedItem = {
        ...updatedItem,
        startDate: updatedItem.startDate instanceof Date ? updatedItem.startDate.toISOString() : updatedItem.startDate,
        endDate: updatedItem.endDate instanceof Date ? updatedItem.endDate.toISOString() : updatedItem.endDate,
        createdAt: updatedItem.createdAt instanceof Date ? updatedItem.createdAt.toISOString() : updatedItem.createdAt
      };
      
      res.status(200).json(serializedItem);
    } catch (error) {
      console.error("Error updating education item:", error);
      res.status(500).json({ message: "Error updating education item" });
    }
  });
  
  app.delete("/api/career-data/education/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteEducationHistoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Education item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting education item:", error);
      res.status(500).json({ message: "Error deleting education item" });
    }
  });
  
  // Skills CRUD endpoints
  app.post("/api/career-data/skills", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      // Add userId to the request body before creating
      const skillData = { ...req.body, userId };
      const skill = await storage.createSkill(skillData);
      
      res.status(201).json(skill);
    } catch (error) {
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Error creating skill" });
    }
  });
  
  app.put("/api/career-data/skills/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const updatedSkill = await storage.updateSkill(id, req.body);
      
      if (!updatedSkill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Serialize dates for the response using a safer approach
      const serializedSkill = { ...updatedSkill };
      
      // Safely handle createdAt date
      try {
        if (updatedSkill.createdAt) {
          if (typeof updatedSkill.createdAt === 'object' && 
              updatedSkill.createdAt !== null &&
              typeof (updatedSkill.createdAt as any).getTime === 'function') {
            serializedSkill.createdAt = new Date((updatedSkill.createdAt as any).getTime()).toISOString();
          }
        }
      } catch (err) {
        console.error("Error serializing skill dates in update:", err);
        // Keep original value if serialization fails
      }
      
      res.status(200).json(serializedSkill);
    } catch (error) {
      console.error("Error updating skill:", error);
      res.status(500).json({ message: "Error updating skill" });
    }
  });
  
  app.delete("/api/career-data/skills/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteSkill(id);
      
      if (!success) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ message: "Error deleting skill" });
    }
  });
  
  // Certifications CRUD endpoints
  app.post("/api/career-data/certifications", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      
      // Process dates to ensure they're Date objects
      const formData = { ...req.body };
      
      // Convert string dates to Date objects if they exist
      if (formData.issueDate && typeof formData.issueDate === 'string') {
        formData.issueDate = new Date(formData.issueDate);
      }
      
      if (formData.expirationDate && typeof formData.expirationDate === 'string') {
        formData.expirationDate = new Date(formData.expirationDate);
      }
      
      const certification = await storage.createCertification(userId, formData);
      
      // Serialize dates for the response with error handling
      try {
        const serializedCertification = { ...certification };
        
        // Safely handle createdAt date
        if (certification.createdAt) {
          if (typeof certification.createdAt === 'object' && 
              certification.createdAt !== null &&
              typeof (certification.createdAt as any).getTime === 'function') {
            serializedCertification.createdAt = new Date((certification.createdAt as any).getTime()).toISOString();
          }
        }
        
        // Handle issueDate if it exists - using a safer type checking approach
        if ('issueDate' in certification && certification.issueDate) {
          if (typeof certification.issueDate === 'object' && 
              certification.issueDate !== null &&
              typeof (certification.issueDate as any).getTime === 'function') {
            serializedCertification.issueDate = new Date((certification.issueDate as any).getTime()).toISOString();
          }
        }
        
        // Handle expirationDate if it exists - using a safer type checking approach
        if ('expirationDate' in certification && certification.expirationDate) {
          if (typeof certification.expirationDate === 'object' && 
              certification.expirationDate !== null &&
              typeof (certification.expirationDate as any).getTime === 'function') {
            serializedCertification.expirationDate = new Date((certification.expirationDate as any).getTime()).toISOString();
          }
        }
        
        res.status(201).json(serializedCertification);
      } catch (serializationError) {
        console.error("Error serializing certification dates:", serializationError);
        // Fallback to returning the original data if serialization fails
        res.status(201).json(certification);
      }
    } catch (error) {
      console.error("Error creating certification:", error);
      res.status(500).json({ message: "Error creating certification" });
    }
  });
  
  app.put("/api/career-data/certifications/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      
      // Process dates to ensure they're Date objects
      const formData = { ...req.body };
      
      // Convert string dates to Date objects if they exist
      if (formData.issueDate && typeof formData.issueDate === 'string') {
        formData.issueDate = new Date(formData.issueDate);
      }
      
      if (formData.expirationDate && typeof formData.expirationDate === 'string') {
        formData.expirationDate = new Date(formData.expirationDate);
      }
      
      const updatedCertification = await storage.updateCertification(id, formData);
      
      if (!updatedCertification) {
        return res.status(404).json({ message: "Certification not found" });
      }
      
      // Serialize dates for the response with error handling
      try {
        const serializedCertification = { ...updatedCertification };
        
        // Safely handle createdAt date
        if (updatedCertification.createdAt) {
          if (typeof updatedCertification.createdAt === 'object' && 
              updatedCertification.createdAt !== null &&
              typeof (updatedCertification.createdAt as any).getTime === 'function') {
            serializedCertification.createdAt = new Date((updatedCertification.createdAt as any).getTime()).toISOString();
          }
        }
        
        // Handle issueDate if it exists - using a safer type checking approach
        if ('issueDate' in updatedCertification && updatedCertification.issueDate) {
          if (typeof updatedCertification.issueDate === 'object' && 
              updatedCertification.issueDate !== null &&
              typeof (updatedCertification.issueDate as any).getTime === 'function') {
            serializedCertification.issueDate = new Date((updatedCertification.issueDate as any).getTime()).toISOString();
          }
        }
        
        // Handle expirationDate if it exists - using a safer type checking approach
        if ('expirationDate' in updatedCertification && updatedCertification.expirationDate) {
          if (typeof updatedCertification.expirationDate === 'object' && 
              updatedCertification.expirationDate !== null &&
              typeof (updatedCertification.expirationDate as any).getTime === 'function') {
            serializedCertification.expirationDate = new Date((updatedCertification.expirationDate as any).getTime()).toISOString();
          }
        }
        
        res.status(200).json(serializedCertification);
      } catch (serializationError) {
        console.error("Error serializing certification dates:", serializationError);
        // Fallback to returning the original data if serialization fails
        res.status(200).json(updatedCertification);
      }
    } catch (error) {
      console.error("Error updating certification:", error);
      res.status(500).json({ message: "Error updating certification" });
    }
  });
  
  app.delete("/api/career-data/certifications/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteCertification(id);
      
      if (!success) {
        return res.status(404).json({ message: "Certification not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting certification:", error);
      res.status(500).json({ message: "Error deleting certification" });
    }
  });
  
  // Career Summary endpoint (updates the user profile)
  app.put("/api/career-data/career-summary", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      const { careerSummary } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { careerSummary });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ careerSummary: updatedUser.careerSummary });
    } catch (error) {
      console.error("Error updating career summary:", error);
      res.status(500).json({ message: "Error updating career summary" });
    }
  });

  // Optimize Career Data endpoint (updates multiple career data elements based on AI analysis)
  app.post("/api/career-data/optimize", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      const { optimizedData, jobDescription } = req.body;
      
      if (!optimizedData) {
        return res.status(400).json({ message: "Optimized data is required" });
      }

      console.log(`Optimizing career data for user ${userId} based on job description`);
      
      // Track what was updated for response
      const updates = {
        workHistory: [] as any[],
        skills: [] as any[],
        careerSummary: null as string | null
      };

      // Update career summary if provided
      if (optimizedData.careerSummary) {
        console.log("Updating career summary with AI-optimized version");
        const updatedUser = await storage.updateUser(userId, { 
          careerSummary: optimizedData.careerSummary 
        });
        
        if (updatedUser) {
          updates.careerSummary = updatedUser.careerSummary;
        }
      }
      
      // Update work history items if provided
      if (optimizedData.workHistory && optimizedData.workHistory.length > 0) {
        console.log(`Processing ${optimizedData.workHistory.length} work history updates`);
        
        for (const item of optimizedData.workHistory) {
          if (item.id) {
            // Update existing item
            const formData = { ...item };
            
            // Convert string dates to Date objects
            if (formData.startDate && typeof formData.startDate === 'string') {
              formData.startDate = new Date(formData.startDate);
            }
            
            if (formData.endDate && typeof formData.endDate === 'string') {
              formData.endDate = new Date(formData.endDate);
            }
            
            const updatedItem = await storage.updateWorkHistoryItem(item.id, formData);
            
            if (updatedItem) {
              // Serialize dates for the response
              const serializedItem = {
                ...updatedItem,
                startDate: updatedItem.startDate instanceof Date ? updatedItem.startDate.toISOString() : updatedItem.startDate,
                endDate: updatedItem.endDate instanceof Date ? updatedItem.endDate.toISOString() : updatedItem.endDate,
                createdAt: updatedItem.createdAt instanceof Date ? updatedItem.createdAt.toISOString() : updatedItem.createdAt
              };
              
              updates.workHistory.push(serializedItem);
            }
          }
        }
      }
      
      // Update or add skills if provided
      if (optimizedData.skills && optimizedData.skills.length > 0) {
        console.log(`Processing ${optimizedData.skills.length} skill updates`);
        
        // Get existing skills
        const existingSkills = await storage.getUserSkills(userId);
        const existingSkillNames = existingSkills.map(skill => skill.name.toLowerCase());
        
        for (const skill of optimizedData.skills) {
          // Check if skill already exists (case insensitive)
          const existingSkill = existingSkills.find(
            s => s.name.toLowerCase() === skill.toLowerCase()
          );
          
          if (existingSkill) {
            // Skill already exists, no need to add it again
            updates.skills.push(existingSkill);
          } else {
            // Add new skill
            const newSkill = await storage.createSkill(userId, {
              name: skill,
              proficiencyLevel: "Intermediate", // Default value
              category: null
            });
            
            if (newSkill) {
              updates.skills.push(newSkill);
            }
          }
        }
      }
      
      console.log("Career data optimization complete");
      res.status(200).json({
        message: "Career data optimized successfully",
        updates
      });
    } catch (error) {
      console.error("Error optimizing career data:", error);
      res.status(500).json({ 
        message: "Error optimizing career data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}