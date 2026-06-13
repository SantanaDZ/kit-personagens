-- ============================================================
-- FIX: Lint "Security Definer View" — public.active_subscriptions
--
-- A view criada com CREATE VIEW roda com os privilégios do dono
-- (comportamento equivalente a SECURITY DEFINER), ignorando as
-- políticas de RLS de subscriptions/plans/kit_credits para quem
-- consulta a view diretamente via PostgREST.
--
-- 1) security_invoker = on: a view passa a rodar com os
--    privilégios de quem a consulta, respeitando as políticas de
--    RLS já existentes (subscriptions_select_own, etc.).
-- 2) REVOKE: a view é um helper interno usado apenas pela API
--    (service role), então também removemos o acesso direto via
--    PostgREST para anon/authenticated.
-- ============================================================

ALTER VIEW public.active_subscriptions SET (security_invoker = on);

REVOKE ALL ON public.active_subscriptions FROM anon, authenticated;
