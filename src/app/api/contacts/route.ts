import { NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

// GET /api/contacts - list current user's contacts
export async function GET(request: Request) {
  const { userId } = getAuth(request as any)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const contacts = await convexServer.query(api.contacts.getUserContacts, { clerkId: userId })
    return NextResponse.json({ contacts })
  } catch (e: any) {
    console.error('GET /api/contacts error', e)
    return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 })
  }
}

// POST /api/contacts - create a contact
export async function POST(request: Request) {
  const { userId } = getAuth(request as any)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name: string = body.full_name ?? body.name ?? 'Unnamed'
  try {
    const contact = await convexServer.mutation(api.contacts.createContact, {
      clerkId: userId,
      name,
      company: body.company ?? undefined,
      position: body.position ?? undefined,
      email: body.email ?? undefined,
      phone: body.phone ?? undefined,
      linkedin_url: body.linkedin_url ?? undefined,
      notes: body.notes ?? undefined,
      relationship: body.relationship_type ?? undefined,
      last_contact: body.last_contact_date ? Date.parse(body.last_contact_date) || undefined : undefined,
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/contacts error', e)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
