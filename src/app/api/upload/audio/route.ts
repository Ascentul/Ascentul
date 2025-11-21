import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function ensureUploadsPath(...segments: string[]) {
  return path.join(process.cwd(), 'uploads', ...segments)
}

function getExtFromFilename(name: string | undefined, fallback: string) {
  if (!name) return fallback
  const ext = path.extname(name)
  return ext || fallback
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const userId = (form.get('userId') as string) || 'anonymous'

    if (!file) {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const allowed = ['.mp3', '.wav', '.webm', '.m4a']
    let ext = getExtFromFilename(file.name, '.webm').toLowerCase()
    if (!allowed.includes(ext)) {
      // Try to infer from type
      if (file.type === 'audio/mpeg') ext = '.mp3'
      else if (file.type === 'audio/wav') ext = '.wav'
      else if (file.type === 'audio/webm') ext = '.webm'
      else if (file.type === 'audio/mp4') ext = '.m4a'
    }

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
