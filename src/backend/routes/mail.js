/**
 * Email API routes
 */
import express from 'express';
import { sendEmail, sendWelcomeEmail, sendApplicationUpdateEmail } from '../mail';
const router = express.Router();
/**
 * @route GET /api/mail/status
 * @description Check the status of the mail service
 * @access Public
 */
router.get('/status', (req, res) => {
    try {
        // Get all environment variables for debugging (excluding sensitive ones)
        const envKeys = Object.keys(process.env)
            .filter(key => !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY'))
            .join(', ');
        console.log('Available environment variables (excluding secrets):', envKeys);
        // Check for Mailgun API key - try different potential environment variable names
        const mailgunKey = process.env.MAILGUN_API_KEY || process.env.MAILGUN_KEY || process.env.MG_API_KEY;
        const hasMailgunApiKey = !!mailgunKey;
        // Check if mail domain is set
        const mailDomain = process.env.MAILGUN_DOMAIN || 'mail.ascentul.io';
        const hasCustomDomain = !!process.env.MAILGUN_DOMAIN;
        // Log the API key status
        console.log('Mail service status check:');
        console.log('- MAILGUN API KEY status:', hasMailgunApiKey ? 'configured' : 'not configured');
        console.log('- MAILGUN_DOMAIN status:', hasCustomDomain ? 'configured' : 'using default');
        console.log('- Default domain:', mailDomain);
        // Check for specific environment variables that might contain the API key
        console.log('Environment variable check:');
        console.log('- MAILGUN_API_KEY present:', process.env.MAILGUN_API_KEY ? 'Yes' : 'No');
        console.log('- MAILGUN_KEY present:', process.env.MAILGUN_KEY ? 'Yes' : 'No');
        console.log('- MG_API_KEY present:', process.env.MG_API_KEY ? 'Yes' : 'No');
        res.status(200).json({
            success: true,
            service: 'Mailgun Email',
            configured: hasMailgunApiKey,
            apiKey: hasMailgunApiKey,
            domain: hasCustomDomain,
            defaultDomain: mailDomain,
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development',
            message: hasMailgunApiKey
                ? 'Mail service is properly configured and operational.'
                : 'Mailgun API key is not set. Email functionality will not work.'
        });
    }
    catch (error) {
        console.error('Error checking mail status:', error);
        res.status(500).json({
            success: false,
            configured: false,
            apiKey: false,
            domain: false,
            message: error.message || 'Failed to check mail status'
        });
    }
});
/**
 * @route POST /api/mail/test
 * @description Send a test email to verify Mailgun configuration
 * @access Public in development, Private in production
 */
router.post('/test', async (req, res) => {
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
    }
    catch (error) {
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
router.get('/test', async (req, res) => {
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
        const toEmail = req.query.email || 'test@example.com';
        const toName = req.query.name || 'Test User';
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
    }
    catch (error) {
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
 * @access Public in development, Private in production
 */
router.post('/welcome', async (req, res) => {
    // In production, require authentication
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        // For all environments, email is required in body or from authenticated user
        if (!req.body.email && !(req.isAuthenticated() && req.user?.email)) {
            return res.status(400).json({
                error: 'Email required',
                details: 'Email address must be provided in request body or you must be authenticated'
            });
        }
        // Extract user info from request or use current user if authenticated
        let email = req.body.email;
        let name = req.body.name;
        if (!email && req.isAuthenticated() && req.user) {
            email = req.user.email;
            name = req.user.name;
        }
        console.log(`Sending welcome email to ${email} (${name || 'unnamed user'})`);
        // Send welcome email
        const result = await sendWelcomeEmail(email, name);
        res.status(200).json({
            success: true,
            message: `Welcome email sent successfully to ${email}`,
            details: result
        });
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
        res.status(500).json({
            error: 'Failed to send welcome email',
            details: error.message || String(error)
        });
    }
});
/**
 * @route GET /api/mail/welcome
 * @description Send a welcome email (development only)
 * @access Public in development mode
 */
router.get('/welcome', async (req, res) => {
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
        const toEmail = req.query.email;
        const toName = req.query.name;
        if (!toEmail) {
            return res.status(400).json({
                error: 'Email required',
                details: 'Email address must be provided as a query parameter'
            });
        }
        console.log(`Sending welcome email to ${toEmail} (${toName || 'unnamed user'})`);
        // Send welcome email
        const result = await sendWelcomeEmail(toEmail, toName);
        res.status(200).json({
            success: true,
            message: `Welcome email sent successfully to ${toEmail}`,
            details: result
        });
    }
    catch (error) {
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
 * @access Public in development, Private in production
 */
router.post('/application-update', async (req, res) => {
    // In production, require authentication
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !req.isAuthenticated()) {
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
        // For name, try to use from body, then from authenticated user if available
        const userName = name || (req.isAuthenticated() && req.user ? req.user.name : 'User');
        console.log(`Sending application update email to ${email} (${userName}) for ${companyName} - ${positionTitle}`);
        // Send application update email
        const result = await sendApplicationUpdateEmail(email, userName, companyName, positionTitle, status);
        res.status(200).json({
            success: true,
            message: `Application update email sent successfully to ${email}`,
            details: result
        });
    }
    catch (error) {
        console.error('Error sending application update email:', error);
        res.status(500).json({
            error: 'Failed to send application update email',
            details: error.message || String(error)
        });
    }
});
/**
 * @route GET /api/mail/application-update
 * @description Send an application update notification email (development only)
 * @access Public in development mode
 */
router.get('/application-update', async (req, res) => {
    // Only allow this in development mode
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            error: 'Not allowed in production',
            details: 'This endpoint is only available in development mode'
        });
    }
    try {
        // Get parameters from query
        const email = req.query.email;
        const name = req.query.name;
        const companyName = req.query.company;
        const positionTitle = req.query.position;
        const status = req.query.status;
        // Validate required parameters
        if (!email || !companyName || !positionTitle || !status) {
            return res.status(400).json({
                error: 'Missing required query parameters',
                details: 'email, company, position, and status are required'
            });
        }
        console.log(`Sending application update email to ${email} (${name || 'User'}) for ${companyName} - ${positionTitle}`);
        // Send application update email
        const result = await sendApplicationUpdateEmail(email, name || 'User', companyName, positionTitle, status);
        res.status(200).json({
            success: true,
            message: `Application update email sent successfully to ${email}`,
            details: result
        });
    }
    catch (error) {
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
 * @access Public in development, Private (requires admin authentication) in production
 */
router.post('/custom', async (req, res) => {
    // In production, require authentication and admin status
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Ensure user is available
        if (!req.user) {
            return res.status(401).json({ error: 'User not found in session' });
        }
        // Check if user is an admin
        if (req.user.userType !== 'admin' && req.user.userType !== 'university_admin') {
            return res.status(403).json({ error: 'Not authorized. Admin privileges required.' });
        }
    }
    else {
        console.log('Development mode: Bypassing authentication for custom email');
    }
    try {
        const { to, subject, text, html } = req.body;
        if (!to || !subject || !(text || html)) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'to, subject, and either text or html are required'
            });
        }
        console.log(`Sending custom email to ${to} with subject "${subject}"`);
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
    }
    catch (error) {
        console.error('Error sending custom email:', error);
        res.status(500).json({
            error: 'Failed to send custom email',
            details: error.message || String(error)
        });
    }
});
export default router;
