
import { Router } from "express";
import { db } from "../db";
import { projects, insertProjectSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Create project
router.post("/", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projectData = insertProjectSchema.parse(req.body);
    const result = await db.insert(projects).values({
      ...projectData,
      userId,
    }).returning();

    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: "Failed to create project" });
    }
  }
});

// Get user's projects
router.get("/", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userProjects = await db.select().from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(projects.createdAt);

    res.json(userProjects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const project = await db.select().from(projects)
      .where(eq(projects.id, parseInt(req.params.id)))
      .limit(1);

    if (!project.length || (project[0].userId !== userId && !project[0].isPublic)) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Update project
router.put("/:id", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projectData = insertProjectSchema.parse(req.body);
    const result = await db.update(projects)
      .set({
        ...projectData,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, parseInt(req.params.id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: "Failed to update project" });
    }
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await db.delete(projects)
      .where(eq(projects.id, parseInt(req.params.id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
