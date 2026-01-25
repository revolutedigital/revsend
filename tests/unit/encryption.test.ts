import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, isEncrypted, hash } from '@/lib/encryption'

describe('Encryption Library', () => {
  describe('encrypt & decrypt', () => {
    it('deve encriptar e decriptar um texto corretamente', () => {
      const original = 'sk-ant-api03-sensitive-api-key-12345'
      const encrypted = encrypt(original)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(original)
      expect(encrypted).not.toBe(original)
    })

    it('deve gerar valores diferentes para cada encriptação', () => {
      const text = 'same text'
      const encrypted1 = encrypt(text)
      const encrypted2 = encrypt(text)

      // Deve ser diferente devido ao salt e IV aleatórios
      expect(encrypted1).not.toBe(encrypted2)

      // Mas ambos devem decriptar para o mesmo valor
      expect(decrypt(encrypted1)).toBe(text)
      expect(decrypt(encrypted2)).toBe(text)
    })

    it('deve lidar com strings vazias', () => {
      const encrypted = encrypt('')
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe('')
    })

    it('deve lidar com strings longas', () => {
      const longText = 'A'.repeat(10000)
      const encrypted = encrypt(longText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(longText)
    })

    it('deve lidar com caracteres especiais', () => {
      const special = 'Hello 世界 🌍 @#$%^&*()_+-={}[]|\\:";\'<>?,./'
      const encrypted = encrypt(special)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(special)
    })

    it('não deve decriptar com chave incorreta', () => {
      const encrypted = encrypt('secret')

      // Corromper o encrypted data
      const corrupted = encrypted.slice(0, -5) + 'XXXXX'

      expect(() => decrypt(corrupted)).toThrow()
    })
  })

  describe('isEncrypted', () => {
    it('deve identificar string encriptada', () => {
      const encrypted = encrypt('test')
      expect(isEncrypted(encrypted)).toBe(true)
    })

    it('deve rejeitar string plaintext', () => {
      expect(isEncrypted('sk-ant-api03-plaintext')).toBe(false)
    })

    it('deve rejeitar string vazia', () => {
      expect(isEncrypted('')).toBe(false)
    })

    it('deve rejeitar base64 curto demais', () => {
      expect(isEncrypted('YWJjZA==')).toBe(false)
    })
  })

  describe('hash', () => {
    it('deve gerar hash consistente', () => {
      const text = 'password123'
      const hash1 = hash(text)
      const hash2 = hash(text)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA256 = 64 hex chars
    })

    it('deve gerar hashes diferentes para textos diferentes', () => {
      const hash1 = hash('password1')
      const hash2 = hash('password2')

      expect(hash1).not.toBe(hash2)
    })

    it('deve ser irreversível', () => {
      const original = 'secret'
      const hashed = hash(original)

      // Não deve ser igual ao original
      expect(hashed).not.toBe(original)

      // Não deve ser possível reverter
      // (não há função de decrypt para hash)
    })
  })
})
