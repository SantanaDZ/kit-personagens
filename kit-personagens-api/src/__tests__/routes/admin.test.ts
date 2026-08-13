import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../../lib/supabase.js', () => ({ createUserClient: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('stripe', () => ({ default: vi.fn().mockReturnValue({}) }))
vi.mock('../../lib/stripe.js', () => ({
  stripe: {
    products: { update: vi.fn() },
    prices: { update: vi.fn() },
  },
  formatPrice: vi.fn(),
}))

import { createUserClient, createAdminClient } from '../../lib/supabase.js'
import { stripe } from '../../lib/stripe.js'
import { q, buildClient } from '../helpers/mock-chain.js'
import adminRoute from '../../routes/admin.js'

const ADMIN_USER = { id: 'admin-1' }
const ADMIN_TOKEN = 'Bearer admin-token'

function makeApp() {
  const app = new Hono()
  app.route('/admin', adminRoute)
  return app
}

/** Sets up createUserClient to simulate an authenticated admin */
function setupAdminAuth(adminTables: Record<string, any> = {}) {
  vi.mocked(createUserClient).mockReturnValue(
    buildClient({ profiles: q({ is_admin: true }), ...adminTables }, ADMIN_USER) as any
  )
}

function get(app: Hono, path: string, token = ADMIN_TOKEN) {
  return app.request(path, { headers: { Authorization: token } })
}

function del(app: Hono, path: string, token = ADMIN_TOKEN) {
  return app.request(path, { method: 'DELETE', headers: { Authorization: token } })
}

function put(app: Hono, path: string, body: any, token = ADMIN_TOKEN) {
  return app.request(path, {
    method: 'PUT',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Admin routes — auth guard', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 on all routes when no token provided', async () => {
    const res = await app.request('/admin/stats')
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    vi.mocked(createUserClient).mockReturnValue(
      buildClient({ profiles: q({ is_admin: false }) }, { id: 'user-1' }) as any
    )
    const res = await get(app, '/admin/stats', 'Bearer user-token')
    expect(res.status).toBe(403)
  })
})

describe('GET /admin/stats', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('returns counts for kits, users, and orders', async () => {
    setupAdminAuth()
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({
        kits: q(null, null, 5),
        profiles: q(null, null, 12),
        orders: q(null, null, 3),
      }) as any
    )

    const res = await get(app, '/admin/stats')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ kits: 5, users: 12, orders: 3 })
  })

  it('returns zero counts when tables are empty', async () => {
    setupAdminAuth()
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({
        kits: q(null, null, 0),
        profiles: q(null, null, 0),
        orders: q(null, null, 0),
      }) as any
    )

    const res = await get(app, '/admin/stats')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ kits: 0, users: 0, orders: 0 })
  })
})

describe('GET /admin/kits', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('returns list of all kits', async () => {
    setupAdminAuth()
    const kits = [{ id: 'k1', title: 'Kit A' }, { id: 'k2', title: 'Kit B' }]
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ kits: q(kits) }) as any
    )

    const res = await get(app, '/admin/kits')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.kits).toHaveLength(2)
    expect(body.kits[0].title).toBe('Kit A')
  })

  it('returns 500 on database error', async () => {
    setupAdminAuth()
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ kits: q(null, { message: 'DB error' }) }) as any
    )

    const res = await get(app, '/admin/kits')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })
})

describe('DELETE /admin/kits/:id', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('deactivates Stripe price and product before deleting when IDs exist', async () => {
    setupAdminAuth()
    const kitWithStripe = {
      stripe_product_id: 'prod_abc',
      stripe_price_id: 'price_abc',
    }
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ kits: q(kitWithStripe) }) as any
    )
    vi.mocked(stripe.prices.update).mockResolvedValue({} as any)
    vi.mocked(stripe.products.update).mockResolvedValue({} as any)

    const res = await del(app, '/admin/kits/kit-1')
    expect(res.status).toBe(200)
    expect(stripe.prices.update).toHaveBeenCalledWith('price_abc', { active: false })
    expect(stripe.products.update).toHaveBeenCalledWith('prod_abc', { active: false })
  })

  it('skips Stripe calls when kit has no Stripe IDs', async () => {
    setupAdminAuth()
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ kits: q(null) }) as any
    )

    const res = await del(app, '/admin/kits/kit-no-stripe')
    expect(res.status).toBe(200)
    expect(stripe.prices.update).not.toHaveBeenCalled()
    expect(stripe.products.update).not.toHaveBeenCalled()
  })

  it('returns 500 on database error during delete', async () => {
    setupAdminAuth()
    const deleteMock = vi.fn().mockReturnValue(q(null, { message: 'FK violation' }))
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null }) }) }),
        delete: vi.fn().mockReturnValue({ eq: deleteMock }),
      }),
    } as any)

    const res = await del(app, '/admin/kits/kit-1')
    expect(res.status).toBe(500)
  })
})

describe('GET /admin/users', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('returns list of all users', async () => {
    setupAdminAuth()
    const users = [
      { id: 'u1', full_name: 'Alice', email: 'alice@test.com', is_admin: false },
      { id: 'u2', full_name: 'Bob', email: 'bob@test.com', is_admin: true },
    ]
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ profiles: q(users) }) as any
    )

    const res = await get(app, '/admin/users')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.users).toHaveLength(2)
    expect(body.users[1].is_admin).toBe(true)
  })
})

