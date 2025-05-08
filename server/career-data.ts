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
      let workHistory, educationHistory, skills, certifications = [], user;
      
      try {
        [workHistory, educationHistory, skills, user] = await Promise.all([
          storage.getWorkHistory(userId),
          storage.getEducationHistory(userId),
          storage.getUserSkills(userId),
          storage.getUser(userId)
        ]);
        
        // Only try to get certifications if the method exists
        if (typeof storage.getCertifications === 'function') {
          certifications = await storage.getCertifications(userId);
        } else {
          console.log("getCertifications method not available in current storage implementation");
          certifications = []; // Empty array as fallback
        }
      } catch (error) {
        console.error("Error fetching career data components:", error);
        throw error;
      }
      
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
              const dateObj = serialized.createdAt;
              serialized.createdAt = dateObj.toISOString ? dateObj.toISOString() : new Date(dateObj).toISOString();
            }
          }
          
          // Check and convert issueDate if present
          if (serialized.issueDate) {
            if (Object.prototype.toString.call(serialized.issueDate) === '[object Date]') {
              const issueDateObj = serialized.issueDate;
              serialized.issueDate = issueDateObj.toISOString ? issueDateObj.toISOString() : new Date(issueDateObj).toISOString();
            }
          }
          
          // Check and convert expirationDate if present
          if (serialized.expirationDate) {
            if (Object.prototype.toString.call(serialized.expirationDate) === '[object Date]') {
              const expDateObj = serialized.expirationDate;
              serialized.expirationDate = expDateObj.toISOString ? expDateObj.toISOString() : new Date(expDateObj).toISOString();
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
              const createdAtTime = (serialized.createdAt as any).getTime();
              // Convert to string directly - don't try to assign string to Date type
              (serialized as any).createdAt = new Date(createdAtTime).toISOString();
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
  
  // Get career profile data specifically for path generation
  app.get("/api/career-data/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      // Ensure we have a valid user session
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      
      // Fetch all career data in parallel
      let workHistory, education, skills, certifications = [], user;
      
      try {
        [workHistory, education, skills, user] = await Promise.all([
          storage.getWorkHistory(userId),
          storage.getEducationHistory(userId),
          storage.getUserSkills(userId),
          storage.getUser(userId)
        ]);
        
        // Only try to get certifications if the method exists
        if (typeof storage.getCertifications === 'function') {
          certifications = await storage.getCertifications(userId);
        } else {
          console.log("getCertifications method not available in current storage implementation");
          certifications = []; // Empty array as fallback
        }
      } catch (error) {
        console.error("Error fetching career data components:", error);
        throw error;
      }
      
      // Extract career summary from user profile
      const careerSummary = user?.careerSummary || "";
      
      console.log(`Career profile data for path generation received:
        - Work history: ${workHistory.length} items
        - Education: ${education.length} items
        - Skills: ${skills.length} items
        - Certifications: ${certifications.length} items
        - Career summary: ${careerSummary ? 'present' : 'not present'}
      `);
      
      // Return all career data in the format expected by the path generator
      return res.json({
        workHistory,
        education,
        skills,
        certifications,
        careerSummary
      });
    } catch (error) {
      console.error("Error fetching career profile data:", error);
      res.status(500).json({ message: "Error fetching career profile data" });
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
      
      console.log("⭐️ POST /api/career-data/education - Request received for user:", userId);
      console.log("📦 Raw request body:", JSON.stringify(req.body, null, 2));
      
      // Process dates to ensure they're Date objects
      const formData = { ...req.body };
      
      console.log("Processing education form data with achievements:", formData.achievements);
      
      // Convert string dates to Date objects
      if (formData.startDate && typeof formData.startDate === 'string') {
        formData.startDate = new Date(formData.startDate);
      }
      
      if (formData.endDate && typeof formData.endDate === 'string') {
        formData.endDate = new Date(formData.endDate);
      }
      
      // Ensure achievements is an array
      if (!formData.achievements) {
        formData.achievements = [];
      } else if (!Array.isArray(formData.achievements)) {
        formData.achievements = [formData.achievements];
      }
      
      console.log("🛠️ Creating education history with processed data:", {
        userId,
        institution: formData.institution,
        degree: formData.degree,
        fieldOfStudy: formData.fieldOfStudy,
        startDate: formData.startDate,
        endDate: formData.endDate,
        current: formData.current,
        achievements: formData.achievements,
        startDateType: formData.startDate ? typeof formData.startDate : 'undefined',
        endDateType: formData.endDate ? typeof formData.endDate : 'undefined',
        isStartDateValid: formData.startDate instanceof Date && !isNaN(formData.startDate.getTime()),
        isEndDateValid: formData.endDate ? (formData.endDate instanceof Date && !isNaN(formData.endDate.getTime())) : true
      });
      
      // Check storage before creating
      const existingItems = await storage.getEducationHistory(userId);
      console.log(`📋 User ${userId} has ${existingItems.length} existing education history items before creation`);
      
      const educationItem = await storage.createEducationHistoryItem(userId, formData);
      
      // Serialize dates to ISO strings in the response
      const serializedItem = {
        ...educationItem,
        startDate: educationItem.startDate instanceof Date ? educationItem.startDate.toISOString() : educationItem.startDate,
        endDate: educationItem.endDate instanceof Date ? educationItem.endDate.toISOString() : educationItem.endDate,
        createdAt: educationItem.createdAt instanceof Date ? educationItem.createdAt.toISOString() : educationItem.createdAt
      };
      
      console.log("✅ Education history item created successfully:", serializedItem);
      
      // Verify item was saved by retrieving again
      const updatedItems = await storage.getEducationHistory(userId);
      console.log(`📋 User ${userId} now has ${updatedItems.length} education history items after creation`);
      
      res.status(201).json(serializedItem);
    } catch (error) {
      console.error("❌ Error creating education item:", error);
      res.status(500).json({ message: "Error creating education item", error: String(error) });
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
      const { jobDescription, careerData } = req.body;
      
      if (!jobDescription) {
        return res.status(400).json({ message: "Job description is required" });
      }
      
      if (!careerData) {
        return res.status(400).json({ message: "Career data is required" });
      }

      console.log(`Optimizing career data for user ${userId} based on job description`);

      // Import the optimizeCareerData function from openai
      const { optimizeCareerData } = await import('./openai');
      
      // Call OpenAI to optimize the career data
      const optimizedData = await optimizeCareerData(careerData, jobDescription);
      
      if (!optimizedData) {
        return res.status(500).json({ message: "Failed to optimize career data" });
      }
      
      // Return the optimized data without making any updates to the database yet
      // The client will review the optimizations and then call specific update endpoints
      res.status(200).json(optimizedData);
    } catch (error) {
      console.error("Error optimizing career data:", error);
      res.status(500).json({ 
        message: "Error optimizing career data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}