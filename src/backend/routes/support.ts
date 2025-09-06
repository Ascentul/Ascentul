import express from 'express';
import { z } from 'zod';
import { supabase } from '../supabase';
import { sendSupportAcknowledgementEmail } from '../mail';
import { verifySupabaseToken, requireAdmin } from '../supabase-auth';

const router = express.Router();

const SupportTicketSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(5),
  email: z.string().email(),
});

router.post('/', verifySupabaseToken, async (req, res) => {
  const parse = SupportTicketSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid support ticket data' });
  }
  const { subject, message, email } = parse.data;
  const userId = req.user?.id || null;

  // Insert support ticket
  const { error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userId,
      email,
      subject,
      message,
      status: 'open',
    });

  if (error) {
    return res.status(500).json({ error: 'Failed to create support ticket' });
  }

  // Send acknowledgement email with provided template
  try {
    const firstName = (email?.split('@')[0] || 'there').split('.')[0]
    await sendSupportAcknowledgementEmail(email, firstName);
  } catch (e) {
    // Log but don't fail the ticket creation if email fails
    console.error('Support confirmation email failed:', e);
  }

  return res.status(201).json({ success: true });
});

// Admin: Get all support tickets
router.get('/all', verifySupabaseToken, requireAdmin, async (req, res) => {
  // Optionally, check if user is admin here
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
  return res.json({ tickets: data });
});

// Admin: Update ticket status
router.post('/:id/status', verifySupabaseToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    return res.status(500).json({ error: 'Failed to update ticket status' });
  }
  return res.json({ success: true });
});

export default router;

