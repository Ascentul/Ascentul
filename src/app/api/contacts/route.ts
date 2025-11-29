import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { fetchQuery, fetchMutation } from 'convex/nextjs';

// GET /api/contacts - list current user's contacts
export async function GET() {
  const authResult = await auth()
  const { userId } = authResult
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await authResult.getToken({ template: 'convex' })
  if (!token) return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 })

  try {
    const contacts = await fetchQuery(api.contacts.getUserContacts, { clerkId: userId }, { token })
    return NextResponse.json({ contacts })
  } catch (e: any) {
    console.error('GET /api/contacts error', e)
    return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 })
  }
}

// POST /api/contacts - create a contact
export async function POST(request: Request) {
  const authResult = await auth()
  const { userId } = authResult
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await authResult.getToken({ template: 'convex' })
  if (!token) return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name: string = body.full_name ?? body.name ?? 'Unnamed'
  try {
    const contact = await fetchMutation(api.contacts.createContact, {
      clerkId: userId,
      name,
      company: body.company ?? undefined,
      position: body.position ?? undefined,
      email: body.email ?? undefined,
      phone: body.phone ?? undefined,
      linkedin_url: body.linkedin_url ?? undefined,
      notes: body.notes ?? undefined,
      relationship: body.relationship_type ?? undefined,
      last_contact: (() => {
        if (!body.last_contact_date) return undefined;
        const parsed = Date.parse(body.last_contact_date);
        return Number.isNaN(parsed) ? undefined : parsed;
      })(),
    }, { token })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/contacts error', e)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
