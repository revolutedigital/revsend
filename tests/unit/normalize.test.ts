import { describe, it, expect } from 'vitest'
import { normalizePhoneNumber } from '@/lib/ai/normalize'

describe('normalizePhoneNumber', () => {
  it('deve adicionar código do país 55 para números de 10 dígitos', () => {
    expect(normalizePhoneNumber('1133334444')).toBe('5511933334444')
  })

  it('deve adicionar código do país 55 para números de 11 dígitos', () => {
    expect(normalizePhoneNumber('11933334444')).toBe('5511933334444')
  })

  it('deve remover caracteres não numéricos', () => {
    expect(normalizePhoneNumber('(11) 93333-4444')).toBe('5511933334444')
    expect(normalizePhoneNumber('+55 11 93333-4444')).toBe('5511933334444')
    expect(normalizePhoneNumber('11 9 3333-4444')).toBe('5511933334444')
  })

  it('deve remover zero inicial', () => {
    expect(normalizePhoneNumber('011933334444')).toBe('5511933334444')
  })

  it('deve adicionar 9 para números de 12 dígitos (55 + DDD + 8 dígitos)', () => {
    expect(normalizePhoneNumber('551133334444')).toBe('5511933334444')
  })

  it('deve manter números já normalizados', () => {
    expect(normalizePhoneNumber('5511933334444')).toBe('5511933334444')
  })

  it('deve lidar com diferentes DDDs', () => {
    expect(normalizePhoneNumber('21987654321')).toBe('5521987654321')
    expect(normalizePhoneNumber('85912345678')).toBe('5585912345678')
    expect(normalizePhoneNumber('47999887766')).toBe('5547999887766')
  })

  it('deve normalizar números com caracteres especiais', () => {
    expect(normalizePhoneNumber('+55 (11) 9.3333-4444')).toBe('5511933334444')
    expect(normalizePhoneNumber('55.11.93333.4444')).toBe('5511933334444')
  })
})
