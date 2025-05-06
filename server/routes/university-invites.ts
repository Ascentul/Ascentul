import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { users, universities, invites, insertInviteSchema } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const router = express.Router();

// Schema for university invites
const universityInviteSchema = z.object({
  email: z.string().email(),
  universityId: z.number().positive(),
  role: z.enum(['student', 'admin']),
});

// Get all invites for a user
router.get('/my-invites', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    // Get all pending invites for this user's email
    const userInvites = await db.select({
      id: invites.id,
      role: invites.role,
      universityId: invites.universityId,
      universityName: invites.universityName,
      status: invites.status,
      sentAt: invites.sentAt,
      expiresAt: invites.expiresAt
    })
    .from(invites)
    .where(
      and(
        eq(invites.email, user.email),
        eq(invites.status, "pending")
      )
    );
    
    // Map the invites with additional university information
    const invitesWithDetails = await Promise.all(userInvites.map(async (invite) => {
      let universityInfo = null;
      
      if (invite.universityId) {
        const [university] = await db.select({
          id: universities.id,
          name: universities.name,
          slug: universities.slug
        })
        .from(universities)
        .where(eq(universities.id, invite.universityId));
        
        if (university) {
          universityInfo = university;
        }
      }
      
      return {
        ...invite,
        university: universityInfo
      };
    }));
    
    res.json(invitesWithDetails);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

// Create an invite
router.post('/', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    // Validate input
    const validatedData = universityInviteSchema.parse(req.body);
    
    // Check if university exists
    const [university] = await db.select()
      .from(universities)
      .where(eq(universities.id, validatedData.universityId));
    
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // Check if university has available license seats
    if (university.licenseUsed >= university.licenseSeats && validatedData.role === 'student') {
      return res.status(400).json({ 
        error: 'License limit reached',
        message: `The university has used all of its ${university.licenseSeats} license seats`
      });
    }
    
    // Check if invite for this email already exists
    const [existingInvite] = await db.select()
      .from(invites)
      .where(
        and(
          eq(invites.email, validatedData.email),
          eq(invites.universityId, validatedData.universityId),
          eq(invites.status, "pending")
        )
      );
    
    if (existingInvite) {
      return res.status(400).json({ 
        error: 'Invite already exists',
        message: `An invitation has already been sent to ${validatedData.email}` 
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email)
    });
    
    // Generate invite token and set expiration (30 days from now)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Create the invite record
    const [invite] = await db.insert(invites)
      .values({
        email: validatedData.email,
        role: validatedData.role,
        token: token,
        universityId: validatedData.universityId,
        universityName: university.name,
        status: "pending",
        expiresAt: expiresAt
      })
      .returning();
    
    // If the user already exists, we would typically send an email with information
    // about joining the university. For existing users, they would be able to
    // accept the invite from their account.
    
    // If user doesn't exist, we would send an email with a signup link that 
    // includes the invite token. They would then complete registration and be
    // automatically added to the university.
    
    // For now, we'll just return the invite data
    const inviteUrl = existingUser
      ? `/university/invites/accept/${invite.id}?token=${token}`
      : `/sign-up?inviteToken=${token}`;
    
    res.status(201).json({ 
      success: true, 
      message: `Invitation sent to ${validatedData.email} to join as ${validatedData.role}`,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        universityId: invite.universityId,
        universityName: invite.universityName,
        inviteUrl
      }
    });
    
    // TODO: Send email with invite link (would implement email sending here
    // using a service like Mailgun or SendGrid)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// Accept an invite
router.post('/accept/:inviteId', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    // Placeholder - would implement to accept an invite
    // This would typically validate the invite token, update user role, etc.
    res.json({ success: true });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

export default router;