import { createClient } from '@/lib/supabase/server'
import { KitCard } from '@/components/dashboard/kit-card'
import { Button } from '@/components/ui/button'
import { Package, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: userKits } = await supabase
    .from('user_kits')
    .select(`
      *,
      kit:kits(*)
    `)
    .order('purchased_at', { ascending: false })

  const kits = userKits?.map((uk) => uk.kit).filter(Boolean) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus Kits</h1>
        <p className="text-muted-foreground mt-2">
          Acesse todos os kits que voce adquiriu
        </p>
      </div>

      {kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum kit ainda</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore nosso catálogo e adquira o kit ideal para seu filho.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/catalog">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Explorar Kits
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <KitCard key={kit.id} kit={kit} />
          ))}
        </div>
      )}
    </div>
  )
}
