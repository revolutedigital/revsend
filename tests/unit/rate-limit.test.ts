import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RATE_LIMITS, getRateLimitIdentifier } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  describe('RATE_LIMITS configuration', () => {
    it('deve ter configurações definidas para auth endpoints', () => {
      expect(RATE_LIMITS.LOGIN).toBeDefined()
      expect(RATE_LIMITS.LOGIN.maxRequests).toBe(5)
      expect(RATE_LIMITS.LOGIN.windowMs).toBe(60 * 1000)

      expect(RATE_LIMITS.REGISTER).toBeDefined()
      expect(RATE_LIMITS.REGISTER.maxRequests).toBe(3)
      expect(RATE_LIMITS.REGISTER.windowMs).toBe(60 * 60 * 1000)
    })

    it('deve ter configurações definidas para API endpoints', () => {
      expect(RATE_LIMITS.API_DEFAULT).toBeDefined()
      expect(RATE_LIMITS.API_DEFAULT.maxRequests).toBe(100)

      expect(RATE_LIMITS.API_WRITE).toBeDefined()
      expect(RATE_LIMITS.API_WRITE.maxRequests).toBe(30)
    })

    it('deve ter configurações mais restritivas para AI e uploads', () => {
      expect(RATE_LIMITS.AI_VARIATIONS.maxRequests).toBeLessThan(
        RATE_LIMITS.API_DEFAULT.maxRequests
      )

      expect(RATE_LIMITS.FILE_UPLOAD.maxRequests).toBeLessThan(
        RATE_LIMITS.API_DEFAULT.maxRequests
      )
    })
  })

  describe('getRateLimitIdentifier', () => {
    it('deve usar userId quando disponível', () => {
      const mockRequest = new Request('https://example.com/api/test')
      const userId = 'user-123'

      const identifier = getRateLimitIdentifier(mockRequest, userId)

      expect(identifier).toBe('user:user-123')
    })

    it('deve usar IP quando userId não está disponível', () => {
      const mockRequest = new Request('https://example.com/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })

      const identifier = getRateLimitIdentifier(mockRequest)

      expect(identifier).toBe('ip:192.168.1.1')
    })

    it('deve lidar com IP ausente', () => {
      const mockRequest = new Request('https://example.com/api/test')

      const identifier = getRateLimitIdentifier(mockRequest)

      expect(identifier).toBe('ip:unknown')
    })

    it('deve extrair primeiro IP de x-forwarded-for', () => {
      const mockRequest = new Request('https://example.com/api/test', {
        headers: {
          'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12',
        },
      })

      const identifier = getRateLimitIdentifier(mockRequest)

      expect(identifier).toBe('ip:1.2.3.4')
    })
  })
})
