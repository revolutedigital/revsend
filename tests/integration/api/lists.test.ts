import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/lists/route'
import {
  prismaMock,
  createMockUser,
  createMockContactList,
  mockAuthSession,
} from '@tests/helpers/test-db'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/lib/auth'

describe('Contact Lists API Integration Tests', () => {
  const mockUser = createMockUser()
  const mockSession = mockAuthSession(mockUser)

  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession)
  })

  describe('GET /api/lists', () => {
    it('should return all user contact lists', async () => {
      const mockLists = [
        createMockContactList(mockUser.id, { name: 'List 1', totalContacts: 50 }),
        createMockContactList(mockUser.id, {
          name: 'List 2',
          id: 'list-test-456',
          totalContacts: 100,
        }),
      ]

      prismaMock.contactList.findMany.mockResolvedValue(mockLists as any)

      const request = new NextRequest('http://localhost:3000/api/lists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('List 1')
      expect(data[0].totalContacts).toBe(50)
      expect(data[1].totalContacts).toBe(100)

      expect(prismaMock.contactList.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/lists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Nao autorizado')
    })

    it('should return empty array if no lists', async () => {
      prismaMock.contactList.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/lists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })
  })

  describe('POST /api/lists', () => {
    it('should create a new contact list', async () => {
      const newList = createMockContactList(mockUser.id, { name: 'New List' })

      prismaMock.contactList.create.mockResolvedValue(newList as any)

      const listData = {
        name: 'New List',
      }

      const request = new NextRequest('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify(listData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('New List')
      expect(data.totalContacts).toBe(100)

      expect(prismaMock.contactList.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          name: 'New List',
          totalContacts: 0,
        },
      })
    })

    it('should return 400 if name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 if name is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Nome')
    })

    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test List' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Nao autorizado')
    })
  })
})
