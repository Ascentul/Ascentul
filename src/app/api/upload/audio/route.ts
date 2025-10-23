import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function ensureUploadsPath(...segments: string[]) {
  return path.join(process.cwd(), 'uploads', ...segments)
}

const MAX_AUDIO_BYTES = 20 * 1024 * 1024 // 20MB limit
const ALLOWED_AUDIO_EXTENSIONS = new Map<string, string>([
  ['.mp3', '.mp3'],
  ['.wav', '.wav'],
  ['.webm', '.webm'],
  ['.m4a', '.m4a'],
])

function resolveAudioExtension(file: File): string {
  const original = path.extname(file.name || '').toLowerCase()
  if (ALLOWED_AUDIO_EXTENSIONS.has(original)) {
    return ALLOWED_AUDIO_EXTENSIONS.get(original)!
  }

  switch (file.type) {
    case 'audio/mpeg':
      return '.mp3'
    case 'audio/wav':
      return '.wav'
    case 'audio/webm':
      return '.webm'
    case 'audio/mp4':
      return '.m4a'
    default:
      return '.webm'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
    }

    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const ext = resolveAudioExtension(file)

    const filename = `speech_${userId}_${Date.now()}${ext}`
    const dir = ensureUploadsPath('audio')
    const fullPath = path.join(dir, filename)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(fullPath, buffer)

    return NextResponse.json({
      ok: true,
      file: {
        name: filename,
        path: `/api/files/audio/${filename}`,
        localPath: fullPath,
        size: buffer.length,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('Upload audio error:', err)
    return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 })
  }
}
