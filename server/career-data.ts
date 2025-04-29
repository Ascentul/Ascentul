import { Express, Request, Response } from "express";
import { IStorage } from "./storage";
import { requireAuth } from "./auth";

/**
 * Registers API routes for retrieving and managing career data
 * (work history, education, skills, certifications, career summary)
 * This powers the Account Settings Profile and other components like the Resume Studio
 */
export function registerCareerDataRoutes(app: Express, storage: IStorage) {
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
      
      // Return all career data in a single response
      res.status(200).json({
        workHistory,
        educationHistory,
        skills,
        certifications,
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
      const workHistoryItem = await storage.createWorkHistoryItem(userId, req.body);
      
      res.status(201).json(workHistoryItem);
    } catch (error) {
      console.error("Error creating work history item:", error);
      res.status(500).json({ message: "Error creating work history item" });
    }
  });
  
  app.put("/api/career-data/work-history/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const updatedItem = await storage.updateWorkHistoryItem(id, req.body);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Work history item not found" });
      }
      
      res.status(200).json(updatedItem);
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
      const educationItem = await storage.createEducationHistoryItem(userId, req.body);
      
      res.status(201).json(educationItem);
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
      const updatedItem = await storage.updateEducationHistoryItem(id, req.body);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Education item not found" });
      }
      
      res.status(200).json(updatedItem);
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
      
      res.status(200).json(updatedSkill);
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
      const certification = await storage.createCertification(userId, req.body);
      
      res.status(201).json(certification);
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
      const updatedCertification = await storage.updateCertification(id, req.body);
      
      if (!updatedCertification) {
        return res.status(404).json({ message: "Certification not found" });
      }
      
      res.status(200).json(updatedCertification);
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
}