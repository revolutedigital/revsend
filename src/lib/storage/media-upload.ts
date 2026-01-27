import { uploadFile, deleteFile, generateFileKey, UploadResult } from './local-storage'
import { db } from '@/lib/db'
import sharp from 'sharp'

export type MediaType = 'image' | 'audio' | 'video'

export interface MediaUploadOptions {
  userId: string
  file: Buffer
  filename: string
  type: MediaType
  originalMimeType?: string
}

// Allowed MIME types
const ALLOWED_MIMETYPES: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/mp4'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
}

// Max file sizes (in bytes)
const MAX_FILE_SIZE: Record<MediaType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  audio: 20 * 1024 * 1024, // 20MB
  video: 100 * 1024 * 1024, // 100MB
}

/**
 * Validate media file
 */
export function validateMedia(file: Buffer, type: MediaType, mimeType: string): { valid: boolean; error?: string } {
  // Check file size
  if (file.length > MAX_FILE_SIZE[type]) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size for ${type} (${MAX_FILE_SIZE[type] / 1024 / 1024}MB)`,
    }
  }

  // Check MIME type
  if (!ALLOWED_MIMETYPES[type].includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid MIME type for ${type}. Allowed types: ${ALLOWED_MIMETYPES[type].join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Optimize image before upload
 */
export async function optimizeImage(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    // Convert to WebP and compress
    const optimized = await sharp(buffer)
      .webp({ quality: 85 })
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer()

    return {
      buffer: optimized,
      contentType: 'image/webp',
    }
  } catch {
    // If optimization fails, return original
    return {
      buffer,
      contentType: 'image/jpeg',
    }
  }
}

/**
 * Upload media file
 */
export async function uploadMedia(options: MediaUploadOptions): Promise<UploadResult & { mediaId: string }> {
  const { userId, file, filename, type, originalMimeType } = options

  // Determine MIME type
  const mimeType = originalMimeType || 'application/octet-stream'

  // Validate
  const validation = validateMedia(file, type, mimeType)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  let uploadBuffer = file
  let uploadContentType = mimeType

  // Optimize images
  if (type === 'image') {
    const optimized = await optimizeImage(file)
    uploadBuffer = optimized.buffer
    uploadContentType = optimized.contentType
  }

  // Upload to storage
  const uploadResult = await uploadFile({
    userId,
    file: uploadBuffer,
    filename,
    contentType: uploadContentType,
    prefix: type,
  })

  // Save to database
  const mediaFile = await db.mediaFile.create({
    data: {
      userId,
      url: uploadResult.url,
      filename,
      originalName: filename,
      size: uploadResult.size,
      mimeType: uploadContentType,
    },
  })

  return {
    ...uploadResult,
    mediaId: mediaFile.id,
  }
}

/**
 * Delete media file
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  // Get media file from database
  const mediaFile = await db.mediaFile.findUnique({
    where: { id: mediaId },
  })

  if (!mediaFile) {
    throw new Error('Media file not found')
  }

  // Delete from storage
  if (mediaFile.url) {
    try {
      await deleteFile(mediaFile.url)
    } catch {
      // Ignore storage deletion errors
    }
  }

  // Delete from database
  await db.mediaFile.delete({
    where: { id: mediaId },
  })
}

/**
 * Get media file info
 */
export async function getMediaInfo(mediaId: string) {
  const mediaFile = await db.mediaFile.findUnique({
    where: { id: mediaId },
  })

  if (!mediaFile) {
    throw new Error('Media file not found')
  }

  return mediaFile
}

/**
 * List user media files
 */
export async function listUserMedia(userId: string, type?: MediaType) {
  return db.mediaFile.findMany({
    where: {
      userId,
      ...(type && { type }),
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
