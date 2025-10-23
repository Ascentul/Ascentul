import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BlockData {
  id?: Id<"builder_resume_blocks">;
  type: string;
  data: any;
  order: number;
  locked?: boolean;
}

interface SaveResumeRequest {
  resumeId: Id<"builder_resumes">;
  blocks: BlockData[];
}

/**
 * Save resume blocks by upserting them via Convex
 * Creates new blocks or updates existing ones
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SaveResumeRequest = await req.json();
    const { resumeId, blocks } = body;

    if (!resumeId || !Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId and blocks array' },
        { status: 400 }
      );
    }

    // Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // Verify resume ownership
    try {
      const resume = await client.query(api.builder_resumes.getResume, {
        id: resumeId,
        clerkId: userId,
      });
      if (!resume) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 403 });
    }

    const updatedBlocks: any[] = [];
    const errors: any[] = [];

    // Process each block
    for (const block of blocks) {
      try {
        if (block.id) {
          // Update existing block
          await client.mutation(api.builder_blocks.updateBlock, {
            id: block.id,
            type: block.type,
            data: block.data,
            order: block.order,
            locked: block.locked,
          });
          updatedBlocks.push({ id: block.id, action: 'updated' });
        } else {
          // Insert new block
          const result = await client.mutation(api.builder_blocks.insertBlock, {
            resumeId,
            type: block.type,
            data: block.data,
            order: block.order,
            locked: block.locked,
          });
          updatedBlocks.push({ id: result.id, action: 'created', order: result.order });
        }
      } catch (error: any) {
        errors.push({
          block: block.id || 'new',
          error: error.message || 'Unknown error',
        });
      }
    }

    // Get the updated resume with all blocks
    const updatedResume = await client.query(api.builder_resumes.getResume, {
      id: resumeId,
      clerkId: userId,
    });

    return NextResponse.json({
      success: true,
      updatedBlocks,
      errors: errors.length > 0 ? errors : undefined,
      blocks: updatedResume?.blocks ?? [],
      message: `Saved ${updatedBlocks.length} blocks${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    });
  } catch (error: any) {
    console.error('Resume save error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save resume blocks' },
      { status: 500 }
    );
  }
}
