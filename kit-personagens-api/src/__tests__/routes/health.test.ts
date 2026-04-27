import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'

vi.mock('../../lib/supabase.js', () => ({ createUserClient: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('stripe', () => ({ default: vi.fn().mockReturnValue({}) }))

describe('GET /health', () => {
  it('returns 200 with {ok: true}', async () => {
    const app = new Hono()
    app.get('/health', (c) => c.json({ ok: true }))

    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })
})
