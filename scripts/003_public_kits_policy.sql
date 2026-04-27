-- Permitir que qualquer pessoa (inclusive não logada) veja kits ativos
DROP POLICY IF EXISTS "kits_select_authenticated" ON public.kits;

CREATE POLICY "kits_select_public" ON public.kits
  FOR SELECT USING (is_active = TRUE);
