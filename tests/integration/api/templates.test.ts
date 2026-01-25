import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/templates/route'
import {
  prismaMock,
  createMockUser,
  createMockTemplate,
  mockAuthSession,
} from '@tests/helpers/test-db'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/lib/auth'

describe('Templates API Integration Tests', () => {
  const mockUser = createMockUser()
  const mockSession = mockAuthSession(mockUser)

  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession)
  })

  describe('GET /api/templates', () => {
    it('should return all user templates', async () => {
      const mockTemplates = [
        createMockTemplate(mockUser.id, { name: 'Template 1', category: 'prospection' }),
        createMockTemplate(mockUser.id, {
          name: 'Template 2',
          id: 'template-test-456',
          category: 'followup',
        }),
      ]

      prismaMock.messageTemplate.findMany.mockResolvedValue(mockTemplates as any)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Template 1')
      expect(data[0].category).toBe('prospection')
      expect(data[1].category).toBe('followup')

      expect(prismaMock.messageTemplate.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter by category', async () => {
      const prospectionTemplates = [
        createMockTemplate(mockUser.id, { category: 'prospection' }),
      ]

      prismaMock.messageTemplate.findMany.mockResolvedValue(prospectionTemplates as any)

      const request = new NextRequest(
        'http://localhost:3000/api/templates?category=prospection'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].category).toBe('prospection')
    })

    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Nao autorizado')
    })
  })

  describe('POST /api/templates', () => {
    it('should create a new template', async () => {
      const newTemplate = createMockTemplate(mockUser.id, {
        name: 'New Template',
        content: 'Hello {nome}',
      })

      prismaMock.messageTemplate.create.mockResolvedValue(newTemplate as any)

      const templateData = {
        name: 'New Template',
        category: 'prospection',
        content: 'Hello {nome}',
      }

      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('New Template')
      expect(data.content).toBe('Hello {nome}')

      expect(prismaMock.messageTemplate.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          name: 'New Template',
          category: 'prospection',
          content: 'Hello {nome}',
          mediaType: null,
          mediaUrl: null,
          timesUsed: 0,
        },
      })
    })

    it('should return 400 if required fields missing', async () => {
      const invalidData = {
        name: 'Test',
        // missing category and content
      }

      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', category: 'prospection', content: 'Test' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Nao autorizado')
    })
  })
})
