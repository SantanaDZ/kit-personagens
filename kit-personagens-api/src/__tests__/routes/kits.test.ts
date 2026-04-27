import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../../lib/supabase.js', () => ({ createUserClient: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('stripe', () => ({ default: vi.fn().mockReturnValue({}) }))
vi.mock('../../lib/stripe.js', () => ({
  stripe: {
    products: { create: vi.fn(), update: vi.fn() },
    prices: { create: vi.fn(), update: vi.fn() },
  },
  formatPrice: vi.fn(),
}))

import { createUserClient } from '../../lib/supabase.js'
import { stripe } from '../../lib/stripe.js'
import { q, buildClient } from '../helpers/mock-chain.js'
import kitsRoute from '../../routes/kits.js'

const ADMIN_USER = { id: 'admin-1' }
const ADMIN_TOKEN = 'Bearer admin-token'
const KIT = { id: 'kit-1', title: 'Kit Aniversário', price: 1999 }

function makeApp() {
  const app = new Hono()
  app.route('/admin/kits', kitsRoute)
  return app
}

function setupAdmin(kitsTables: Record<string, any> = {}) {
  vi.mocked(createUserClient).mockReturnValue(
    buildClient(
      { profiles: q({ is_admin: true }), ...kitsTables },
      ADMIN_USER
    ) as any
  )
}

function post(app: Hono, body: any) {
  return app.request('/admin/kits', {
    method: 'POST',
    headers: { Authorization: ADMIN_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function patch(app: Hono, id: string, body: any) {
  return app.request(`/admin/kits/${id}`, {
    method: 'PATCH',
    headers: { Authorization: ADMIN_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /admin/kits', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when no token is provided', async () => {
    const res = await app.request('/admin/kits', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    vi.mocked(createUserClient).mockReturnValue(
      buildClient({ profiles: q({ is_admin: false }) }, { id: 'user-1' }) as any
    )
    const res = await app.request('/admin/kits', {
      method: 'POST',
      headers: { Authorization: 'Bearer user-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Kit' }),
    })
    expect(res.status).toBe(403)
  })

  it('creates Stripe product and price when price > 0', async () => {
    setupAdmin({ kits: q(KIT) })
    vi.mocked(stripe.products.create).mockResolvedValue({ id: 'prod_new' } as any)
    vi.mocked(stripe.prices.create).mockResolvedValue({ id: 'price_new' } as any)

    const res = await post(app, { title: 'Kit Aniversário', price: 1999, is_active: true })
    expect(res.status).toBe(201)
    expect(stripe.products.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Kit Aniversário' })
    )
    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({ unit_amount: 1999, currency: 'brl' })
    )
  })

  it('skips Stripe creation when price is 0 or not provided', async () => {
    setupAdmin({ kits: q({ ...KIT, price: null, stripe_price_id: null }) })

    const res = await post(app, { title: 'Kit Gratuito' })
    expect(res.status).toBe(201)
    expect(stripe.products.create).not.toHaveBeenCalled()
    expect(stripe.prices.create).not.toHaveBeenCalled()
  })

  it('returns 500 on database insert error', async () => {
    setupAdmin({ kits: q(null, { message: 'unique violation' }) })
    vi.mocked(stripe.products.create).mockResolvedValue({ id: 'prod_1' } as any)
    vi.mocked(stripe.prices.create).mockResolvedValue({ id: 'price_1' } as any)

    const res = await post(app, { title: 'Kit X', price: 1000 })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('unique violation')
  })

  it('returns 201 with created kit data', async () => {
    setupAdmin({ kits: q(KIT) })
    vi.mocked(stripe.products.create).mockResolvedValue({ id: 'prod_1' } as any)
    vi.mocked(stripe.prices.create).mockResolvedValue({ id: 'price_1' } as any)

    const res = await post(app, { title: 'Kit Aniversário', price: 1999 })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.kit.title).toBe('Kit Aniversário')
  })
})

describe('PATCH /admin/kits/:id', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when no token is provided', async () => {
    const res = await app.request('/admin/kits/kit-1', { method: 'PATCH' })
    expect(res.status).toBe(401)
  })

  // Helper: builds a mock client for PATCH tests.
  // requireAdmin calls from('profiles') first, then the route handler calls from('kits') twice.
  function mockPatchClient(existingKit: any, kitResult: any) {
    const profileChain = q({ is_admin: true })
    const fetchChain: any = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existingKit }),
        }),
      }),
    }
    const updateChain = q(kitResult, kitResult ? null : { message: 'row not found' })

    vi.mocked(createUserClient).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: ADMIN_USER }, error: null }) },
      from: vi.fn()
        .mockReturnValueOnce(profileChain)  // requireAdmin → from('profiles')
        .mockReturnValueOnce(fetchChain)    // route handler → from('kits') fetch existing
        .mockReturnValueOnce(updateChain),  // route handler → from('kits') update
    } as any)
  }

  it('creates new Stripe product when kit had none', async () => {
    mockPatchClient({ stripe_product_id: null, stripe_price_id: null, price: null }, KIT)
    vi.mocked(stripe.products.create).mockResolvedValue({ id: 'prod_new' } as any)
    vi.mocked(stripe.prices.create).mockResolvedValue({ id: 'price_new' } as any)

    const res = await patch(app, 'kit-1', { title: 'Kit Updated', price: 1999 })
    expect(res.status).toBe(200)
    expect(stripe.products.create).toHaveBeenCalled()
  })

  it('updates existing Stripe product and creates new price when price changes', async () => {
    mockPatchClient(
      { stripe_product_id: 'prod_existing', stripe_price_id: 'price_existing', price: 1500 },
      KIT
    )
    vi.mocked(stripe.products.update).mockResolvedValue({} as any)
    vi.mocked(stripe.prices.update).mockResolvedValue({} as any)
    vi.mocked(stripe.prices.create).mockResolvedValue({ id: 'price_new' } as any)

    const res = await patch(app, 'kit-1', { title: 'Kit Updated', price: 2500 })
    expect(res.status).toBe(200)
    expect(stripe.products.update).toHaveBeenCalledWith('prod_existing', expect.anything())
    expect(stripe.prices.update).toHaveBeenCalledWith('price_existing', { active: false })
    expect(stripe.prices.create).toHaveBeenCalled()
  })

  it('does not create new Stripe price when price is unchanged', async () => {
    mockPatchClient(
      { stripe_product_id: 'prod_existing', stripe_price_id: 'price_existing', price: 1999 },
      KIT
    )
    vi.mocked(stripe.products.update).mockResolvedValue({} as any)

    const res = await patch(app, 'kit-1', { title: 'Kit Updated', price: 1999 })
    expect(res.status).toBe(200)
    expect(stripe.prices.update).not.toHaveBeenCalled()
    expect(stripe.prices.create).not.toHaveBeenCalled()
  })

  it('returns 500 on database update error', async () => {
    mockPatchClient({ stripe_product_id: null, stripe_price_id: null, price: null }, null)

    const res = await patch(app, 'kit-1', { title: 'Kit', price: 0 })
    expect(res.status).toBe(500)
  })
})
