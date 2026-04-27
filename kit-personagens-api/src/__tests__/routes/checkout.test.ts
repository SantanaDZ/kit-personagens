import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../../lib/supabase.js', () => ({ createUserClient: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('stripe', () => ({ default: vi.fn().mockReturnValue({}) }))
vi.mock('../../lib/stripe.js', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } },
  },
  formatPrice: vi.fn(),
}))

import { createUserClient, createAdminClient } from '../../lib/supabase.js'
import { stripe } from '../../lib/stripe.js'
import { q, buildClient } from '../helpers/mock-chain.js'
import checkoutRoute from '../../routes/checkout.js'

const USER = { id: 'user-abc', email: 'user@test.com' }
const KIT_ACTIVE = {
  id: 'kit-1',
  title: 'Kit Teste',
  price: 1999,
  stripe_price_id: 'price_abc',
  cover_image_url: null,
  is_active: true,
}

function makeApp() {
  const app = new Hono()
  app.route('/checkout', checkoutRoute)
  return app
}

function setupAuth(tables: Record<string, any> = {}) {
  vi.mocked(createUserClient).mockReturnValue(
    buildClient(
      {
        kits: q(KIT_ACTIVE),
        user_kits: q(null),
        ...tables,
      },
      USER
    ) as any
  )
}

function setupAdmin(tables: Record<string, any> = {}) {
  vi.mocked(createAdminClient).mockReturnValue(
    buildClient(tables) as any
  )
}

function post(app: Hono, path: string, body: any, token = 'Bearer valid-token') {
  return app.request(path, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /checkout', () => {
  const app = makeApp()

  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when no token is provided', async () => {
    const res = await app.request('/checkout', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when kitId is missing', async () => {
    setupAuth()
    const res = await post(app, '/checkout', {})
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('kitId é obrigatório')
  })

  it('returns 404 when kit does not exist', async () => {
    setupAuth({ kits: q(null) })
    const res = await post(app, '/checkout', { kitId: 'nonexistent' })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Kit não encontrado')
  })

  it('returns 400 when kit is inactive', async () => {
    setupAuth({ kits: q({ ...KIT_ACTIVE, is_active: false }) })
    const res = await post(app, '/checkout', { kitId: KIT_ACTIVE.id })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Kit indisponível')
  })

  it('returns 400 when kit has no price configured', async () => {
    setupAuth({ kits: q({ ...KIT_ACTIVE, price: null, stripe_price_id: null }) })
    const res = await post(app, '/checkout', { kitId: KIT_ACTIVE.id })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Kit sem preço configurado')
  })

  it('returns 400 when user already owns the kit', async () => {
    setupAuth({ kits: q(KIT_ACTIVE), user_kits: q({ id: 'uk-1' }) })
    const res = await post(app, '/checkout', { kitId: KIT_ACTIVE.id })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Você já possui este kit')
  })

  it('returns 200 with Stripe checkout URL on success', async () => {
    setupAuth()
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: 'https://checkout.stripe.com/test-session',
    } as any)

    const res = await post(app, '/checkout', { kitId: KIT_ACTIVE.id })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/test-session')
  })

  it('passes kitId and userId as metadata to Stripe session', async () => {
    setupAuth()
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://stripe.com/x' } as any)

    await post(app, '/checkout', { kitId: KIT_ACTIVE.id })

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { user_id: USER.id, kit_id: KIT_ACTIVE.id },
      })
    )
  })

  it('returns 500 when Stripe throws', async () => {
    setupAuth()
    vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(new Error('Stripe error'))

    const res = await post(app, '/checkout', { kitId: KIT_ACTIVE.id })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Stripe error')
  })
})

describe('POST /checkout/verify', () => {
  const app = makeApp()

  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when no token is provided', async () => {
    const res = await app.request('/checkout/verify', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when sessionId is missing', async () => {
    setupAuth()
    const res = await post(app, '/checkout/verify', {})
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('sessionId é obrigatório')
  })

  it('returns 400 when payment is not completed', async () => {
    setupAuth()
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      payment_status: 'unpaid',
      metadata: { user_id: USER.id, kit_id: KIT_ACTIVE.id },
    } as any)

    const res = await post(app, '/checkout/verify', { sessionId: 'cs_test_123' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Pagamento não confirmado')
  })

  it('returns 400 when session user does not match authenticated user', async () => {
    setupAuth()
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      payment_status: 'paid',
      metadata: { user_id: 'different-user', kit_id: KIT_ACTIVE.id },
      id: 'cs_test_123',
      payment_intent: 'pi_test',
      amount_total: 1999,
    } as any)

    const res = await post(app, '/checkout/verify', { sessionId: 'cs_test_123' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Sessão inválida')
  })

  it('returns 200 with kitId on successful verification', async () => {
    setupAuth()
    setupAdmin({ orders: q(null), user_kits: q(null) })

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      payment_status: 'paid',
      metadata: { user_id: USER.id, kit_id: KIT_ACTIVE.id },
      id: 'cs_test_ok',
      payment_intent: 'pi_test_ok',
      amount_total: 1999,
    } as any)

    const res = await post(app, '/checkout/verify', { sessionId: 'cs_test_ok' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.kitId).toBe(KIT_ACTIVE.id)
  })

  it('upserts orders with correct data on success', async () => {
    setupAuth()
    const adminUpsertMock = vi.fn().mockReturnValue(q(null))
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ upsert: adminUpsertMock }),
    } as any)

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      payment_status: 'paid',
      metadata: { user_id: USER.id, kit_id: KIT_ACTIVE.id },
      id: 'cs_test_ok',
      payment_intent: 'pi_abc',
      amount_total: 1999,
    } as any)

    await post(app, '/checkout/verify', { sessionId: 'cs_test_ok' })

    expect(adminUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER.id,
        kit_id: KIT_ACTIVE.id,
        stripe_session_id: 'cs_test_ok',
        status: 'completed',
        amount: 1999,
      }),
      expect.anything()
    )
  })
})
