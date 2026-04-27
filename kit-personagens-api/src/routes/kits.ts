import { Hono } from 'hono'
import { stripe } from '../lib/stripe.js'
import { createUserClient } from '../lib/supabase.js'
import { requireAdmin, type AuthVars } from '../middleware/auth.js'

const app = new Hono<{ Variables: AuthVars }>()

app.post('/', requireAdmin, async (c) => {
  const body = await c.req.json()
  const {
    title, description, is_active, price,
    music_url, music_title, story_text, video_url,
    character_name, character_description, character_image_url,
    guide_text, cover_image_url,
  } = body

  let stripe_product_id: string | null = null
  let stripe_price_id: string | null = null

  if (price && price > 0) {
    const product = await stripe.products.create({
      name: title,
      ...(description ? { description } : {}),
      ...(cover_image_url ? { images: [cover_image_url] } : {}),
    })
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: price,
      currency: 'brl',
    })
    stripe_product_id = product.id
    stripe_price_id = stripePrice.id
  }

  const supabase = createUserClient(c.get('token'))
  const { data: kit, error } = await supabase
    .from('kits')
    .insert({
      title,
      description: description || null,
      is_active: is_active ?? true,
      price: price || null,
      stripe_product_id,
      stripe_price_id,
      music_url: music_url || null,
      music_title: music_title || null,
      story_text: story_text || null,
      video_url: video_url || null,
      character_name: character_name || null,
      character_description: character_description || null,
      character_image_url: character_image_url || null,
      guide_text: guide_text || null,
      cover_image_url: cover_image_url || null,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ kit }, 201)
})

app.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    title, description, is_active, price,
    music_url, music_title, story_text, video_url,
    character_name, character_description, character_image_url,
    guide_text, cover_image_url,
  } = body

  const supabase = createUserClient(c.get('token'))

  const { data: existing } = await supabase
    .from('kits')
    .select('stripe_product_id, stripe_price_id, price')
    .eq('id', id)
    .single()

  let stripe_product_id = existing?.stripe_product_id ?? null
  let stripe_price_id = existing?.stripe_price_id ?? null

  if (price && price > 0) {
    if (!stripe_product_id) {
      const product = await stripe.products.create({
        name: title,
        ...(description ? { description } : {}),
        ...(cover_image_url ? { images: [cover_image_url] } : {}),
      })
      stripe_product_id = product.id
    } else {
      await stripe.products.update(stripe_product_id, {
        name: title,
        ...(description ? { description } : {}),
      })
    }

    if (price !== existing?.price || !stripe_price_id) {
      if (stripe_price_id) {
        await stripe.prices.update(stripe_price_id, { active: false })
      }
      const stripePrice = await stripe.prices.create({
        product: stripe_product_id,
        unit_amount: price,
        currency: 'brl',
      })
      stripe_price_id = stripePrice.id
    }
  }

  const { data: kit, error } = await supabase
    .from('kits')
    .update({
      title,
      description: description || null,
      is_active: is_active ?? true,
      price: price || null,
      stripe_product_id,
      stripe_price_id,
      music_url: music_url || null,
      music_title: music_title || null,
      story_text: story_text || null,
      video_url: video_url || null,
      character_name: character_name || null,
      character_description: character_description || null,
      character_image_url: character_image_url || null,
      guide_text: guide_text || null,
      cover_image_url: cover_image_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ kit })
})

export default app
