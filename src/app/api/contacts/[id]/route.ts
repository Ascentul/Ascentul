import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';
import { requireConvexToken } from '@/lib/convex-auth';

// GET /api/contacts/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, token } = await requireConvexToken()

  const { id } = await params
  if (!id || typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 })
  }

  try {
    const contact = await convexServer.query(api.contacts.getContactById, { 
      clerkId: userId,
      contactId: id as Id<'networking_contacts'>,
    }, token)
    return NextResponse.json({ contact })
  } catch (e: any) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }
}

// PUT /api/contacts/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, token } = await requireConvexToken()

  const { id } = await params
  if (!id || typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    // Mutation now returns the updated contact directly - no need to refetch all contacts
    const contact = await convexServer.mutation(api.contacts.updateContact, {
      clerkId: userId,
      contactId: id as Id<'networking_contacts'>,  // Convex will validate
      updates: {
        name: body.full_name ?? body.name,
        company: body.company,
        position: body.position,
        email: body.email,
        phone: body.phone,
        notes: body.notes,
        last_contact: body.last_contact_date 
          ? (Number.isNaN(Date.parse(body.last_contact_date)) ? undefined : Date.parse(body.last_contact_date)) 
          : undefined,
      },
    }, token)

    return NextResponse.json({ contact })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

// DELETE /api/contacts/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, token } = await requireConvexToken()

  const { id } = await params
  if (!id || typeof id !== 'string' || !id.trim()) {
    return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 })
  }

  try {
    await convexServer.mutation(
      api.contacts.deleteContact,
      { clerkId: userId, contactId: id as Id<'networking_contacts'> },
      token
    )
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
