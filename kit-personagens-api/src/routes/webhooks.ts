import { Hono } from 'hono'
import { stripe } from '../lib/stripe.js'
import { createAdminClient } from '../lib/supabase.js'
import type Stripe from 'stripe'

const app = new Hono()

app.post('/stripe', async (c) => {
  const body = await c.req.text()
  const signature = c.req.header('stripe-signature')

  if (!signature) return c.json({ error: 'Assinatura ausente' }, 400)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return c.json({ error: 'Assinatura inválida' }, 400)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const kitId = session.metadata?.kit_id

    if (!userId || !kitId) return c.json({ error: 'Metadata ausente' }, 400)

    const supabase = createAdminClient()

    await supabase.from('orders').upsert(
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

    await supabase
      .from('user_kits')
      .upsert({ user_id: userId, kit_id: kitId }, { onConflict: 'user_id,kit_id' })
  }

  return c.json({ received: true })
})

export default app
