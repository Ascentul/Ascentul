import { Express, Request, Response } from "express"
import { IStorage } from "./storage"
import { requireAuth } from "./auth"
import { z } from "zod"
import { InsertSkill } from "../types/database"

// Zod schema for skill validation (request payload)
const skillSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  proficiencyLevel: z.number().min(1).max(5),
  yearsOfExperience: z.number().optional()
})

export function registerSkillsRoutes(app: Express, storage: IStorage) {
  // Get all skills for the current user
  app.get("/api/skills", requireAuth, async (req: Request, res: Response) => {
    try {
      const skills = await storage.getUserSkills(req.userId!)
      res.status(200).json(skills)
    } catch (error) {
      console.error("Error fetching skills:", error)
      res.status(500).json({ message: "Error fetching skills" })
    }
  })

  // Get a specific skill
  app.get(
    "/api/skills/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params
        const skillId = parseInt(id)

        if (isNaN(skillId)) {
          return res.status(400).json({ message: "Invalid skill ID" })
        }

        const skill = await storage.getSkill(skillId)

        if (!skill) {
          return res.status(404).json({ message: "Skill not found" })
        }

        // Ensure the skill belongs to the current user
        if (skill.userId !== req.userId) {
          return res
            .status(403)
            .json({ message: "You don't have permission to view this skill" })
        }

        res.status(200).json(skill)
      } catch (error) {
        console.error("Error fetching skill:", error)
        res.status(500).json({ message: "Error fetching skill" })
      }
    }
  )

  // Create a new skill
  app.post("/api/skills", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = skillSchema.parse(req.body)

      const newSkill = await storage.createSkill({
        ...validatedData,
        userId: req.userId!
      })

      res.status(201).json(newSkill)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid skill data", errors: error.errors })
      }
      console.error("Error creating skill:", error)
      res.status(500).json({ message: "Error creating skill" })
    }
  })

  // Update a skill
  app.put(
    "/api/skills/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params
        const skillId = parseInt(id)

        if (isNaN(skillId)) {
          return res.status(400).json({ message: "Invalid skill ID" })
        }

        const validatedData = skillSchema.parse(req.body)

        // Get the existing skill to check ownership
        const existingSkill = await storage.getSkill(skillId)

        if (!existingSkill) {
          return res.status(404).json({ message: "Skill not found" })
        }

        // Ensure the skill belongs to the current user
        if (existingSkill.userId !== req.userId) {
          return res
            .status(403)
            .json({ message: "You don't have permission to update this skill" })
        }

        const updatedSkill = await storage.updateSkill(skillId, validatedData)
        res.status(200).json(updatedSkill)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid skill data", errors: error.errors })
        }
        console.error("Error updating skill:", error)
        res.status(500).json({ message: "Error updating skill" })
      }
    }
  )

  // Delete a skill
  app.delete(
    "/api/skills/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params
        const skillId = parseInt(id)

        if (isNaN(skillId)) {
          return res.status(400).json({ message: "Invalid skill ID" })
        }

        // Get the existing skill to check ownership
        const existingSkill = await storage.getSkill(skillId)

        if (!existingSkill) {
          return res.status(404).json({ message: "Skill not found" })
        }

        // Ensure the skill belongs to the current user
        if (existingSkill.userId !== req.userId) {
          return res
            .status(403)
            .json({ message: "You don't have permission to delete this skill" })
        }

        await storage.deleteSkill(skillId)
        res.status(204).send()
      } catch (error) {
        console.error("Error deleting skill:", error)
        res.status(500).json({ message: "Error deleting skill" })
      }
    }
  )
}
