import { NextResponse } from 'next/server'

import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';
import { requireConvexToken } from '@/lib/convex-auth';
import { isValidConvexId } from '@/lib/convex-ids';

// GET /api/contacts/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, token } = await requireConvexToken()

  const { id } = await params
  if (!isValidConvexId(id)) {
    return NextResponse.json({ error: 'Invalid contact ID format' }, { status: 400 })
  }

  try {
    const contact = await convexServer.query(api.contacts.getContactById, {
      clerkId: userId,
      contactId: id as Id<'networking_contacts'>,
    }, token)

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error: unknown) {
    console.error('GET /api/contacts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

// PUT /api/contacts/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, token } = await requireConvexToken()

  const { id } = await params
  if (!isValidConvexId(id)) {
    return NextResponse.json({ error: 'Invalid contact ID format' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const contact = await convexServer.mutation(api.contacts.updateContact, {
      clerkId: userId,
      contactId: id as Id<'networking_contacts'>,
      updates: {
        name: (body.full_name ?? body.name) as string | undefined,
        company: body.company as string | undefined,
        position: body.position as string | undefined,
        email: body.email as string | undefined,
        phone: body.phone as string | undefined,
        notes: body.notes as string | undefined,
        last_contact: typeof body.last_contact_date === 'string'
          ? (Number.isNaN(Date.parse(body.last_contact_date)) ? undefined : Date.parse(body.last_contact_date))
          : undefined,
      },
    }, token)

    return NextResponse.json({ contact })
  } catch (error: unknown) {
    console.error('PUT /api/contacts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

// DELETE /api/contacts/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, token } = await requireConvexToken()

  const { id } = await params
  if (!isValidConvexId(id)) {
    return NextResponse.json({ error: 'Invalid contact ID format' }, { status: 400 })
  }

  try {
    await convexServer.mutation(
      api.contacts.deleteContact,
      { clerkId: userId, contactId: id as Id<'networking_contacts'> },
      token
    )
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('DELETE /api/contacts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
