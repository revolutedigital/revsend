import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (className utility)', () => {
  it('deve combinar classes do Tailwind', () => {
    expect(cn('px-2 py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500')
  })

  it('deve fazer merge de classes conflitantes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('deve lidar com classes condicionais', () => {
    expect(cn('px-2', false && 'py-1', 'bg-red-500')).toBe('px-2 bg-red-500')
  })

  it('deve remover undefined e null', () => {
    expect(cn('px-2', undefined, null, 'py-1')).toBe('px-2 py-1')
  })

  it('deve lidar com arrays de classes', () => {
    expect(cn(['px-2', 'py-1'], 'bg-red-500')).toBe('px-2 py-1 bg-red-500')
  })
})
