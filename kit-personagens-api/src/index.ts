import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import checkoutRoute from './routes/checkout.js'
import webhooksRoute from './routes/webhooks.js'
import kitsRoute from './routes/kits.js'
import adminRoute from './routes/admin.js'
import plansRoute from './routes/plans.js'
import subscriptionsRoute from './routes/subscriptions.js'

const app = new Hono()

app.use(logger())
const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:3000',
  process.env.ADMIN_URL ?? 'http://localhost:3002',
].map((url) => url.replace(/\/$/, ''))

// Cobre as URLs únicas geradas pela Vercel para cada deploy/preview
// (ex.: kit-personagens-h9a0al0nl-santanadzs-projects.vercel.app)
const vercelPreviewPattern = /^https:\/\/kit-personagens(-admin)?[a-z0-9-]*\.vercel\.app$/

app.use(
  cors({
    origin: (origin) =>
      allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin) ? origin : null,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message }, 500)
})

app.get('/health', (c) => c.json({ ok: true }))

app.route('/plans', plansRoute)
app.route('/subscriptions', subscriptionsRoute)
app.route('/checkout', checkoutRoute)
app.route('/webhooks', webhooksRoute)
app.route('/admin/kits', kitsRoute)
app.route('/admin', adminRoute)

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API rodando em http://localhost:${port}`)
})
