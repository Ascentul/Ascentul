import { NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';

// GET /api/contacts/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = getAuth(request as any)
  try {
      try {
    const contacts = await convexServer.query(api.contacts.getUserContacts, { clerkId: userId })
    const contact = (contacts as any[]).find((c) => String(c._id) === params.id)
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    return NextResponse.json({ contact })
  } catch (e: any) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }
}

// PUT /api/contacts/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { userId } = getAuth(request as any)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const body = await request.json().catch(() => ({} as any))
  try {
    await convexServer.mutation(api.contacts.updateContact, {
      clerkId: userId,
      contactId: params.id as Id<'networking_contacts'>,
      updates: {
        name: body.full_name ?? body.name,
        company: body.company,
        position: body.position,
        email: body.email,
        phone: body.phone,
        linkedin_url: body.linkedin_url,
        notes: body.notes,
        last_contact: body.last_contact_date 
          ? (isNaN(Date.parse(body.last_contact_date)) ? undefined : Date.parse(body.last_contact_date))
          : undefined,
        last_contact: body.last_contact_date ? Date.parse(body.last_contact_date) || undefined : undefined,
      },
    })
    const contacts = await convexServer.query(api.contacts.getUserContacts, { clerkId: userId })
    const contact = (contacts as any[]).find((c) => String(c._id) === params.id)
    return NextResponse.json({ contact })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

// DELETE /api/contacts/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { userId } = getAuth(request as any)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      try {
    await convexServer.mutation(api.contacts.deleteContact, { clerkId: userId, contactId: params.id as Id<'networking_contacts'> })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
