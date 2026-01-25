import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/campaigns/route'
import {
  prismaMock,
  createMockUser,
  createMockCampaign,
  createMockContactList,
  mockAuthSession,
} from '@tests/helpers/test-db'

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/lib/auth'

describe('Campaigns API Integration Tests', () => {
  const mockUser = createMockUser()
  const mockSession = mockAuthSession(mockUser)

  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession)
  })

  describe('GET /api/campaigns', () => {
    it('should return user campaigns', async () => {
      const mockCampaigns = [
        createMockCampaign(mockUser.id, { name: 'Campaign 1' }),
        createMockCampaign(mockUser.id, { name: 'Campaign 2', id: 'campaign-test-456' }),
      ]

      prismaMock.campaign.findMany.mockResolvedValue(mockCampaigns as any)

      const request = new NextRequest('http://localhost:3000/api/campaigns')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Campaign 1')
      expect(data[1].name).toBe('Campaign 2')

      expect(prismaMock.campaign.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          list: { select: { name: true } },
          messages: true,
          numbers: { include: { whatsappNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/campaigns')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Nao autorizado')
    })

    it('should return empty array if no campaigns', async () => {
      prismaMock.campaign.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/campaigns')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })
  })

  describe('POST /api/campaigns', () => {
    it('should create a new campaign', async () => {
      const mockList = createMockContactList(mockUser.id)
      const newCampaign = createMockCampaign(mockUser.id)

      prismaMock.contactList.findUnique.mockResolvedValue(mockList as any)
      prismaMock.contact.count.mockResolvedValue(100)
      prismaMock.campaign.create.mockResolvedValue(newCampaign as any)

      const campaignData = {
        name: 'Test Campaign',
        listId: 'list-test-123',
        messages: ['Message 1', 'Message 2'],
        minInterval: 30,
        maxInterval: 60,
        numberIds: ['whatsapp-test-123'],
      }

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('campaign-test-123')
      expect(data.name).toBe('Test Campaign')

      expect(prismaMock.campaign.create).toHaveBeenCalled()
    })

    it('should return 400 if list not found', async () => {
      prismaMock.contactList.findUnique.mockResolvedValue(null)

      const campaignData = {
        name: 'Test Campaign',
        listId: 'non-existent-list',
        messages: ['Message 1'],
        minInterval: 30,
        maxInterval: 60,
        numberIds: ['whatsapp-test-123'],
      }

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Lista')
    })

    it('should return 400 if invalid data', async () => {
      const invalidData = {
        name: '', // Empty name
        listId: 'list-test-123',
      }

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Nao autorizado')
    })
  })
})
