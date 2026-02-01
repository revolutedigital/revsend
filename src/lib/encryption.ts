import crypto from 'crypto'

// A chave de encriptação deve vir das variáveis de ambiente
// DEVE ter exatamente 32 bytes (256 bits) para AES-256
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: ENCRYPTION_KEY must be set in production environment')
  }
  return key || 'dev-key-32-bytes-long-change-me!'
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // Para AES, IV é sempre 16 bytes
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Deriva uma chave de 256 bits a partir da chave de encriptação usando PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(getEncryptionKey(), salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Encripta um texto usando AES-256-GCM
 * Retorna: salt + iv + authTag + ciphertext (tudo em base64)
 */
export function encrypt(text: string): string {
  try {
    // Gera salt e IV aleatórios
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Deriva a chave do salt
    const key = deriveKey(salt)

    // Cria cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encripta
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    // Pega o authentication tag (GCM)
    const authTag = cipher.getAuthTag()

    // Combina tudo: salt + iv + authTag + encrypted
    const result = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'base64'),
    ])

    return result.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decripta um texto encriptado com encrypt()
 */
export function decrypt(encryptedData: string): string {
  try {
    // Converte de base64 para buffer
    const buffer = Buffer.from(encryptedData, 'base64')

    // Extrai os componentes
    const salt = buffer.subarray(0, SALT_LENGTH)
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    )
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    // Deriva a mesma chave usando o salt
    const key = deriveKey(salt)

    // Cria decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decripta
    let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Valida se um valor está encriptado (formato base64 válido com tamanho mínimo)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false

  try {
    const buffer = Buffer.from(value, 'base64')
    // Deve ter pelo menos: salt + iv + tag
    return buffer.length >= SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  } catch {
    return false
  }
}

/**
 * Hash one-way para comparação (ex: verificar senhas)
 * NÃO use para API keys - use encrypt/decrypt
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}
