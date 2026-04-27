// Env vars must be set before any module import resolves
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_for_testing'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
process.env.FRONTEND_URL = 'http://localhost:3000'
process.env.ADMIN_URL = 'http://localhost:3002'
