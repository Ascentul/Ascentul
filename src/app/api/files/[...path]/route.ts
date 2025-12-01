import { promises as fs } from 'fs';
import { NextRequest } from 'next/server';
import path from 'path';

import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

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

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const correlationId = getCorrelationIdFromRequest(req);
  const log = createRequestLogger(correlationId, {
    feature: 'file',
    httpMethod: 'GET',
    httpPath: '/api/files/[...path]',
  });

  try {
    const { path: segments } = await ctx.params;
    if (!segments || segments.length < 2) {
      log.warn('Invalid path', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return new Response(JSON.stringify({ error: 'Invalid path' }), {
        status: 400,
        headers: { 'x-correlation-id': correlationId },
      });
    }
    const [root, ...rest] = segments;
    if (!ALLOWED_ROOTS.has(root)) {
      log.warn('Root not allowed', {
        event: 'validation.failed',
        errorCode: 'NOT_FOUND',
        extra: { root },
      });
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'x-correlation-id': correlationId },
      });
    }

    const safeRelPath = path.join(root, ...rest);
    const fullPath = path.join(uploadsRoot(), safeRelPath);

    // Prevent path traversal outside uploads/
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(path.resolve(uploadsRoot()))) {
      log.warn('Path traversal attempt blocked', {
        event: 'security.path_traversal',
        errorCode: 'FORBIDDEN',
      });
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'x-correlation-id': correlationId },
      });
    }

    const data = await fs.readFile(resolved);
    const contentType = getContentType(resolved);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'x-correlation-id': correlationId,
      },
    });
  } catch (err: any) {
    if (err && err.code === 'ENOENT') {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'x-correlation-id': correlationId },
      });
    }
    log.error('File serve error', toErrorCode(err), { event: 'request.error', httpStatus: 500 });
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'x-correlation-id': correlationId },
    });
  }
}
