import express, { Request, Response } from "express"
import type { Express } from "express"
import { createServer, type Server } from "http"
import { storage, checkStorageHealth } from "./storage"
import { z } from "zod"
import Stripe from "stripe"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import { registerCareerPathRoutes } from "./career-path"
// import { registerAICoachRoutes } from "./routes/ai-coach" // Disabled - using inline routes with proper Supabase auth
import { registerSkillsRoutes } from "./skills"
import { registerLanguagesRoutes } from "./languages"
import { registerContactsRoutes } from "./contacts"
import { registerJobRoutes } from "./routes/jobs"
import { getRedirectByRole } from "./utils/redirectByRole"
import { registerJobsAIRoutes } from "./routes/jobs-ai"
import { registerAdzunaRoutes } from "./routes/adzuna"
import { registerApplicationRoutes } from "./routes/applications"
import { registerApplicationInterviewRoutes } from "./routes/application-interview"
import { registerModelsRoutes } from "./routes/models"
import { registerPdfExtractRoutes } from "./routes-pdf"
import { supabaseHelpers } from "./supabase"
import type { User } from "../types/database"

import { registerOpenAILogsRoutes } from "./routes/openai-logs"
// Voice Interview routes removed
import { registerCareerDataRoutes } from "./career-data"
import projectsRouter from "./routes/projects"
import debugRouter from "./routes/debug"
import pdfTestRouter from "./routes/pdf-test"
import userRoleRouter from "./routes/user-role"
import academicProgramsRouter from "./routes/academic-programs"
// Import mail router for email functionality
import mailRouter from "./routes/mail"
// Import university invites router
import universityInvitesRouter from "./routes/university-invites"
// Import universities router
import universitiesRouter from "./routes/universities"
// Import reviews router
import reviewsRouter from "./routes/reviews"
// Import settings router
import settingsRouter from "./routes/settings"
// Import test email router
import testEmailRouter from "./routes/test-email"
// Import notifications router
import notificationsRouter from "./routes/notifications"
import supportRouter from "./routes/support"
import { sendSupportAcknowledgementEmail } from "./mail"
import * as openai from "./openai"
import {
  generateCertificationRecommendations,
  CertificationRecommendation
} from "./ai-certifications"
import { generateCareerPaths, CareerPath } from "./ai-career-paths"
import {
  getCareerAdvice,
  generateResumeSuggestions,
  generateFullResume,
  generateCoverLetter,
  generateCoverLetterSuggestions,
  generateInterviewQuestions,
  suggestCareerGoals,
  analyzeInterviewAnswer,
  generateRoleInsights,
  RoleInsightResponse
} from "./openai"
import { generateCoachingResponse } from "./utils/openai"
import {
  createPaymentIntent,
  createPaymentIntentSchema,
  createSubscription,
  createSubscriptionSchema,
  handleSubscriptionUpdated,
  cancelSubscription,
  generateEmailVerificationToken,
  verifyEmail,
  createSetupIntent,
  getUserPaymentMethods,
  stripe
} from "./services/stripe"
import {
  generateSkillStackerPlan,
  generatePlanRequestSchema
} from "./skill-stacker"

