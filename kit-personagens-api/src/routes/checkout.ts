import { Hono } from 'hono'
import { stripe } from '../lib/stripe.js'
import { createUserClient, createAdminClient } from '../lib/supabase.js'
import { requireAuth, type AuthVars } from '../middleware/auth.js'

const app = new Hono<{ Variables: AuthVars }>()

app.post('/', requireAuth, async (c) => {
  try {
    const { kitId } = await c.req.json()
    if (!kitId) return c.json({ error: 'kitId é obrigatório' }, 400)

    const supabase = createUserClient(c.get('token'))
    const userId = c.get('userId')

    const { data: kit } = await supabase
      .from('kits')
      .select('id, title, price, stripe_price_id, cover_image_url, is_active')
      .eq('id', kitId)
      .single()

    if (!kit) return c.json({ error: 'Kit não encontrado' }, 404)
    if (!kit.is_active) return c.json({ error: 'Kit indisponível' }, 400)
    if (!kit.price || !kit.stripe_price_id) return c.json({ error: 'Kit sem preço configurado' }, 400)

    const { data: existing } = await supabase
      .from('user_kits')
      .select('id')
      .eq('user_id', userId)
      .eq('kit_id', kitId)
      .single()

    if (existing) return c.json({ error: 'Você já possui este kit' }, 400)

    const { data: { user } } = await supabase.auth.getUser()
    const origin = process.env.FRONTEND_URL

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: kit.stripe_price_id, quantity: 1 }],
      metadata: { user_id: userId, kit_id: kit.id },
      customer_email: user?.email,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/catalog`,
    })

    return c.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno no servidor'
    return c.json({ error: message }, 500)
  }
})

// Chamado pela página de sucesso como fallback ao webhook
app.post('/verify', requireAuth, async (c) => {
  try {
    const { sessionId } = await c.req.json()
    if (!sessionId) return c.json({ error: 'sessionId é obrigatório' }, 400)

    const userId = c.get('userId')
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return c.json({ error: 'Pagamento não confirmado' }, 400)
    }

    const kitId = session.metadata?.kit_id
    const sessionUserId = session.metadata?.user_id

    if (!kitId || sessionUserId !== userId) {
      return c.json({ error: 'Sessão inválida' }, 400)
    }

    const admin = createAdminClient()

    await admin.from('orders').upsert(
      {
        user_id: userId,
        kit_id: kitId,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total ?? 0,
        status: 'completed',
      },
      { onConflict: 'stripe_session_id' }
    )

    await admin
      .from('user_kits')
      .upsert({ user_id: userId, kit_id: kitId }, { onConflict: 'user_id,kit_id' })

    return c.json({ kitId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno no servidor'
    return c.json({ error: message }, 500)
  }
})

export default app
