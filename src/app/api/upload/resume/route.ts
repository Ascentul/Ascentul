import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function ensureUploadsPath(...segments: string[]) {
  return path.join(process.cwd(), 'uploads', ...segments)
}

const MAX_RESUME_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_RESUME_EXT = new Set(['.pdf', '.docx'])

function getResumeExtension(name: string | undefined): string {
  const ext = name ? path.extname(name).toLowerCase() : ''
  if (ext && ALLOWED_RESUME_EXT.has(ext)) return ext
  return '.pdf'
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

    if (file.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const ext = getResumeExtension(file.name)
    const filename = `resume_${userId}_${Date.now()}${ext}`
    const dir = ensureUploadsPath('resumes')
    const fullPath = path.join(dir, filename)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(fullPath, buffer)

    return NextResponse.json({
      ok: true,
      file: {
        name: filename,
        path: `/api/files/resumes/${filename}`,
        localPath: fullPath,
        size: buffer.length,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('Upload resume error:', err)
    return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 })
  }
}
