-- ============================================================
-- Script 007: Acesso Premium automático para administradores
--
-- Garante que todo perfil com is_admin = TRUE tenha uma
-- assinatura "Premium" ativa (kit_limit = NULL = ilimitado),
-- sem depender de uma cobrança real no Stripe/Mercado Pago.
-- Isso faz com que /catalog, /dashboard e o endpoint
-- /subscriptions/* (via active_subscriptions) tratem o admin
-- como assinante Premium normalmente.
-- ============================================================

-- 1. Concede assinatura Premium para admins existentes que ainda
--    não possuem uma assinatura ativa
INSERT INTO public.subscriptions (
  user_id, plan_id, status, current_period_start, current_period_end, payment_provider
)
SELECT
  pr.id,
  (SELECT id FROM public.plans WHERE name = 'premium'),
  'active',
  NOW(),
  '2099-12-31 23:59:59+00',
  'admin'
FROM public.profiles pr
WHERE pr.is_admin = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = pr.id
      AND s.status = 'active'
      AND s.current_period_end > NOW()
  );

-- 2. Trigger: sempre que um perfil for marcado como admin (na
--    criação ou em uma atualização), garante uma assinatura
--    Premium ativa automaticamente. SECURITY DEFINER + search_path
--    fixo para que o INSERT em subscriptions funcione independente
--    do papel que disparou o UPDATE em profiles.
CREATE OR REPLACE FUNCTION public.grant_premium_to_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS TRUE AND (TG_OP = 'INSERT' OR OLD.is_admin IS NOT TRUE) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = NEW.id
        AND status = 'active'
        AND current_period_end > NOW()
    ) THEN
      INSERT INTO public.subscriptions (
        user_id, plan_id, status, current_period_start, current_period_end, payment_provider
      ) VALUES (
        NEW.id,
        (SELECT id FROM public.plans WHERE name = 'premium'),
        'active',
        NOW(),
        '2099-12-31 23:59:59+00',
        'admin'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_premium_to_admin ON public.profiles;

CREATE TRIGGER trg_grant_premium_to_admin
AFTER INSERT OR UPDATE OF is_admin ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.grant_premium_to_admin();
