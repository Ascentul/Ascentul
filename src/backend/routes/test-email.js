/**
 * Test routes for email functionality
 * These routes are for testing purposes only and should be disabled in production
 */
import express from 'express';
import { sendEmail } from '../mail';
import { z } from 'zod';
const router = express.Router();
// Schema for validating test email requests
const testEmailSchema = z.object({
    recipient: z.string().email(),
    subject: z.string(),
    template: z.string().optional(),
    content: z.string(),
});
// Schema for validating university invite test requests
const universityInviteSchema = z.object({
    universityName: z.string(),
    adminEmail: z.string().email(),
    adminName: z.string(),
});
/**
 * @route POST /api/admin/test-email
 * @desc Send a test email
 * @access Admin only
 */
router.post('/test-email', async (req, res) => {
    try {
        // Validate request body
        const validationResult = testEmailSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
                errors: validationResult.error.format(),
            });
        }
        const { recipient, subject, content, template } = validationResult.data;
        // Send the email
        const result = await sendEmail({
            to: recipient,
            subject,
            text: content,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${content.replace(/\n/g, '<br>')}</div>`,
        });
        return res.json({
            success: true,
            message: 'Test email sent successfully',
            details: result,
        });
    }
    catch (error) {
        console.error('Error sending test email:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * @route POST /api/admin/test-university-invite
 * @desc Test sending a university admin invitation email
 * @access Admin only
 */
router.post('/test-university-invite', async (req, res) => {
    try {
        // Validate request body
        const validationResult = universityInviteSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
                errors: validationResult.error.format(),
            });
        }
        const { universityName, adminEmail, adminName } = validationResult.data;
        // Create a mock token for testing (in production this would be a real JWT token)
        const testToken = `test-token-${Date.now()}`;
        // Generate the invitation link
        const invitationLink = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/university-invite?token=${testToken}`;
        // Send the university invite email instead of through dedicated function,
        // we'll use the regular email function for testing purposes
        const result = await sendEmail({
            to: adminEmail,
            subject: `You're Invited to Manage ${universityName} on Ascentul`,
            text: `Hello ${adminName},
      
You've been invited to join Ascentul as an administrator for ${universityName}.

To accept this invitation, please click the following link:
${invitationLink}

Thank you,
The Ascentul Team`,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>University Admin Invitation</h2>
        <p>Hello ${adminName},</p>
        <p>You've been invited to join Ascentul as an administrator for <strong>${universityName}</strong>.</p>
        <p>To accept this invitation, please click the button below:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${invitationLink}" style="background-color: #1333c2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
        </div>
        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p><a href="${invitationLink}">${invitationLink}</a></p>
        <p>Thank you,<br>The Ascentul Team</p>
      </div>`,
        });
        return res.json({
            success: true,
            message: 'University invite email sent successfully',
            details: {
                result,
                invitationLink,
            },
        });
    }
    catch (error) {
        console.error('Error sending university invite email:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send university invite email',
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
export default router;
