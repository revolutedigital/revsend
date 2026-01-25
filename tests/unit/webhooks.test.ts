import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

describe('Webhook HMAC Signature', () => {
  function generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }

  it('deve gerar assinatura HMAC consistente', () => {
    const payload = JSON.stringify({ event: 'test', data: { id: 1 } })
    const secret = 'my-secret-key'

    const signature1 = generateSignature(payload, secret)
    const signature2 = generateSignature(payload, secret)

    expect(signature1).toBe(signature2)
    expect(signature1).toHaveLength(64) // SHA256 = 64 hex chars
  })

  it('deve gerar assinaturas diferentes para payloads diferentes', () => {
    const payload1 = JSON.stringify({ event: 'test1' })
    const payload2 = JSON.stringify({ event: 'test2' })
    const secret = 'my-secret-key'

    const signature1 = generateSignature(payload1, secret)
    const signature2 = generateSignature(payload2, secret)

    expect(signature1).not.toBe(signature2)
  })

  it('deve gerar assinaturas diferentes para secrets diferentes', () => {
    const payload = JSON.stringify({ event: 'test' })
    const secret1 = 'secret1'
    const secret2 = 'secret2'

    const signature1 = generateSignature(payload, secret1)
    const signature2 = generateSignature(payload, secret2)

    expect(signature1).not.toBe(signature2)
  })

  it('deve validar assinatura corretamente', () => {
    const payload = JSON.stringify({ event: 'test', timestamp: '2024-01-01' })
    const secret = 'webhook-secret'

    const signature = generateSignature(payload, secret)
    const verification = generateSignature(payload, secret)

    expect(signature).toBe(verification)
  })
})
