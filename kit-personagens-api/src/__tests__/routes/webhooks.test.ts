import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../../lib/supabase.js', () => ({ createUserClient: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('stripe', () => ({ default: vi.fn().mockReturnValue({}) }))
vi.mock('../../lib/stripe.js', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
  },
  formatPrice: vi.fn(),
}))

import { createAdminClient } from '../../lib/supabase.js'
import { stripe } from '../../lib/stripe.js'
import { q, buildClient } from '../helpers/mock-chain.js'
import webhooksRoute from '../../routes/webhooks.js'

const SESSION = {
  id: 'cs_live_abc',
  payment_intent: 'pi_live_abc',
  amount_total: 2990,
  metadata: { user_id: 'user-1', kit_id: 'kit-1' },
}

function makeApp() {
  const app = new Hono()
  app.route('/webhooks', webhooksRoute)
  return app
}

function postStripe(app: Hono, body: string, signature = 'valid-sig') {
  return app.request('/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': signature, 'Content-Type': 'text/plain' },
    body,
  })
}

describe('POST /webhooks/stripe', () => {
  const app = makeApp()

  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Assinatura ausente')
  })

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const res = await postStripe(app, '{"type":"checkout.session.completed"}', 'bad-sig')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Assinatura inválida')
  })

  it('returns 200 and ignores unhandled event types', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    } as any)

    const res = await postStripe(app, '{}')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })

  it('returns 400 when checkout.session.completed has missing metadata', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { ...SESSION, metadata: {} } },
    } as any)

    const res = await postStripe(app, '{}')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Metadata ausente')
  })

  it('upserts orders and user_kits on checkout.session.completed', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: SESSION },
    } as any)

    const upsertSpy = vi.fn().mockReturnValue(q(null))
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ upsert: upsertSpy }),
    } as any)

    const res = await postStripe(app, '{}')
    expect(res.status).toBe(200)

    // Should have been called twice: once for orders, once for user_kits
    expect(upsertSpy).toHaveBeenCalledTimes(2)

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: SESSION.metadata.user_id,
        kit_id: SESSION.metadata.kit_id,
        stripe_session_id: SESSION.id,
        amount: SESSION.amount_total,
        status: 'completed',
      }),
      expect.anything()
    )
  })

  it('returns 200 with received:true on success', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: SESSION },
    } as any)

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ upsert: vi.fn().mockReturnValue(q(null)) }),
    } as any)

    const res = await postStripe(app, '{}')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })
})