describe('GET /admin/users/:id/kits', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('returns array of kit IDs owned by user and current expiration', async () => {
    setupAdminAuth()
    const userKits = [
      { kit_id: 'kit-1', expires_at: '2026-09-13T00:00:00.000Z' },
      { kit_id: 'kit-2', expires_at: '2026-09-13T00:00:00.000Z' },
    ]
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ user_kits: q(userKits) }) as any
    )

    const res = await get(app, '/admin/users/user-1/kits')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.kitIds).toEqual(['kit-1', 'kit-2'])
    expect(body.expiresAt).toBe('2026-09-13T00:00:00.000Z')
  })

  it('returns empty array and null expiration when user owns no kits', async () => {
    setupAdminAuth()
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ user_kits: q([]) }) as any
    )

    const res = await get(app, '/admin/users/user-empty/kits')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.kitIds).toEqual([])
    expect(body.expiresAt).toBeNull()
  })

  it('returns null expiration for permanent access grants', async () => {
    setupAdminAuth()
    const userKits = [{ kit_id: 'kit-1', expires_at: null }]
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ user_kits: q(userKits) }) as any
    )

    const res = await get(app, '/admin/users/user-1/kits')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.expiresAt).toBeNull()
  })
})

describe('PUT /admin/users/:id/kits', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  function mockClient() {
    const insertSpy = vi.fn().mockReturnValue(q(null))
    const deleteSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(q(null)) })
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ delete: deleteSpy, insert: insertSpy }),
    } as any)
    return { insertSpy, deleteSpy }
  }

  it('replaces all user kits with permanent access when duration is "none"', async () => {
    setupAdminAuth()
    const { insertSpy, deleteSpy } = mockClient()

    const res = await put(app, '/admin/users/user-1/kits', {
      kitIds: ['kit-a', 'kit-b'],
      duration: 'none',
    })
    expect(res.status).toBe(200)
    expect(deleteSpy).toHaveBeenCalled()
    expect(insertSpy).toHaveBeenCalledWith([
      { user_id: 'user-1', kit_id: 'kit-a', expires_at: null },
      { user_id: 'user-1', kit_id: 'kit-b', expires_at: null },
    ])
  })

  it('sets expires_at ~1 month ahead for duration "1m"', async () => {
    setupAdminAuth()
    const { insertSpy } = mockClient()

    const res = await put(app, '/admin/users/user-1/kits', {
      kitIds: ['kit-a'],
      duration: '1m',
    })
    expect(res.status).toBe(200)
    const inserted = insertSpy.mock.calls[0][0][0]
    const expiresAt = new Date(inserted.expires_at)
    const daysAhead = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    expect(daysAhead).toBeGreaterThan(27)
    expect(daysAhead).toBeLessThan(32)
  })

  it('uses customDate verbatim for duration "custom"', async () => {
    setupAdminAuth()
    const { insertSpy } = mockClient()

    const res = await put(app, '/admin/users/user-1/kits', {
      kitIds: ['kit-a'],
      duration: 'custom',
      customDate: '2026-12-25',
    })
    expect(res.status).toBe(200)
    const inserted = insertSpy.mock.calls[0][0][0]
    expect(new Date(inserted.expires_at).toISOString().slice(0, 10)).toBe('2026-12-25')
  })

  it('returns 400 when duration is "custom" without customDate', async () => {
    setupAdminAuth()
    mockClient()

    const res = await put(app, '/admin/users/user-1/kits', {
      kitIds: ['kit-a'],
      duration: 'custom',
    })
    expect(res.status).toBe(400)
  })

  it('deletes all kits when kitIds is empty array', async () => {
    setupAdminAuth()
    const { insertSpy, deleteSpy } = mockClient()

    const res = await put(app, '/admin/users/user-1/kits', { kitIds: [], duration: 'none' })
    expect(res.status).toBe(200)
    expect(deleteSpy).toHaveBeenCalled()
    expect(insertSpy).not.toHaveBeenCalled()
  })
})

describe('GET /admin/orders', () => {
  const app = makeApp()
  beforeEach(() => vi.clearAllMocks())

  it('returns orders with joined profile and kit data', async () => {
    setupAdminAuth()
    const orders = [
      {
        id: 'o1',
        amount: 1999,
        status: 'completed',
        profiles: { full_name: 'Alice', email: 'alice@test.com' },
        kits: { title: 'Kit Festa' },
      },
    ]
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ orders: q(orders) }) as any
    )

    const res = await get(app, '/admin/orders')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.orders).toHaveLength(1)
    expect(body.orders[0].profiles.full_name).toBe('Alice')
    expect(body.orders[0].kits.title).toBe('Kit Festa')
  })

  it('returns empty array when no orders exist', async () => {
    setupAdminAuth()
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ orders: q([]) }) as any
    )

    const res = await get(app, '/admin/orders')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.orders).toEqual([])
  })

  it('returns 500 on database error', async () => {
    setupAdminAuth()
    vi.mocked(createAdminClient).mockReturnValue(
      buildClient({ orders: q(null, { message: 'relation does not exist' }) }) as any
    )

    const res = await get(app, '/admin/orders')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('relation does not exist')
  })
})
