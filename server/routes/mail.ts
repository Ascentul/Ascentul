/**
 * Email API routes
 */
import express, { Request, Response } from 'express';
import { sendEmail, sendWelcomeEmail, sendApplicationUpdateEmail } from '../mail';

const router = express.Router();

/**
 * @route GET /api/mail/status
 * @description Check the status of the mail service
 * @access Public
 */
router.get('/status', (req: Request, res: Response) => {
  // Get all environment variables for debugging
  const envKeys = Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY'))
    .join(', ');
  console.log('Available environment variables (excluding secrets):', envKeys);
  
  // Check for Mailgun API key - try different potential environment variable names
  const mailgunKey = process.env.MAILGUN_API_KEY || process.env.MAILGUN_KEY || process.env.MG_API_KEY;
  const mailgunApiKey = mailgunKey ? 'configured' : 'not configured';
  
  // Log the API key status
  console.log('MAILGUN API KEY status:', mailgunApiKey);
  
  // Check for specific environment variables that might contain the API key
  console.log('Environment variable check:');
  console.log('- MAILGUN_API_KEY present:', process.env.MAILGUN_API_KEY ? 'Yes' : 'No');
  console.log('- MAILGUN_KEY present:', process.env.MAILGUN_KEY ? 'Yes' : 'No');
  console.log('- MG_API_KEY present:', process.env.MG_API_KEY ? 'Yes' : 'No');
  
  res.status(200).json({
    service: 'Mailgun Email',
    status: 'operational',
    mailgunApiKey,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route POST /api/mail/test
 * @description Send a test email to verify Mailgun configuration
 * @access Public in development, Private in production
 */
router.post('/test', async (req: Request, res: Response) => {
  // In production, require authentication
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !req.isAuthenticated()) {
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

    // Get recipient email from request body
    const { recipient, name } = req.body;
    let toEmail = recipient;
    let toName = name;
    
    // If no recipient is provided in the body, try to use authenticated user
    if (!toEmail && req.isAuthenticated() && req.user) {
      toEmail = req.user.email;
      toName = req.user.name;
    }
    
    // Final fallback - require an email address
    if (!toEmail) {
      return res.status(400).json({ 
        error: 'No recipient email provided',
        details: 'Please provide a recipient email address in the request body'
      });
    }

    // Send the test email
    const result = await sendEmail({
      to: toEmail,
      subject: '🎉 Test Email from Ascentul',
      text: 'This is a test email sent via Mailgun. If you see this, the email service is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email from Ascentul ✅</h2>
          <p>Hello ${toName || 'there'},</p>
          <p>This is a test email sent via <strong>Mailgun</strong>.</p>
          <p>If you're seeing this, it means the email service is configured correctly!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Best regards,<br>The Ascentul Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: `Test email sent successfully to ${toEmail}`,
      details: result
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: error.message || String(error)
    });
  }
});

/**
 * @route GET /api/mail/test
 * @description Send a test email to verify Mailgun configuration (development only)
 * @access Public in development mode
 */
router.get('/test', async (req: Request, res: Response) => {
  // Only allow this in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      error: 'Not allowed in production',
      details: 'This endpoint is only available in development mode'
    });
  }
  
  try {
    // Make sure we have the Mailgun API key
    if (!process.env.MAILGUN_API_KEY) {
      return res.status(500).json({ 
        error: 'Mailgun API key not configured',
        details: 'The MAILGUN_API_KEY environment variable is not set.' 
      });
    }

    // Get recipient email from query parameters
    const toEmail = req.query.email as string || 'test@example.com';
    const toName = req.query.name as string || 'Test User';
    
    console.log(`Sending test email to ${toEmail} (${toName})`);

    // Send the test email
    const result = await sendEmail({
      to: toEmail,
      subject: '🎉 Test Email from Ascentul',
      text: 'This is a test email sent via Mailgun. If you see this, the email service is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email from Ascentul ✅</h2>
          <p>Hello ${toName || 'there'},</p>
          <p>This is a test email sent via <strong>Mailgun</strong>.</p>
          <p>If you're seeing this, it means the email service is configured correctly!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Best regards,<br>The Ascentul Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: `Test email sent successfully to ${toEmail}`,
      details: result
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: error.message || String(error)
    });
  }
});

/**
 * @route POST /api/mail/welcome
 * @description Send a welcome email to a specified user or the current user
 * @access Private (requires authentication)
 */
router.post('/welcome', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Ensure user is available if needed
    if (!req.body.email && !req.user) {
      return res.status(401).json({ error: 'User not found in session and no email provided' });
    }
    
    // Extract user info from request or use current user
    const { email, name } = req.body.email ? req.body : req.user!;
    
    // Send welcome email
    const result = await sendWelcomeEmail(email, name);
    
    res.status(200).json({
      success: true,
      message: `Welcome email sent successfully to ${email}`,
      details: result
    });
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      error: 'Failed to send welcome email',
      details: error.message || String(error)
    });
  }
});

/**
 * @route POST /api/mail/application-update
 * @description Send an application update notification email
 * @access Private (requires authentication)
 */
router.post('/application-update', async (req: Request, res: Response) => {
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
    
    // Ensure user is available if name is not provided
    if (!name && !req.user) {
      return res.status(400).json({ 
        error: 'Missing name parameter', 
        details: 'Name must be provided in request body or user must be authenticated' 
      });
    }
    
    // Send application update email
    const result = await sendApplicationUpdateEmail(
      email,
      name || (req.user ? req.user.name : 'User'),
      companyName,
      positionTitle,
      status
    );
    
    res.status(200).json({
      success: true,
      message: `Application update email sent successfully to ${email}`,
      details: result
    });
  } catch (error: any) {
    console.error('Error sending application update email:', error);
    res.status(500).json({
      error: 'Failed to send application update email',
      details: error.message || String(error)
    });
  }
});

/**
 * @route POST /api/mail/custom
 * @description Send a custom email (admin only)
 * @access Private (requires admin authentication)
 */
router.post('/custom', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Ensure user is available
  if (!req.user) {
    return res.status(401).json({ error: 'User not found in session' });
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
  } catch (error: any) {
    console.error('Error sending custom email:', error);
    res.status(500).json({
      error: 'Failed to send custom email',
      details: error.message || String(error)
    });
  }
});

export default router;