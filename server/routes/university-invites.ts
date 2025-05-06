import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { users, universities, invites, insertInviteSchema } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
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
    if (validatedData.role === 'student' && 
        university.licenseUsed !== null && 
        university.licenseSeats !== null && 
        university.licenseUsed >= university.licenseSeats) {
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

// Accept an invite (for existing users)
router.post('/accept/:inviteId', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const inviteId = parseInt(req.params.inviteId);
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Get the user from the session
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get the invite by ID
    const [invite] = await db.select()
      .from(invites)
      .where(
        and(
          eq(invites.id, inviteId),
          eq(invites.token, token),
          eq(invites.status, "pending")
        )
      );
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or already accepted' });
    }
    
    // Check if invite is expired
    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invite has expired' });
    }
    
    // Check if the invite is for this user
    if (invite.email !== user.email) {
      return res.status(403).json({ 
        error: 'This invite is not for your account',
        message: `This invite was sent to ${invite.email} but your account email is ${user.email}`
      });
    }
    
    // Get the university information
    const [university] = await db.select()
      .from(universities)
      .where(eq(universities.id, invite.universityId || 0));
    
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // If inviting a student, check if university has available license seats
    if (invite.role === 'student' && 
        university.licenseUsed !== null && 
        university.licenseSeats !== null && 
        university.licenseUsed >= university.licenseSeats) {
      return res.status(400).json({ 
        error: 'License limit reached',
        message: `The university has used all of its ${university.licenseSeats} license seats`
      });
    }
    
    // Update user with university information and appropriate role
    await db.update(users)
      .set({
        universityId: invite.universityId,
        universityName: university.name,
        userType: invite.role === 'admin' ? 'university_admin' : 'university_student',
        role: invite.role === 'admin' ? 'university_admin' : 'user'
      })
      .where(eq(users.id, user.id));
    
    // Mark the invite as accepted
    await db.update(invites)
      .set({
        status: "accepted",
        acceptedAt: new Date()
      })
      .where(eq(invites.id, inviteId));
    
    // If this is a student, increment the university's license used count
    if (invite.role === 'student' && university.licenseUsed !== null) {
      await db.update(universities)
        .set({
          licenseUsed: university.licenseUsed + 1
        })
        .where(eq(universities.id, university.id));
    }
    
    // Return success
    res.json({ 
      success: true,
      message: `You have successfully joined ${university.name} as a ${invite.role === 'admin' ? 'university administrator' : 'student'}`,
      redirectTo: invite.role === 'admin' ? '/university-admin' : '/university'
    });
    
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// Validate an invite token (for new users during signup)
router.get('/validate-token/:token', async (req, res) => {
  try {
    const token = req.params.token;
    
    // Get the invite by token
    const [invite] = await db.select()
      .from(invites)
      .where(
        and(
          eq(invites.token, token),
          eq(invites.status, "pending")
        )
      );
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or already accepted' });
    }
    
    // Check if invite is expired
    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invite has expired' });
    }
    
    // Get the university information
    const [university] = await db.select()
      .from(universities)
      .where(eq(universities.id, invite.universityId || 0));
    
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    // Return invite details for the signup process
    res.json({
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        universityId: invite.universityId,
        universityName: university.name
      }
    });
    
  } catch (error) {
    console.error('Error validating invite token:', error);
    res.status(500).json({ error: 'Failed to validate invite token' });
  }
});

export default router;