import { Hono } from 'hono'
import { createAdminClient, createUserClient } from '../lib/supabase.js'
import { requireAuth, type AuthVars } from '../middleware/auth.js'

const app = new Hono<{ Variables: AuthVars }>()

// Retorna a assinatura ativa do usuário com créditos usados/restantes
app.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('active_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? null)
})

// Retorna os kits desbloqueados no ciclo atual
app.get('/me/kits', requireAuth, async (c) => {
  const userId = c.get('userId')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('kit_credits')
    .select(`
      id,
      unlocked_at,
      expires_at,
      kit:kits (
        id, title, description, cover_image_url,
        character_name, character_image_url, is_active
      )
    `)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('unlocked_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// Desbloqueia um kit usando 1 crédito do ciclo atual
app.post('/unlock-kit', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { kitId } = await c.req.json()

  if (!kitId) return c.json({ error: 'kitId é obrigatório' }, 400)

  const supabase = createAdminClient()

  // 1. Busca assinatura ativa
  const { data: subscription, error: subError } = await supabase
    .from('active_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (subError) return c.json({ error: subError.message }, 500)
  if (!subscription) return c.json({ error: 'Nenhuma assinatura ativa' }, 403)

  // 2. Verifica se o kit existe e está ativo
  const { data: kit } = await supabase
    .from('kits')
    .select('id, title, is_active')
    .eq('id', kitId)
    .single()

  if (!kit) return c.json({ error: 'Kit não encontrado' }, 404)
  if (!kit.is_active) return c.json({ error: 'Kit indisponível' }, 400)

  // 3. Verifica se o kit já está desbloqueado neste ciclo
  const { data: existing } = await supabase
    .from('kit_credits')
    .select('id')
    .eq('user_id', userId)
    .eq('kit_id', kitId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existing) return c.json({ error: 'Kit já desbloqueado neste ciclo' }, 400)

  // 4. Verifica créditos disponíveis (null = premium ilimitado)
  if (
    subscription.credits_remaining !== null &&
    subscription.credits_remaining <= 0
  ) {
    return c.json({ error: 'Sem créditos disponíveis. Faça upgrade do plano.' }, 403)
  }

  // 5. Desbloqueia o kit
  const { data: credit, error: insertError } = await supabase
    .from('kit_credits')
    .insert({
      user_id: userId,
      kit_id: kitId,
      subscription_id: subscription.id,
      expires_at: subscription.current_period_end,
    })
    .select()
    .single()

  if (insertError) return c.json({ error: insertError.message }, 500)
  return c.json({ credit }, 201)
})

// Verifica se o usuário tem acesso a um kit específico
app.get('/access/:kitId', requireAuth, async (c) => {
  const userId = c.get('userId')
  const kitId = c.req.param('kitId')
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('kit_credits')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('kit_id', kitId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return c.json({ hasAccess: !!data, expiresAt: data?.expires_at ?? null })
})

// Cancela a assinatura ativa
app.delete('/me', requireAuth, async (c) => {
  const userId = c.get('userId')
  const supabase = createAdminClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!subscription) return c.json({ error: 'Nenhuma assinatura ativa' }, 404)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

export default app
