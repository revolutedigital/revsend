import { writeFile, unlink, mkdir, access } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'

// Storage directory (Railway Volume mount point in production, local in dev)
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage')
const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface UploadOptions {
  organizationId: string
  file: Buffer
  filename: string
  contentType: string
  prefix?: string
}

export interface UploadResult {
  key: string
  url: string
  size: number
  contentType: string
}

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir(subdir?: string): Promise<string> {
  const dir = subdir ? path.join(STORAGE_DIR, subdir) : STORAGE_DIR

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  return dir
}

/**
 * Generate a unique key for a file
 * Files are organized by organization for proper multi-tenant separation
 */
export function generateFileKey(organizationId: string, filename: string, prefix: string = 'media'): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')

  return `${prefix}/${organizationId}/${timestamp}-${randomStr}-${sanitizedFilename}`
}

/**
 * Upload a file to local storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { organizationId, file, filename, contentType, prefix = 'media' } = options

  // Generate unique key (organized by organization for multi-tenant separation)
  const key = generateFileKey(organizationId, filename, prefix)
  const filePath = path.join(STORAGE_DIR, key)

  // Ensure directory exists
  await ensureStorageDir(path.dirname(key))

  // Write file
  await writeFile(filePath, file)

  // Generate public URL
  const url = `${PUBLIC_URL}/storage/${key}`

  return {
    key,
    url,
    size: file.length,
    contentType,
  }
}

/**
 * Delete a file from local storage
 */
export async function deleteFile(key: string): Promise<void> {
  const filePath = path.join(STORAGE_DIR, key)

  try {
    await unlink(filePath)
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error
    }
    // File doesn't exist, ignore
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const filePath = path.join(STORAGE_DIR, key)

  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Get file path
 */
export function getFilePath(key: string): string {
  return path.join(STORAGE_DIR, key)
}

/**
 * Initialize storage (create directories)
 */
export async function initStorage(): Promise<void> {
  await ensureStorageDir()
  await ensureStorageDir('media')
  await ensureStorageDir('audio')
  await ensureStorageDir('video')
  await ensureStorageDir('image')

  console.log('✅ Storage initialized at:', STORAGE_DIR)
}