// Helper function to get the current user
async function getCurrentUser(req: Request): Promise<User | null> {
  try {
    // If we already have the user object from the Supabase auth middleware
    if (req.user) {

        // }

        if (loginType === "admin" && user.userType !== "admin") {
          return res.status(403).json({
            message: "Access denied. You do not have administrator privileges."
          })
        }

        if (
          loginType === "staff" &&
          user.userType !== "staff" &&
          user.userType !== "admin"
        ) {
          return res.status(403).json({
            message: "Access denied. You do not have staff privileges."
          })
        }
      }

      // NOTE: This route is maintained for backward compatibility only
      // Supabase handles authentication directly in the frontend now

      const { password: pwd, ...safeUser } = user

      // Use the imported getRedirectByRole utility from the top

      // Use the utility function to determine redirect path
      const redirectPath = getRedirectByRole(user.role || "user")

      // Enhanced logging to diagnose redirect issues

          // Extract the base64 data from the data URL
          const matches = req.body.imageDataUrl.match(
            /^data:image\/([A-Za-z-+\/]+);base64,(.+)$/
          )

          if (!matches || matches.length !== 3) {
            console.error("Invalid image data URL format")
            return res.status(400).json({ message: "Invalid image data" })
          }

          const imageType = matches[1]
        // Upload image to Supabase storage
          const base64Data = matches[2]
          const buffer = Buffer.from(base64Data, "base64")

          // Create unique filename
          const timestamp = Date.now()
          const extension = imageType === "jpeg" ? "jpg" : imageType
          const filename = `profile_${user.id}_${timestamp}.${extension}`
          const filePathInBucket = `images/${filename}`

          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } =
            await supabaseAdmin.storage.from("images").upload(
              filePathInBucket,
              buffer,
              { contentType: `image/${imageType}` }
            )
          if (uploadError) {
            console.error("Error uploading image to Supabase:", uploadError)
            return res.status(500).json({ message: "Error uploading image" })
          }

          // Get public URL
          const { data: { publicUrl } } =
            supabaseAdmin.storage.from("images").getPublicUrl(filePathInBucket)

          // Update the user profile in the database
          const updatedUser = await storage.updateUser(user.id.toString(), { profileImage: publicUrl })
          if (!updatedUser) {
            console.error("Failed to update user profile with new image URL")
            return res.status(404).json({ message: "Failed to update profile image" })
          }

          // Extract the base64 data from the data URL
          const matches = req.body.fileDataUrl.match(
            /^data:application\/([A-Za-z-+\/]+);base64,(.+)$/
          )

          if (!matches || matches.length !== 3) {
            console.error("Invalid file data URL format")
            return res.status(400).json({ message: "Invalid file data" })
          }

          const fileType = matches[1]
          const base64Data = matches[2]
          const buffer = Buffer.from(base64Data, "base64")

          // Upload resume to Supabase storage
          const timestamp = Date.now()
          const filename = `resume_${user.id}_${timestamp}.${fileType}`
          const filePathInBucket = `resumes/${filename}`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from("resumes").upload(filePathInBucket, buffer, { contentType: `application/${fileType}` })
          if (uploadError) {
            console.error("Error uploading resume to Supabase:", uploadError)
            return res.status(500).json({ message: "Error uploading resume" })
          }

          // Get public URL
          const { data: { publicUrl } } = supabaseAdmin.storage.from("resumes").getPublicUrl(filePathInBucket)

          // Extract the base64 data from the data URL
          const matches = req.body.fileDataUrl.match(
            /^data:application\/([A-Za-z-+\/]+);base64,(.+)$/
          )

          if (!matches || matches.length !== 3) {
            console.error("Invalid file data URL format")
            return res.status(400).json({ message: "Invalid file data" })
          }

          const fileType = matches[1]
          const base64Data = matches[2]
          const buffer = Buffer.from(base64Data, "base64")

          // Upload resume to Supabase storage
          const timestamp = Date.now()
          const filename = `resume_${user.id}_${timestamp}.${fileType}`
          const filePathInBucket = `resumes/${filename}`
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from("resumes").upload(filePathInBucket, buffer, { contentType: `application/${fileType}` })
          if (uploadError) {
            console.error("Error uploading resume to Supabase:", uploadError)
            return res.status(500).json({ message: "Error uploading resume" })
          }

          // Get public URL
          const { data: { publicUrl } } = supabaseAdmin.storage.from("resumes").getPublicUrl(filePathInBucket)

                await createNotification({
                  userId: user.id,
                  title: 'New Daily Recommendations',
                  meta: {
                    text: 'Your daily job recommendations are ready! Check them out to stay on track with your career goals.',
                    category: 'recommendation',
                    channel: 'in_app',
                    cadence: 'daily',
                    ctaText: 'View recommendations',
                    ctaUrl: '/career-dashboard'
                  }
                });

              } catch (notifError) {
                console.error(`Failed to create notification for user ${user.id}:`, notifError);
              }

  // Mount projects router
  app.use("/api/projects", projectsRouter)

  // Register our PDF test router
  app.use(pdfTestRouter)

  // Register the test PDF extraction router
  // (already registered above)

  // Skill Stacker section removed

  // Job Listings API Routes
  apiRouter.get(
    "/job-listings",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const query = req.query.query as string | undefined
        const location = req.query.location as string | undefined
        const remote = req.query.remote === "true"
        const jobType = req.query.jobType as string | undefined
        const page = req.query.page ? parseInt(req.query.page as string) : 1
        const pageSize = req.query.pageSize
          ? parseInt(req.query.pageSize as string)
          : 10

        const result = await storage.getJobListings({
          query,
          location,
          remote: req.query.remote === "true" ? true : undefined,
          jobType,
          page,
          pageSize
        })

        res.json(result)
      } catch (error) {
        console.error("Error fetching job listings:", error)
        res.status(500).json({ message: "Failed to fetch job listings" })
      }
    }
  )

  apiRouter.get(
    "/job-listings/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)
        const listing = await storage.getJobListing(id)

        if (!listing) {
          return res.status(404).json({ message: "Job listing not found" })
        }

        res.json(listing)
      } catch (error) {
        console.error("Error fetching job listing:", error)
        res.status(500).json({ message: "Failed to fetch job listing" })
      }
    }
  )

  apiRouter.post(
    "/job-listings",
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        // Only admin users can create job listings
        const listingData = insertJobListingSchema.parse(req.body)
        const listing = await storage.createJobListing(listingData)
        res.status(201).json(listing)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid job listing data", errors: error.errors })
        }
        console.error("Error creating job listing:", error)
        res.status(500).json({ message: "Failed to create job listing" })
      }
    }
  )

  apiRouter.put(
    "/job-listings/:id",
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        // Only admin users can update job listings
        const id = parseInt(req.params.id)
        const listingData = req.body
        const updatedListing = await storage.updateJobListing(id, listingData)

        if (!updatedListing) {
          return res.status(404).json({ message: "Job listing not found" })
        }

        res.json(updatedListing)
      } catch (error) {
        console.error("Error updating job listing:", error)
        res.status(500).json({ message: "Failed to update job listing" })
      }
    }
  )

  apiRouter.delete(
    "/job-listings/:id",
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        // Only admin users can delete job listings
        const id = parseInt(req.params.id)
        const success = await storage.deleteJobListing(id)

        if (!success) {
          return res.status(404).json({ message: "Job listing not found" })
        }

        res.status(204).end()
      } catch (error) {
        console.error("Error deleting job listing:", error)
        res.status(500).json({ message: "Failed to delete job listing" })
      }
    }
  )

  // Job Applications API Routes
  apiRouter.get(
    "/applications",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const user = await getCurrentUser(req)
        if (!user) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        const applications = await storage.getJobApplications(user.id)
        res.json(applications)
      } catch (error) {
        console.error("Error fetching job applications:", error)
        res.status(500).json({ message: "Failed to fetch job applications" })
      }
    }
  )

  // Alias route for job-applications (same as /applications)
  apiRouter.get(
    "/job-applications",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const user = await getCurrentUser(req)
        if (!user) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        const applications = await storage.getJobApplications(user.id)
        res.json(applications)
      } catch (error) {
        console.error("Error fetching job applications:", error)
        res.status(500).json({ message: "Failed to fetch job applications" })
      }
    }
  )

  apiRouter.get(
    "/applications/:id",
    requireAuth,
    validateUserAccess,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)
        const application = await storage.getJobApplication(id)

        if (!application) {
          return res.status(404).json({ message: "Application not found" })
        }

        // Get application wizard steps
        const steps = await storage.getApplicationWizardSteps(id)

        res.json({
          application,
          steps
        })
      } catch (error) {
        console.error("Error fetching job application:", error)
        res.status(500).json({ message: "Failed to fetch job application" })
      }
    }
  )

  apiRouter.post(
    "/applications",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const user = await getCurrentUser(req)
        if (!user) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        const applicationData = insertJobApplicationSchema.parse(req.body)
        const application = await storage.createJobApplication(
          user.id,
          applicationData
        )

        // Create default application wizard steps
        const defaultSteps = [
          {
            applicationId: application.id,
            order: 1,
            title: "Resume Selection",
            description:
              "Select a resume for this application or create a new one tailored to the position",
            type: "resume",
            isRequired: true
          },
          {
            applicationId: application.id,
            order: 2,
            title: "Cover Letter",
            description:
              "Create a custom cover letter for this job application",
            type: "cover_letter",
            isRequired: true
          },
          {
            applicationId: application.id,
            order: 3,
            title: "Application Details",
            description:
              "Complete the application details required by the employer",
            type: "details",
            isRequired: true
          },
          {
            applicationId: application.id,
            order: 4,
            title: "Review",
            description: "Review your application before submission",
            type: "review",
            isRequired: true
          }
        ]

        const wizardSteps = await Promise.all(
          defaultSteps.map((step) =>
            storage.createApplicationWizardStep(application.id, step)
          )
        )

        res.status(201).json({
          application,
          steps: wizardSteps
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid application data", errors: error.errors })
        }
        console.error("Error creating job application:", error)
        res.status(500).json({ message: "Failed to create job application" })
      }
    }
  )

  apiRouter.put(
    "/applications/:id",
    requireAuth,
    validateUserAccess,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)
        const applicationData = req.body
        const updatedApplication = await storage.updateJobApplication(
          id,
          applicationData
        )

        if (!updatedApplication) {
          return res.status(404).json({ message: "Application not found" })
        }

        res.json(updatedApplication)
      } catch (error) {
        console.error("Error updating job application:", error)
        res.status(500).json({ message: "Failed to update job application" })
      }
    }
  )

  apiRouter.post(
    "/applications/:id/submit",
    requireAuth,
    validateUserAccess,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)
        const { applied = false } = req.body // Get applied status from request body, default to false

        try {
          const submittedApplication = await storage.submitJobApplication(
            id,
            !!applied
          )

          if (!submittedApplication) {
            return res.status(404).json({ message: "Application not found" })
          }

          res.json(submittedApplication)
        } catch (error) {
          if (error instanceof Error) {
            return res.status(400).json({ message: error.message })
          }
          throw error
        }
      } catch (error) {
        console.error("Error submitting job application:", error)
        res.status(500).json({ message: "Failed to submit job application" })
      }
    }
  )

  apiRouter.delete(
    "/applications/:id",
    requireAuth,
    validateUserAccess,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)
        const success = await storage.deleteJobApplication(id)

        if (!success) {
          return res.status(404).json({ message: "Application not found" })
        }

        res.status(204).end()
      } catch (error) {
        console.error("Error deleting job application:", error)
        res.status(500).json({ message: "Failed to delete job application" })
      }
    }
  )

  // Application Wizard Steps API Routes
  apiRouter.get(
    "/applications/:applicationId/steps",
    requireAuth,
    validateUserAccess,
    async (req: Request, res: Response) => {
      try {
        const applicationId = parseInt(req.params.applicationId)
        const steps = await storage.getApplicationWizardSteps(applicationId)
        res.json(steps)
      } catch (error) {
        console.error("Error fetching application wizard steps:", error)
        res
          .status(500)
          .json({ message: "Failed to fetch application wizard steps" })
      }
    }
  )

  apiRouter.get(
    "/api/application-steps/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)
        const step = await storage.getApplicationWizardStep(id)

        if (!step) {
          return res.status(404).json({ message: "Application step not found" })
        }

        // Get the application to check user access
        const application = await storage.getJobApplication(step.applicationId)
        if (!application) {
          return res.status(404).json({ message: "Application not found" })
        }

        const user = await getCurrentUser(req)
        if (
          !user ||
          (application.userId !== user.id && user.userType !== "admin")
        ) {
          return res.status(403).json({ message: "Access denied" })
        }

        res.json(step)
      } catch (error) {
        console.error("Error fetching application step:", error)
        res.status(500).json({ message: "Failed to fetch application step" })
      }
    }
  )

  apiRouter.put(
    "/api/application-steps/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)
        const stepData = req.body

        // First get the step to verify user access
        const step = await storage.getApplicationWizardStep(id)
        if (!step) {
          return res.status(404).json({ message: "Application step not found" })
        }

        // Get the application
        const application = await storage.getJobApplication(step.applicationId)
        if (!application) {
          return res.status(404).json({ message: "Application not found" })
        }

        // Verify the user has access to this application
        const user = await getCurrentUser(req)
        if (
          !user ||
          (application.userId !== user.id && user.userType !== "admin")
        ) {
          return res.status(403).json({ message: "Access denied" })
        }

        const updatedStep = await storage.updateApplicationWizardStep(
          id,
          stepData
        )
        res.json(updatedStep)
      } catch (error) {
        console.error("Error updating application step:", error)
        res.status(500).json({ message: "Failed to update application step" })
      }
    }
  )

  apiRouter.post(
    "/api/application-steps/:id/complete",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)

        // First get the step to verify user access
        const step = await storage.getApplicationWizardStep(id)
        if (!step) {
          return res.status(404).json({ message: "Application step not found" })
        }

        // Get the application
        const application = await storage.getJobApplication(step.applicationId)
        if (!application) {
          return res.status(404).json({ message: "Application not found" })
        }

        // Verify the user has access to this application
        const user = await getCurrentUser(req)
        if (
          !user ||
          (application.userId !== user.id && user.userType !== "admin")
        ) {
          return res.status(403).json({ message: "Access denied" })
        }

        const completedStep = await storage.completeApplicationWizardStep(id)
        res.json(completedStep)
      } catch (error) {
        console.error("Error completing application step:", error)
        res.status(500).json({ message: "Failed to complete application step" })
      }
    }
  )

  // Register OpenAI logs routes for admin usage
  registerOpenAILogsRoutes(apiRouter)

  // Register PDF extraction routes for resume handling
  registerPdfExtractRoutes(apiRouter)

  // Register debugging routes for file upload testing
  app.use("/debug", debugRouter)

  // Add a simple health check endpoint
  app.get("/api/health", (req, res) => {

  return httpServer
}
