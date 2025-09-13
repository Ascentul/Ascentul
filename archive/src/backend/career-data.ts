import { Express, Request, Response } from "express"
import { IStorage } from "./storage"
import { requireAuth } from "./auth"

/**
 * Registers API routes for retrieving and managing career data
 * (work history, education, skills, certifications, career summary)
 * This powers the Account Settings Profile and other components like the Resume Studio
 */
export function registerCareerDataRoutes(app: Express, storage: IStorage) {
  // DEBUG ENDPOINT: Get work history data with detailed debugging info
  app.get(
    "/api/debug/work-history",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.userId) {
          return res.status(401).json({ message: "Authentication required" })
        }

        const userId = req.userId

        // Get the raw work history items
        const workHistoryItems = await storage.getWorkHistory(userId)

        // Add debugging info
        const debugItems = workHistoryItems.map((item) => {
          return {
            ...item,
            _debug: {
              startDateType: item.startDate
                ? typeof item.startDate
                : "undefined",
              endDateType: item.endDate ? typeof item.endDate : "undefined",
              startDateIsDate: item.startDate instanceof Date,
              endDateIsDate: item.endDate instanceof Date,
              startDateStr: item.startDate ? item.startDate.toString() : null,
              endDateStr: item.endDate ? item.endDate.toString() : null,
              hasCompany: Boolean(item.company),
              hasPosition: Boolean(item.position),
              formatExample: item.startDate
                ? `${new Date(item.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric"
                  })}`
                : null
            }
          }
        })

          ;[workHistory, educationHistory, skills, user] = await Promise.all([
            storage.getWorkHistory(userId),
            storage.getEducationHistory(userId),
            storage.getUserSkills(userId),
            storage.getUser(userId)
          ])

          // Add debug logs to see what's happening with skills

                // Convert to string directly - don't try to assign string to Date type
                ;(serialized as any).createdAt = new Date(
                  createdAtTime
                ).toISOString()
              }
            }
          } catch (err) {
            console.error("Error serializing skill dates:", err)
            // Keep original value if there's an error
          }

          return serialized
        })

        // Return all career data in a single response with serialized dates

        }

        const userId = req.userId

        // Fetch all career data in parallel
        let workHistory,
          education,
          skills,
          certifications = [],
          user

        try {
          ;[workHistory, education, skills, user] = await Promise.all([
            storage.getWorkHistory(userId),
            storage.getEducationHistory(userId),
            storage.getUserSkills(userId),
            storage.getUser(userId)
          ])

          // Only try to get certifications if the method exists
          if (typeof storage.getCertifications === "function") {
            certifications = await storage.getCertifications(userId)
          } else {

}
