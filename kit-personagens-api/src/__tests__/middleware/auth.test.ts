import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../../lib/supabase.js', () => ({
  createUserClient: vi.fn(),
  createAdminClient: vi.fn(),
}))
vi.mock('stripe', () => ({ default: vi.fn().mockReturnValue({}) }))

import { createUserClient } from '../../lib/supabase.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { q, buildClient } from '../helpers/mock-chain.js'

const USER = { id: 'user-123' }
const ADMIN_USER = { id: 'admin-456' }

function makeApp(middleware: any) {
  const app = new Hono()
  app.use(middleware)
  app.get('/test', (c) => c.json({ userId: c.get('userId') }))
  app.post('/test', (c) => c.json({ userId: c.get('userId') }))
  return app
}

describe('requireAuth middleware', () => {
  const app = makeApp(requireAuth)

  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when Authorization header is missing', async () => {
    const res = await app.request('/test')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Não autorizado')
  })

  it('returns 401 when token is invalid', async () => {
    vi.mocked(createUserClient).mockReturnValue(
      buildClient({}, null) as any
    )
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer bad-token' },
    })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Token inválido')
  })

  it('passes and sets userId when token is valid', async () => {
    vi.mocked(createUserClient).mockReturnValue(
      buildClient({}, USER) as any
    )
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBe(USER.id)
  })
})

describe('requireAdmin middleware', () => {
  const app = makeApp(requireAdmin)

  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when Authorization header is missing', async () => {
    const res = await app.request('/test')
    expect(res.status).toBe(401)
  })

  it('returns 401 when token is invalid', async () => {
    vi.mocked(createUserClient).mockReturnValue(
      buildClient({}, null) as any
    )
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer bad-token' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    vi.mocked(createUserClient).mockReturnValue(
      buildClient({ profiles: q({ is_admin: false }) }, ADMIN_USER) as any
    )
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer user-token' },
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Acesso negado')
  })

  it('returns 403 when profiles row is missing', async () => {
    vi.mocked(createUserClient).mockReturnValue(
      buildClient({ profiles: q(null) }, ADMIN_USER) as any
    )
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer user-token' },
    })
    expect(res.status).toBe(403)
  })

  it('passes and sets userId when user is admin', async () => {
    vi.mocked(createUserClient).mockReturnValue(
      buildClient({ profiles: q({ is_admin: true }) }, ADMIN_USER) as any
    )
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer admin-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBe(ADMIN_USER.id)
  })
})
