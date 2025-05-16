import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { users, universities, invites, insertInviteSchema } from "../../utils/schema";
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { sendUniversityInviteEmail } from '../mail';

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
        const universities = await db.execute(
          sql`SELECT id, name, slug FROM universities WHERE id = ${invite.universityId}`
        );
        
        if (universities.length > 0) {
          universityInfo = universities[0];
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
    const universities = await db.execute(
      sql`SELECT * FROM universities WHERE id = ${validatedData.universityId}`
    );
    
    if (universities.length === 0) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    const university = universities[0];
    
    // Check if university has available license seats
    if (validatedData.role === 'student' && 
        university.license_used !== null && 
        university.license_seats !== null && 
        university.license_used >= university.license_seats) {
      return res.status(400).json({ 
        error: 'License limit reached',
        message: `The university has used all of its ${university.license_seats} license seats`
      });
    }
    
    // Check if invite for this email already exists
    const existingInvites = await db.execute(
      sql`SELECT * FROM invites 
          WHERE email = ${validatedData.email} 
          AND university_id = ${validatedData.universityId}
          AND status = 'pending'`
    );
    
    if (existingInvites.length > 0) {
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
    
    const inviteUrl = existingUser
      ? `/university/invites/accept/${invite.id}?token=${token}`
      : `/sign-up?inviteToken=${token}`;
    
    try {
      // Send invitation email
      await sendUniversityInviteEmail(
        validatedData.email,
        token,
        university.name
      );
      
      console.log(`University invitation email sent to ${validatedData.email} for ${university.name}`);
      
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
    } catch (emailError) {
      console.error('Failed to send university invitation email:', emailError);
      
      // Still return success to UI, but log the email failure
      res.status(201).json({ 
        success: true, 
        message: `Invitation created for ${validatedData.email} but email delivery failed. Please check email settings.`,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          universityId: invite.universityId,
          universityName: invite.universityName,
          inviteUrl
        }
      });
    }
    
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
    const invites = await db.execute(
      sql`SELECT * FROM invites 
          WHERE id = ${inviteId} 
          AND token = ${token}
          AND status = 'pending'`
    );
    
    if (invites.length === 0) {
      return res.status(404).json({ error: 'Invite not found or already accepted' });
    }
    
    const invite = invites[0];
    
    // Check if invite is expired
    if (new Date() > new Date(invite.expires_at)) {
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
    const universities = await db.execute(
      sql`SELECT * FROM universities WHERE id = ${invite.university_id}`
    );
    
    if (universities.length === 0) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    const university = universities[0];
    
    // If inviting a student, check if university has available license seats
    if (invite.role === 'student' && 
        university.license_used !== null && 
        university.license_seats !== null && 
        university.license_used >= university.license_seats) {
      return res.status(400).json({ 
        error: 'License limit reached',
        message: `The university has used all of its ${university.license_seats} license seats`
      });
    }
    
    // Update user with university information and appropriate role
    await db.execute(
      sql`UPDATE users 
          SET university_id = ${invite.university_id}, 
              university_name = ${university.name},
              user_type = ${invite.role === 'admin' ? 'university_admin' : 'university_student'},
              role = ${invite.role === 'admin' ? 'university_admin' : 'user'}
          WHERE id = ${user.id}`
    );
    
    // Mark the invite as accepted
    await db.execute(
      sql`UPDATE invites 
          SET status = 'accepted', 
              accepted_at = ${new Date()}
          WHERE id = ${inviteId}`
    );
    
    // If this is a student, increment the university's license used count
    if (invite.role === 'student' && university.license_used !== null) {
      await db.execute(
        sql`UPDATE universities 
            SET license_used = license_used + 1
            WHERE id = ${university.id}`
      );
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
    const invites = await db.execute(
      sql`SELECT * FROM invites 
          WHERE token = ${token}
          AND status = 'pending'`
    );
    
    if (invites.length === 0) {
      return res.status(404).json({ error: 'Invite not found or already accepted' });
    }
    
    const invite = invites[0];
    
    // Check if invite is expired
    if (new Date() > new Date(invite.expires_at)) {
      return res.status(400).json({ error: 'Invite has expired' });
    }
    
    // Get the university information
    const universities = await db.execute(
      sql`SELECT * FROM universities WHERE id = ${invite.university_id}`
    );
    
    if (universities.length === 0) {
      return res.status(404).json({ error: 'University not found' });
    }
    
    const university = universities[0];
    
    // Return invite details for the signup process
    res.json({
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        universityId: invite.university_id,
        universityName: university.name
      }
    });
    
  } catch (error) {
    console.error('Error validating invite token:', error);
    res.status(500).json({ error: 'Failed to validate invite token' });
  }
});

export default router;