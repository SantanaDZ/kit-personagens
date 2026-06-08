import { Hono } from 'hono'
import { createAdminClient } from '../lib/supabase.js'

const app = new Hono()

app.get('/', async (c) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, display_name, price, kit_limit')
    .eq('is_active', true)
    .order('price')

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default app
