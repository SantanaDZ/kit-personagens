import { Hono } from 'hono'
import { stripe } from '../lib/stripe.js'
import { createUserClient, createAdminClient } from '../lib/supabase.js'
import { requireAdmin, type AuthVars } from '../middleware/auth.js'

const app = new Hono<{ Variables: AuthVars }>()

app.use(requireAdmin)

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get('/stats', async (c) => {
  const supabase = createAdminClient()
  const [kits, users, orders] = await Promise.all([
    supabase.from('kits').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])
  return c.json({
    kits: kits.count ?? 0,
    users: users.count ?? 0,
    orders: orders.count ?? 0,
  })
})

// ── Kits ──────────────────────────────────────────────────────────────────────
app.get('/kits', async (c) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('kits')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ kits: data })
})

app.delete('/kits/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = createAdminClient()

  const { data: kit } = await supabase
    .from('kits')
    .select('stripe_product_id, stripe_price_id')
    .eq('id', id)
    .single()

  if (kit?.stripe_product_id) {
    if (kit.stripe_price_id) {
      await stripe.prices.update(kit.stripe_price_id, { active: false }).catch(() => null)
    }
    await stripe.products.update(kit.stripe_product_id, { active: false }).catch(() => null)
  }

  const { error } = await supabase.from('kits').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

// ── Users ─────────────────────────────────────────────────────────────────────
app.get('/users', async (c) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ users: data })
})

type AccessDuration = '1m' | '3m' | '6m' | '1y' | 'custom' | 'none'

function resolveExpiresAt(duration: AccessDuration, customDate?: string): string | null {
  if (duration === 'none') return null
  if (duration === 'custom') {
    if (!customDate) throw new Error('customDate é obrigatório para duration "custom"')
    return new Date(customDate).toISOString()
  }

  const months = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }[duration]
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

app.get('/users/:id/kits', async (c) => {
  const userId = c.req.param('id')
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('user_kits')
    .select('kit_id, expires_at')
    .eq('user_id', userId)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({
    kitIds: data.map((r) => r.kit_id),
    expiresAt: data[0]?.expires_at ?? null,
  })
})

app.put('/users/:id/kits', async (c) => {
  const userId = c.req.param('id')
  const { kitIds, duration, customDate } = await c.req.json<{
    kitIds: string[]
    duration: AccessDuration
    customDate?: string
  }>()
  const supabase = createAdminClient()

  await supabase.from('user_kits').delete().eq('user_id', userId)

  if (kitIds.length > 0) {
    let expiresAt: string | null
    try {
      expiresAt = resolveExpiresAt(duration, customDate)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'duration inválida' }, 400)
    }

    const rows = kitIds.map((kit_id) => ({ user_id: userId, kit_id, expires_at: expiresAt }))
    const { error } = await supabase.from('user_kits').insert(rows)
    if (error) return c.json({ error: error.message }, 500)
  }

  return c.json({ ok: true })
})

// ── Orders ────────────────────────────────────────────────────────────────────
app.get('/orders', async (c) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles(full_name, email), kits(title)')
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ orders: data })
})

export default app
