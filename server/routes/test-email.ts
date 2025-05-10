/**
 * Test routes for email functionality
 * These routes are for testing purposes only and should be disabled in production
 */
import express from 'express';
import { z } from 'zod';
import { sendEmail, sendUniversityInviteEmail } from '../mail';

const router = express.Router();

// Schema for direct email test
const directEmailSchema = z.object({
  email: z.string().email(),
  subject: z.string().optional().default('Test Email'),
  text: z.string().optional().default('This is a test email.'),
  html: z.string().optional()
});

// Schema for university invite email test
const universityInviteTestSchema = z.object({
  email: z.string().email(),
  universityName: z.string().optional().default('Test University')
});

// Test direct email sending
router.post('/send-direct-email', async (req, res) => {
  // Only allow in development or by admins
  if (process.env.NODE_ENV === 'production') {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check if user is admin
    const user = req.user;
    if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  }
  
  try {
    // Validate input
    const validatedData = directEmailSchema.parse(req.body);
    
    // Send test email
    const result = await sendEmail({
      to: validatedData.email,
      subject: validatedData.subject,
      text: validatedData.text,
      html: validatedData.html
    });
    
    res.json({
      success: true,
      message: `Test email sent to ${validatedData.email}`,
      id: result.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test university invite email
router.post('/send-university-invite', async (req, res) => {
  // Only allow in development or by admins
  if (process.env.NODE_ENV === 'production') {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check if user is admin
    const user = req.user;
    if (!user || (user.userType !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  }
  
  try {
    // Validate input
    const validatedData = universityInviteTestSchema.parse(req.body);
    
    // Generate a test token
    const testToken = `test-token-${Date.now()}`;
    
    // Send university invite test email
    const result = await sendUniversityInviteEmail(
      validatedData.email,
      testToken,
      validatedData.universityName
    );
    
    res.json({
      success: true,
      message: `University invite test email sent to ${validatedData.email}`,
      id: result.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error sending university invite test email:', error);
    res.status(500).json({ 
      error: 'Failed to send university invite test email', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;