import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import checkoutRoute from './routes/checkout.js'
import webhooksRoute from './routes/webhooks.js'
import kitsRoute from './routes/kits.js'
import adminRoute from './routes/admin.js'

const app = new Hono()

app.use(logger())
const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:3000',
  process.env.ADMIN_URL ?? 'http://localhost:3002',
]

app.use(
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

app.get('/health', (c) => c.json({ ok: true }))

app.route('/checkout', checkoutRoute)
app.route('/webhooks', webhooksRoute)
app.route('/admin/kits', kitsRoute)
app.route('/admin', adminRoute)

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API rodando em http://localhost:${port}`)
})
