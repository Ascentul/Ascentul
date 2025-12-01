import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { isValidConvexId } from '@/lib/convex-ids';
import { convexServer } from '@/lib/convex-server';

// GET /api/contacts/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, token } = await requireConvexToken();

    const { id } = await params;
    if (!isValidConvexId(id)) {
      return NextResponse.json({ error: 'Invalid contact ID format' }, { status: 400 });
    }

    const contact = await convexServer.query(
      api.contacts.getContactById,
      {
        clerkId: userId,
        contactId: id as Id<'networking_contacts'>,
      },
      token,
    );

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error: unknown) {
    console.error('GET /api/contacts/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch contact';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT /api/contacts/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, token } = await requireConvexToken();

    const { id } = await params;
    if (!isValidConvexId(id)) {
      return NextResponse.json({ error: 'Invalid contact ID format' }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const contact = await convexServer.mutation(
      api.contacts.updateContact,
      {
        clerkId: userId,
        contactId: id as Id<'networking_contacts'>,
        updates: {
          name: (body.full_name ?? body.name) as string | undefined,
          company: body.company as string | undefined,
          position: body.position as string | undefined,
          email: body.email as string | undefined,
          phone: body.phone as string | undefined,
          notes: body.notes as string | undefined,
          last_contact: (() => {
            if (typeof body.last_contact_date !== 'string') return undefined;
            const parsed = Date.parse(body.last_contact_date);
            if (Number.isNaN(parsed)) {
              return undefined;
            }
            return parsed;
          })(),
        },
      },
      token,
    );

    return NextResponse.json({ contact });
  } catch (error: unknown) {
    console.error('PUT /api/contacts/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update contact';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/contacts/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, token } = await requireConvexToken();

    const { id } = await params;
    if (!isValidConvexId(id)) {
      return NextResponse.json({ error: 'Invalid contact ID format' }, { status: 400 });
    }

    await convexServer.mutation(
      api.contacts.deleteContact,
      { clerkId: userId, contactId: id as Id<'networking_contacts'> },
      token,
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/contacts/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete contact';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
