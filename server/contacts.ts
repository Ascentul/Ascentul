import { Router, Request, Response } from "express";
import { IStorage } from "./storage";
import { insertNetworkingContactSchema } from "@shared/schema";
import { requireAuth } from "./auth";
import { z } from "zod";

export const registerContactsRoutes = (app: Router, storage: IStorage) => {
  console.log("Registered contacts routes at /api/contacts");

  // Get all contacts for the current user
  app.get("/api/contacts", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get query parameters for filtering
      const query = req.query.query as string | undefined;
      const relationshipType = req.query.relationshipType as string | undefined;
      
      const contacts = await storage.getNetworkingContacts(userId, {
        query,
        relationshipType
      });
      
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Get contacts that need follow-up
  app.get("/api/contacts/need-followup", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const contacts = await storage.getContactsNeedingFollowUp(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts needing follow-up:", error);
      res.status(500).json({ message: "Failed to fetch contacts needing follow-up" });
    }
  });

  // Get a specific contact by ID
  app.get("/api/contacts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const contactId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      const contact = await storage.getNetworkingContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      // Make sure the user owns this contact
      if (contact.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  // Create a new contact
  app.post("/api/contacts", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate the request body
      const contactData = insertNetworkingContactSchema.parse(req.body);
      
      // Create the contact
      const contact = await storage.createNetworkingContact(userId, contactData);
      
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid contact data", 
          errors: error.errors 
        });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  // Update an existing contact
  app.put("/api/contacts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const contactId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Make sure the contact exists and belongs to the user
      const existingContact = await storage.getNetworkingContact(contactId);
      
      if (!existingContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      if (existingContact.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update the contact
      const updatedContact = await storage.updateNetworkingContact(contactId, req.body);
      
      res.json(updatedContact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  // Delete a contact
  app.delete("/api/contacts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const contactId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Make sure the contact exists and belongs to the user
      const existingContact = await storage.getNetworkingContact(contactId);
      
      if (!existingContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      if (existingContact.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the contact
      await storage.deleteNetworkingContact(contactId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Log an interaction with a contact
  app.post("/api/contacts/:id/log-interaction", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const contactId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }
      
      // Make sure the contact exists and belongs to the user
      const existingContact = await storage.getNetworkingContact(contactId);
      
      if (!existingContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      if (existingContact.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update the contact's lastContactedDate to today
      const updatedContact = await storage.updateNetworkingContact(contactId, {
        ...existingContact,
        lastContactedDate: new Date()
      });
      
      res.status(200).json(updatedContact);
    } catch (error) {
      console.error("Error logging contact interaction:", error);
      res.status(500).json({ message: "Failed to log interaction" });
    }
  });
};