import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import sgMail from '@sendgrid/mail'
import { convexServer } from '@/lib/convex-server';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId, getToken } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = await getToken({ template: 'convex' })
    if (!token) return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 })
    const tickets = await convexServer.query(api.support_tickets.listTickets, { clerkId: userId }, token)
    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = await getToken({ template: 'convex' })
    if (!token) return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 })
    const body = await request.json()
    const { subject, description, issueType, source } = body

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 })
    }

    // Get user info to send email
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId }, token)

    const ticket = await convexServer.mutation(api.support_tickets.createTicket, {
      clerkId: userId,
      subject: String(subject),
      description: String(description),
      issue_type: issueType ? String(issueType) : undefined,
      source: source ? String(source) : 'in-app',
    }, token)

    // Send email notification to user
    if (process.env.SENDGRID_API_KEY && user?.email) {
      try {
        const msg = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'support@ascentful.com',
          subject: `Support Ticket Submitted - #${ticket?._id || 'Unknown'}`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <h2 style="color: #0C29AB;">Hi ${user.name || 'there'},</h2>

              <p>Thank you for contacting Ascentful support. We have received your support ticket and our team is evaluating it.</p>

              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Ticket Details:</h3>
                <p><strong>Ticket ID:</strong> #${ticket?._id || 'Unknown'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Type:</strong> ${issueType}</p>
                <p><strong>Description:</strong> ${description}</p>
              </div>

              <p>We aim to respond to all support tickets within 24-48 hours. You will receive an email notification when there are updates to your ticket.</p>

              <p>If you have any urgent questions, please don't hesitate to reach out.</p>

              <p style="margin-top: 30px;">
                Best regards,<br>
                The Ascentful Support Team
              </p>
            </div>
          `,
        }

        await sgMail.send(msg)
      } catch (emailError) {
        console.error('Error sending support ticket email:', emailError)
        // Don't fail the ticket creation if email fails
      }
    }

    return NextResponse.json({
      ticket,
      message: 'Support ticket submitted successfully!'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
