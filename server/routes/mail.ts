/**
 * Email API routes
 */
import express from 'express';
import { sendEmail, sendWelcomeEmail, sendApplicationUpdateEmail } from '../mail.js';

const router = express.Router();

/**
 * @route POST /api/mail/test
 * @description Send a test email to verify Mailgun configuration
 * @access Private (requires authentication)
 */
router.post('/test', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Make sure we have the Mailgun API key
    if (!process.env.MAILGUN_API_KEY) {
      return res.status(500).json({ 
        error: 'Mailgun API key not configured',
        details: 'The MAILGUN_API_KEY environment variable is not set.' 
      });
    }

    // Use the authenticated user's email for testing
    const { email, name } = req.user;
    
    // Extract optional recipient email from request body
    const { recipient } = req.body;
    const to = recipient || email;

    // Send the test email
    const result = await sendEmail({
      to,
      subject: '🎉 Test Email from Ascentul',
      text: 'This is a test email sent via Mailgun. If you see this, the email service is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email from Ascentul ✅</h2>
          <p>Hello ${name || 'there'},</p>
          <p>This is a test email sent via <strong>Mailgun</strong>.</p>
          <p>If you're seeing this, it means the email service is configured correctly!</p>
          <p>Best regards,<br>The Ascentul Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: `Test email sent successfully to ${to}`,
      details: result
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: error.message
    });
  }
});

/**
 * @route POST /api/mail/welcome
 * @description Send a welcome email to a specified user or the current user
 * @access Private (requires authentication)
 */
router.post('/welcome', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Extract user info from request or use current user
    const { email, name } = req.body.email ? req.body : req.user;
    
    // Send welcome email
    const result = await sendWelcomeEmail(email, name);
    
    res.status(200).json({
      success: true,
      message: `Welcome email sent successfully to ${email}`,
      details: result
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      error: 'Failed to send welcome email',
      details: error.message
    });
  }
});

/**
 * @route POST /api/mail/application-update
 * @description Send an application update notification email
 * @access Private (requires authentication)
 */
router.post('/application-update', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { email, name, companyName, positionTitle, status } = req.body;
    
    if (!email || !companyName || !positionTitle || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Email, companyName, positionTitle, and status are required'
      });
    }
    
    // Send application update email
    const result = await sendApplicationUpdateEmail(
      email,
      name || req.user.name,
      companyName,
      positionTitle,
      status
    );
    
    res.status(200).json({
      success: true,
      message: `Application update email sent successfully to ${email}`,
      details: result
    });
  } catch (error) {
    console.error('Error sending application update email:', error);
    res.status(500).json({
      error: 'Failed to send application update email',
      details: error.message
    });
  }
});

/**
 * @route POST /api/mail/custom
 * @description Send a custom email (admin only)
 * @access Private (requires admin authentication)
 */
router.post('/custom', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Check if user is an admin
  if (req.user.userType !== 'admin' && req.user.userType !== 'university_admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  try {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || !(text || html)) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'to, subject, and either text or html are required'
      });
    }
    
    // Send custom email
    const result = await sendEmail({
      to,
      subject,
      text: text || 'No text content provided',
      html
    });
    
    res.status(200).json({
      success: true,
      message: `Custom email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`,
      details: result
    });
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({
      error: 'Failed to send custom email',
      details: error.message
    });
  }
});

export default router;