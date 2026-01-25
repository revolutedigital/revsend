import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Anthropic AI Client
vi.mock('@/lib/ai/client', () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
  getAnthropicClient: vi.fn(),
}))

// Mock Prisma DB Client
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    campaign: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    contact: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

// Mock Redis Client
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
}))
