import express, { Express } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { requireAuth } from './auth';
import { insertNetworkingContactSchema } from '../shared/schema';

export function registerContactsRoutes(app: Express, storage: any) {
  const router = express.Router();

// Get all contacts for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = req.query.query as string | undefined;
    const relationshipType = req.query.relationshipType as string | undefined;
    
    const contacts = await storage.getNetworkingContacts(userId, {
      query,
      relationshipType
    });
    
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get contacts needing follow-up
router.get('/followup', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const contacts = await storage.getContactsNeedingFollowUp(userId);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching follow-up contacts:', error);
    res.status(500).json({ error: 'Failed to fetch follow-up contacts' });
  }
});

// Get a single contact by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const contactId = parseInt(req.params.id);
    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }
    
    const contact = await storage.getNetworkingContact(contactId);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Ensure user can only access their own contacts
    if (contact.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create a new contact
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate request body
    const validationResult = insertNetworkingContactSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid contact data', 
        details: validationResult.error.format() 
      });
    }
    
    const contactData = validationResult.data;
    const newContact = await storage.createNetworkingContact(userId, contactData);
    
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update an existing contact
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const contactId = parseInt(req.params.id);
    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }
    
    // Check if contact exists and belongs to user
    const existingContact = await storage.getNetworkingContact(contactId);
    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    if (existingContact.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update the contact
    const updatedContact = await storage.updateNetworkingContact(contactId, req.body);
    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete a contact
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const contactId = parseInt(req.params.id);
    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }
    
    // Check if contact exists and belongs to user
    const existingContact = await storage.getNetworkingContact(contactId);
    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    if (existingContact.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete the contact
    const success = await storage.deleteNetworkingContact(contactId);
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;