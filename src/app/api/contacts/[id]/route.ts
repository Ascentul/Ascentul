import { NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
// Workaround for "Type instantiation is excessively deep" error in Convex
const api: any = require('convex/_generated/api').api

// GET /api/contacts/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = getAuth(request as any)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
  const client = new ConvexHttpClient(url)
  try {
    const contacts = await client.query(api.contacts.getUserContacts, { clerkId: userId })
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
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
  const client = new ConvexHttpClient(url)

  const body = await request.json().catch(() => ({} as any))
  try {
    await client.mutation(api.contacts.updateContact, {
      clerkId: userId,
      contactId: params.id as any,
      updates: {
        name: body.full_name ?? body.name,
        company: body.company,
        position: body.position,
        email: body.email,
        phone: body.phone,
        linkedin_url: body.linkedin_url,
        notes: body.notes,
        relationship: body.relationship_type,
        last_contact: body.last_contact_date ? Date.parse(body.last_contact_date) || undefined : undefined,
      },
    })
    const contacts = await client.query(api.contacts.getUserContacts, { clerkId: userId })
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
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
  const client = new ConvexHttpClient(url)
  try {
    await client.mutation(api.contacts.deleteContact, { clerkId: userId, contactId: params.id as any })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
