-- ============================================================
-- Script 005: Modelo de assinatura com créditos
-- Substitui compra avulsa por planos mensais com kits ativos
-- ============================================================

-- 1. PLANOS DE ASSINATURA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT    NOT NULL UNIQUE,     -- 'basico' | 'pro' | 'premium'
  display_name TEXT    NOT NULL,
  price        INTEGER NOT NULL,            -- em centavos (4900 = R$49,00)
  kit_limit    INTEGER,                     -- NULL = ilimitado (premium)
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.plans (name, display_name, price, kit_limit) VALUES
  ('basico',  'Básico',  4900,  3),
  ('pro',     'Pro',     8900,  8),
  ('premium', 'Premium', 19900, NULL)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_active" ON public.plans
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "plans_admin_all" ON public.plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );


-- 2. ASSINATURAS
-- Uma linha por ciclo de cobrança. Ao renovar, a linha atual
-- vira 'expired' e uma nova é criada para o próximo ciclo.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                 UUID NOT NULL REFERENCES public.plans(id),
  status                  TEXT NOT NULL DEFAULT 'active',
    -- active | cancelled | past_due | expired
  current_period_start    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end      TIMESTAMPTZ NOT NULL,
  payment_provider        TEXT NOT NULL DEFAULT 'stripe',
    -- 'stripe' | 'mercadopago'  (troca na Fase 4)
  provider_subscription_id TEXT UNIQUE,   -- ID externo do provedor de pagamento
  provider_customer_id     TEXT,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );


-- 3. CRÉDITOS: KITS DESBLOQUEADOS NO CICLO
-- 1 crédito = 1 kit ativo por ciclo de cobrança.
-- Acesso é ilimitado enquanto o crédito não expirar.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kit_credits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_id          UUID NOT NULL REFERENCES public.kits(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,  -- = current_period_end da subscription
  UNIQUE(user_id, kit_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_kit_credits_user_id
  ON public.kit_credits(user_id);

CREATE INDEX IF NOT EXISTS idx_kit_credits_expires_at
  ON public.kit_credits(expires_at);

ALTER TABLE public.kit_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kit_credits_select_own" ON public.kit_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "kit_credits_admin_all" ON public.kit_credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );


-- 4. VIEW: ASSINATURA ATIVA COM CRÉDITOS
-- Retorna a assinatura ativa do usuário com contagem de
-- kits desbloqueados e créditos restantes no ciclo atual.
-- ============================================================
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT
  s.id,
  s.user_id,
  s.plan_id,
  p.name             AS plan_name,
  p.display_name     AS plan_display_name,
  p.price            AS plan_price,
  p.kit_limit,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.payment_provider,
  s.provider_subscription_id,
  -- Kits desbloqueados no ciclo atual
  (
    SELECT COUNT(*) FROM public.kit_credits kc
    WHERE kc.subscription_id = s.id
    AND   kc.expires_at > NOW()
  )::INTEGER AS credits_used,
  -- Créditos disponíveis (NULL = ilimitado para o Premium)
  CASE
    WHEN p.kit_limit IS NULL THEN NULL
    ELSE p.kit_limit - (
      SELECT COUNT(*) FROM public.kit_credits kc
      WHERE kc.subscription_id = s.id
      AND   kc.expires_at > NOW()
    )
  END AS credits_remaining
FROM public.subscriptions s
JOIN public.plans p ON s.plan_id = p.id
WHERE s.status = 'active'
  AND s.current_period_end > NOW();
