import { Express, Request, Response } from "express";
import { IStorage } from "./storage";
import { requireAuth } from "./auth";
import { InsertLanguage } from "../types/database";
import { z } from "zod";

// Create a new Zod schema for language validation
const languageSchema = z.object({
  userId: z.string(),
  name: z.string(),
  proficiencyLevel: z.enum(["beginner", "intermediate", "advanced", "native"]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export function registerLanguagesRoutes(app: Express, storage: IStorage) {
  // Get all languages for the current user
  app.get("/api/languages", requireAuth, async (req: Request, res: Response) => {
    try {
      const languages = await storage.getUserLanguages(req.userId!);
      res.status(200).json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Error fetching languages" });
    }
  });

  // Get a specific language
  app.get("/api/languages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const languageId = parseInt(id);
      
      if (isNaN(languageId)) {
        return res.status(400).json({ message: "Invalid language ID" });
      }
      
      const language = await storage.getLanguage(languageId);
      
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      
      // Ensure the language belongs to the current user
      if (language.userId !== req.userId) {
        return res.status(403).json({ message: "You don't have permission to view this language" });
      }
      
      res.status(200).json(language);
    } catch (error) {
      console.error("Error fetching language:", error);
      res.status(500).json({ message: "Error fetching language" });
    }
  });

  // Create a new language
  app.post("/api/languages", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = languageSchema.parse(req.body);
      
      const newLanguage = await storage.createLanguage({
        ...validatedData,
        userId: req.userId!
      });
      
      res.status(201).json(newLanguage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid language data", errors: error.errors });
      }
      console.error("Error creating language:", error);
      res.status(500).json({ message: "Error creating language" });
    }
  });

  // Update a language
  app.put("/api/languages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const languageId = parseInt(id);
      
      if (isNaN(languageId)) {
        return res.status(400).json({ message: "Invalid language ID" });
      }
      
      const validatedData = languageSchema.parse(req.body);
      
      // Get the existing language to check ownership
      const existingLanguage = await storage.getLanguage(languageId);
      
      if (!existingLanguage) {
        return res.status(404).json({ message: "Language not found" });
      }
      
      // Ensure the language belongs to the current user
      if (existingLanguage.userId !== req.userId) {
        return res.status(403).json({ message: "You don't have permission to update this language" });
      }
      
      const updatedLanguage = await storage.updateLanguage(languageId, validatedData);
      res.status(200).json(updatedLanguage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid language data", errors: error.errors });
      }
      console.error("Error updating language:", error);
      res.status(500).json({ message: "Error updating language" });
    }
  });

  // Delete a language
  app.delete("/api/languages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const languageId = parseInt(id);
      
      if (isNaN(languageId)) {
        return res.status(400).json({ message: "Invalid language ID" });
      }
      
      // Get the existing language to check ownership
      const existingLanguage = await storage.getLanguage(languageId);
      
      if (!existingLanguage) {
        return res.status(404).json({ message: "Language not found" });
      }
      
      // Ensure the language belongs to the current user
      if (existingLanguage.userId !== req.userId) {
        return res.status(403).json({ message: "You don't have permission to delete this language" });
      }
      
      await storage.deleteLanguage(languageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting language:", error);
      res.status(500).json({ message: "Error deleting language" });
    }
  });
}