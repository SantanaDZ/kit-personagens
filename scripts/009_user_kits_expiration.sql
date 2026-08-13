-- ============================================================
-- Script 009: Expiração de acesso em user_kits
-- Permite conceder acesso manual (painel admin) com prazo
-- definido, sem exigir assinatura. NULL = acesso permanente
-- (mantém compatibilidade com linhas já existentes).
-- ============================================================

ALTER TABLE public.user_kits
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;
