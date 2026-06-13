import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Verifica se o usuário tem acesso a um kit, considerando os dois
 * modelos de desbloqueio existentes:
 * - admin (profiles.is_admin)
 * - compra avulsa legada (user_kits)
 * - assinatura ativa com crédito no kit (kit_credits, mesmo critério
 *   usado em /catalog)
 */
export async function hasKitAccess(
  supabase: SupabaseClient,
  userId: string,
  kitId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.is_admin) return true

  const { data: userKit } = await supabase
    .from('user_kits')
    .select('id')
    .eq('user_id', userId)
    .eq('kit_id', kitId)
    .maybeSingle()

  if (userKit) return true

  const { data: credit } = await supabase
    .from('kit_credits')
    .select('id')
    .eq('user_id', userId)
    .eq('kit_id', kitId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return !!credit
}
