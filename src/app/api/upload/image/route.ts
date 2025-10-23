import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function ensureUploadsPath(...segments: string[]) {
  return path.join(process.cwd(), 'uploads', ...segments)
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB limit
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function getSafeExtension(name: string | undefined): string {
  const ext = name ? path.extname(name).toLowerCase() : ''
  if (ext && ALLOWED_EXTENSIONS.has(ext)) return ext
  return '.jpg'
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

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const ext = getSafeExtension(file.name)
    const filename = `profile_${userId}_${Date.now()}${ext}`
    const dir = ensureUploadsPath('images')
    const fullPath = path.join(dir, filename)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(fullPath, buffer)

    return NextResponse.json({
      ok: true,
      file: {
        name: filename,
        path: `/api/files/images/${filename}`,
        localPath: fullPath,
        size: buffer.length,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('Upload image error:', err)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
