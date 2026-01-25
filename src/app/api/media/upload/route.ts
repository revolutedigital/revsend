import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadMedia, MediaType } from '@/lib/storage/media-upload'
import { rateLimit } from '@/lib/rate-limit'
import { listUserMedia } from '@/lib/storage/media-upload'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'FILE_UPLOAD')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
        { status: 429 }
      )
    }

    // Parse form data
    const formData = await request.formData()
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
      userId: session.user.id,
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
  } catch (error: any) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as MediaType | null

    // List user media
    const files = await listUserMedia(
      session.user.id,
      type || undefined
    )

    return NextResponse.json({ files })
  } catch (error: any) {
    console.error('Media list error:', error)
    return NextResponse.json(
      { error: 'Erro ao listar arquivos' },
      { status: 500 }
    )
  }
}
