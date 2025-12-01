import { promises as fs } from 'fs';
import { NextRequest } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ROOTS = new Set(['images', 'resumes', 'audio']);

function uploadsRoot() {
  return path.join(process.cwd(), 'uploads');
}

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.pdf':
      return 'application/pdf';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.webm':
      return 'audio/webm';
    case '.m4a':
      return 'audio/mp4';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await ctx.params;
    if (!segments || segments.length < 2) {
      return new Response(JSON.stringify({ error: 'Invalid path' }), { status: 400 });
    }
    const [root, ...rest] = segments;
    if (!ALLOWED_ROOTS.has(root)) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    const safeRelPath = path.join(root, ...rest);
    const fullPath = path.join(uploadsRoot(), safeRelPath);

    // Prevent path traversal outside uploads/
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(path.resolve(uploadsRoot()))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const data = await fs.readFile(resolved);
    const contentType = getContentType(resolved);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    if (err && err.code === 'ENOENT') {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
    }
    console.error('File serve error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
