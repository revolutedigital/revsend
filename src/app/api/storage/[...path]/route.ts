import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { auth } from '@/lib/auth'

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(process.cwd(), 'storage'))

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Reject path segments with traversal attempts
    const filePath = params.path.join('/')
    if (filePath.includes('..') || filePath.includes('\0')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // IDOR protection: files are stored as {prefix}/{organizationId}/..., verify ownership
    const pathParts = filePath.split('/')
    if (pathParts.length >= 2 && pathParts[1] !== session.user.currentOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fullPath = path.resolve(STORAGE_DIR, filePath)

    // Security: prevent directory traversal (use resolved paths)
    if (!fullPath.startsWith(STORAGE_DIR + path.sep) && fullPath !== STORAGE_DIR) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(fullPath)

    // Determine content type from extension
    const ext = path.extname(filePath).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.aac': 'audio/aac',
      '.m4a': 'audio/mp4',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
    }

    const contentType = contentTypes[ext] || 'application/octet-stream'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Storage serve error:', error)
    return NextResponse.json({ error: 'Error serving file' }, { status: 500 })
  }
}
