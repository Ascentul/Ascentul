import { Router, Request, Response } from "express"
import { IStorage } from "./storage"
import { InsertNetworkingContact } from "../types/database"
import { requireAuth, requireLoginFallback } from "./auth"
import { z } from "zod"

// Zod schema for creating a networking contact
const contactSchema = z.object({
  fullName: z.string(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  relationshipType: z.string().optional(),
  linkedInUrl: z.string().url().optional(),
  notes: z.string().optional(),
  lastContactDate: z.string().optional()
});

export const registerContactsRoutes = (app: Router, storage: IStorage) => {
  console.log("Registered contacts routes at /api/contacts")

  // Get all contacts for the current user
  app.get(
    "/api/contacts",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        // Get query parameters for filtering
        const query = req.query.query as string | undefined
        const relationshipType = req.query.relationshipType as
          | string
          | undefined

        const contacts = await storage.getNetworkingContacts(userId, {
          query,
          relationshipType
        })

        res.json(contacts)
      } catch (error) {
        console.error("Error fetching contacts:", error)
        res.status(500).json({ message: "Failed to fetch contacts" })
      }
    }
  )

  // Get contacts that need follow-up
  app.get(
    "/api/contacts/need-followup",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        const contacts = await storage.getContactsNeedingFollowup(userId)
        res.json(contacts)
      } catch (error) {
        console.error("Error fetching contacts needing follow-up:", error)
        res
          .status(500)
          .json({ message: "Failed to fetch contacts needing follow-up" })
      }
    }
  )

  // Get all active follow-ups for all contacts
  app.get(
    "/api/contacts/all-followups",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        // Use req.userId which is set by verifySupabaseToken middleware
        const userId = req.userId || (req as any).user?.id

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        // First, get all contacts for this user
        const contacts = await storage.getNetworkingContacts(userId)

        // Then, gather all follow-ups for these contacts
        const allFollowUps = []
        const contactMap = new Map()

        // Build a map of contact IDs to contact details for quick lookups
        contacts.forEach((contact) => {
          contactMap.set(contact.id, contact)
        })

        // Get all follow-ups for each contact
        for (const contact of contacts) {
          const followUps = await storage.getContactFollowUps(contact.id)

          // Only add non-completed follow-ups with future due dates
          const pendingFollowUps = followUps.filter((followUp) => {
            return (
              !followUp.completed &&
              followUp.dueDate &&
              new Date(followUp.dueDate) > new Date()
            )
          })

          // Add contact information to each follow-up
          pendingFollowUps.forEach((followUp) => {
            allFollowUps.push({
              ...followUp,
              contact: {
                id: contact.id,
                fullName: contact.fullName,
                company: contact.company,
                email: contact.email,
                phone: contact.phone
              }
            })
          })
        }

        // Sort follow-ups by due date (soonest first)
        allFollowUps.sort((a, b) => {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })

        console.log(
          `Found ${allFollowUps.length} pending follow-ups across all contacts`
        )

        // Return all pending follow-ups
        res.json(allFollowUps)
      } catch (error) {
        console.error("Error fetching all follow-ups:", error)
        res.status(500).json({ message: "Failed to fetch follow-ups" })
      }
    }
  )

  // Get a specific contact by ID
  app.get(
    "/api/contacts/:id",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const contactId = parseInt(req.params.id)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(contactId)) {
          return res.status(400).json({ message: "Invalid contact ID" })
        }

        const contact = await storage.getNetworkingContact(contactId)

        if (!contact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        // Make sure the user owns this contact
        if (contact.userId !== userId) {
          return res.status(403).json({ message: "Access denied" })
        }

        res.json(contact)
      } catch (error) {
        console.error("Error fetching contact:", error)
        res.status(500).json({ message: "Failed to fetch contact" })
      }
    }
  )

  // Create a new contact
  app.post(
    "/api/contacts",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        // Validate the request body
        const contactData = contactSchema.parse(req.body)

        // Create the contact
        const contact = await storage.createNetworkingContact(
          userId,
          contactData
        )

        res.status(201).json(contact)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Invalid contact data",
            errors: error.errors
          })
        }
        console.error("Error creating contact:", error)
        res.status(500).json({ message: "Failed to create contact" })
      }
    }
  )

  // Update an existing contact
  app.put(
    "/api/contacts/:id",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const contactId = parseInt(req.params.id)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(contactId)) {
          return res.status(400).json({ message: "Invalid contact ID" })
        }

        // Make sure the contact exists and belongs to the user
        const existingContact = await storage.getNetworkingContact(contactId)

        if (!existingContact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        if (existingContact.userId !== userId) {
          return res.status(403).json({ message: "Access denied" })
        }

        // Update the contact
        const updatedContact = await storage.updateNetworkingContact(
          contactId,
          req.body
        )

        res.json(updatedContact)
      } catch (error) {
        console.error("Error updating contact:", error)
        res.status(500).json({ message: "Failed to update contact" })
      }
    }
  )

  // Delete a contact
  app.delete(
    "/api/contacts/:id",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const contactId = parseInt(req.params.id)

        console.log(
          `Delete contact request: Contact ID=${contactId}, User ID=${userId}`
        )

        if (!userId) {
          console.log("Delete contact rejected: Unauthorized")
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(contactId)) {
          console.log(
            `Delete contact rejected: Invalid contact ID format: ${req.params.id}`
          )
          return res.status(400).json({ message: "Invalid contact ID" })
        }

        // Make sure the contact exists and belongs to the user
        const existingContact = await storage.getNetworkingContact(contactId)
        console.log(
          `Looking up contact ID=${contactId}, found:`,
          existingContact ? "Contact exists" : "Contact not found"
        )

        if (!existingContact) {
          console.log(
            `Delete contact rejected: Contact ID=${contactId} not found in storage`
          )
          return res.status(404).json({ message: "Contact not found" })
        }

        if (existingContact.userId !== userId) {
          console.log(
            `Delete contact rejected: Contact belongs to user ${existingContact.userId}, not current user ${userId}`
          )
          return res.status(403).json({ message: "Access denied" })
        }

        // Delete the contact
        const result = await storage.deleteNetworkingContact(contactId)
        console.log(
          `Delete contact result for ID=${contactId}:`,
          result ? "Success" : "Failed"
        )

        res.status(204).end()
        console.log(`Contact ID=${contactId} successfully deleted`)
      } catch (error) {
        console.error("Error deleting contact:", error)
        res.status(500).json({ message: "Failed to delete contact" })
      }
    }
  )

  // Log an interaction with a contact
  app.post(
    "/api/contacts/:id/log-interaction",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const contactId = parseInt(req.params.id)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(contactId)) {
          return res.status(400).json({ message: "Invalid contact ID" })
        }

        // Make sure the contact exists and belongs to the user
        const existingContact = await storage.getNetworkingContact(contactId)

        if (!existingContact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        if (existingContact.userId !== userId) {
          return res.status(403).json({ message: "Access denied" })
        }

        // Create a new interaction record
        const newInteraction = await storage.createContactInteraction(
          userId,
          contactId,
          {
            contactId: contactId,
            interactionType: req.body.interactionType,
            notes: req.body.notes,
            date: req.body.date ? new Date(req.body.date) : new Date()
          }
        )

        res.status(201).json(newInteraction)
      } catch (error) {
        console.error("Error logging contact interaction:", error)
        res.status(500).json({ message: "Failed to log interaction" })
      }
    }
  )

  // Get interactions for a specific contact
  app.get(
    "/api/contacts/:id/interactions",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const contactId = parseInt(req.params.id)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(contactId)) {
          return res.status(400).json({ message: "Invalid contact ID" })
        }

        // Make sure the contact exists and belongs to the user
        const existingContact = await storage.getNetworkingContact(contactId)

        if (!existingContact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        if (existingContact.userId !== userId) {
          return res.status(403).json({ message: "Access denied" })
        }

        // Get all interactions for this contact
        const interactions = await storage.getContactInteractions(contactId)

        res.status(200).json(interactions)
      } catch (error) {
        console.error("Error fetching contact interactions:", error)
        res.status(500).json({ message: "Failed to fetch interactions" })
      }
    }
  )

  // Update an interaction
  app.put(
    "/api/contacts/interactions/:id",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const interactionId = parseInt(req.params.id)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(interactionId)) {
          return res.status(400).json({ message: "Invalid interaction ID" })
        }

        // Update the interaction
        const updatedInteraction = await storage.updateContactInteraction(
          interactionId,
          {
            ...req.body,
            updatedAt: new Date()
          }
        )

        if (!updatedInteraction) {
          return res.status(404).json({ message: "Interaction not found" })
        }

        res.status(200).json(updatedInteraction)
      } catch (error) {
        console.error("Error updating contact interaction:", error)
        res.status(500).json({ message: "Failed to update interaction" })
      }
    }
  )

  // Delete an interaction
  app.delete(
    "/api/contacts/interactions/:id",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const interactionId = parseInt(req.params.id)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(interactionId)) {
          return res.status(400).json({ message: "Invalid interaction ID" })
        }

        // Delete the interaction
        const success = await storage.deleteContactInteraction(interactionId)

        if (!success) {
          return res.status(404).json({ message: "Interaction not found" })
        }

        res
          .status(200)
          .json({ success: true, message: "Interaction deleted successfully" })
      } catch (error) {
        console.error("Error deleting contact interaction:", error)
        res.status(500).json({ message: "Failed to delete interaction" })
      }
    }
  )

  // Schedule a follow-up for a contact
  app.post(
    "/api/contacts/:id/schedule-followup",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const contactId = parseInt(req.params.id)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(contactId)) {
          return res.status(400).json({ message: "Invalid contact ID" })
        }

        // Make sure the contact exists and belongs to the user
        const existingContact = await storage.getNetworkingContact(contactId)

        if (!existingContact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        if (existingContact.userId !== userId) {
          return res.status(403).json({ message: "Access denied" })
        }

        // Debug the incoming request body
        console.log(
          "💾 Received follow-up data:",
          JSON.stringify(req.body, null, 2)
        )

        // Validate and safely parse the date
        let parsedDate: Date | null = null

        if (req.body.followUpDate) {
          if (req.body.followUpDate instanceof Date) {
            parsedDate = req.body.followUpDate
          } else if (typeof req.body.followUpDate === "string") {
            parsedDate = new Date(req.body.followUpDate)
            if (isNaN(parsedDate.getTime())) {
              return res.status(400).json({
                message: "Invalid follow-up date format"
              })
            }
          } else {
            return res.status(400).json({
              message:
                "Follow-up date must be a valid date string or Date object"
            })
          }
        }

        // Prepare the follow-up action data
        const followUpData = {
          type: "contact_followup",
          description: req.body.notes || "Follow up with contact",
          dueDate: parsedDate,
          applicationId: contactId, // Using contactId as applicationId for contact follow-ups
          stageId: null,
          completed: false,
          notes: req.body.notes || null
        }

        console.log(
          "💾 Creating follow-up with data:",
          JSON.stringify(followUpData, null, 2)
        )

        // Create the follow-up action
        const newFollowUp = await storage.createContactFollowUp(
          userId,
          contactId,
          followUpData
        )

        res.status(201).json(newFollowUp)
      } catch (error) {
        console.error("Error scheduling follow-up:", error)
        res.status(500).json({ message: "Failed to schedule follow-up" })
      }
    }
  )

  // Get all follow-ups for a specific contact
  app.get(
    "/api/contacts/:id/followups",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const contactId = parseInt(req.params.id)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(contactId)) {
          return res.status(400).json({ message: "Invalid contact ID" })
        }

        // Make sure the contact exists and belongs to the user
        const existingContact = await storage.getNetworkingContact(contactId)

        if (!existingContact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        if (existingContact.userId !== userId) {
          return res.status(403).json({ message: "Access denied" })
        }

        // Get all follow-ups for this contact
        const followUps = await storage.getContactFollowUps(contactId)

        res.status(200).json(followUps)
      } catch (error) {
        console.error("Error fetching contact follow-ups:", error)
        res.status(500).json({ message: "Failed to fetch follow-ups" })
      }
    }
  )

  // Mark a follow-up as completed
  app.put(
    "/api/contacts/followups/:followupId/complete",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const followupId = parseInt(req.params.followupId)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(followupId)) {
          return res.status(400).json({ message: "Invalid follow-up ID" })
        }

        // Complete the follow-up
        const updatedFollowUp = await storage.completeContactFollowUp(
          followupId
        )

        if (!updatedFollowUp) {
          return res.status(404).json({ message: "Follow-up not found" })
        }

        res.json(updatedFollowUp)
      } catch (error) {
        console.error("Error completing follow-up:", error)
        res.status(500).json({ message: "Failed to complete follow-up" })
      }
    }
  )

  // Delete a follow-up for a specific contact
  app.delete(
    "/api/contacts/:contactId/followups/:followupId",
    requireLoginFallback,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId || (req as any).user?.id
        const contactId = parseInt(req.params.contactId)
        const followupId = parseInt(req.params.followupId)

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" })
        }

        if (isNaN(contactId) || isNaN(followupId)) {
          return res.status(400).json({ message: "Invalid IDs provided" })
        }

        // Make sure the contact exists and belongs to the user
        const existingContact = await storage.getNetworkingContact(contactId)

        if (!existingContact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        if (existingContact.userId !== userId) {
          return res.status(403).json({ message: "Access denied" })
        }

        // Get the followup to make sure it exists and belongs to this contact
        const allFollowups = await storage.getContactFollowUps(contactId)
        const followup = allFollowups.find((f) => f.id === followupId)

        if (!followup) {
          return res.status(404).json({ message: "Follow-up not found" })
        }

        // Delete the follow-up
        const success = await storage.deleteFollowupAction(followupId)

        if (success) {
          res.status(200).json({ success: true })
        } else {
          res.status(500).json({ message: "Failed to delete follow-up" })
        }
      } catch (error) {
        console.error("Error deleting contact follow-up:", error)
        res.status(500).json({ message: "Failed to delete follow-up" })
      }
    }
  )
}
