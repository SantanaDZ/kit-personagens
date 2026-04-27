import { createMiddleware } from 'hono/factory'
import { createUserClient } from '../lib/supabase.js'

export type AuthVars = {
  userId: string
  token: string
}

export const requireAuth = createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Não autorizado' }, 401)
  }

  const supabase = createUserClient(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return c.json({ error: 'Token inválido' }, 401)
  }

  c.set('userId', user.id)
  c.set('token', token)
  await next()
})

export const requireAdmin = createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Não autorizado' }, 401)
  }

  const supabase = createUserClient(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return c.json({ error: 'Token inválido' }, 401)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return c.json({ error: 'Acesso negado' }, 403)
  }

  c.set('userId', user.id)
  c.set('token', token)
  await next()
})
