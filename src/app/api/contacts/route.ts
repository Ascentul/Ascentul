import { NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
// Workaround for "Type instantiation is excessively deep" error in Convex
const api: any = require('convex/_generated/api').api

// GET /api/contacts - list current user's contacts
export async function GET(request: Request) {
  const { userId } = getAuth(request as any)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
  const client = new ConvexHttpClient(url)
  try {
    const contacts = await client.query(api.contacts.getUserContacts, { clerkId: userId })
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
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
  const client = new ConvexHttpClient(url)

  const body = await request.json().catch(() => ({} as any))
  const name: string = body.full_name ?? body.name ?? 'Unnamed'
  try {
    const contact = await client.mutation(api.contacts.createContact, {
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
