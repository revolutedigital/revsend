import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'

import { db } from '@/lib/db'

// Mock Prisma Client
vi.mock('@/lib/db', () => ({
  __esModule: true,
  db: mockDeep<PrismaClient>(),
}))

export const prismaMock = db as unknown as DeepMockProxy<PrismaClient>

// Reset mock before each test
beforeEach(() => {
  mockReset(prismaMock)
})

/**
 * Helper to create test user
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-test-123',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$10$hashedpassword', // bcrypt hash
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create test campaign
 */
export function createMockCampaign(userId: string, overrides = {}) {
  return {
    id: 'campaign-test-123',
    userId,
    name: 'Test Campaign',
    status: 'draft' as const,
    listId: 'list-test-123',
    totalContacts: 100,
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    repliedCount: 0,
    minInterval: 30,
    maxInterval: 60,
    scheduledFor: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create test contact list
 */
export function createMockContactList(userId: string, overrides = {}) {
  return {
    id: 'list-test-123',
    userId,
    name: 'Test List',
    totalContacts: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create test contact
 */
export function createMockContact(listId: string, overrides = {}) {
  return {
    id: 'contact-test-123',
    userId: 'user-test-123',
    listId,
    name: 'John Doe',
    phoneNumber: '5511999887766',
    email: 'john@example.com',
    extraFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create test WhatsApp number
 */
export function createMockWhatsAppNumber(userId: string, overrides = {}) {
  return {
    id: 'whatsapp-test-123',
    userId,
    phoneNumber: '5511999887766',
    name: 'Test WhatsApp',
    isConnected: true,
    sessionData: null,
    qrCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create test template
 */
export function createMockTemplate(userId: string, overrides = {}) {
  return {
    id: 'template-test-123',
    userId,
    name: 'Test Template',
    category: 'prospection' as const,
    content: 'Hello {nome}, this is a test message',
    mediaType: null,
    mediaUrl: null,
    timesUsed: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Mock NextAuth session
 */
export function mockAuthSession(user = createMockUser()) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}
