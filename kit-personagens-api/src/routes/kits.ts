import { Hono } from 'hono'
import { createUserClient } from '../lib/supabase.js'
import { requireAdmin, type AuthVars } from '../middleware/auth.js'

const app = new Hono<{ Variables: AuthVars }>()

// Nota: kits não são mais sincronizados com o Stripe ao salvar — a venda
// avulsa por kit foi substituída pelo modelo de assinatura (planos), e o
// Stripe deve ser trocado pelo Mercado Pago antes de ir para produção.
// stripe_product_id/stripe_price_id só existem por compatibilidade com
// dados legados e não são mais escritos por estas rotas.

app.post('/', requireAdmin, async (c) => {
  const body = await c.req.json()
  const {
    title, description, is_active, price,
    music_url, music_title, story_text, video_url,
    character_name, character_description, character_image_url,
    guide_text, cover_image_url,
  } = body

  const supabase = createUserClient(c.get('token'))
  const { data: kit, error } = await supabase
    .from('kits')
    .insert({
      title,
      description: description || null,
      is_active: is_active ?? true,
      price: price || null,
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

  const { data: kit, error } = await supabase
    .from('kits')
    .update({
      title,
      description: description || null,
      is_active: is_active ?? true,
      price: price || null,
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
