import { Express, Request, Response } from "express";
import { IStorage } from "./storage";
import { requireAuth } from "./auth";

/**
 * Registers API routes for retrieving career data (work history, education, skills)
 * for use in the Resume Studio Editor
 */
export function registerCareerDataRoutes(app: Express, storage: IStorage) {
  // Get all career data for the current user (work history, education, skills)
  app.get("/api/career-data", requireAuth, async (req: Request, res: Response) => {
    try {
      // Ensure we have a valid user session
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.session.userId;
      
      // Fetch all career data in parallel
      const [workHistory, educationHistory, skills] = await Promise.all([
        storage.getWorkHistory(userId),
        storage.getEducationHistory(userId),
        storage.getUserSkills(userId)
      ]);
      
      // Return all career data in a single response
      res.status(200).json({
        workHistory,
        educationHistory,
        skills
      });
    } catch (error) {
      console.error("Error fetching career data:", error);
      res.status(500).json({ message: "Error fetching career data" });
    }
  });
}