import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-handler'
import { uploadMedia, MediaType } from '@/lib/storage/media-upload'
import { rateLimit } from '@/lib/rate-limit'
import { listUserMedia } from '@/lib/storage/media-upload'

export const runtime = 'nodejs'
export const maxDuration = 60

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  // Rate limiting
  const rateLimitResult = await rateLimit(`upload:${session!.user.id}`, { windowMs: 60000, maxRequests: 20 })
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
      { status: 429 }
    )
  }

  // Parse form data
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as MediaType | null

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
  }

  if (!type || !['image', 'audio', 'video'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de mídia inválido' }, { status: 400 })
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload media to R2
  const result = await uploadMedia({
    userId: session!.user.id,
    organizationId: session!.user.organizationId!,
    file: buffer,
    filename: file.name,
    type,
    originalMimeType: file.type,
  })

  return NextResponse.json({
    id: result.mediaId,
    url: result.url,
    filename: file.name,
    originalName: file.name,
    mimeType: result.contentType,
    mediaType: type,
    size: result.size,
  })
}, { requiredPermission: 'media:upload' })

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  // Get query params
  const searchParams = req.nextUrl.searchParams
  const type = searchParams.get('type') as MediaType | null

  // List organization media
  const files = await listUserMedia(
    session!.user.organizationId!,
    type || undefined
  )

  return NextResponse.json({ files })
}, { requiredPermission: 'media:read' })
