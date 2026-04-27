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

app.get('/users/:id/kits', async (c) => {
  const userId = c.req.param('id')
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('user_kits')
    .select('kit_id')
    .eq('user_id', userId)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ kitIds: data.map((r) => r.kit_id) })
})

app.put('/users/:id/kits', async (c) => {
  const userId = c.req.param('id')
  const { kitIds } = await c.req.json<{ kitIds: string[] }>()
  const supabase = createAdminClient()

  await supabase.from('user_kits').delete().eq('user_id', userId)

  if (kitIds.length > 0) {
    const rows = kitIds.map((kit_id) => ({ user_id: userId, kit_id }))
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
