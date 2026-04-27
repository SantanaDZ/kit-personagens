import { createClient } from '@/lib/supabase/server'
import { CatalogGrid } from '@/components/catalog/catalog-grid'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default async function CatalogPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: kits } = await supabase
    .from('kits')
    .select('id, title, description, cover_image_url, price, stripe_price_id')
    .eq('is_active', true)
    .not('price', 'is', null)
    .order('created_at', { ascending: false })

  const ownedKitIds = new Set<string>()
  if (user) {
    const { data: userKits } = await supabase
      .from('user_kits')
      .select('kit_id')
      .eq('user_id', user.id)
    userKits?.forEach((uk) => ownedKitIds.add(uk.kit_id))
  }

  const kitsWithOwnership = (kits ?? []).map((kit) => ({
    ...kit,
    owned: ownedKitIds.has(kit.id),
    formattedPrice: kit.price ? formatPrice(kit.price) : null,
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Kits Criativos</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Escolha o kit ideal para sua criança e comece a explorar
          </p>
        </div>
        <CatalogGrid kits={kitsWithOwnership} isLoggedIn={!!user} />
      </div>
    </div>
  )
}
