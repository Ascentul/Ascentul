import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { eq } from 'drizzle-orm';
import * as mailService from '../mail.js';
import { storage } from '../storage';
import { insertInviteSchema, invites } from '@shared/schema';
import { db } from '../db';

const router = express.Router();

// Get all invites (admin only)
router.get('/', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const result = await db.select().from(invites).orderBy(invites.sentAt);
    res.json(result);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

// Get a specific invite by token (for registration page verification)
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const [invite] = await db.select().from(invites).where(eq(invites.token, token));
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    // Check if invite is expired
    if (invite.status === 'expired' || new Date() > new Date(invite.expiresAt)) {
      return res.status(400).json({ error: 'Invite has expired' });
    }
    
    // Check if invite is already accepted
    if (invite.status === 'accepted') {
      return res.status(400).json({ error: 'Invite has already been used' });
    }
    
    return res.json({
      email: invite.email,
      role: invite.role,
      universityName: invite.universityName
    });
  } catch (error) {
    console.error('Error verifying invite:', error);
    res.status(500).json({ error: 'Failed to verify invite' });
  }
});

// Create a new invite for a university admin
router.post('/', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const validatedData = insertInviteSchema.parse(req.body);
    
    // Generate a secure token
    const token = uuidv4();
    
    // Set expiry date to 7 days from now
    const expiresAt = add(new Date(), { days: 7 });
    
    // Create the invite record
    const [invite] = await db.insert(invites)
      .values({
        ...validatedData,
        token,
        expiresAt,
        status: 'pending',
      })
      .returning();
    
    // Send the invitation email
    try {
      await mailService.sendUniversityInviteEmail({
        to: invite.email,
        universityName: invite.universityName || 'University',
        inviteToken: token,
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Continue even if email fails - we'll show the admin a warning
      res.status(201).json({ 
        invite, 
        warning: 'Invite created but email delivery failed. You may need to resend the invitation.'
      });
      return;
    }
    
    res.status(201).json({ invite });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(400).json({ error: 'Failed to create invite' });
  }
});

// Accept an invite (called during registration)
router.post('/accept/:token', async (req, res) => {
  const { token } = req.params;
  const { userId } = req.body;
  
  if (!token || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    const [invite] = await db.select().from(invites).where(eq(invites.token, token));
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    // Check if invite is expired
    if (invite.status === 'expired' || new Date() > new Date(invite.expiresAt)) {
      return res.status(400).json({ error: 'Invite has expired' });
    }
    
    // Check if invite is already accepted
    if (invite.status === 'accepted') {
      return res.status(400).json({ error: 'Invite has already been used' });
    }
    
    // Update the invite status
    await db.update(invites)
      .set({ 
        status: 'accepted', 
        acceptedAt: new Date()
      })
      .where(eq(invites.id, invite.id));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// Resend an invitation email
router.post('/resend/:id', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  try {
    const inviteId = parseInt(id);
    const [invite] = await db.select().from(invites).where(eq(invites.id, inviteId));
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    
    // Check if invite is already accepted
    if (invite.status === 'accepted') {
      return res.status(400).json({ error: 'Cannot resend an accepted invite' });
    }
    
    // If it's expired, reset it and extend expiration
    if (invite.status === 'expired' || new Date() > new Date(invite.expiresAt)) {
      // Generate a new token
      const token = uuidv4();
      // Set new expiry date
      const expiresAt = add(new Date(), { days: 7 });
      
      await db.update(invites)
        .set({ 
          token,
          status: 'pending',
          expiresAt,
          sentAt: new Date()
        })
        .where(eq(invites.id, invite.id));
      
      // Refresh invite data
      const [updatedInvite] = await db.select().from(invites).where(eq(invites.id, inviteId));
      
      // Send the invitation email with the new token
      try {
        await mailService.sendUniversityInviteEmail({
          to: updatedInvite.email,
          universityName: updatedInvite.universityName || 'University',
          inviteToken: updatedInvite.token,
        });
      } catch (emailError) {
        console.error('Error resending invitation email:', emailError);
        res.status(200).json({ 
          invite: updatedInvite, 
          warning: 'Failed to send email. Please try again later.'
        });
        return;
      }
      
      res.json({ invite: updatedInvite });
    } else {
      // Just resend the current invite
      try {
        await mailService.sendUniversityInviteEmail({
          to: invite.email,
          universityName: invite.universityName || 'University',
          inviteToken: invite.token,
        });
      } catch (emailError) {
        console.error('Error resending invitation email:', emailError);
        res.status(200).json({ 
          invite, 
          warning: 'Failed to send email. Please try again later.'
        });
        return;
      }
      
      res.json({ invite });
    }
  } catch (error) {
    console.error('Error resending invite:', error);
    res.status(500).json({ error: 'Failed to resend invite' });
  }
});

export default router;