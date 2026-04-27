import { describe, it, expect, vi } from 'vitest'

// Stripe is instantiated with `new` — must mock as a class
vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor(_key: string) {}
  },
}))

import { formatPrice } from '../../lib/stripe.js'

describe('formatPrice', () => {
  it('formats zero cents as R$ 0,00', () => {
    expect(formatPrice(0)).toBe('R$ 0,00')
  })

  it('formats 1999 cents as R$ 19,99', () => {
    expect(formatPrice(1999)).toBe('R$ 19,99')
  })

  it('formats 100000 cents as R$ 1.000,00', () => {
    expect(formatPrice(100000)).toBe('R$ 1.000,00')
  })

  it('formats fractional-cent values truncated by Intl', () => {
    // 1 cent = R$ 0,01
    expect(formatPrice(1)).toBe('R$ 0,01')
  })
})
