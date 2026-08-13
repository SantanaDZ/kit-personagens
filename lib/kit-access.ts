import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Verifica se o usuário tem acesso a um kit, considerando os dois
 * modelos de desbloqueio existentes:
 * - admin (profiles.is_admin)
 * - compra avulsa legada ou concessão manual do admin (user_kits,
 *   permanente se expires_at for null)
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
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
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
